import { useState, useEffect, useCallback } from 'react';
import { ChatRoom } from '@/components/chat/types';
import { chatApi } from '@/lib/chatApi';
import { useChatAuth } from './useChatAuth';

export const useChatRooms = () => {
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