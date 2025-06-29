import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatApiMessage } from '@/components/chat/types';
import { chatApi } from '@/lib/chatApi';
import { useChatAuth } from './useChatAuth';

export const useChatMessages = (roomId: number | null) => {
  const [messages, setMessages] = useState<ChatApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const { chatAuth } = useChatAuth();
  
  // 메시지 로딩 상태 관리를 위한 ref
  const isInitialLoadRef = useRef(true);

  // 메시지 목록 조회
  const loadMessages = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
    if (!roomId || !chatAuth.isAuthenticated) {
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // API 인증 헤더 설정
      if (chatAuth.token) {
        chatApi.setAuthHeader(chatAuth.token);
      }

      const response = await chatApi.getChatMessages(roomId, page, 20);

      if (response.success && response.data) {
        const { messages: newMessages, isLastPage } = response.data;

        if (isLoadMore) {
          // 기존 메시지에 추가 (이전 메시지들을 앞에 추가)
          setMessages(prevMessages => [...newMessages, ...prevMessages]);
        } else {
          // 새로운 메시지로 교체
          setMessages(newMessages);
        }

        setHasMoreMessages(!isLastPage);
        setCurrentPage(page);

        console.log(`채팅 메시지 조회 성공 (페이지 ${page}):`, newMessages.length, '개');
      } else {
        const errorMessage = response.error || '메시지 조회에 실패했습니다.';
        setError(errorMessage);
        console.error('메시지 조회 실패:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('메시지 조회 오류:', error);
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [roomId, chatAuth.isAuthenticated, chatAuth.token]);

  // 이전 메시지 더 불러오기
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || !roomId) {
      return;
    }

    await loadMessages(currentPage + 1, true);
  }, [hasMoreMessages, isLoadingMore, roomId, currentPage, loadMessages]);

  // 새 메시지 추가 (중복 방지)
  const addMessage = useCallback((newMessage: ChatApiMessage) => {
    setMessages(prevMessages => {
      // 이미 같은 messageId가 있는지 확인
      const exists = prevMessages.some(msg => msg.messageId === newMessage.messageId);
      if (exists) {
        console.log('중복 메시지 무시:', newMessage.messageId);
        return prevMessages;
      }
      return [...prevMessages, newMessage];
    });
  }, []);

  // 메시지 업데이트 (읽음 상태 등)
  const updateMessage = useCallback((messageId: number, updates: Partial<ChatApiMessage>) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.messageId === messageId
          ? { ...message, ...updates }
          : message
      )
    );
  }, []);

  // 메시지 제거 (임시 메시지 제거용)
  const removeMessage = useCallback((messageId: number) => {
    setMessages(prevMessages => prevMessages.filter(message => message.messageId !== messageId));
  }, []);

  // 메시지 읽음 처리
  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
    if (!roomId || !chatAuth.isAuthenticated || !chatAuth.token || messageIds.length === 0) {
      return;
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      const response = await chatApi.markMessagesAsRead(roomId, messageIds);

      if (response.success) {
        // 로컬 상태에서 읽음 처리
        setMessages(prevMessages =>
          prevMessages.map(message =>
            messageIds.includes(message.messageId)
              ? { ...message, isRead: true }
              : message
          )
        );
        console.log('메시지 읽음 처리 성공:', messageIds.length, '개');
      } else {
        console.error('메시지 읽음 처리 실패:', response.error);
      }
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
    }
  }, [roomId, chatAuth.isAuthenticated, chatAuth.token]);

  // 채팅방의 모든 읽지 않은 메시지 읽음 처리
  const markRoomMessagesAsRead = useCallback(async () => {
    if (!roomId || !chatAuth.isAuthenticated || !chatAuth.token) {
      return;
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      const response = await chatApi.markRoomMessagesAsRead(roomId);

      if (response.success) {
        // 로컬 상태에서 모든 메시지를 읽음 처리
        setMessages(prevMessages =>
          prevMessages.map(message => ({ ...message, isRead: true }))
        );
        console.log('채팅방 메시지 읽음 처리 성공');
      } else {
        console.error('채팅방 메시지 읽음 처리 실패:', response.error);
      }
    } catch (error) {
      console.error('채팅방 메시지 읽음 처리 오류:', error);
    }
  }, [roomId, chatAuth.isAuthenticated, chatAuth.token]);

  // 읽지 않은 메시지 수 계산
  const unreadCount = useCallback(() => {
    return messages.filter(message => !message.isRead && message.senderType !== 'WEB').length;
  }, [messages]);

  // roomId 변경 시 메시지 초기화 및 로드
  useEffect(() => {
    if (roomId && chatAuth.isAuthenticated) {
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(true);
      setError(null);
      isInitialLoadRef.current = true;
      loadMessages(1, false);
    } else {
      // roomId가 없거나 인증이 해제되면 메시지 초기화
      setMessages([]);
      setError(null);
    }
  }, [roomId, chatAuth.isAuthenticated, loadMessages]);

  // 새로고침 함수
  const refreshMessages = useCallback(() => {
    if (roomId) {
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(true);
      setError(null);
      loadMessages(1, false);
    }
  }, [roomId, loadMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasMoreMessages,
    loadMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    removeMessage,
    markMessagesAsRead,
    markRoomMessagesAsRead,
    unreadCount: unreadCount(),
    refreshMessages,
  };
}; 