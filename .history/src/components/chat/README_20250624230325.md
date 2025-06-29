# 채팅 시스템 (Chat System)

실시간 채팅 기능을 제공하는 컴포넌트 시스템입니다. 기존 인증 시스템과 연동되어 WebSocket 기반의 실시간 메시징을 지원합니다.

## 📁 프로젝트 구조

```
src/components/chat/
├── ChatModal.tsx          # 채팅 모달 UI 컴포넌트
├── types.ts              # 채팅 관련 타입 정의
├── useChatLogic.ts       # 채팅 로직 통합 훅
├── index.ts              # 컴포넌트 export
├── README.md             # 사용법 문서
└── 프론트_개발가이드.md   # API 개발가이드

src/hooks/
├── useChatAuth.ts        # 채팅 인증 관리 훅
├── useChatRooms.ts       # 채팅방 목록 관리 훅
├── useChatMessages.ts    # 채팅 메시지 관리 훅
└── useChatWebSocket.ts   # WebSocket 연결 관리 훅

src/lib/
├── chatApi.ts            # 채팅 REST API 클라이언트
└── chatWebSocket.ts      # WebSocket 연결 관리자

src/services/
└── chatService.ts        # 채팅 서비스 (기존 호환성)
```

## 🚀 구현 완료 기능

### ✅ Phase 1: 기본 환경 설정 (완료)

- [x] **인증 시스템**: 기존 JWT 토큰 활용
- [x] **타입 정의**: 완전한 TypeScript 타입 시스템
- [x] **API 클라이언트**: REST API 연동 (axios 기반)
- [x] **기본 UI**: 모던한 채팅 인터페이스

### ✅ Phase 2: WebSocket 연결 (완료)

- [x] **실시간 메시지**: WebSocket 기반 메시징
- [x] **타이핑 상태**: 실시간 타이핑 인디케이터
- [x] **연결 관리**: 자동 재연결, 에러 처리
- [x] **읽음 처리**: 메시지 읽음 상태 관리

### 🔄 Phase 3: 고급 기능 (개발 중)

- [x] **파일 업로드**: 이미지, 문서 파일 전송
- [ ] **성능 최적화**: 메시지 페이징, 가상 스크롤
- [ ] **오프라인 지원**: 메시지 큐, 동기화

### 📋 Phase 4: 완성도 (예정)

- [ ] **UI/UX 개선**: 애니메이션, 반응형 디자인
- [ ] **추가 기능**: 이모지, 검색, 알림
- [ ] **테스트**: 단위/통합 테스트
- [ ] **배포 준비**: 성능 모니터링

## 🔧 사용법

### 1. 기본 사용법

```tsx
import { useChatLogic, ChatModal } from "@/components/chat";

function MyComponent() {
  const [chatPartner, setChatPartner] = useState<CustomerRequestAnswer>();

  const {
    isOpen,
    messages,
    newMessage,
    isLoading,
    isConnected,
    connectionError,
    isTyping,
    uploadingFile,
    messagesEndRef,
    openChat,
    closeChat,
    handleSendMessage,
    handleFileUpload,
    handleTyping,
    handleKeyPress,
    isAuthenticated,
  } = useChatLogic(chatPartner);

  const handleChatClick = (partner: CustomerRequestAnswer) => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      return;
    }
    setChatPartner(partner);
    openChat();
  };

  return (
    <>
      <button onClick={() => handleChatClick(somePartner)}>채팅하기</button>

      <ChatModal
        isOpen={isOpen}
        onClose={closeChat}
        chatPartner={chatPartner}
        messages={messages}
        newMessage={newMessage}
        onMessageChange={handleTyping}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        isConnected={isConnected}
        connectionError={connectionError}
        isTyping={isTyping}
        uploadingFile={uploadingFile}
        messagesEndRef={messagesEndRef}
      />
    </>
  );
}
```

### 2. 개별 훅 사용법

#### 채팅 인증

```tsx
import { useChatAuth } from "@/hooks/useChatAuth";

const { chatAuth, isReady, getAuthHeader } = useChatAuth();
```

#### 채팅방 관리

```tsx
import { useChatRooms } from "@/hooks/useChatRooms";

const { chatRooms, createChatRoom, updateUnreadCount } = useChatRooms();
```

#### 메시지 관리

```tsx
import { useChatMessages } from "@/hooks/useChatMessages";

const { messages, addMessage, markRoomMessagesAsRead } =
  useChatMessages(roomId);
```

#### WebSocket 연결

```tsx
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

const { isConnected, sendMessage, sendTypingStatus } = useChatWebSocket(
  roomId,
  onNewMessage
);
```

## 🔗 API 연동

### 환경 변수 설정

```env
NEXT_PUBLIC_CHAT_API_URL=https://www.tigerbk.com/chat-api
NEXT_PUBLIC_CHAT_WS_URL=wss://www.tigerbk.com/chat-api
```

### API 엔드포인트

- `GET /chat/list` - 채팅방 목록
- `GET /chat/{roomId}/messages` - 메시지 조회
- `POST /chat/create` - 채팅방 생성
- `POST /chat/upload` - 파일 업로드
- `POST /chat/{roomId}/read` - 메시지 읽음 처리

### WebSocket 이벤트

- `join_room` - 채팅방 입장
- `send_message` - 메시지 전송
- `typing_status` - 타이핑 상태
- `message` - 메시지 수신
- `message_read_update` - 읽음 상태 업데이트

## 🔐 인증 시스템

기존 시스템의 JWT 토큰을 자동으로 활용합니다:

- **토큰 관리**: localStorage 기반 자동 관리
- **사용자 타입**: WEB (고객), APP (전문가)
- **자동 연동**: 기존 로그인/로그아웃과 동기화

## 🎨 UI 컴포넌트

### ChatModal 특징

- **반응형 디자인**: 모바일/데스크톱 최적화
- **실시간 상태**: 연결 상태, 타이핑 표시
- **파일 지원**: 이미지, 문서 업로드
- **접근성**: 키보드 단축키, 스크린 리더 지원

### 상태 표시

- 🟢 연결됨
- 🔄 연결 중...
- ⚠️ 연결 오류
- 📎 파일 첨부
- ⏳ 업로드 중

## 🐛 문제 해결

### 일반적인 문제

1. **WebSocket 연결 실패**

   ```bash
   # 네트워크 확인
   curl -I https://www.tigerbk.com/chat-api
   ```

2. **인증 오류**

   ```tsx
   // 토큰 확인
   const token = AuthManager.getToken();
   console.log("Token:", token);
   ```

3. **메시지 전송 실패**
   ```tsx
   // 연결 상태 확인
   console.log("Connected:", isConnected);
   console.log("Room ID:", currentRoomId);
   ```

### 디버깅 팁

- 브라우저 개발자 도구에서 WebSocket 연결 상태 확인
- Network 탭에서 API 호출 상태 확인
- Console에서 실시간 로그 모니터링

## 📈 성능 최적화

### 현재 적용된 최적화

- **메모이제이션**: useCallback, useMemo 활용
- **지연 로딩**: 메시지 페이징 (20개씩)
- **자동 정리**: 컴포넌트 언마운트 시 리소스 해제
- **재연결 로직**: 지수 백오프 알고리즘

### 권장 사항

- 메시지 목록이 많을 경우 가상 스크롤 구현 고려
- 이미지 파일은 썸네일 생성 권장
- 오프라인 상황 대비 로컬 캐싱 구현

## 🔮 향후 계획

1. **알림 시스템**: 브라우저 푸시 알림
2. **메시지 검색**: 전체 텍스트 검색 기능
3. **이모지 지원**: 이모지 피커, 반응 기능
4. **음성 메시지**: 음성 녹음/재생
5. **화상 통화**: WebRTC 기반 영상 통화

## 📞 지원

문제가 있거나 기능 요청이 있으시면:

1. GitHub Issues 등록
2. 개발팀 Slack 채널
3. 기술 문서 wiki 참조

---

**마지막 업데이트**: 2024-12-24  
**버전**: 1.0.0  
**상태**: Phase 2 완료, Phase 3 진행 중
