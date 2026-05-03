# 도배르만 Boss(사장님) 백엔드 수정 권고서

> 작성일: 2026-05-04
> 작성 배경: 웹 클라이언트(Next.js) boss 영역 점검 중 발견된 서버 측 이슈 정리
> 우선순위: CRITICAL > HIGH > MEDIUM

---

## 1. [CRITICAL] CORS allowedHeaders 에 `Device-ID` 추가

### 현상
Flutter 앱은 `Authorization: Bearer <token>` 과 `Device-ID: <uuid>` 를 함께 전송한다.
웹 브라우저는 CORS preflight(OPTIONS) 에서 서버가 허용하는 헤더 목록을 확인하는데,
현재 백엔드 CORS 설정에 `Device-ID` 가 없어 preflight 에서 차단된다.
결과적으로 웹에서는 `Device-ID` 없이 요청이 전송되고, 백엔드가 이를 거부하면 401 이 발생한다.

### 클라이언트 측 대응 (이미 완료)
`src/lib/bossDeviceId.ts` — localStorage 에 UUID 를 생성·저장하는 헬퍼 추가.
`src/lib/bossApi.ts` — 모든 private API 요청에 `Device-ID` 헤더 첨부.
백엔드 CORS 갱신 즉시 자동으로 동작한다.

### 백엔드 수정 방법 (Spring Boot)

```java
// CorsConfig.java 또는 WebMvcConfigurer 구현체
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("https://your-domain.com", "http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    config.setAllowedHeaders(List.of(
        "Authorization",
        "Content-Type",
        "Device-ID",       // ← 이 줄 추가
        "Accept",
        "X-Requested-With"
    ));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

Spring Security 를 사용하는 경우 `SecurityFilterChain` 에서도 `.cors(withDefaults())` 를 유지해야 한다.

---

## 2. [CRITICAL] `/auth/login` 응답 형식 검증

### 현재 클라이언트 기대 형식
```typescript
// src/types/boss.ts
interface BossLoginResponse {
  token: string;
  userInfo: {
    id?: number;
    userId?: string;
    name?: string;
    nickNm?: string;
    profilePath?: string;
    phone?: string;
    email?: string;
    companyId?: number;
    alramTime?: string;
    createdDt?: string;
    deviceId?: string;
  };
}
```

백엔드가 `{ token: "...", userInfo: {...} }` 를 직접 반환하거나
`{ success: true, data: { token: "...", userInfo: {...} } }` 형태로 감싸도 동작한다
(클라이언트의 `normalize()` 함수가 두 형태 모두 처리).

### 확인이 필요한 경우
응답이 `{ success: false, message: "..." }` 로 오는데 클라이언트가 성공으로 처리하는
경우가 있으면 백엔드 응답 형식을 Flutter 앱 응답과 동일하게 맞춰야 한다.

---

## 3. [HIGH] `/auth/login` 요청 시 `deviceId` 처리 정책

### 현재 클라이언트 동작
```typescript
// src/types/boss.ts
interface BossLoginRequest {
  userId: string;
  password: string;
  fcmToken: string;   // 웹에서는 FCM 없으므로 빈 문자열 전송
  deviceId: string;   // 웹에서는 localStorage UUID 전송
}
```

웹 클라이언트는 FCM 토큰이 없으므로 `fcmToken: ""` 을 전송한다.
`deviceId` 는 `bossDeviceId.ts` 헬퍼가 생성한 UUID 를 전송한다.

### 백엔드 권장 처리
1. **`fcmToken` 빈 문자열 허용**: 웹 환경에서는 푸시 알림이 없으므로 빈 문자열이나 null 을 정상값으로 처리
2. **`deviceId` 검증 완화 또는 단계적 등록**:
   - 옵션 A (권장): 첫 로그인 시 `deviceId` 를 DB 에 등록하고, 이후 요청 시 검증
   - 옵션 B: `deviceId` 는 선택 필드로 처리하고 인증의 필수 조건에서 제외
   - 옵션 C: 웹 플랫폼(`platform: "web"` 파라미터 추가)일 경우 `deviceId` 검증 스킵

---

## 4. [HIGH] 401 응답 본문 표준화

### 현상
401 발생 시 응답 본문이 비어있거나 HTML 에러 페이지인 경우 클라이언트가
사용자에게 의미있는 메시지를 보여주지 못한다.

### 권장 응답 형식
```json
{
  "success": false,
  "message": "인증이 만료되었습니다. 다시 로그인해주세요.",
  "error": "UNAUTHORIZED",
  "code": 401
}
```

클라이언트 `handleError()` 함수는 `message` 필드를 사용자에게 표시하므로
이 필드를 한국어 메시지로 채워주면 UX 가 개선된다.

---

## 5. [MEDIUM] API URL 및 엔드포인트 prefix 점검

### 현재 클라이언트 설정
```
baseURL: https://www.tigerbk.com/api-doman
```

### 엔드포인트별 prefix 매핑 (클라이언트 코드 기준)
| 기능 | prefix | 예시 |
|------|--------|------|
| 인증 | `/auth` | `/auth/login`, `/auth/register` |
| 웹 전용 | `/web` | 일부 API |
| 웹앱 공통 | `/webapp` | 일부 API |
| 고객 관련 | `/customers` | `/customers/...` |
| 사용자 | `/user` | `/user/{userId}` |

확인 필요 사항:
- `api-doman` 이 실제 운영 도메인인지 (`api-domain` 오타 아닌지)
- 각 prefix 가 boss 웹 영역에서 올바르게 라우팅되는지
- HTTPS 인증서가 유효한지

---

## 6. [MEDIUM] Device-ID 기반 인증이 핵심인 경우 마이그레이션 경로

백엔드가 Device-ID 를 인증의 필수 조건으로 사용한다면 아래 단계로 마이그레이션을 권장한다.

```
1단계 (긴급): CORS 에 Device-ID 추가 → 웹에서 헤더 전송 가능해짐
2단계 (단기): 로그인 시 deviceId 를 users 테이블에 upsert
3단계 (중기): deviceId 검증은 "등록된 기기인지" 확인으로 완화
              (완전 일치 대신 사용자가 등록한 기기 목록 중 하나인지)
4단계 (장기): 웹 플랫폼용 별도 인증 흐름 또는 TOTP/이메일 2FA 도입
```

---

## 요약: 즉시 조치 항목

| 우선순위 | 항목 | 예상 소요 |
|----------|------|-----------|
| CRITICAL | CORS `allowedHeaders` 에 `Device-ID` 추가 | 10분 |
| CRITICAL | `/auth/login` 응답 형식 Flutter 앱과 일치 확인 | 30분 |
| HIGH | `fcmToken` 빈 문자열 + `deviceId` 신규 등록 허용 | 1시간 |
| HIGH | 401 응답 본문 JSON 표준화 | 30분 |
| MEDIUM | `api-doman` URL 오타 여부 확인 | 5분 |

CORS `Device-ID` 추가만 해도 현재 401 문제의 상당 부분이 해결될 것으로 예상된다.
