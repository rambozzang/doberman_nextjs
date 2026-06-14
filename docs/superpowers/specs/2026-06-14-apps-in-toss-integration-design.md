# 도배르만 × 앱인토스(Apps in Toss) 입점 설계 문서

- 작성일: 2026-06-14 (2026-06-14 개발가이드 조사 반영해 아키텍처 전면 수정)
- 대상 서비스: 도배르만 (도배 견적 플랫폼). 기존 웹은 Next.js 16 App Router(React 19, SSR)
- 목표: 토스 앱 안에서 "앱인앱(App-in-App)" 형태로 도배 견적 서비스 제공
- 상세 플랫폼 사실은 같은 디렉토리 `apps-in-toss-developer-guide.md` 참조

---

## 1. 배경 & 전략

토스의 **앱인토스(Apps in Toss)** 플랫폼에 도배르만 견적 서비스를 입점. 토스 약 3,000만 유저 대상 App-in-App. 핵심 타깃은 **B2C 고객 + AI 견적**, "토스에서 30초 만에 AI 도배 견적".

### ⚠️ 초기 가정 수정 (개발가이드 조사 결과)

최초 "기존 Next.js 사이트를 WebView로 그대로 임베드" 가정은 **불가**로 확인됨:

| 제약 (앱인토스 검수 정책) | 결과 |
|---|---|
| **SSR 금지 — CSR/SSG만 허용** | 현재 SSR 기반 Next.js를 그대로 못 띄움 |
| **WebView = web-framework 번들 빌드·업로드** (`intoss://{appName}`) | 기존 https URL 등록 방식 아님 |
| **토스 로그인만 허용** (소셜/간편 로그인 불가) | 카카오/네이버/구글 제거, `appLogin()` 신규 |
| **외부 링크 차단** (`window.open` 불가, `openURL()`만) | 링크 처리 교체 |
| **TDS + Navigation 필수**, 라이트 모드 | 미니앱 UI를 TDS로 구현 |
| **WebSocket wss만** | ✅ 현재 `wss://` 준수(점검 완료) |

### 확정 결정

| 항목 | 결정 |
|---|---|
| 빌드 방식 | **별도 CSR 미니앱 신규 구축** (Vite + React 18) |
| 디자인 | **React 18 + TDS**(토스 디자인 시스템, Navigation 필수) |
| 인증 | **토스 로그인(`appLogin`)** 단일 — 소셜로그인 미사용 |
| 재사용 | 기존 **백엔드 REST API(tigerbk.com)** + **AI 견적 로직** 재사용(포팅) |
| 사업자 | 보유 → 토스 로그인·수익화 가능 |
| 일정 | 1~2개월 균형형, 단계적 |

> 코드 재사용 주의: 기존 웹은 React 19, 미니앱은 React 18 → **컴포넌트 직접 import 불가**. "재사용"의 실체는 (1) 동일 백엔드 REST API 계약, (2) AI 견적 도메인 로직(`src/lib/ai/*`의 슬롯/가격계산 등) 포팅, (3) 카피/플로우 설계 재사용.

---

## 2. 아키텍처

```
[토스 앱] ──WebView──> [도배르만 미니앱 (CSR, Vite+React18)]
                              │
            appLogin() ───────┤ (authorizationCode)
                              │
                              ▼
                    [도배르만 백엔드 (tigerbk.com)]
                     - 토스 토큰교환(generate-token/login-me)
                     - userKey/ci → 자사 회원 매칭 → 자사 JWT 발급
                     - 기존 견적/AI/채팅 REST API
```

### 신규 미니앱 프로젝트 (CSR)
- 위치: 본 레포 내 별도 디렉토리 `toss-miniapp/` (기존 Next 빌드와 독립)
- 스택: Vite + React 18 + TypeScript + `@apps-in-toss/web-framework` + TDS(`@toss/tds-mobile`, `@toss/tds-mobile-ait`, `@emotion/react@^11`)
- 라우팅: 앱인토스 파일기반 라우팅 / 진입 `intoss://{appName}`
- 상태/데이터: 경량(React Query 등) — 기존과 동일 패턴 권장

### 백엔드 추가 작업 (별도 레포/서버 — 본 설계 범위 밖이나 의존성)
- 토스 인가코드 → AccessToken 교환 엔드포인트
- login-me로 `userKey`/`ci` 조회 → 자사 회원 매칭/생성 → 자사 JWT 발급
- 개인정보 복호화(AES/GCM/256, 콘솔서 받은 키/AAD)
- 토스 로그인 **연결 끊기 콜백** 수신 엔드포인트
- 서버간 통신 **mTLS**, API CORS에 앱인토스 도메인 허용

---

## 3. 단계적 로드맵

### Phase 1 — 미니앱 MVP (1차 출시)
- `toss-miniapp` 스캐폴딩(Vite+React18+web-framework+TDS)
- **토스 로그인** 클라이언트 플로우(`appLogin` → 백엔드 교환 → 자사 JWT 저장)
- **AI 견적 핵심 플로우**(견적 대화 → 결과) — 기존 백엔드 API 호출, AI 로직 포팅
- TDS Navigation 등 검수 필수 UI, 라이트 모드
- 외부 링크는 `openURL()`
- 콘솔: 앱 등록 → 샌드박스 테스트 → 검수 요청

### Phase 2 — 강화
- 견적 조회/상세, 채팅(wss 유지) 등 부가 플로우 이식
- 햅틱/공유(`getTossShareLink`) 등 네이티브 경험
- 푸시(검수 별도)

### Phase 3 — 수익화 (선택)
- IAP/토스페이 (B2B 사장님 구독은 별도 검토, 현 단계 B2C 우선이라 제외)

---

## 4. Phase 1 상세 (이번 구현 범위)

### 4.1 스캐폴딩
- `toss-miniapp/` Vite+React18 프로젝트, `npx ait init`로 `granite.config.ts` 생성
- `granite.config.ts`의 `appName`/brand를 콘솔 등록값과 일치
- `web.commands.dev/build`를 Vite 기준으로 구성

### 4.2 토스 로그인
- 클라이언트: `appLogin()` → `{ authorizationCode, referrer }`
- 자사 백엔드로 전달 → 교환 응답으로 **자사 JWT** 수신 → 저장(미니앱 스토리지)
- **신규 사용자 약관 동의 화면 노출**(미구현 시 반려) — appLogin이 처리하는 범위 확인
- 비로그인으로 AI 견적 시작 가능, 결과 저장 시점에 로그인 유도

### 4.3 AI 견적 플로우
- 기존 백엔드 REST API 계약 재사용(견적 요청/AI 응답)
- `src/lib/ai/*` 도메인 로직(슬롯 매핑, 가격 계산)을 미니앱으로 포팅
- TDS 컴포넌트로 대화/견적 UI 구성

### 4.4 검수 필수 사항
- 모든 화면 최상단 **Navigation**(브랜드 로고+국문명, 뒤로가기, 기능버튼 ≤1)
- 라이트 모드, 제스처 확대/축소 비활성, 진입 즉시 바텀시트 금지
- 외부 이동 `openURL()`만, 자사 앱/웹 유도 금지
- mTLS·CORS(백엔드), wss(채팅) 준수

---

## 5. 리스크 & 검증 포인트

| 리스크 | 대응 |
|---|---|
| TDS React 18 한정 ↔ 기존 React 19 | 미니앱을 React 18로 고정(별도 프로젝트라 격리됨) |
| 백엔드 토스 토큰교환/복호화 신규 구현 필요 | 백엔드 작업을 의존성으로 명시, 일정 분리 |
| Next.js 컴포넌트 직접 재사용 불가 | API 계약 + AI 로직 포팅으로 재사용 범위 한정 |
| WebView IAP 지원 여부 확인 불가 | 수익화는 Phase 3로 분리, 1차 영향 없음 |
| TDS 정확한 API/props 미확정 | 구현 시 공식 레퍼런스 직접 확인 단계 포함 |
| 검수 리젝(외부로그인/링크/SSR/다크패턴) | 체크리스트 사전 점검으로 1회 통과 목표 |

---

## 6. 성공 지표 (KPI)
- 토스 유입 → AI 견적 시작률 / 견적요청 완료율
- 토스 경유 신규 고객 수 / 사장님 매칭 건수

---

## 7. 범위

### 포함 (Phase 1)
- `toss-miniapp` CSR 스캐폴딩(Vite+React18+web-framework+TDS)
- 토스 로그인 클라이언트 플로우 + 자사 JWT 저장
- AI 견적 핵심 플로우(백엔드 API 재사용, AI 로직 포팅)
- 검수 필수 UI(Navigation/라이트모드/외부링크 openURL)
- 콘솔 앱 등록·샌드박스 테스트·검수 요청

### 제외 (후속/타 레포)
- 백엔드 토스 토큰교환·복호화·연결끊기 콜백 (의존성으로만 명시)
- 견적 조회/상세, 채팅, 공유/햅틱 (Phase 2)
- IAP/토스페이 수익화, B2B 사장님 기능 (Phase 3)
