# 채팅 알림 시스템 설계 — 2026-05-25

## 개요

웹 고객이 채팅방에 들어가지 않아도 새 메시지 수신 여부를 즉시 확인할 수 있도록
폴링 기반 알림 시스템을 구현한다.

## 배경 및 문제

현재 `ChatWebSocketManager.connect(token, userId, userType, roomId)` 은 `roomId` 가
필수 파라미터다. 즉, 채팅방에 직접 입장해야만 WebSocket이 연결되어 메시지를 수신할 수
있다. 채팅방 밖에서는 새 메시지를 전혀 인지할 수 없다.

백엔드에 사용자 레벨 WebSocket 채널(`/ws/user/{userId}`)이 없으므로,
기존 REST API(`/chat/list`, 응답에 `unreadCount` 포함)를 활용한 폴링 방식으로 구현한다.

## 요구사항

- 로그인한 웹 고객(userType=WEB)에 한해 동작
- 채팅방 밖에서도 새 메시지 도착 시 토스트 알림 표시
- 화면 우하단에 총 미읽음 메시지 수가 표시되는 플로팅 버튼(FAB) 표시
- 백엔드 수정 없이 구현 (기존 `/chat/list` API 활용)
- 채팅 모달이 열려있는 동안은 토스트 알림 억제

## 아키텍처

### 새로 생성할 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useGlobalChatNotification.ts` | 폴링 + 미읽음 변화 감지 로직 |
| `src/components/chat/ChatNotificationFAB.tsx` | 플로팅 액션 버튼 UI |

### 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/SiteChrome.tsx` | FAB 컴포넌트 추가 (boss 영역 제외) |
| `src/components/chat/index.ts` | ChatNotificationFAB export 추가 |

## 상세 설계

### useGlobalChatNotification 훅

```ts
interface UseGlobalChatNotificationOptions {
  isChatModalOpen?: boolean; // 채팅 모달 열림 여부 (토스트 억제용)
}

interface UseGlobalChatNotificationReturn {
  totalUnread: number;       // 전체 미읽음 수
  unreadRooms: ChatRoom[];   // 미읽음 있는 채팅방 목록
}
```

**폴링 전략**
- 인증 상태(`chatAuth.isAuthenticated === true`) 일 때만 인터벌 시작
- 30초(`POLL_INTERVAL = 30_000`) 마다 `chatApi.getChatRooms()` 호출
- 최초 로드: 기존 unreadCount 합계를 베이스라인으로 저장, 토스트 없음
- 이후 합계 증가 시:
  - `isChatModalOpen` 이 false 이면 toast 알림
  - FAB 배지 업데이트 (항상)
- 컴포넌트 언마운트 / 인증 해제 시 인터벌 정리

**토스트 내용**
- 채팅방이 1개: `"{partnerName} 전문가에게서 새 메시지가 왔습니다"`
- 채팅방이 2개 이상: `"채팅 {N}개에서 새 메시지가 왔습니다"`
- 클릭 시 토스트 닫힘 (react-hot-toast 기본 동작 활용)

### ChatNotificationFAB 컴포넌트

```tsx
interface ChatNotificationFABProps {
  totalUnread: number;
  unreadRooms: ChatRoom[];
}
```

**위치**: `fixed bottom-6 right-6 z-40`

**상태별 렌더링**
- `totalUnread === 0`: 반투명 회색 버튼 (💬 아이콘만)
- `totalUnread > 0`: 파란색 강조 버튼 + 우상단 빨간 배지 (숫자)

**클릭 동작**
- 항상 `/quote-request/list` 로 이동
- 이유: `ChatRoom` 타입에 `requestId` 필드 없음 (`roomId`, `partnerName`, `unreadCount`, `partnerStatus` 만 존재)

**애니메이션**
- 미읽음 수 > 0 일 때 pulse 링 효과

### SiteChrome 수정

```tsx
// boss 영역 제외, 웹 고객 영역에만 FAB 렌더링
import { ChatNotificationFAB } from "@/components/chat";
// ...
return (
  <>
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <ChatNotificationFAB />
  </>
);
```

`ChatNotificationFAB` 내부에서 `useGlobalChatNotification` 을 호출하므로
SiteChrome은 props를 전달할 필요 없음.

## 데이터 흐름

```
SiteChrome (웹 영역)
  └── ChatNotificationFAB
        └── useGlobalChatNotification
              ├── useChatAuth (인증 상태)
              ├── chatApi.getChatRooms() (30초 폴링)
              ├── totalUnread 계산
              ├── 증가 감지 → toast.custom(...)
              └── totalUnread, unreadRooms 반환
```

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| 비로그인 | 폴링 시작 안 함, FAB 렌더링 안 함 |
| 채팅 모달 열림 | 토스트 억제, FAB 배지는 유지 |
| API 오류 | 에러 무시 (조용히 실패), 다음 폴링에서 재시도 |
| boss 영역 | SiteChrome에서 FAB 미포함 (boss 자체 UI 있음) |
| 읽음 처리 후 | 다음 폴링에서 unreadCount 감소 → FAB 배지 업데이트 |

## 구현 범위 외

- 브라우저 Push Notification (PWA): 별도 페이즈
- 실시간 WebSocket 글로벌 채널: 백엔드 추가 시 별도 페이즈
- boss 영역 알림: boss 자체 채팅 UI가 있으므로 제외
