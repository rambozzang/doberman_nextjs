# 견적 요청 리마인더 푸시 백엔드 스펙

이 문서는 `doberman_back` (Kotlin + Spring Boot, `/var/lib/jenkins/workspace/doberman_back`)에 구현할
"견적 미제출 도배사장님 대상 리마인더 푸시" 기능의 설계 스펙이다.

## 1. 배경 / 목적

고객이 견적 요청(`TB_WEB_CUSTOMER_REQUEST`)을 등록하면 해당 지역 도배사장님(`TB_USER`)에게 즉시 FCM 푸시가
발송된다 (`WebCustomerRequestSvc.sendFcmToUser`). 하지만 이후 견적을 제출하지 않는 사장님에게는 추가
알림이 없어 응답률이 떨어진다.

**목표**: 요청 등록 후 30분 간격으로 최대 3회, 아직 견적을 내지 않은 지역 내 사장님에게 리마인더 푸시를
추가 발송한다. 단, 고객이 이미 한 사장님을 채택(성사)한 요청은 리마인더를 보내지 않는다.

## 2. 스키마 변경

`TB_WEB_CUSTOMER_REQUEST` 테이블에 컬럼 2개 추가 (수동 ALTER — 이 프로젝트는
`spring.jpa.hibernate.ddl-auto: none`이라 자동 마이그레이션이 없음):

```sql
ALTER TABLE TB_WEB_CUSTOMER_REQUEST
  ADD COLUMN REMINDER_COUNT INT NOT NULL DEFAULT 0,
  ADD COLUMN LAST_REMINDER_DT DATETIME NULL;
```

`TbWebCustomerRequest` 엔티티에 대응 필드 추가:

```kotlin
@Column(name = "REMINDER_COUNT", nullable = false)
open var reminderCount: Int = 0

@Column(name = "LAST_REMINDER_DT")
open var lastReminderDt: LocalDateTime? = null
```

## 3. 대상 선정 로직

리마인더 후보 조회 (신규 리포지토리 메서드):

```kotlin
fun findByStatusAndReminderCountLessThan(status: String, maxCount: Int): List<TbWebCustomerRequest>
```

각 후보에 대해 (`CustomerRequestReminderJob` 내부):

1. `elapsed = Duration.between(request.requestDate, now)`
2. `requiredElapsed = (request.reminderCount + 1) * 30분` 이상이어야 처리 대상 (아니면 스킵, 다음 폴링에서 재확인)
3. `tbUserRepository.findUserInfoByRegion(request.region)` 로 지역 내 사장님 목록 조회 (최초 발송과 동일한
   지역 매칭 규칙 재사용)
4. `webRequestAnswerRepository.findByRequestIdOrderByCreatedDtDesc(request.id)` 결과에서 `userId` 집합을
   뽑아, 지역 목록에서 이미 답변한 사장님 제외
5. 남은 사장님 각각의 `alramTime`("HHmm-HHmm")을 파싱해 현재 시각이 범위 밖이면 이번 회차 발송 대상에서 제외
   (형식 파싱 불가/`null`이면 제한 없이 발송 — 기존 프론트 알림 설정 페이지의 기본값과 동일하게 취급)
6. 남은 `fcmToken`으로 멀티캐스트 발송:
   - 제목: `"⏰ 아직 답변을 기다리는 도배 견적이 있어요!"`
   - 본문: 최초 발송과 동일한 포맷 (지역/건물유형/평수/천장/시공위치/벽지/특이사항)
   - `data`: `type=견적요청리마인더`, `region`, `requestId`, `reminderCount`(발송 후 값)
7. `request.reminderCount += 1`, `request.lastReminderDt = now` 로 갱신 후 저장 — **발송 대상이 0명이어도
   카운트는 증가** (4번 항목 참고)

## 4. 스케줄러 & 설정

- 신규 컴포넌트: `com.tigerbk.doberman.app.web.webCustomerRequest.CustomerRequestReminderJob`
  (`ScraperConfig`/`HumorUnivScraperJob` 과 동일한 `@Component` + `@Scheduled` 패턴)
- `@EnableScheduling`은 이미 `ScraperConfig`에서 전역 활성화되어 있으므로 재선언 불필요
- 폴링 주기: `application.yml`에 `reminder.customerRequest.fixed-delay-ms` (기본 `300000` = 5분)로 분리
- 발송 로직은 `WebCustomerRequestSvc`에 `sendReminderPush(request, targetUsers)` 메서드로 추가해
  기존 `sendFcmToUser`와 나란히 배치, `firebaseSvc.sendMulticastMessage` 재사용

## 5. 중단 / 종료 조건 정리

| 조건 | 동작 |
|---|---|
| 고객이 채택 완료 (`STATUS = '채택 성공'`) | 다음 폴링부터 후보 조회(`WHERE STATUS='검토중'`)에서 자연 제외 — 별도 취소 로직 불필요 |
| `REMINDER_COUNT >= 3` | 후보 조회에서 제외, 더 이상 리마인더 없음 |
| 지역 전원 답변 완료 / 전원 조용시간 | 이번 회차 발송 스킵하되 `REMINDER_COUNT`는 증가 (무한 재검사 방지) |
| `STATUS`가 `완료`/`취소`로 바뀐 경우 | `검토중`이 아니므로 후보 조회에서 자연 제외 (범위 밖, 요청 시 확인 완료 — "채택성공만" 기준 유지) |

## 6. 범위 밖 (Out of scope)

- 최초 즉시 발송(`sendFcmToUser`)에는 `alramTime` 필터를 적용하지 않는다 (기존 동작 유지, 이번 변경은
  리마인더 경로에만 조용시간을 적용)
- 리마인더 발송 이력을 별도 로그 테이블로 남기는 것은 포함하지 않음 (필요 시 후속 작업)
