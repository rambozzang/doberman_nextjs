import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChatMessage } from './types';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { chatApi } from '@/lib/chatApi';

export const useChatLogic = (chatPartner?: CustomerRequestAnswer, requestId?: number) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅 시스템 훅들
  const { chatAuth } = useChatAuth();
  const { createChatRoom, findChatRoomByRequestId, updateLastMessage, updateUnreadCount } = useChatRooms();
  const { 
    messages, 
    isLoading, 
    addMessage, 
    updateMessage,
    removeMessage,
    markRoomMessagesAsRead,
    refreshMessages 
  } = useChatMessages(currentRoomId);

  // WebSocket 연결 및 실시간 처리
  const { 
    isConnected, 
    connectionError, 
    sendMessage: sendWebSocketMessage,
    sendFileMessage,
    sendTypingStatus 
  } = useChatWebSocket(
    currentRoomId,
    // 새 메시지 수신 시 (다른 사용자로부터 받은 메시지)
    (message) => {
      console.log('새 메시지 수신:', message);
      addMessage(message);
      
      // 새로 받은 메시지가 읽음 상태라면, 이전 메시지들도 모두 읽음 처리
      if (message.isRead) {
        console.log('새로 받은 메시지가 읽음 상태이므로 이전 메시지들을 읽음 처리합니다.');
        // 약간의 지연을 두어 메시지가 추가된 후 처리
        setTimeout(() => {
          markPreviousMessagesAsRead(message.messageId);
        }, 100);
      }
      
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message || '', message.createdAt);
        // 읽지 않은 메시지 수 업데이트는 실제 API에서 처리
      }
    },
    // 메시지 전송 완료 시 (내가 보낸 메시지 확인)
    (message) => {
      console.log('메시지 전송 확인:', message);
      
      // 임시 메시지를 실제 서버 메시지로 교체 (읽음 상태 포함)
      const tempMessages = messages.filter(msg => 
        msg.messageId < 0 && 
        msg.senderType === 'WEB' && 
        msg.message === message.message
      );
      
      if (tempMessages.length > 0) {
        // 가장 최근 임시 메시지 찾기
        const latestTempMessage = tempMessages[tempMessages.length - 1];
        console.log('임시 메시지를 실제 메시지로 교체:', latestTempMessage.messageId, '->', message.messageId);
        
        // 임시 메시지 제거
        removeMessage(latestTempMessage.messageId);
        
        // 실제 메시지 추가
        addMessage({
          ...message,
          // 서버에서 받은 읽음 상태 그대로 사용
        });

        // 새 메시지가 읽음 상태라면, 이전 메시지들도 모두 읽음 처리
        if (message.isRead) {
          console.log('새 메시지가 읽음 상태이므로 이전 메시지들을 읽음 처리합니다.');
          markPreviousMessagesAsRead(message.messageId);
        }
      }
      
      // 마지막 메시지 업데이트
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message || '', message.createdAt);
      }
    },
    // 타이핑 상태 변경 시
    (isTyping, userId) => {
      if (userId !== chatAuth.userId) {
        setPartnerTyping(isTyping);
      }
    },
    // 메시지 읽음 처리 시
    (messageId) => {
      console.log('메시지 읽음 처리:', messageId);
      // 해당 메시지의 읽음 상태를 업데이트
      updateMessage(messageId, { isRead: true });
      
      // 해당 메시지가 읽음 처리되면, 이전 메시지들도 모두 읽음 처리
      markPreviousMessagesAsRead(messageId);
    },
    // 사용자 입장 시
    (userId) => {
      console.log('🚪 사용자 입장:', userId);
      // 상대방이 입장하면 모든 메시지를 읽음 처리
      if (userId !== chatAuth.userId) {
        console.log('👥 상대방이 채팅방에 입장했습니다. 모든 메시지를 읽음 처리합니다.');
        
        // 현재 채팅방의 모든 읽지 않은 메시지 찾기
        const allUnreadMessages = messages.filter(msg => !msg.isRead);
        
        if (allUnreadMessages.length > 0) {
          console.log(`📖 상대방 입장으로 인한 전체 메시지 읽음 처리: ${allUnreadMessages.length}개`);
          
          // 모든 읽지 않은 메시지를 읽음 처리
          allUnreadMessages.forEach(msg => {
            updateMessage(msg.messageId, { isRead: true });
          });
          
          // 채팅방의 읽지 않은 메시지 수를 0으로 업데이트
          if (currentRoomId) {
            updateUnreadCount(currentRoomId, 0);
          }
        } else {
          console.log('📝 읽지 않은 메시지가 없습니다.');
        }
      }
    },
    // 사용자 퇴장 시
    (userId) => {
      console.log('사용자 퇴장:', userId);
      // 필요시 추가 처리 (현재는 로그만)
    }
  );

  // 메시지 끝으로 스크롤
  const scrollToBottom = useCallback(() => {
    // 즉시 스크롤과 지연 스크롤 모두 실행하여 안정성 확보
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // 채팅 모달 열기
  const openChat = useCallback(async () => {
    if (!chatAuth.isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 필수 파라미터 검증
    if (!chatPartner?.userId || !requestId) {
      console.error('채팅 파트너 정보 또는 요청 ID가 없습니다.');
      toast.error('채팅을 시작하기 위한 정보가 부족합니다.');
      return;
    }

    setIsOpen(true);

    // 채팅방 찾기 또는 생성
    try {
      // 1. requestId와 전문가 ID로 기존 채팅방 조회
      console.log('채팅방 조회 시작 - requestId:', requestId, 'expertId:', chatPartner.userId);
      const existingRoomId = await findChatRoomByRequestId(requestId);

      if (existingRoomId) {
        // 기존 채팅방이 있으면 조인
        setCurrentRoomId(existingRoomId);
        console.log('기존 채팅방 조인:', existingRoomId);
      } else {
        // 2. 기존 채팅방이 없으면 새로 생성
        console.log('새 채팅방 생성 시작 - requestId:', requestId, 'expertId:', chatPartner.userId);
        const roomId = await createChatRoom(requestId, chatPartner.userId.toString());
        
        if (roomId) {
          setCurrentRoomId(roomId);
          console.log('새 채팅방 생성 완료:', roomId);
        } else {
          throw new Error('채팅방 ID를 받지 못했습니다.');
        }
      }
    } catch (error) {
      console.error('채팅방 조회/생성 오류:', error);
      setIsOpen(false);
      toast.error('채팅방 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    scrollToBottom();
  }, [chatAuth.isAuthenticated, chatPartner, requestId, findChatRoomByRequestId, createChatRoom]);

  // 채팅 모달 닫기
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setCurrentRoomId(null);
    setNewMessage('');
    setIsTyping(false);
    setPartnerTyping(false);
  }, []);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentRoomId || !isConnected) {
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);

    try {
      // 즉시 UI에 내 메시지 표시 (임시 ID 사용 - 음수로 서버 ID와 구분)
      const tempMessage = {
        messageId: -Date.now(), // 임시 ID (음수로 서버 ID와 구분)
        senderType: 'WEB' as const,
        senderId: chatAuth.userId || '',
        message: messageText,
        filePath: null,
        isRead: false,
        createdAt: new Date().toISOString(),
        timeAgo: '방금 전'
      };
      addMessage(tempMessage);

      // WebSocket으로 메시지 전송
      const success = sendWebSocketMessage(messageText);
      if (!success) {
        throw new Error('메시지 전송에 실패했습니다.');
      }
      console.log('메시지 전송:', messageText);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      // 실패 시 메시지 복원
      setNewMessage(messageText);
    }
  }, [newMessage, currentRoomId, isConnected, sendWebSocketMessage, chatAuth.userId, addMessage]);

  // 파일 업로드 및 전송
  const handleFileUpload = useCallback(async (file: File) => {
    if (!currentRoomId || !isConnected) {
      toast.error('채팅방에 연결되지 않았습니다.');
      return;
    }

    setUploadingFile(true);

    try {
      // 파일 업로드
      if (chatAuth.token) {
        chatApi.setAuthHeader(chatAuth.token);
      }

      const uploadResponse = await chatApi.uploadFile(file);

      if (uploadResponse.success && uploadResponse.data?.filePath) {
        // WebSocket으로 파일 메시지 전송
        sendFileMessage(uploadResponse.data.filePath);
        console.log('파일 메시지 전송:', uploadResponse.data.filePath);
      } else {
        throw new Error(uploadResponse.error || '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(false);
    }
  }, [currentRoomId, isConnected, chatAuth.token, sendFileMessage]);

  // 타이핑 상태 처리
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      sendTypingStatus(true);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      sendTypingStatus(false);
    }
  }, [isTyping, sendTypingStatus]);

  // Enter 키 처리
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 채팅방 열림 시 메시지 읽음 처리
  useEffect(() => {
    if (isOpen && currentRoomId) {
      markRoomMessagesAsRead();
      if (currentRoomId) {
        updateUnreadCount(currentRoomId, 0);
      }
    }
  }, [isOpen, currentRoomId, markRoomMessagesAsRead, updateUnreadCount]);

  // 메시지 변경 시 자동 스크롤 및 읽음 처리 확인
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      
      // 가장 최근 읽음 메시지 찾기
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // 마지막으로 읽은 메시지 찾기 (읽음 상태인 메시지 중 가장 최근)
      let lastReadMessage = null;
      for (let i = sortedMessages.length - 1; i >= 0; i--) {
        if (sortedMessages[i].isRead) {
          lastReadMessage = sortedMessages[i];
          break;
        }
      }
      
      // 마지막 읽은 메시지가 있다면, 그 이전 메시지들 중 읽지 않은 것들을 읽음 처리
      if (lastReadMessage) {
        const lastReadIndex = sortedMessages.findIndex(msg => msg.messageId === lastReadMessage.messageId);
        const messagesToUpdate = sortedMessages.slice(0, lastReadIndex).filter(msg => !msg.isRead);
        
        if (messagesToUpdate.length > 0) {
          console.log(`메시지 목록 업데이트로 인한 읽음 처리: ${messagesToUpdate.length}개`);
          messagesToUpdate.forEach(msg => {
            updateMessage(msg.messageId, { isRead: true });
          });
        }
      }
    }
  }, [messages, scrollToBottom, updateMessage]); // updateMessage 의존성 추가

  // 특정 메시지 이전의 모든 메시지를 읽음 처리하는 함수
  const markPreviousMessagesAsRead = useCallback((lastReadMessageId: number) => {
    if (!messages || messages.length === 0) {
      console.log('메시지가 없어서 읽음 처리를 건너뜁니다.');
      return;
    }

    // 메시지를 시간순으로 정렬 (오래된 것부터)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // 마지막 읽은 메시지의 인덱스 찾기
    const lastReadIndex = sortedMessages.findIndex(msg => msg.messageId === lastReadMessageId);
    
    if (lastReadIndex === -1) {
      console.log('마지막 읽은 메시지를 찾을 수 없습니다:', lastReadMessageId, '전체 메시지:', messages.length);
      return;
    }

    // 마지막 읽은 메시지 이전의 모든 메시지를 읽음 처리 (마지막 읽은 메시지 포함)
    const messagesToMarkAsRead = sortedMessages.slice(0, lastReadIndex + 1).filter(msg => !msg.isRead);
    
    if (messagesToMarkAsRead.length > 0) {
      console.log(`읽음 처리 대상 메시지: ${messagesToMarkAsRead.length}개 (전체: ${messages.length}개)`);
      console.log('읽음 처리할 메시지 ID들:', messagesToMarkAsRead.map(msg => msg.messageId));
      
      messagesToMarkAsRead.forEach(msg => {
        console.log(`메시지 ${msg.messageId} 읽음 처리: "${msg.message?.substring(0, 20)}..."`);
        updateMessage(msg.messageId, { isRead: true });
      });
    } else {
      console.log('읽음 처리할 메시지가 없습니다.');
    }
  }, [messages, updateMessage]);

  // 기존 ChatMessage 형식으로 변환하는 함수
  const getFormattedMessages = useCallback((): ChatMessage[] => {
    // 메시지를 시간순으로 정렬 (오래된 것부터 - 채팅 UI 표시 순서)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const formattedMessages = sortedMessages.map(msg => ({
      id: msg.messageId.toString(),
      senderId: msg.senderId,
      senderName: msg.senderType === 'WEB' ? '나' : (chatPartner?.user?.userName || '전문가'),
      senderType: msg.senderType === 'WEB' ? 'customer' : 'expert',
      message: msg.message || msg.filePath || '',
      timestamp: msg.createdAt,
      isRead: msg.isRead
    }));

    // 디버깅용 로그 - 내가 보낸 메시지의 읽음 상태 확인
    const myMessages = formattedMessages.filter(msg => msg.senderType === 'customer');
    if (myMessages.length > 0) {
      console.log('📋 [메시지 포맷팅] 내가 보낸 메시지들의 읽음 상태:', 
        myMessages.map(msg => ({
          id: msg.id,
          message: msg.message.substring(0, 20) + '...',
          isRead: msg.isRead
        }))
      );
    }

    return formattedMessages;
  }, [messages, chatPartner?.user?.userName]);

  return {
    // 상태
    isOpen,
    newMessage,
    isLoading,
    isConnected,
    connectionError,
    isTyping: partnerTyping,
    uploadingFile,
    
    // 데이터
    messages: getFormattedMessages(),
    chatPartner,
    messagesEndRef,
    
    // 액션
    openChat,
    closeChat,
    handleSendMessage,
    handleFileUpload,
    handleTyping,
    handleKeyPress,
    refreshMessages,
    
    // 시스템 상태
    isAuthenticated: chatAuth.isAuthenticated,
    currentRoomId
  };
}; 