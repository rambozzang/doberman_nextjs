# 앱인토스 Phase 1 (WebView 입점) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 도배르만 Next.js 웹을 앱인토스 WebView로 그대로 입점시키되, 토스 진입 시 헤더/푸터를 제거한 경량 모드로 AI 견적(`/quote-request-ai`)을 메인 후킹 포인트로 노출한다.

**Architecture:** 토스 WebView 환경을 클라이언트에서 감지하는 유틸(`src/lib/toss/env.ts`)을 추가하고, 토스 전용 진입 라우트(`/toss`)에서 진입 플래그를 세션에 기록한다. 전역 `SiteChrome`이 이 플래그/경로를 보고 고객용 Header/Footer를 숨겨 풀스크린 경량 UI를 제공한다. safe-area·외부링크 등 WebView 호환성을 보강하고, 소셜로그인 OAuth가 WebView에서 동작하는지 검증한다.

**Tech Stack:** Next.js 16 (App Router, `src/` 구조, `@/` = `src/`), React 19, Tailwind CSS 3.4, TypeScript. 테스트 러너 없음 → 검증은 `npm run build` + `npm run lint` + 순수 유틸 `node` 단언 + WebView 수동 스모크.

---

## File Structure

| 파일 | 책임 | 생성/수정 |
|---|---|---|
| `src/lib/toss/env.ts` | 토스 WebView 환경 감지 + 진입 플래그 기록 (순수/클라이언트 유틸) | 생성 |
| `src/lib/toss/__check_env.mjs` | env 유틸 로직 단언 검증 스크립트 (러너 부재 보완, 검증 후 삭제) | 임시 생성 |
| `src/components/SiteChrome.tsx` | 토스 환경에서 고객용 Header/Footer/FAB 숨김 | 수정 |
| `src/app/toss/layout.tsx` | 토스 진입 메타데이터 + 경량 래퍼 | 생성 |
| `src/app/toss/page.tsx` | 토스 랜딩: 진입 플래그 기록 + AI 견적 CTA | 생성 |
| `src/app/globals.css` | safe-area(notch) 대응 유틸 클래스 | 수정 |
| `src/app/layout.tsx` | viewport `viewport-fit=cover` 추가 | 수정 |
| `src/lib/toss/links.ts` | 토스 WebView 안전 외부링크 오픈 헬퍼 | 생성 |
| `docs/superpowers/plans/toss-webview-smoke-checklist.md` | 검수 전 WebView 수동 스모크 체크리스트 | 생성 |

> 인증(OAuth) 대체 로직은 Task 7의 수동 검증 결과에 따라 Phase 1 후반 또는 Phase 2로 분기한다. 본 계획에서는 검증과 폴백 토글 지점 마련까지만 다룬다.

---

### Task 1: 토스 WebView 환경 감지 유틸

**Files:**
- Create: `src/lib/toss/env.ts`
- Test: `src/lib/toss/__check_env.mjs` (임시)

- [ ] **Step 1: 유틸 구현**

`src/lib/toss/env.ts`:

```ts
// 토스 WebView(앱인토스) 환경 감지 유틸.
// 감지 우선순위: (1) 세션에 기록된 진입 플래그, (2) UA의 toss 마커.
// 진입 플래그는 /toss 라우트 진입 시 markTossEntry()로 기록한다.

const TOSS_ENTRY_KEY = 'toss_entry';

// SSR 안전: window 없으면 항상 false
function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

// /toss 진입점에서 호출 → 세션 동안 토스 환경으로 고정
export function markTossEntry(): void {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.setItem(TOSS_ENTRY_KEY, '1');
  } catch {
    // sessionStorage 접근 불가(시크릿 등) 시 무시
  }
}

// UA에 toss 마커가 있는지 (앱인토스 WebView는 UA에 'toss' 포함)
export function isTossUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return ua.toLowerCase().includes('toss');
}

// 현재 토스 환경인지 종합 판정
export function isInTossEnv(): boolean {
  if (!hasWindow()) return false;
  try {
    if (window.sessionStorage.getItem(TOSS_ENTRY_KEY) === '1') return true;
  } catch {
    // 무시하고 UA로 폴백
  }
  return isTossUserAgent(window.navigator.userAgent);
}
```

- [ ] **Step 2: 검증 스크립트 작성**

`src/lib/toss/__check_env.mjs`:

```js
// 러너 부재 보완: 순수 로직 isTossUserAgent를 직접 단언한다.
// env.ts는 TS이므로 동일 로직을 인라인 복제해 단언한다(로직 동치 확인용).
function isTossUserAgent(ua) {
  if (!ua) return false;
  return ua.toLowerCase().includes('toss');
}

const cases = [
  ['Mozilla/5.0 ... TossApp/5.1', true],
  ['Mozilla/5.0 ... toss/1.0', true],
  ['Mozilla/5.0 ... Safari', false],
  ['', false],
  [null, false],
];

let ok = true;
for (const [ua, expected] of cases) {
  const got = isTossUserAgent(ua);
  if (got !== expected) {
    ok = false;
    console.error(`FAIL ua=${JSON.stringify(ua)} expected=${expected} got=${got}`);
  }
}
if (ok) console.log('PASS: isTossUserAgent all cases');
else process.exit(1);
```

- [ ] **Step 3: 검증 실행**

Run: `node src/lib/toss/__check_env.mjs`
Expected: `PASS: isTossUserAgent all cases`

- [ ] **Step 4: 타입체크/린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 없음 (경고는 무방)

- [ ] **Step 5: 임시 검증 스크립트 삭제 후 커밋**

```bash
rm src/lib/toss/__check_env.mjs
git add src/lib/toss/env.ts
git commit -m "feat(toss): 토스 WebView 환경 감지 유틸 추가"
```

---

### Task 2: SiteChrome에서 토스 환경 chrome 숨김

**Files:**
- Modify: `src/components/SiteChrome.tsx`

기존 `SiteChrome`은 `/boss/*` 경로에서 고객용 Header/Footer를 숨긴다. 동일 패턴으로 토스 환경(경로 `/toss` 또는 `isInTossEnv()`)에서도 숨긴다. 클라이언트 컴포넌트이므로 `isInTossEnv()` 호출 가능하나, hydration 불일치를 막기 위해 마운트 후에만 env 플래그를 반영한다.

- [ ] **Step 1: SiteChrome 수정**

`src/components/SiteChrome.tsx` 전체를 아래로 교체:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { ChatNotificationFAB } from "@/components/chat";
import { isInTossEnv } from "@/lib/toss/env";

// /boss/* 라우트에서는 고객용 Header/Footer 를 렌더링하지 않는다.
// boss 영역은 BossHeader + BossSidebar 로 별도 chrome 을 사용한다.
// 토스(앱인토스) WebView 환경에서도 고객용 chrome 을 숨겨 풀스크린 경량 UI 를 제공한다.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoss = pathname?.startsWith("/boss") ?? false;
  const isTossPath = pathname?.startsWith("/toss") ?? false;

  // env 감지(sessionStorage/UA)는 클라이언트 마운트 후에만 반영해 hydration 불일치를 막는다.
  const [isTossRuntime, setIsTossRuntime] = useState(false);
  useEffect(() => {
    setIsTossRuntime(isInTossEnv());
  }, []);

  const hideChrome = isBoss || isTossPath || isTossRuntime;

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatNotificationFAB />
    </>
  );
}
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공 (타입/컴파일 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/components/SiteChrome.tsx
git commit -m "feat(toss): 토스 환경에서 고객용 헤더/푸터 숨김"
```

---

### Task 3: 토스 전용 진입 라우트 (`/toss`)

**Files:**
- Create: `src/app/toss/layout.tsx`
- Create: `src/app/toss/page.tsx`

`/toss`는 토스 콘솔에 등록할 진입 URL이다. 진입 시 `markTossEntry()`로 세션 플래그를 기록하고, AI 견적을 메인 후킹으로 안내한 뒤 `/quote-request-ai`로 연결한다.

- [ ] **Step 1: 레이아웃 생성**

`src/app/toss/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '토스 도배 견적 | 30초 AI 견적',
  description: '토스에서 바로 받는 AI 도배 견적. 한 줄만 입력하면 평수·벽지·가격까지 분석해 드려요.',
};

export default function TossLayout({ children }: { children: React.ReactNode }) {
  // 경량 래퍼: safe-area 패딩 + 풀스크린. 전역 chrome 은 SiteChrome 에서 숨긴다.
  return (
    <div className="toss-safe-area min-h-[100dvh] bg-white">{children}</div>
  );
}
```

- [ ] **Step 2: 랜딩 페이지 생성**

`src/app/toss/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { markTossEntry } from '@/lib/toss/env';

export default function TossLandingPage() {
  const router = useRouter();

  // 진입 즉시 토스 환경 플래그 기록 (이후 모든 라우트에서 chrome 숨김 유지)
  useEffect(() => {
    markTossEntry();
  }, []);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <Sparkles className="h-8 w-8 text-blue-600" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900">
          30초 만에 받는<br />AI 도배 견적
        </h1>
        <p className="text-base text-gray-500">
          한 줄만 입력하면 평수·벽지·가격까지<br />AI가 분석해 드려요.
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push('/quote-request-ai')}
        className="w-full max-w-sm rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white active:bg-blue-700"
      >
        AI 견적 시작하기
      </button>
    </main>
  );
}
```

- [ ] **Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공, `/toss` 라우트가 빌드 출력에 포함됨

- [ ] **Step 4: 로컬 확인**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000/toss` 접속
Expected: 헤더/푸터 없는 풀스크린 랜딩 노출, "AI 견적 시작하기" 클릭 시 `/quote-request-ai`로 이동하며 이동 후에도 헤더/푸터가 보이지 않음(세션 플래그 유지)

- [ ] **Step 5: 커밋**

```bash
git add src/app/toss/layout.tsx src/app/toss/page.tsx
git commit -m "feat(toss): 토스 전용 진입 랜딩 라우트(/toss) 추가"
```

---

### Task 4: safe-area & viewport-fit 대응

**Files:**
- Modify: `src/app/layout.tsx` (viewport 메타)
- Modify: `src/app/globals.css` (safe-area 유틸)

WebView 노치/홈인디케이터 영역 대응을 위해 `viewport-fit=cover`와 `env(safe-area-inset-*)` 패딩을 추가한다.

- [ ] **Step 1: viewport 메타 수정**

`src/app/layout.tsx`의 `other` 메타데이터에서 `viewport` 값을 교체:

찾기:
```ts
    'viewport': 'width=device-width, initial-scale=1',
```
교체:
```ts
    'viewport': 'width=device-width, initial-scale=1, viewport-fit=cover',
```

- [ ] **Step 2: safe-area 유틸 CSS 추가**

`src/app/globals.css` 맨 아래에 추가:

```css
/* 앱인토스 WebView: 노치/홈 인디케이터 safe-area 대응 */
.toss-safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

- [ ] **Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(toss): WebView safe-area 및 viewport-fit 대응"
```

---

### Task 5: 토스 WebView 안전 외부링크 헬퍼

**Files:**
- Create: `src/lib/toss/links.ts`

WebView에서 `target="_blank"` 새창이 막히거나 빈 창으로 뜨는 문제를 피하기 위해, 토스 환경에서는 동일 WebView 내 이동(`location.href`)으로 폴백하는 헬퍼를 제공한다. (토스 브릿지 SDK 연동은 Phase 2 범위)

- [ ] **Step 1: 헬퍼 구현**

`src/lib/toss/links.ts`:

```ts
import { isInTossEnv } from './env';

// 외부 링크를 환경에 맞게 연다.
// - 토스 WebView: 새창이 막힐 수 있어 동일 WebView 내 이동으로 폴백
// - 일반 웹: 새 탭으로 오픈
export function openExternalLink(url: string): void {
  if (typeof window === 'undefined') return;

  if (isInTossEnv()) {
    window.location.href = url;
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
```

- [ ] **Step 2: 타입체크/린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/toss/links.ts
git commit -m "feat(toss): WebView 안전 외부링크 오픈 헬퍼 추가"
```

> 참고: 기존 코드의 `window.open(...,'_blank')`/`target="_blank"` 사용처를 토스 노출 플로우(`/toss`, `/quote-request-ai`)에 한해 점진적으로 `openExternalLink`로 교체한다. 전수 교체는 YAGNI — 토스 퍼널에 실제로 등장하는 링크만 교체하고, Task 7 수동 스모크에서 빈 창 발생 시 추가 교체한다.

---

### Task 6: 검수 대비 WebView 수동 스모크 체크리스트 문서화

**Files:**
- Create: `docs/superpowers/plans/toss-webview-smoke-checklist.md`

테스트 러너가 없으므로, 검수 전 실제 토스 WebView/모바일에서 확인할 항목을 체크리스트로 고정한다.

- [ ] **Step 1: 체크리스트 작성**

`docs/superpowers/plans/toss-webview-smoke-checklist.md`:

```markdown
# 앱인토스 WebView 스모크 체크리스트 (검수 전)

## 진입/레이아웃
- [ ] `/toss` 진입 시 헤더/푸터 없이 풀스크린 랜딩 노출
- [ ] "AI 견적 시작하기" → `/quote-request-ai` 이동, 이동 후에도 chrome 숨김 유지
- [ ] 노치/홈 인디케이터 영역에 콘텐츠가 가려지지 않음(safe-area)
- [ ] 스크롤 바운스/오버스크롤 시 빈 영역 노출 없음

## 핵심 플로우 (B2C + AI)
- [ ] AI 견적 대화 입력/응답 정상
- [ ] 사진 업로드(카메라/갤러리) 권한 동작 — 막히면 사유 기록
- [ ] 견적 완료 → 결과/저장 흐름 정상

## 인증 (최우선)
- [ ] 비로그인 상태로 AI 견적 시작 가능
- [ ] 카카오/네이버/구글 소셜로그인 팝업·리다이렉트가 WebView에서 정상 완료되는지
  - [ ] 막힐 경우: 휴대폰 인증 로그인으로 대체 가능한지 확인 → Phase 2 토스 로그인 우선순위 상향
- [ ] 로그인 후 localStorage 토큰 유지(`auth_token`)되는지

## 외부링크/정책
- [ ] 외부 링크 클릭 시 빈 창 없이 정상 이동(`openExternalLink` 적용 지점)
- [ ] HTTPS 전 구간, 개인정보 처리방침/약관 접근 가능
- [ ] 19세+ 정책, iOS16+/Android7+ 동작 확인

## 환경 설정 확인
- [ ] `next.config.ts`의 `X-Frame-Options: DENY`가 토스 WebView 로딩을 막지 않는지 확인
      (토스 WebView는 top-level navigation 이므로 일반적으로 무관하나, iframe 임베드 방식이면 토스 도메인 frame-ancestors 허용 필요)
```

- [ ] **Step 2: 커밋**

```bash
git add docs/superpowers/plans/toss-webview-smoke-checklist.md
git commit -m "docs(toss): WebView 검수 전 스모크 체크리스트 추가"
```

---

### Task 7: 최종 빌드 검증 & 인증 동작 확인

**Files:** (없음 — 검증 단계)

- [ ] **Step 1: 전체 빌드**

Run: `npm run build`
Expected: 성공, `/toss` 포함 모든 라우트 정상 빌드

- [ ] **Step 2: 린트**

Run: `npm run lint`
Expected: 신규 파일 관련 에러 없음

- [ ] **Step 3: 인증 WebView 검증 (수동, 최우선 리스크)**

`docs/superpowers/plans/toss-webview-smoke-checklist.md`의 "인증" 섹션을 실제 모바일/토스 WebView에서 수행.
- 소셜로그인이 WebView에서 막히면: LoginModal에서 토스 환경일 때 휴대폰 인증 탭을 기본 노출하도록 후속 작업 발행(별도 태스크/Phase 2). 본 Phase에서는 결과만 기록.

- [ ] **Step 4: 결과 기록 커밋(선택)**

검증 결과(특히 OAuth 가부)를 체크리스트에 체크하여 커밋:

```bash
git add docs/superpowers/plans/toss-webview-smoke-checklist.md
git commit -m "docs(toss): WebView 스모크 검증 결과 기록"
```

---

## 운영 작업 (코드 외 — 병행)

- [ ] 앱인토스 콘솔 가입 → 워크스페이스 생성 → 사업자 등록(보유) → 앱 등록
- [ ] 진입 URL을 `https://www.doberman.kr/toss`로 등록
- [ ] 검수 요청 (영업일 3~5일) — 위 스모크 체크리스트 통과 후 제출

---

## Self-Review 결과

- **스펙 커버리지:** 스펙 §4(경량 진입점 Task 3 / 환경감지 Task 1 / WebView 호환성 Task 4·5 / 인증 점검 Task 6·7 / 콘솔 셋업 운영작업) 모두 태스크 매핑됨. §5 리스크(OAuth·safe-area·외부링크·검수)는 Task 5·6·7에 반영.
- **플레이스홀더:** 없음 — 모든 코드 스텝에 실제 코드 포함.
- **타입 일관성:** `markTossEntry()`/`isInTossEnv()`/`isTossUserAgent()`/`openExternalLink()` 시그니처가 정의부(Task 1·5)와 사용부(Task 2·3)에서 일치.
- **범위:** Phase 1(WebView 입점)로 한정. 토스 로그인/결제(Phase 2·3)는 제외하고 폴백 지점만 마련.
