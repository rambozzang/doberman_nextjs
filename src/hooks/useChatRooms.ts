import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatRoom } from '@/components/chat/types';
import { chatApi } from '@/lib/chatApi';
import { useChatAuth } from './useChatAuth';

// 채팅방 목록 실시간 갱신 소켓 — /ws/rooms 가 내려주는 필드 그대로.
// (chat-api 백엔드 room_list_websocket.py 의 _create_room_update 응답)
interface RoomListUpdatePayload {
  roomId: number;
  partnerName: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  partnerStatus: ChatRoom['partnerStatus'];
}

const CHAT_WS_BASE_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'wss://www.tigerbk.com/chat-api';

export const useChatRooms = (options?: { realtime?: boolean }) => {
  const realtime = options?.realtime ?? false;
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chatAuth } = useChatAuth();

  // 채팅방 목록 조회
  const loadChatRooms = useCallback(async () => {
    if (!chatAuth.isAuthenticated) {
      console.log('채팅 인증이 되지 않아 채팅방 목록을 조회하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // API 인증 헤더 설정
      if (chatAuth.token) {
        chatApi.setAuthHeader(chatAuth.token);
      }

      const response = await chatApi.getChatRooms(chatAuth.userId || undefined, chatAuth.userType || undefined);

      if (response.success && response.data) {
        setChatRooms(response.data);
        console.log('채팅방 목록 조회 성공:', response.data.length, '개');
      } else {
        const errorMessage = response.error || '채팅방 목록 조회에 실패했습니다.';
        setError(errorMessage);
        console.error('채팅방 목록 조회 실패:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('채팅방 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
    }, [chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, chatAuth.userType]);

  // requestId로 기존 채팅방 조회
  const findChatRoomByRequestId = useCallback(async (requestId: number, expertId: string) => {
    if (!chatAuth.isAuthenticated || !chatAuth.token || !chatAuth.userId) {
      throw new Error('인증이 필요합니다.');
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      const response = await chatApi.findChatRoom(requestId, chatAuth.userId, chatAuth.userType || 'WEB');

      if (response.success) {
        console.log('채팅방 조회 결과:', response.data);
        return response.data?.roomId || null;
      } else {
        console.log('채팅방 조회 실패:', response.error);
        return null;
      }
    } catch (error) {
      console.error('채팅방 조회 오류:', error);
      return null;
    }
  }, [chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, chatAuth.userType]);

  // 채팅방 생성
  const createChatRoom = useCallback(async (requestId: number, expertId: string) => {
    if (!chatAuth.isAuthenticated || !chatAuth.token || !chatAuth.userId) {
      throw new Error('인증이 필요합니다.');
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      console.log('채팅방 생성 요청:', { requestId, expertId });
      // 로그인 한사람  customerId
      const response = await chatApi.createChatRoom(requestId, expertId, chatAuth.userId);

      if (response.success && response.data) {
        console.log('채팅방 생성 성공:', response.data.roomId, `(requestId: ${requestId}, expertId: ${expertId})`);
        // 채팅방 목록 새로고침
        await loadChatRooms();
        return response.data.roomId;
      } else {
        throw new Error(response.error || '채팅방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      throw error;
    }
  }, [chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, loadChatRooms]);

  // 특정 채팅방 찾기
  const findChatRoom = useCallback((roomId: number): ChatRoom | undefined => {
    return chatRooms.find(room => room.roomId === roomId);
  }, [chatRooms]);

  // 채팅방 읽지 않은 메시지 수 업데이트
  const updateUnreadCount = useCallback((roomId: number, unreadCount: number) => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => 
        room.roomId === roomId 
          ? { ...room, unreadCount }
          : room
      )
    );
  }, []);

  // 채팅방 마지막 메시지 업데이트
  const updateLastMessage = useCallback((roomId: number, lastMessage: string, lastMessageTime: string) => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => 
        room.roomId === roomId 
          ? { ...room, lastMessage, lastMessageTime }
          : room
      )
    );
  }, []);

  // 상대방 상태 업데이트
  const updatePartnerStatus = useCallback((roomId: number, partnerStatus: ChatRoom['partnerStatus']) => {
    setChatRooms(prevRooms => 
      prevRooms.map(room => 
        room.roomId === roomId 
          ? { ...room, partnerStatus }
          : room
      )
    );
  }, []);

  // room_update 하나로 목록 한 줄을 통째로 갱신 — 없는 방이면 맨 앞에 새로 끼워 넣는다
  // (다른 방을 보고 있는 사이 새 채팅방이 생긴 경우)
  const applyRoomUpdate = useCallback((update: RoomListUpdatePayload) => {
    setChatRooms((prevRooms) => {
      const idx = prevRooms.findIndex((room) => room.roomId === update.roomId);
      if (idx === -1) {
        return [
          {
            roomId: update.roomId,
            partnerName: update.partnerName,
            lastMessage: update.lastMessage,
            lastMessageTime: update.lastMessageTime,
            unreadCount: update.unreadCount,
            partnerStatus: update.partnerStatus,
          },
          ...prevRooms,
        ];
      }
      const next = [...prevRooms];
      next[idx] = { ...next[idx], ...update };
      return next;
    });
  }, []);

  // 인증 상태 변경 시 채팅방 목록 로드
  useEffect(() => {
    if (chatAuth.isAuthenticated) {
      loadChatRooms();
    } else {
      // 인증이 해제되면 채팅방 목록 초기화
      setChatRooms([]);
      setError(null);
    }
  }, [chatAuth.isAuthenticated, loadChatRooms]);

  // 목록 실시간 갱신 — 지금 열어 둔 방이 아닌 다른 방에 새 메시지가 와도 목록에 바로 뜨게 한다.
  // 지금까지는 REST 로 한 번 불러온 뒤 수동 새로고침 전엔 안 바뀌었다.
  const applyRoomUpdateRef = useRef(applyRoomUpdate);
  applyRoomUpdateRef.current = applyRoomUpdate;

  useEffect(() => {
    if (!realtime) return;
    if (!chatAuth.isAuthenticated || !chatAuth.token || !chatAuth.userId || !chatAuth.userType) return;

    let socket: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let disposed = false;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const connect = () => {
      if (disposed) return;
      const wsUrl = new URL(`${CHAT_WS_BASE_URL}/ws/rooms`);
      wsUrl.searchParams.set('token', chatAuth.token!);

      socket = new WebSocket(wsUrl.toString());

      socket.onopen = () => {
        reconnectAttempts = 0;
        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room_update' && data.room) {
            applyRoomUpdateRef.current(data.room as RoomListUpdatePayload);
          }
          // status_update 는 어느 방의 상대방인지 알 수 없어(REST 목록에 partnerId 가 없다)
          // 반영하지 않는다 — room_update 에 partnerStatus 가 같이 오므로 메시지가 오갈 때는 맞춰진다.
        } catch (err) {
          console.error('채팅방 목록 소켓 메시지 파싱 오류:', err);
        }
      };

      socket.onclose = (event) => {
        if (pingTimer) clearInterval(pingTimer);
        if (disposed || event.code === 1000) return;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
        reconnectAttempts += 1;
        const delay = 2000 * Math.pow(2, reconnectAttempts - 1);
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close(1000, '정상 종료');
    };
  }, [realtime, chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, chatAuth.userType]);

  // 새로고침 함수
  const refreshChatRooms = useCallback(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  return {
    chatRooms,
    isLoading,
    error,
    loadChatRooms,
    createChatRoom,
    findChatRoom,
    findChatRoomByRequestId,
    updateUnreadCount,
    updateLastMessage,
    updatePartnerStatus,
    refreshChatRooms,
  };
}; 