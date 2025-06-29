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

        // 메시지를 시간순으로 정렬 (오래된 메시지가 위, 최신 메시지가 아래)
        const sortedMessages = [...newMessages].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        if (isLoadMore) {
          // 기존 메시지에 추가 (이전 메시지들을 앞에 추가)
          setMessages(prevMessages => [...sortedMessages, ...prevMessages]);
        } else {
          // 새로운 메시지로 교체
          setMessages(sortedMessages);
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

  // 새 메시지 추가 (중복 방지 및 임시 메시지 교체)
  const addMessage = useCallback((newMessage: ChatApiMessage) => {
    setMessages(prevMessages => {
      // 이미 같은 messageId가 있는지 확인
      const exists = prevMessages.some(msg => msg.messageId === newMessage.messageId);
      if (exists) {
        console.log('중복 메시지 무시:', newMessage.messageId);
        return prevMessages;
      }

      // 서버에서 온 메시지인 경우 (임시 ID가 아닌 경우)
      if (newMessage.messageId < 1000000000000) { // 서버 메시지 ID는 작은 숫자
        
        // 메시지 내용이 없는 경우 - message_sent 응답으로 isRead 상태 업데이트
        if (!newMessage.message || !newMessage.message.trim()) {
          console.log('임시 메시지 검색 조건:', {
            serverSenderType: newMessage.senderType,
            serverSenderId: newMessage.senderId,
            totalMessages: prevMessages.length,
            tempMessagesCount: prevMessages.filter(msg => msg.messageId > 1000000000000).length
          });
          
          // 가장 최근 임시 메시지 찾아서 업데이트
          const tempMessages = prevMessages.filter(msg => 
            msg.messageId > 1000000000000 && // 임시 ID
            msg.senderType === newMessage.senderType &&
            msg.senderId === newMessage.senderId
          );
          
          if (tempMessages.length > 0) {
            const latestTempMessage = tempMessages[tempMessages.length - 1];
            
            console.log('임시 메시지를 서버 메시지로 교체 (isRead 업데이트):', {
              tempId: latestTempMessage.messageId,
              serverId: newMessage.messageId,
              isRead: newMessage.isRead
            });
            
            // 임시 메시지를 서버 정보로 교체
            const updatedMessages = prevMessages.map(msg => 
              msg.messageId === latestTempMessage.messageId 
                ? {
                    ...msg,
                    messageId: newMessage.messageId,
                    isRead: newMessage.isRead,
                    createdAt: newMessage.createdAt || msg.createdAt
                  }
                : msg
            );
            
            return updatedMessages;
          } else {
            // 임시 메시지가 없으면 빈 메시지 무시
            console.log('임시 메시지를 찾을 수 없어서 빈 메시지 무시:', newMessage.messageId);
            return prevMessages;
          }
        } else {
          // 메시지 내용이 있는 경우 - 같은 내용의 임시 메시지 찾아서 교체
          const tempMessageIndex = prevMessages.findIndex(msg => 
            msg.messageId > 1000000000000 && // 임시 ID
            msg.message === newMessage.message &&
            msg.senderType === newMessage.senderType &&
            msg.senderId === newMessage.senderId
          );

          if (tempMessageIndex !== -1) {
            console.log('임시 메시지를 서버 메시지로 교체 (내용 매칭):', {
              tempId: prevMessages[tempMessageIndex].messageId,
              serverId: newMessage.messageId,
              isRead: newMessage.isRead
            });
            
            const updatedMessages = [...prevMessages];
            updatedMessages[tempMessageIndex] = newMessage;
            return updatedMessages;
          }
          
          // 임시 메시지를 찾을 수 없으면 새 메시지로 추가
          return [...prevMessages, newMessage];
        }
      }

      // 일반적인 새 메시지 추가 (빈 메시지 체크)
      if (!newMessage.message || !newMessage.message.trim()) {
        console.log('빈 메시지 추가 무시:', newMessage.messageId);
        return prevMessages;
      }

      // 새 메시지 추가
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

  // 채팅방의 모든 읽지 않은 메시지 읽음 처리 (상대방이 보낸 메시지만)
  const markRoomMessagesAsRead = useCallback(async (messageIds?: number[]) => {
    if (!roomId || !chatAuth.isAuthenticated || !chatAuth.token) {
      return;
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      
      if (messageIds && messageIds.length > 0) {
        // 특정 메시지들만 읽음 처리
        const response = await chatApi.markMessagesAsRead(roomId, messageIds);
        
        if (response.success) {
          // 로컬 상태에서 해당 메시지들만 읽음 처리
          setMessages(prevMessages =>
            prevMessages.map(message =>
              messageIds.includes(message.messageId)
                ? { ...message, isRead: true }
                : message
            )
          );
          console.log('특정 메시지 읽음 처리 성공:', messageIds.length, '개');
        } else {
          console.error('특정 메시지 읽음 처리 실패:', response.error);
        }
      } else {
        // 채팅방의 모든 읽지 않은 메시지 읽음 처리 (상대방 메시지만)
        const response = await chatApi.markRoomMessagesAsRead(roomId);

        if (response.success) {
          // 로컬 상태에서 상대방이 보낸 메시지만 읽음 처리
          const currentUserType = chatAuth.userType; // 'WEB' 또는 'APP'
          setMessages(prevMessages =>
            prevMessages.map(message => 
              message.senderType !== currentUserType
                ? { ...message, isRead: true }
                : message // 내가 보낸 메시지는 그대로 유지
            )
          );
          console.log('채팅방 메시지 읽음 처리 성공 (상대방 메시지만)');
        } else {
          console.error('채팅방 메시지 읽음 처리 실패:', response.error);
        }
      }
    } catch (error) {
      console.error('채팅방 메시지 읽음 처리 오류:', error);
    }
  }, [roomId, chatAuth.isAuthenticated, chatAuth.token, chatAuth.userType]);

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