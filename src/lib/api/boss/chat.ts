// 사장님 채팅 API (chat-api 백엔드 호출)
// Flutter web_repo.dart 의 chat 관련 메서드와 동일 엔드포인트 사용
import { BossAuthManager } from '@/lib/bossAuth';

const CHAT_API_BASE =
  process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://chat.doberman.kr/chat-api';

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
    const url = new URL(`${CHAT_API_BASE}/chat/list`);
    url.searchParams.set('userId', userId);
    url.searchParams.set('userType', 'APP');
    const res = await fetch(url.toString(), { headers: authHeaders() });
    return res.json();
  },

  // 메시지 목록 (페이징)
  async messages(roomId: number, page = 1, limit = 20) {
    const url = new URL(`${CHAT_API_BASE}/chat/room/${roomId}/messages`);
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
    const url = new URL(`${CHAT_API_BASE}/chat/room/${requestId}`);
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
