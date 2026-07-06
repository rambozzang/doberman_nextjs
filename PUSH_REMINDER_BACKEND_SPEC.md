# 견적 요청 리마인더 푸시 백엔드 스펙

이 문서는 백엔드 레포 `doberman`(Kotlin + Spring Boot, 로컬 `~/work/app/doberman/backend`,
원격 `github.com/rambozzang/doberman`)에 구현할 "견적 미제출 도배사장님 대상 리마인더 푸시" 기능의
설계 스펙이다.

## 1. 배경 / 목적

고객이 견적 요청(`TB_WEB_CUSTOMER_REQUEST`)을 등록하면 해당 지역 도배사장님(`TB_USER`)에게 즉시 FCM 푸시가
발송된다 (`WebCustomerRequestSvc.sendFcmToUser`). 하지만 이후 견적을 제출하지 않는 사장님에게는 추가
알림이 없어 응답률이 떨어진다.

**목표**: 요청 등록 후 30분 간격으로 최대 3회, 아직 견적을 내지 않은 지역 내 사장님에게 리마인더 푸시를
추가 발송한다. 단, 고객이 이미 한 사장님을 채택(성사)한 요청은 리마인더를 보내지 않는다.

## 2. 확인된 사실 (설계 전제)

운영 DB(`127.0.0.1:33066/doberman`) 실측 결과:

- `TB_WEB_CUSTOMER_REQUEST.STATUS`: `검토중` 328건, `채택 성공` 1,476건, `PENDING` 1건
- `TB_USER.ALRAM_TIME` 컬럼: **`varbinary(4)`** — 4바이트만 저장. 값은 `0600`,`0700`,`0830`(543명, 기본값),
  `2340` 등 **단일 시각 "HHmm"** (범위 "HHmm-HHmm"이 아님). 프론트가 `"0900-2200"`을 보내도 앞 4바이트만
  잘려 저장됨. 백엔드 어디에서도 이 값을 알림 필터로 사용한 적 없음 → **이번이 첫 적용**.
- `@EnableScheduling` 은 이미 `app/scraper/ScraperConfig` 에서 전역 활성화됨.
- 스키마는 `spring.jpa.hibernate.ddl-auto: none` → 자동 마이그레이션 없음. ALTER는 운영 DB에 수동 실행 필요.

## 3. 스키마 변경

`TB_WEB_CUSTOMER_REQUEST` 테이블에 컬럼 2개 추가 (수동 ALTER):

```sql
ALTER TABLE TB_WEB_CUSTOMER_REQUEST
  ADD COLUMN REMINDER_COUNT INT NOT NULL DEFAULT 0,
  ADD COLUMN LAST_REMINDER_DT DATETIME NULL;
```

`TbWebCustomerRequest` 엔티티에 대응 필드 추가:

```kotlin
@ColumnDefault("0")
@Column(name = "REMINDER_COUNT", nullable = false)
open var reminderCount: Int = 0

@Column(name = "LAST_REMINDER_DT")
open var lastReminderDt: LocalDateTime? = null
```

기존 `검토중` 328건은 ALTER 후 `REMINDER_COUNT = 0`이 된다. **나이 가드(4-B)**가 없으면 배포 즉시 이 수백 건에
리마인더가 일제히 발송되는 스팸 사고가 나므로, 나이 가드는 필수다.

## 4. 대상 선정 로직

리마인더 후보 조회 (신규 리포지토리 메서드):

```kotlin
fun findByStatusAndReminderCountLessThan(status: String, reminderCount: Int): List<TbWebCustomerRequest>
```

각 후보를 `CustomerRequestReminderSvc.sendDueReminders(now)` 에서 처리한다.

### 4-A. 발송 시점(due) 판정 — `isDue(request, now)`

- 기준 시각 = `request.requestDate` (등록 시각)
- `elapsedMinutes = Duration.between(requestDate, now).toMinutes()`
- `requiredMinutes = (reminderCount + 1) * intervalMinutes(=30)`
- `elapsedMinutes >= requiredMinutes` 이면 due (아니면 이번 회차 스킵, 다음 폴링에서 재확인)

### 4-B. 나이 가드 (배포 스팸 방지 & 무한 재검사 방지)

- `Duration.between(requestDate, now).toHours() >= maxAgeHours(=6)` 이면 후보에서 제외.
- 리마인더 스케줄은 0→90분(30/60/90분에 3회)이라 6시간이면 충분한 여유. 배포 시점에 6시간보다 오래된
  `검토중` 백로그는 자동 제외되어 과거 폭탄 발송이 방지된다.

### 4-C. 수신자 선정

1. `region.split(" ").firstOrNull() ?: region` 으로 `processedRegion` 산출 (기존 `sendFcmToUser`와 동일)
2. `tbUserRepository.findUserInfoByRegion(processedRegion)` 로 지역 내 사장님 목록 조회
3. `webRequestAnswerRepository.findByRequestIdOrderByCreatedDtDesc(request.id)` 결과의 `userId` 집합을
   구해, 이미 답변한 사장님 제외
4. 남은 사장님 각각을 조용시간 필터(`withinWindow`)로 판정해 발송 대상(`sendable`) 확정

### 4-D. 조용시간 필터 — `withinWindow(alramTime, now)`

- `alramTime`("HHmm")을 분 단위 `start`로 파싱. `null`/형식 오류/시분 범위 초과이면 `defaultAlarmStart(="0830")`
  으로 대체
- 창 = `[start, quietEndHour(=22):00)` — 즉 `nowMinutes in start until (quietEndHour*60)`
- 창 밖이면 이번 회차 이 사장님에게는 미발송

### 4-E. 발송 & 카운트 갱신 (burn 모델)

```kotlin
val tokens = sendable.mapNotNull { it.fcmToken }
if (tokens.isNotEmpty()) {
    firebaseSvc.sendMulticastMessage(
        tokens = tokens,
        title = "⏰ 아직 답변을 기다리는 도배 견적이 있어요!",
        body = buildContents(request),          // 최초 발송과 동일 포맷
        imageUrl = null,
        data = mapOf(
            "type" to "견적요청리마인더",
            "region" to region,
            "requestId" to request.id.toString(),
            "reminderCount" to (request.reminderCount + 1).toString(),
        ),
    )
}
request.reminderCount += 1
request.lastReminderDt = now
requestRepository.save(request)
```

**burn 모델**: due 판정을 통과한 요청은 발송 대상이 0명(전원 답변/전원 조용시간)이어도 `REMINDER_COUNT`를
증가시킨다. 이로써 특정 요청이 매 폴링마다 무한 재검사 대상으로 남는 것을 방지한다. 조용시간(예: 밤 22:00 이후
등록 요청)에 걸린 회차는 발송 없이 소진되며, 다음 날 아침으로 이월(defer)하지 않는다 — 심야/이월 스팸 방지.

## 5. 스케줄러 & 설정

- 신규 서비스: `com.tigerbk.doberman.app.web.webCustomerRequest.CustomerRequestReminderSvc`
  (모든 리마인더 로직 보유, 순수 함수 `withinWindow`/`isDue`로 단위 테스트 가능하게 분리)
- 신규 잡: `com.tigerbk.doberman.app.web.webCustomerRequest.CustomerRequestReminderJob`
  (`ScraperConfig`/`HumorUnivScraperJob`과 동일한 `@Component` + `@Scheduled(fixedDelayString=...)` +
  `AtomicBoolean` 중복 실행 방지 패턴). `LocalDateTime.now()`는 잡에서 생성해 서비스에 주입 → 서비스는 시계
  의존 없이 테스트 가능
- 설정 프로퍼티: `ReminderProps`(`@ConfigurationProperties(prefix = "reminder.customer-request")`),
  `ReminderConfig`(`@EnableConfigurationProperties(ReminderProps::class)`). `ScraperProps`/`ScraperConfig` 패턴 답습
- `WebCustomerRequestSvc`는 수정하지 않는다 (이미 422줄로 큼 → 리마인더는 별도 서비스로 경계 분리)

`application.yml` 추가:

```yaml
reminder:
    customer-request:
        enabled: true
        fixed-delay-ms: 300000     # 폴링 주기 5분
        interval-minutes: 30       # 리마인더 간격
        max-count: 3               # 최대 리마인더 횟수
        max-age-hours: 6           # 이보다 오래된 요청 제외(배포 폭탄 방지)
        quiet-end-hour: 22         # 밤 컷오프(시)
        default-alarm-start: "0830" # ALRAM_TIME 파싱 실패 시 기본
        target-status: "검토중"
```

## 6. 중단 / 종료 조건 정리

| 조건 | 동작 |
|---|---|
| 고객이 채택 완료 (`STATUS = '채택 성공'`) | 다음 폴링부터 후보 조회(`target-status='검토중'`)에서 자연 제외 — 별도 취소 로직 불필요 |
| `REMINDER_COUNT >= 3` (max-count) | 후보 조회에서 제외, 더 이상 리마인더 없음 |
| 요청 나이 ≥ 6시간 (max-age-hours) | 후보 in-memory 필터에서 제외 (배포 백로그·무한 재검사 방지) |
| 지역 전원 답변 완료 / 전원 조용시간 | 이번 회차 발송 스킵하되 `REMINDER_COUNT`는 증가 (burn 모델) |
| `STATUS`가 `완료`/`취소`로 바뀐 경우 | `검토중`이 아니므로 후보 조회에서 자연 제외 ("채택성공만 성사" 기준 유지) |

## 7. 범위 밖 (Out of scope)

- 최초 즉시 발송(`sendFcmToUser`)에는 `alramTime` 필터를 적용하지 않는다 (기존 동작 유지, 이번 변경은
  리마인더 경로에만 조용시간을 적용)
- 리마인더 발송 이력을 별도 로그 테이블로 남기는 것은 포함하지 않음 (필요 시 후속 작업)
- `ALRAM_TIME` 컬럼을 `varchar`로 넓혀 진짜 범위("HHmm-HHmm")를 저장하도록 바꾸는 것은 이번 범위 밖
  (프론트/앱/기존 데이터 마이그레이션 동반 필요)
