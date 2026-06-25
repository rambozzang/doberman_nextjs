# 앱인토스 Phase 1 (CSR 미니앱 MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 본 계획은 2026-06-14 개발가이드 조사 결과(SSR 금지·토스로그인 전용·번들 업로드)를 반영해 "기존 사이트 WebView 래핑" 방식에서 "CSR 미니앱 신규 구축"으로 전면 개정됨.

**Goal:** 앱인토스 `@apps-in-toss/web-framework` 기반의 CSR 전용 미니앱(`toss-miniapp/`)을 신규 구축하고, 토스 로그인(`appLogin`)과 AI 견적 핵심 플로우(기존 백엔드 API 재사용)를 구현해 검수 요청 가능한 MVP를 만든다.

**Architecture:** 본 레포 안에 기존 Next.js와 독립된 `toss-miniapp/` (Vite + React 18 + TypeScript) 프로젝트를 둔다. 앱인토스 web-framework로 빌드/업로드하며, 인증은 `appLogin()`이 반환한 `authorizationCode`를 자사 백엔드로 보내 자사 JWT를 받는다. UI는 TDS(Navigation 필수)로 라이트 모드 구현하고, 외부 이동은 `openURL()`만 사용한다.

**Tech Stack:** Vite, React 18, TypeScript, `@apps-in-toss/web-framework`, TDS(`@toss/tds-mobile`/`@toss/tds-mobile-ait`/`@emotion/react@^11`), 기존 백엔드 REST(`https://www.tigerbk.com`). 테스트 러너는 미니앱 프로젝트에 **Vitest 신규 도입**(기존 Next 레포와 분리되어 영향 없음). 검증은 `npm run build` + `vitest` + 샌드박스 수동 스모크.

> **백엔드 의존성(본 계획 범위 밖, 병행 필요):** 토스 인가코드→AccessToken 교환(`generate-token`), `login-me` 사용자조회, `userKey`/`ci` 회원매칭 후 자사 JWT 발급, 개인정보 복호화, 연결끊기 콜백, mTLS·CORS. 이 엔드포인트가 준비되기 전까지 Task 4는 목(mock) 응답으로 진행하고, 실제 연동은 백엔드 완료 후 스왑한다.

---

## 사전 확인 (구현 전 필수)

코드 작성 전, 다음을 공식 레퍼런스/콘솔에서 확정한다. (가이드에서 "확인 불가"로 남은 항목)

- [ ] **사전-1:** `@apps-in-toss/web-framework` 최신 2.x 버전과 `npx ait init` 산출물 구조 확인 — https://developers-apps-in-toss.toss.im/tutorials/webview.html
- [ ] **사전-2:** Vite 프로젝트에서 web-framework 연동 공식 예제 확인 — https://github.com/toss/apps-in-toss-examples (with-react / with-vite 계열)
- [ ] **사전-3:** TDS 패키지 설치 권한(npm 그룹 초대/토큰)과 `Navigation` 컴포넌트 props 확인 — https://developers-apps-in-toss.toss.im/design/components.html
- [ ] **사전-4:** 콘솔에서 `appName` 확정(등록 후 수정 불가). 본 계획에서는 placeholder로 `doberman-quote` 사용, 확정 시 일괄 치환.

---

## File Structure (toss-miniapp/)

| 파일 | 책임 | 비고 |
|---|---|---|
| `toss-miniapp/package.json` | 미니앱 의존성/스크립트 | 신규, React 18 고정 |
| `toss-miniapp/granite.config.ts` | 앱인토스 빌드 설정(appName/brand/commands) | `npx ait init` 산출 후 수정 |
| `toss-miniapp/vite.config.ts` | Vite 빌드 설정 | 신규 |
| `toss-miniapp/src/main.tsx` | 진입점(React 18 createRoot) | 신규 |
| `toss-miniapp/src/lib/tossAuth.ts` | `appLogin` 호출 + 자사 JWT 교환/저장 | 신규 |
| `toss-miniapp/src/lib/apiClient.ts` | 백엔드 REST 클라이언트(Bearer 주입) | 신규 |
| `toss-miniapp/src/lib/ai/` | 기존 `web/src/lib/ai/*`에서 포팅한 도메인 로직 | 포팅 |
| `toss-miniapp/src/lib/links.ts` | `openURL` 래퍼 | 신규 |
| `toss-miniapp/src/pages/` | 앱인토스 파일기반 라우팅 화면 | 신규 |
| `toss-miniapp/src/components/AppNavigation.tsx` | TDS Navigation 래퍼(전 화면 상단) | 신규 |

---

### Task 0: 미니앱 프로젝트 스캐폴딩

**Files:** `toss-miniapp/` 전체 (신규)

- [ ] **Step 1: 앱인토스 미니앱 초기화**

레포 루트에서:
```bash
mkdir -p toss-miniapp && cd toss-miniapp
npm create vite@latest . -- --template react-ts
npm pkg set dependencies.react="^18.3.1" dependencies.react-dom="^18.3.1"
npm pkg set devDependencies.@types/react="^18.3.0" devDependencies.@types/react-dom="^18.3.0"
npm install
npm install @apps-in-toss/web-framework
npx ait init
```
Expected: `granite.config.ts` 생성, React 18 의존성 설치 완료

- [ ] **Step 2: granite.config.ts 설정**

`toss-miniapp/granite.config.ts`를 아래 골격으로 수정(사전-1/사전-4 확인값 반영):
```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'doberman-quote', // 사전-4에서 확정한 콘솔 appName으로 치환
  brand: {
    displayName: '도배르만',
    primaryColor: '#1e293b', // 기존 theme-color와 통일
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite dev', build: 'vite build' },
  },
  permissions: [],
  outdir: 'dist',
});
```

- [ ] **Step 3: 빌드 검증**

Run: `cd toss-miniapp && npm run build`
Expected: Vite 빌드 성공, `dist/` 생성

- [ ] **Step 4: 루트 .gitignore에 미니앱 산출물 추가**

`toss-miniapp/.gitignore`에 `node_modules`, `dist` 포함 확인(vite 템플릿 기본 포함). 누락 시 추가.

- [ ] **Step 5: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp
git commit -m "feat(toss): 앱인토스 CSR 미니앱 스캐폴딩(Vite+React18+web-framework)"
```

---

### Task 1: Vitest 도입 + 외부링크 래퍼 (TDD 가능한 첫 유닛)

**Files:**
- Create: `toss-miniapp/src/lib/links.ts`
- Create: `toss-miniapp/src/lib/links.test.ts`
- Modify: `toss-miniapp/package.json` (vitest)

- [ ] **Step 1: Vitest 설치**

```bash
cd toss-miniapp && npm install -D vitest
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 2: 실패 테스트 작성**

`toss-miniapp/src/lib/links.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { openExternal } from './links';

describe('openExternal', () => {
  it('openURL을 받은 url로 호출한다', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    await openExternal('https://www.doberman.kr', spy);
    expect(spy).toHaveBeenCalledWith('https://www.doberman.kr');
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/links.test.ts`
Expected: FAIL — `openExternal` 미존재

- [ ] **Step 4: 구현**

`toss-miniapp/src/lib/links.ts`:
```ts
import { openURL } from '@apps-in-toss/web-framework';

// 앱인토스는 window.open/location.href 외부 이동을 차단한다.
// 외부 이동은 반드시 openURL()로 처리한다.
// opener 주입은 테스트 용도(기본값은 실제 openURL).
export async function openExternal(
  url: string,
  opener: (u: string) => Promise<unknown> = openURL,
): Promise<void> {
  await opener(url);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/links.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp/src/lib/links.ts toss-miniapp/src/lib/links.test.ts toss-miniapp/package.json toss-miniapp/package-lock.json
git commit -m "feat(toss): openURL 외부링크 래퍼 + vitest 도입"
```

---

### Task 2: 백엔드 API 클라이언트 (Bearer 주입)

**Files:**
- Create: `toss-miniapp/src/lib/apiClient.ts`
- Create: `toss-miniapp/src/lib/apiClient.test.ts`

기존 웹의 axios 인터셉터 패턴(Bearer 자동 주입)을 미니앱에 맞게 fetch 기반으로 옮긴다. 토큰 저장은 미니앱 스토리지(localStorage) 사용.

- [ ] **Step 1: 실패 테스트 작성**

`toss-miniapp/src/lib/apiClient.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, setAuthToken, clearAuthToken } from './apiClient';

beforeEach(() => {
  clearAuthToken();
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('토큰이 있으면 Authorization 헤더를 붙인다', async () => {
    setAuthToken('jwt-123');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/test');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123');
  });

  it('토큰이 없으면 Authorization 헤더가 없다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/test');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/apiClient.test.ts`
Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

`toss-miniapp/src/lib/apiClient.ts`:
```ts
const TOKEN_KEY = 'doberman_jwt';
const BASE_URL = 'https://www.tigerbk.com';

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  return fetch(url, { ...init, headers });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/apiClient.test.ts`
Expected: PASS (2 passed)

- [ ] **Step 5: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp/src/lib/apiClient.ts toss-miniapp/src/lib/apiClient.test.ts
git commit -m "feat(toss): 백엔드 API 클라이언트(Bearer 주입) 추가"
```

---

### Task 3: 토스 로그인 → 자사 JWT 교환

**Files:**
- Create: `toss-miniapp/src/lib/tossAuth.ts`
- Create: `toss-miniapp/src/lib/tossAuth.test.ts`

`appLogin()`이 반환한 `authorizationCode`를 자사 백엔드로 보내 자사 JWT를 받는다. 백엔드 엔드포인트가 아직 없으면 응답을 목으로 두고, 계약(요청/응답 형태)만 고정한다.

- [ ] **Step 1: 실패 테스트 작성**

`toss-miniapp/src/lib/tossAuth.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { loginWithToss } from './tossAuth';

describe('loginWithToss', () => {
  it('authorizationCode를 백엔드로 보내고 받은 jwt를 저장한다', async () => {
    const appLoginMock = vi.fn().mockResolvedValue({
      authorizationCode: 'auth-code-1',
      referrer: 'DEFAULT',
    });
    const exchangeMock = vi.fn().mockResolvedValue('jwt-xyz');
    const setTokenMock = vi.fn();

    const jwt = await loginWithToss({
      appLogin: appLoginMock,
      exchange: exchangeMock,
      setToken: setTokenMock,
    });

    expect(exchangeMock).toHaveBeenCalledWith('auth-code-1', 'DEFAULT');
    expect(setTokenMock).toHaveBeenCalledWith('jwt-xyz');
    expect(jwt).toBe('jwt-xyz');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/tossAuth.test.ts`
Expected: FAIL — 모듈 미존재

- [ ] **Step 3: 구현**

`toss-miniapp/src/lib/tossAuth.ts`:
```ts
import { appLogin as sdkAppLogin } from '@apps-in-toss/web-framework';
import { apiFetch, setAuthToken } from './apiClient';

type Referrer = 'DEFAULT' | 'SANDBOX';
type AppLoginResult = { authorizationCode: string; referrer: Referrer };

// authorizationCode를 자사 백엔드로 보내 자사 JWT를 받는다.
// 백엔드 계약: POST /api-doman/toss/login { authorizationCode, referrer } -> { jwt }
export async function exchangeAuthorizationCode(
  authorizationCode: string,
  referrer: Referrer,
): Promise<string> {
  const res = await apiFetch('/api-doman/toss/login', {
    method: 'POST',
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  if (!res.ok) throw new Error(`toss login exchange failed: ${res.status}`);
  const data = (await res.json()) as { jwt: string };
  return data.jwt;
}

// 의존성 주입으로 테스트 가능. 기본값은 실제 SDK/백엔드/스토리지.
export async function loginWithToss(deps: {
  appLogin?: () => Promise<AppLoginResult>;
  exchange?: (code: string, referrer: Referrer) => Promise<string>;
  setToken?: (jwt: string) => void;
} = {}): Promise<string> {
  const appLogin = deps.appLogin ?? (sdkAppLogin as () => Promise<AppLoginResult>);
  const exchange = deps.exchange ?? exchangeAuthorizationCode;
  const setToken = deps.setToken ?? setAuthToken;

  const { authorizationCode, referrer } = await appLogin();
  const jwt = await exchange(authorizationCode, referrer);
  setToken(jwt);
  return jwt;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd toss-miniapp && npx vitest run src/lib/tossAuth.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp/src/lib/tossAuth.ts toss-miniapp/src/lib/tossAuth.test.ts
git commit -m "feat(toss): 토스 로그인(appLogin)→자사 JWT 교환 로직 추가"
```

> 백엔드 `/api-doman/toss/login` 엔드포인트 미완성 시: 실제 호출은 실패하므로, UI 연동(Task 5) 전까지 통합은 보류하고 유닛 테스트로만 계약을 고정한다.

---

### Task 4: AI 견적 도메인 로직 포팅

**Files:**
- Create: `toss-miniapp/src/lib/ai/` (기존 `src/lib/ai/`에서 선별 포팅)
- Create: `toss-miniapp/src/lib/ai/priceCalculator.test.ts`

기존 웹의 AI 견적 도메인 로직(가격 계산/슬롯 매핑)은 React 비의존 순수 로직이면 그대로 옮길 수 있다. React에 의존하는 부분(hooks/컴포넌트)은 제외하고 순수 로직만 가져온다.

- [ ] **Step 1: 포팅 대상 식별**

Run: `ls /Users/bumkyuchun/work/app/doberman/web/src/lib/ai`
기대: `priceCalculator.ts`, `slotsMapper.ts`, `types.ts` 등 순수 로직 파일 확인. (React import 있는 파일은 제외)

- [ ] **Step 2: 순수 로직 복사**

React/Next 의존이 없는 파일만 `toss-miniapp/src/lib/ai/`로 복사. import 경로(`@/...`)를 상대경로로 수정.

- [ ] **Step 3: 대표 함수 회귀 테스트 작성**

포팅한 `priceCalculator.ts`의 대표 함수(예: `formatPriceShort`)에 대해 기존 동작을 고정하는 테스트 작성. (실제 export 함수명/시그니처는 Step 1에서 확인한 것으로 맞춘다.)
```ts
import { describe, it, expect } from 'vitest';
import { formatPriceShort } from './priceCalculator';

describe('formatPriceShort (포팅 회귀)', () => {
  it('금액을 축약 문자열로 변환한다', () => {
    // 기존 구현 동작에 맞춰 기대값 확정 후 작성
    expect(typeof formatPriceShort(1234000)).toBe('string');
  });
});
```

- [ ] **Step 4: 테스트 실행**

Run: `cd toss-miniapp && npx vitest run src/lib/ai`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp/src/lib/ai
git commit -m "feat(toss): AI 견적 순수 도메인 로직 포팅"
```

---

### Task 5: TDS Navigation + AI 견적 화면 (검수 필수 UI)

**Files:**
- Create: `toss-miniapp/src/components/AppNavigation.tsx`
- Create: `toss-miniapp/src/pages/index.tsx` (또는 web-framework 라우팅 규칙에 맞는 진입 화면)
- Modify: `toss-miniapp/src/main.tsx`

> TDS 정확한 API/props는 사전-3에서 확인한 값으로 맞춘다. 아래는 골격이며 import 경로/props는 공식 레퍼런스에 맞춰 조정한다.

- [ ] **Step 1: TDS 설치**

```bash
cd toss-miniapp
npm install @toss/tds-mobile @toss/tds-mobile-ait @emotion/react@^11
```
(설치 권한/토큰 필요 시 사전-3 절차 선행)

- [ ] **Step 2: Navigation 래퍼 작성**

`toss-miniapp/src/components/AppNavigation.tsx`:
```tsx
// 모든 화면 최상단에 TDS Navigation 필수(검수 기준).
// 실제 컴포넌트/props는 TDS 레퍼런스(사전-3)에 맞춰 조정.
import { Navigation } from '@toss/tds-mobile';

export function AppNavigation({ title = '도배르만' }: { title?: string }) {
  return <Navigation title={title} />;
}
```

- [ ] **Step 3: AI 견적 진입 화면 작성**

`toss-miniapp/src/pages/index.tsx` (라이트 모드, 진입 즉시 바텀시트 금지):
```tsx
import { useState } from 'react';
import { AppNavigation } from '../components/AppNavigation';
import { loginWithToss } from '../lib/tossAuth';

export default function Home() {
  const [loading, setLoading] = useState(false);

  const startQuote = async () => {
    // 비로그인으로도 시작 가능. 결과 저장 시점에 loginWithToss() 호출 예정.
    // 여기서는 진입 → AI 견적 화면 라우팅(이후 Task에서 견적 대화 화면 연결).
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithToss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: '#fff' }}>
      <AppNavigation title="도배르만" />
      <section style={{ padding: 24, textAlign: 'center' }}>
        <h1>30초 만에 받는 AI 도배 견적</h1>
        <p>한 줄만 입력하면 평수·벽지·가격까지 분석해 드려요.</p>
        <button onClick={startQuote}>AI 견적 시작하기</button>
        <button onClick={handleLogin} disabled={loading}>
          토스로 로그인
        </button>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: main.tsx에서 React 18 createRoot로 마운트**

`toss-miniapp/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './pages/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
```

- [ ] **Step 5: 빌드 검증**

Run: `cd toss-miniapp && npm run build`
Expected: 빌드 성공

- [ ] **Step 6: 로컬 확인**

Run: `cd toss-miniapp && npm run dev` → `http://localhost:5173`
Expected: 상단 Navigation + AI 견적 진입 화면, "토스로 로그인" 버튼 노출

- [ ] **Step 7: 커밋**

```bash
cd /Users/bumkyuchun/work/app/doberman/web
git add toss-miniapp/src
git commit -m "feat(toss): TDS Navigation + AI 견적 진입 화면 구현"
```

---

### Task 6: 콘솔 등록 & 검수 체크리스트

**Files:**
- Create: `docs/superpowers/plans/toss-miniapp-review-checklist.md`

- [ ] **Step 1: 검수 체크리스트 작성**

`docs/superpowers/plans/toss-miniapp-review-checklist.md`:
```markdown
# 앱인토스 미니앱 검수 체크리스트 (Phase 1)

## 빌드/구조
- [ ] CSR/SSG만 사용(SSR 없음) — Vite 빌드 산출물 확인
- [ ] granite.config.ts의 appName이 콘솔 등록값과 일치
- [ ] 외부 코드 실행(eval 등) 없음

## 인증
- [ ] 토스 로그인(appLogin)만 사용, 소셜/간편 로그인 없음
- [ ] 신규 사용자 약관 동의 화면 정상 노출
- [ ] 연결 끊기 콜백 처리(백엔드) 연동 확인

## UI/UX (검수 필수)
- [ ] 모든 화면 최상단 Navigation(브랜드 로고+국문명, 뒤로가기, 기능버튼 ≤1)
- [ ] 라이트 모드, 제스처 확대/축소 비활성
- [ ] 진입 즉시 바텀시트 자동 열림 없음
- [ ] 미니앱을 나갈 방법 명확, 자사 앱/웹 설치·이동 유도 없음

## 링크/통신
- [ ] 외부 이동은 openURL()만 사용(window.open/location.href 외부이동 없음)
- [ ] 채팅 등 WebSocket은 wss://만(현재 준수)
- [ ] 백엔드 mTLS, CORS 허용목록에 앱인토스 도메인 추가

## 요건
- [ ] 만 19세+ 대상, Android7+/iOS16+
- [ ] 샌드박스 앱에서 전체 플로우 테스트 완료
```

- [ ] **Step 2: 커밋**

```bash
git add docs/superpowers/plans/toss-miniapp-review-checklist.md
git commit -m "docs(toss): 미니앱 검수 체크리스트 추가"
```

- [ ] **Step 3: 콘솔 운영 작업 (코드 외)**
  - 앱인토스 콘솔 가입 → 워크스페이스 생성 → 사업자 등록 → 앱 등록(appName 확정)
  - 콘솔에서 토스 로그인 약관 동의/Scope 설정, 복호화 키 수령
  - `dist` 번들 업로드 → 샌드박스 테스트 → 체크리스트 통과 후 검수 요청

---

## Self-Review 결과

- **스펙 커버리지:** 스펙 §4(스캐폴딩 Task0 / 토스로그인 Task3 / AI견적 Task4·5 / 검수필수 UI Task5·6 / 콘솔 Task6)·§2 아키텍처(API클라이언트 Task2, openURL Task1) 매핑 완료. 백엔드 의존성은 상단에 명시.
- **플레이스홀더:** TDS props·appName·포팅 함수명은 "사전 확인"과 Step 내 확인 지시로 처리(추측 코드 미작성). 그 외 코드 스텝은 실제 코드 포함.
- **타입 일관성:** `setAuthToken`/`getAuthToken`/`apiFetch`(Task2) ↔ `exchangeAuthorizationCode`/`loginWithToss`(Task3) ↔ `openExternal`(Task1) 시그니처 일관.
- **범위:** Phase 1(CSR 미니앱 MVP)로 한정. 견적조회/채팅/공유(Phase2), IAP/토스페이(Phase3), 백엔드 토큰교환 구현(타 레포)은 제외.
- **테스트 전략:** 미니앱에 Vitest 신규 도입(기존 Next 레포 무영향). 순수 로직은 TDD, UI/SDK 연동은 빌드+샌드박스 수동 검증.
