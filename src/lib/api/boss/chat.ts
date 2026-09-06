// 사장님 채팅 API (chat-api 백엔드 호출)
// Flutter web_repo.dart 의 chat 관련 메서드와 동일 엔드포인트 사용
import { BossAuthManager } from '@/lib/bossAuth';

// 브라우저에서는 같은 출처의 프록시(/api/chat → www.tigerbk.com/chat-api)를 쓴다.
// 예전에는 chat.doberman.kr 을 직접 불러 CORS 로 전부 실패했다(채팅이 아예 안 열렸다).
// 앱도 www.tigerbk.com/chat-api 를 쓴다(UrlConfig.chatApiURL).
/** new URL() 은 상대 경로를 못 받는다 — 브라우저에서만 origin 을 붙인다 */
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

const CHAT_API_BASE =
  typeof window !== 'undefined'
    ? '/api/chat'
    : process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://www.tigerbk.com/chat-api';

const authHeaders = (): HeadersInit => {
  const token = BossAuthManager.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const bossChatApi = {
  // 채팅방 목록
  async listRooms(userId: string) {
    const url = new URL(`${ORIGIN}${CHAT_API_BASE}/chat/list`);
    url.searchParams.set('userId', userId);
    url.searchParams.set('userType', 'APP');
    const res = await fetch(url.toString(), { headers: authHeaders() });
    return res.json();
  },

  // 메시지 목록 (페이징)
  async messages(roomId: number, page = 1, limit = 20) {
    const url = new URL(`${ORIGIN}${CHAT_API_BASE}/chat/room/${roomId}/messages`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString(), { headers: authHeaders() });
    return res.json();
  },

  // 채팅방 생성
  async createRoom(requestId: number, customerId: number, userId: string) {
    const res = await fetch(`${CHAT_API_BASE}/chat/room`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ requestId, customerId, userId }),
    });
    return res.json();
  },

  // requestId 로 채팅방 조회
  async findRoomByRequestId(requestId: number, userId: string) {
    const url = new URL(`${ORIGIN}${CHAT_API_BASE}/chat/room/${requestId}`);
    url.searchParams.set('userId', userId);
    url.searchParams.set('userType', 'APP');
    const res = await fetch(url.toString(), { headers: authHeaders() });
    return res.json();
  },

  // 사용자 상태 업데이트
  async updateStatus(userId: string, status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE') {
    const res = await fetch(`${CHAT_API_BASE}/user/status`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, userType: 'APP', status }),
    });
    return res.json();
  },

  // 메시지 읽음 처리
  async markRead(roomId: number, userId: string) {
    const res = await fetch(`${CHAT_API_BASE}/chat/mark-read`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ roomId, userId, userType: 'APP' }),
    });
    return res.json();
  },
};
