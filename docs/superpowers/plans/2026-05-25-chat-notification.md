# 채팅 알림 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹 고객이 채팅방 밖에서도 새 메시지 도착을 플로팅 버튼 배지와 토스트 알림으로 즉시 확인할 수 있게 한다.

**Architecture:** 30초 폴링으로 `/chat/list` API를 호출해 `unreadCount` 합계 증가를 감지하고, `react-hot-toast`로 토스트 알림을 띄우며 화면 우하단 FAB에 배지를 표시한다. 백엔드 수정 없이 기존 `chatApi.getChatRooms()`와 `useChatAuth()`를 재활용한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, react-hot-toast, 기존 `chatApi` / `useChatAuth`

---

## 파일 구조

| 경로 | 변경 유형 | 역할 |
|------|----------|------|
| `src/hooks/useGlobalChatNotification.ts` | 신규 생성 | 30초 폴링 + 미읽음 변화 감지 + 토스트 발행 |
| `src/components/chat/ChatNotificationFAB.tsx` | 신규 생성 | 플로팅 액션 버튼 UI |
| `src/components/chat/index.ts` | 수정 | `ChatNotificationFAB` export 추가 |
| `src/components/SiteChrome.tsx` | 수정 | 웹 영역에 FAB 삽입 |

---

## Task 1: useGlobalChatNotification 훅 구현

**Files:**
- Create: `src/hooks/useGlobalChatNotification.ts`

- [ ] **Step 1: 파일 생성**

`src/hooks/useGlobalChatNotification.ts` 를 아래 내용으로 생성한다.

```ts
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { chatApi } from '@/lib/chatApi';
import { useChatAuth } from './useChatAuth';
import { ChatRoom } from '@/components/chat/types';

const POLL_INTERVAL = 30_000; // 30초

interface UseGlobalChatNotificationOptions {
  /** 채팅 모달이 열려있으면 true — 토스트 알림을 억제한다 */
  isChatModalOpen?: boolean;
}

interface UseGlobalChatNotificationReturn {
  /** 전체 미읽음 메시지 수 */
  totalUnread: number;
  /** 미읽음이 1개 이상인 채팅방 목록 */
  unreadRooms: ChatRoom[];
}

export const useGlobalChatNotification = (
  options: UseGlobalChatNotificationOptions = {}
): UseGlobalChatNotificationReturn => {
  const { isChatModalOpen = false } = options;
  const { chatAuth } = useChatAuth();

  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadRooms, setUnreadRooms] = useState<ChatRoom[]>([]);

  // 이전 미읽음 수 — null 이면 아직 최초 로드 전
  const prevTotalRef = useRef<number | null>(null);
  // 모달 열림 여부를 ref 로 유지해 콜백 클로저 문제 방지
  const isChatModalOpenRef = useRef(isChatModalOpen);
  useEffect(() => {
    isChatModalOpenRef.current = isChatModalOpen;
  }, [isChatModalOpen]);

  const fetchAndNotify = useCallback(async () => {
    if (!chatAuth.isAuthenticated || !chatAuth.token || !chatAuth.userId || !chatAuth.userType) {
      return;
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      // chatAuth.userId/userType 은 null | string 이지만 위에서 falsy 체크 후 진입하므로 안전하게 캐스팅
      const response = await chatApi.getChatRooms(
        chatAuth.userId ?? undefined,
        chatAuth.userType ?? undefined,
      );

      if (!response.success || !response.data) return;

      const rooms: ChatRoom[] = response.data;
      const newTotal = rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0);
      const newUnreadRooms = rooms.filter(r => (r.unreadCount ?? 0) > 0);

      setTotalUnread(newTotal);
      setUnreadRooms(newUnreadRooms);

      const prev = prevTotalRef.current;

      if (prev !== null && newTotal > prev && !isChatModalOpenRef.current) {
        // 새 메시지 알림 토스트
        const added = newTotal - prev;
        const message =
          newUnreadRooms.length === 1
            ? `💬 ${newUnreadRooms[0].partnerName} 전문가에게서 새 메시지가 왔습니다`
            : `💬 채팅 ${newUnreadRooms.length}개에서 새 메시지 ${added}건이 왔습니다`;

        toast(message, {
          duration: 5000,
          style: {
            background: '#1e40af',
            color: '#fff',
            border: '1px solid #3b82f6',
            cursor: 'pointer',
          },
          icon: '💬',
        });
      }

      prevTotalRef.current = newTotal;
    } catch {
      // 조용히 실패 — 다음 폴링에서 재시도
    }
  }, [chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, chatAuth.userType]);

  useEffect(() => {
    if (!chatAuth.isAuthenticated) {
      // 로그아웃 시 상태 초기화
      setTotalUnread(0);
      setUnreadRooms([]);
      prevTotalRef.current = null;
      return;
    }

    // 즉시 한 번 실행
    fetchAndNotify();

    const interval = setInterval(fetchAndNotify, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [chatAuth.isAuthenticated, fetchAndNotify]);

  return { totalUnread, unreadRooms };
};
```

- [ ] **Step 2: 타입 확인 (빌드)**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run build 2>&1 | tail -20
```

오류 없이 빌드가 성공하거나, 이 파일과 무관한 기존 오류만 출력되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useGlobalChatNotification.ts
git commit -m "feat(chat): useGlobalChatNotification 폴링 훅 추가"
```

---

## Task 2: ChatNotificationFAB 컴포넌트 구현

**Files:**
- Create: `src/components/chat/ChatNotificationFAB.tsx`

- [ ] **Step 1: 파일 생성**

`src/components/chat/ChatNotificationFAB.tsx` 를 아래 내용으로 생성한다.

```tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalChatNotification } from '@/hooks/useGlobalChatNotification';
import { useChatAuth } from '@/hooks/useChatAuth';

export const ChatNotificationFAB: React.FC = () => {
  const router = useRouter();
  const { chatAuth } = useChatAuth();
  const { totalUnread } = useGlobalChatNotification();

  // 비로그인이거나 boss 유저(APP)이면 렌더링 안 함
  if (!chatAuth.isAuthenticated || chatAuth.userType !== 'WEB') {
    return null;
  }

  const handleClick = () => {
    router.push('/quote-request/list');
  };

  return (
    <button
      onClick={handleClick}
      aria-label={
        totalUnread > 0
          ? `읽지 않은 채팅 메시지 ${totalUnread}건`
          : '채팅 목록 보기'
      }
      className={[
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full shadow-2xl',
        'flex items-center justify-center',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
        totalUnread > 0
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 scale-100 hover:scale-110'
          : 'bg-slate-700/60 hover:bg-slate-600/70 scale-90 hover:scale-100',
      ].join(' ')}
    >
      {/* 채팅 아이콘 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>

      {/* 미읽음 배지 */}
      {totalUnread > 0 && (
        <>
          {/* pulse 링 */}
          <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30" />
          {/* 숫자 배지 */}
          <span
            className={[
              'absolute -top-1 -right-1',
              'min-w-[1.25rem] h-5 px-1',
              'bg-red-500 text-white text-xs font-bold',
              'rounded-full flex items-center justify-center',
              'shadow-lg border border-white/20',
            ].join(' ')}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        </>
      )}
    </button>
  );
};
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/chat/ChatNotificationFAB.tsx
git commit -m "feat(chat): ChatNotificationFAB 플로팅 버튼 컴포넌트 추가"
```

---

## Task 3: chat/index.ts — export 추가

**Files:**
- Modify: `src/components/chat/index.ts`

현재 내용:
```ts
export { ChatModal } from './ChatModal';
export { useChatLogic } from './useChatLogic';
export type { ChatMessage } from './types';
```

- [ ] **Step 1: export 추가**

파일 끝에 한 줄 추가한다.

```ts
export { ChatModal } from './ChatModal';
export { useChatLogic } from './useChatLogic';
export type { ChatMessage } from './types';
export { ChatNotificationFAB } from './ChatNotificationFAB';
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/chat/index.ts
git commit -m "feat(chat): ChatNotificationFAB export 추가"
```

---

## Task 4: SiteChrome — FAB 삽입

**Files:**
- Modify: `src/components/SiteChrome.tsx`

현재 내용:
```tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoss = pathname?.startsWith("/boss") ?? false;

  if (isBoss) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 1: FAB import 및 삽입**

파일을 아래와 같이 수정한다.

```tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { ChatNotificationFAB } from "@/components/chat";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoss = pathname?.startsWith("/boss") ?? false;

  if (isBoss) {
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

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run build 2>&1 | tail -30
```

빌드 에러 없이 완료되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/SiteChrome.tsx
git commit -m "feat(chat): SiteChrome에 ChatNotificationFAB 삽입"
```

---

## Task 5: 통합 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run dev
```

- [ ] **Step 2: 동작 확인 체크리스트**

브라우저에서 `http://localhost:3000` 접속 후 아래를 확인한다.

| 확인 항목 | 기대 결과 |
|----------|----------|
| 비로그인 상태 | FAB 버튼 보이지 않음 |
| 웹 고객 로그인 후 | 우하단에 반투명 채팅 버튼 표시 |
| 미읽음 메시지 있을 때 | 빨간 배지 + 숫자 + pulse 링 표시 |
| FAB 클릭 | `/quote-request/list` 페이지로 이동 |
| boss 영역(`/boss/*`) | FAB 버튼 보이지 않음 |
| 30초 경과 후 새 메시지 도착 | 파란 토스트 알림 팝업 |

- [ ] **Step 3: 최종 커밋 (필요 시)**

변경사항이 있으면:

```bash
git add -A
git commit -m "fix(chat): 채팅 알림 통합 검증 수정사항"
```

- [ ] **Step 4: lint 확인**

```bash
cd /Users/bumkyuchun/work/app/doberman/web && npm run lint 2>&1 | tail -20
```

lint 경고/에러 없어야 한다. 기존 프로젝트 lint 오류는 무시.
