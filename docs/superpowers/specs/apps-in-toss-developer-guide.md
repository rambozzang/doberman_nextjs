# 앱인토스(Apps in Toss) 개발 가이드 — 조사 기록

> 조사일: 2026-06-14. 출처: 공식 개발자센터(developers-apps-in-toss.toss.im), 공식 예제(github.com/toss/apps-in-toss-examples), 공식 커뮤니티(techchat-apps-in-toss.toss.im), 랜딩(toss.im/apps-in-toss).
> 본 문서는 입점 전 사실 확인용 레퍼런스다. "확인 불가" 표기는 공식 문서에서 단정할 수 없어 추측을 배제한 항목이다.

---

## 0. 🔴 가장 중요한 제약 (의사결정에 직접 영향)

1. **로그인은 토스 로그인만 허용.** "미니앱 내 로그인은 토스 로그인만 사용할 수 있어요. 그 외 로그인 기능 및 소셜, 간편 로그인은 사용할 수 없어요." → **기존 카카오/네이버/구글 소셜로그인은 미니앱 내에서 사용 불가(검수 리젝 사유).**
2. **SSR 사용 불가.** 비게임 체크리스트: "SSR(서버 사이드 렌더링) 사용 불가 — CSR 또는 SSG만 허용." → **현재 Next.js의 서버 렌더링/서버 컴포넌트/동적 메타데이터를 그대로 미니앱에 쓸 수 없음.**
3. **WebView 입점 = "기존 https URL 그대로 등록"이 아님.** `@apps-in-toss/web-framework`로 빌드한 번들을 콘솔에 업로드하고, `intoss://{appName}` 스킴 + 파일기반 라우팅으로 동작. (Next.js를 진입점으로 쓰는 공식 예제는 확인되지 않음 — SSR 금지와 맞물려 별도 CSR 빌드가 현실적)
4. **외부 링크/외부 이동 차단.** `window.location.href`·`window.open` 직접 외부 이동 불가. 외부 이동은 공식 `openURL()` 사용. 자사 웹사이트/앱 설치 유도 금지.
5. **WebSocket은 `wss://`(암호화)만 허용.** (현재 채팅 WebSocket의 wss 여부 확인 필요)
6. **TDS(토스 디자인 시스템) 적용이 검수 기준에 포함.** 모든 화면 최상단 Navigation 컴포넌트 필수. 단 TDS는 React 18까지 호환(React 19 일부 미작동) — 현재 앱은 React 19.

---

## 1. 입점 방식 & 프레임워크

- WebView용 패키지: **`@apps-in-toss/web-framework`** (RN용은 `@granite-js/react-native`). 공통 런타임 코어 = **Granite**.
- 초기화:
  ```bash
  npm install @apps-in-toss/web-framework
  npx ait init   # granite.config.ts 생성
  ```
- `granite.config.ts` (콘솔 등록값과 일치 필요):
  ```ts
  import { defineConfig } from '@apps-in-toss/web-framework/config';
  export default defineConfig({
    appName: 'my-mini-app',  // intoss://{appName} 식별자, 등록 후 수정 불가
    brand: { displayName: 'App Name', primaryColor: '#FF91D5', icon: '' },
    web: { host: 'localhost', port: 5173, commands: { dev: 'vite dev', build: 'vite build' } },
    permissions: [],
    outdir: 'dist',
  });
  ```
- 개발 흐름: 콘솔에서 미니앱 생성 → 개발환경(WebView/RN) 선택 → SDK 설치·초기화 → 로컬 개발 → 빌드 → **콘솔 업로드** → 토스앱/샌드박스 테스트 → 출시 승인.
- 진입 시 네이티브가 `InitialProps`(플랫폼 종류, 컬러 테마, 네트워크 상태, 폰트 스케일) 전달. 파일기반 라우팅(`/pages/home.ts` → `intoss://app-name/home`).
- **SDK 버전 주의:** 2.x 권장(RN 0.84/React 19 지원). 2026-03-23 이후 1.x 업로드 제한.
- 출처: [WebView 튜토리얼](https://developers-apps-in-toss.toss.im/tutorials/webview.html), [예제 저장소](https://github.com/toss/apps-in-toss-examples)
- **확인 불가:** Next.js 직접 진입점 공식 지원 여부 / SSR-off Next.js static export의 호환성.

---

## 2. 토스 로그인 (인증 — 우리 확정 방식)

### 패키지 & 호출
- WebView: `import { appLogin } from '@apps-in-toss/web-framework';`
- 시그니처:
  ```ts
  function appLogin(): Promise<{ authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' }>;
  ```
- 기존 동의 사용자는 즉시 `authorizationCode` 반환, 신규 사용자는 **약관 동의 화면** 노출 후 발급.

### 서버 토큰 교환 흐름 (API Base: `https://apps-in-toss-api.toss.im`)
1. **AccessToken 발급** (서버 → 토스):
   ```
   POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token
   { "authorizationCode": "...", "referrer": "DEFAULT" }
   ```
   응답: `accessToken`, `refreshToken`, `scope`, `expiresIn` 등
2. **토큰 갱신:** `POST /api-partner/v1/apps-in-toss/user/oauth2/refresh-token` `{ "refreshToken": "..." }`
3. **사용자 정보 조회:**
   ```
   GET /api-partner/v1/apps-in-toss/user/oauth2/login-me
   Authorization: Bearer ${AccessToken}
   ```
   응답: `userKey`(앱별 고유 식별자, 기기변경·재설치에도 동일), `ci`(본인확인 식별자), `name`/`phone`/`birthday` 등은 **암호화된 값**.
4. **연결 끊기:** `POST /api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token`

### 자체 백엔드 연계 (구현 패턴)
- 클라이언트 `appLogin()` → `authorizationCode`를 자사 서버 전달 → 서버가 generate-token → login-me로 `userKey`/`ci` 조회 → `userKey`(또는 복호화 `ci`)로 자사 회원 조회·생성 → **자사 JWT 발급**.
- (자사 JWT 발급은 토스 강제 표준 아님. 토스 명세는 AccessToken/사용자 조회까지.)

### 개인정보 복호화
- **AES/GCM/NoPadding, 256bit 대칭키.** 복호화 키 + AAD는 **콘솔 설정 후 이메일로(base64) 전달**. 암호문 앞부분 IV 포함. Kotlin/Java/PHP 샘플 제공.

### 전제조건
- **사업자 등록 필수**(보유 중). 대표 관리자 계정에서 콘솔 약관 동의.
- 콘솔에서 Scope(name/phone/ci/birthday 등) 지정, 파트너사 약관(서비스/개인정보 수집·이용/마케팅) 직접 등록.
- 앱인토스 미니앱 **내부** 사용은 별도 계약 불필요. (앱인토스 **밖** 자체 서비스에서 쓰려면 cert.support@toss.im 별도 계약)

### 심사 주의
- **약관 동의 화면이 신규 사용자에게 노출되도록 구현 필수** (미구현 시 반려 사례 있음).
- **연결 끊기 콜백 처리 필수** (직접 해제/약관 철회/토스 탈퇴 3경로).
- 출시 후 토스 로그인 추가 시 기존 회원 매칭은 `ci` 기반. **워크스페이스 이전 시 `userKey` 재발급**되어 매칭 깨질 수 있음 주의.
- 출처: [토스 로그인 개발](https://developers-apps-in-toss.toss.im/login/develop.html), [소개](https://developers-apps-in-toss.toss.im/login/intro.html), [appLogin 커뮤니티](https://techchat-apps-in-toss.toss.im/t/applogin/3056)
- **확인 불가:** `/checklist/login.html` 원문(체크리스트 세부) — SPA 404로 직접 미확인, 출시 전 브라우저 확인 권장.

---

## 3. 브릿지 API & 외부 링크

### openURL (외부 이동 정석)
- `import { openURL } from '@apps-in-toss/web-framework';`
- `function openURL(url: string): Promise<any>;` (WebView SDK v1.0.3+)
- 예: `openURL('https://google.com')`, 딥링크 `openURL('intoss://{appName}')`.
- **확인 불가:** "HTTPS만 허용" 명시 단정(문서는 https·딥링크 예시 혼재). 스킴별 허용/차단 매트릭스.

### 외부 이동 차단 정책
- 사용자를 외부 브라우저로 보내는 동작 기본 비허용(토스 담당자 답변). 외부 앱 스킴(`nmap://`, `kakaomap://` 등) 차단. `window.location.href` 외부 스킴 호출 차단.
- 허용: JS SDK `<script>` 임베드, SDK 내부 CDN/리소스 fetch.
- 출처: [WebView 외부 이동 정책](https://techchat-apps-in-toss.toss.im/t/webview/3914)

### 주요 브릿지 함수 (WebView=web-framework / RN=granite-js)
| 분류 | API |
|---|---|
| 외부링크 | `openURL` |
| 라우팅/생명주기 | `AppsInToss.registerApp` (파일라우팅, 쿼리, 뒤로가기 제어, 가시성) |
| 공유 | `getTossShareLink`, `Share` |
| 햅틱 | `generateHapticFeedback` |
| 카메라 | `openCamera` (권한 필요) |
| 사진/앨범 | `fetchAlbumPhotos` (권한 필요) |
| 클립보드 | `getClipboardText` / `setClipboardText` |
| 위치 | `getCurrentLocation` 등 |
| 권한 | `getPermission`, `openPermissionDialog` (선언은 granite.config `permissions`) |
| 로그인 | `appLogin` |
| 환경 | platform-os / network-status / locale 조회 |
- **확인 불가:** 스크롤 제어 전용 브릿지, 연락처/스토리지/광고 정확한 함수명.
- 출처: [예제 저장소](https://github.com/toss/apps-in-toss-examples), [openCamera](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%B9%B4%EB%A9%94%EB%9D%BC/openCamera.html), [fetchAlbumPhotos](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%82%AC%EC%A7%84/fetchAlbumPhotos.html)

---

## 4. 출시 절차 & 검수

### 단계 (콘솔)
1. **회원가입** — 만 19세+, 본인 명의 토스앱 로그인, 토스 비즈니스 회원.
2. **워크스페이스 생성** — 사업자당 1개.
3. **사업자 등록** — 검토 영업일 1~2일 (수익화·토스로그인에 필수).
4. **앱 등록** — 앱 이름, **appName(수정 불가)**, 유형(비게임), 로고 600×600 PNG, 썸네일 1932×828, 스크린샷 등.
5. **검수 요청** — "운영·디자인·기능·보안 4단계". **앱 출시 검수 영업일 3~5일**(문서에 1~2일/2~3일 표기 혼재). 재심사도 3~5일. 검수 전 **샌드박스 테스트 필수**.

### 비게임 체크리스트 핵심 (출처: checklist/app-nongame.html)
- 접속/기능: 미니앱 정상 오픈, 안내한 모든 기능 동일 제공, 앱스킴 진입 후 뒤로가기 정상.
- 내비게이션: **앱인토스 비게임 내비게이션바 사용**, 모든 화면 뒤로가기(<) 동작, 브랜드 로고+미니앱 국문명 표시, 기능 버튼 최대 1개, 더보기(⋯)에 신고/공유 등 공통기능.
- 보안: **외부 코드 실행(eval 등) 금지**, 히스토리 조작 자사이동 금지, **SSR 금지(CSR/SSG)**, **WebSocket wss만**.
- 동작: 제스처 확대/축소 비활성, **라이트 모드**, 인터랙션 2초 이상 지연 금지, 공유는 `intoss://`(=private 금지), 위법 콘텐츠 금지.
- UX: 진입 즉시 바텀시트 자동 열림 금지, 나갈 방법 명확, **자사 서비스 이동/앱 설치 유도 금지**.
- 기술 요건(FAQ): **서버간 통신 mTLS 필수**, API CORS 허용목록에 앱인토스 도메인 추가.

### 자주 발생하는 리젝 사유
- 보안 위반(eval 등 외부 코드 실행) / **외부·소셜·간편 로그인** / **외부 결제창·IAP 외 결제** / **외부 링크 의존·자사 웹 랜딩** / **자사 앱 설치 유도** / 다크패턴(즉시 전면광고·강제 동의·모호 CTA) / **SSR·미암호화 WebSocket** / 어뷰징(유사앱 다중출시) / 제한 업종.
- 출처: [서비스 오픈 정책](https://developers-apps-in-toss.toss.im/intro/guide.html), [비게임 체크리스트](https://developers-apps-in-toss.toss.im/checklist/app-nongame.html), [주의사항](https://developers-apps-in-toss.toss.im/intro/caution.html)

---

## 5. 디자인 (TDS)

- **TDS 적용이 검수 기준에 포함**(표현 편차 있으나 사실상 필수). 핵심 컴포넌트 11종: Badge, Border, BottomCTA, Button, Asset, ListRow, ListHeader, **Navigation(모든 화면 최상단 필수)**, Paragraph, Tab, Top.
- 작업 기준 가로 375px, 라이트 모드, 해요체 UX 라이팅, 다크패턴 5종 금지, 아이콘 7,000개+ 제공, 탭바 플로팅 2~5개.
- TDS 패키지: `@toss/tds-mobile @toss/tds-mobile-ait @emotion/react@^11` (일부 npm 그룹 초대+토큰 필요).
- **⚠️ TDS는 React 18까지 호환, React 19 일부 미작동** — 현재 앱 React 19와 충돌 가능.
- 출처: [UI/UX 가이드](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.html), [TDS 컴포넌트](https://developers-apps-in-toss.toss.im/design/components.html)

---

## 6. 정산 & 수수료 & 사업자

### 사업자 필요 기능 6종 (FAQ 확정)
토스 로그인 / 비즈월렛 / 프로모션 / 인앱 광고 / 토스페이 / 인앱 결제. (사업자 없어도 출시는 가능하나 위 기능 불가)

### 사업자 등록 서류
- 개인: 사업자등록증 (대리 시 인감증명서+위임장+신분증).
- 법인: 사업자등록증 + 등기부등본(발급 3개월 이내) (대리 시 법인 인감증명서 등 추가).

### 수수료
- **인앱결제**: 앱마켓 15%(최대 30%) + **토스 5%**. 앱마켓 정산 입금일로부터 3영업일 내.
- **인앱광고**: 송출 운영비 ~30% + 토스 15%. **단 2026-06 현재 토스 15% 수취 유예/시점 미정(재공지 대기).**
- **정산 주기**: 익월 말일(영업일). 익월 2영업일 확정, 5,000원 이하 이월, **사업자 단위** 합산.
- **토스 로그인 자체 수수료**: 문서에 언급 없음 → **확인 불가**(명시적 무료 표현도 없음).

### 인앱결제 API (참고)
`getProductItemList`, `createOneTimePurchaseOrder`, `getPendingOrders`, `completeProductGrant`, `getCompletedOrRefundedOrders`. SDK v1.1.3+/토스앱 v5.219.0+. **샌드박스 테스트 불가(실결제 발생)**. 예제상 IAP는 RN 태그만 — **WebView IAP 지원 여부 확인 불가**.

### 입점 비용
- **"계약 없이 시작" — 입점료·계약 없음. 무료 출시 가능.** 수익 발생 시에만 수수료 차감.
- 출처: [정산](https://developers-apps-in-toss.toss.im/settlement/intro.html), [사업자 등록](https://developers-apps-in-toss.toss.im/prepare/register-business.html), [FAQ](https://developers-apps-in-toss.toss.im/faq.html), [랜딩](https://toss.im/apps-in-toss)

---

## 7. 우리 프로젝트에 미치는 영향 (요약)

| 항목 | 현재 도배르만 | 앱인토스 제약 | 영향 |
|---|---|---|---|
| 인증 | 카카오/네이버/구글 + 휴대폰 | **토스 로그인만** | 미니앱 전용 인증 경로 신규 구현, 소셜 버튼 제거 |
| 렌더링 | Next.js SSR/서버컴포넌트 | **CSR/SSG만** | 미니앱은 별도 CSR 빌드 필요(기존 사이트 직접 임베드 불가) |
| 외부링크 | `window.open`/`target=_blank` | `openURL()`만 | 링크 처리 교체 |
| 채팅 | WebSocket | **wss만** | 현재 wss 여부 확인 필요 |
| 결제(B2B) | RevenueCat | IAP/토스페이 | Phase 3로 분리(B2C 우선이라 1차 무관) |
| UI | 자체 Tailwind | **TDS+Navigation** | 미니앱 화면 TDS 적용, React 19 호환성 검토 |
| 백엔드 | REST(tigerbk.com) | mTLS·CORS 허용목록 | 서버 설정 점검 |

→ **"기존 사이트를 WebView로 그대로 띄운다"는 초기 가정은 수정 필요.** 현실적 경로는 **기존 백엔드 API와 비즈니스 로직(AI 견적 등)을 재사용하되, 앱인토스 web-framework 기반의 CSR 전용 미니앱을 별도로 빌드**하고 토스 로그인으로 인증하는 것이다.
