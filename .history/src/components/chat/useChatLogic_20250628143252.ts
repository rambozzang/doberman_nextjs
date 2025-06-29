// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useMessageReadStatus } from '@/hooks/useMessageReadStatus';
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
  const { chatAuth, refreshChatAuth } = useChatAuth();

  // 컴포넌트 마운트 시 채팅 인증 상태 새로고침
  useEffect(() => {
    refreshChatAuth();
  }, [refreshChatAuth]);
  const { createChatRoom, findChatRoomByRequestId, updateLastMessage, updateUnreadCount } = useChatRooms();
  const { 
    messages, 
    isLoading, 
    addMessage, 
    updateMessage,
    removeMessage,
    markRoomMessagesAsRead,
    markMyMessagesAsRead,
    refreshMessages 
  } = useChatMessages(currentRoomId);

  // 메시지 읽음 상태 처리 Hook
  const { 
    markMessagesAsRead: markSpecificMessagesAsRead,
    markVisibleMessagesAsRead,
    observeMessage,
    unobserveMessage 
  } = useMessageReadStatus({
    roomId: currentRoomId,
    onMarkAsRead: (messageIds) => {
      // 읽음 처리된 메시지들의 UI 업데이트
      messageIds.forEach(messageId => {
        updateMessage(messageId, { isRead: true });
      });
    }
  });

  // 웹소켓 연결
  const { 
    isConnected, 
    sendMessage: sendWebSocketMessage, 
    sendTypingStatus 
  } = useChatWebSocket(
    currentRoomId,
    // 새 메시지 수신 시
    (message) => {
      console.log('새 메시지 수신:', message);
      addMessage(message);
      
      // 상대방 메시지이고 채팅방이 열려있으면 자동 읽음 처리
      if (isOpen && document.visibilityState === 'visible' && 
          message.senderType !== chatAuth.userType && message.senderId !== chatAuth.userId) {
        setTimeout(() => {
          markSpecificMessagesAsRead([message.messageId]);
        }, 1000); // 1초 후 읽음 처리
      }
      
      // 마지막 메시지 업데이트
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message || '', message.createdAt);
      }
    },
    // 메시지 전송 완료 시 - 임시 메시지의 isRead 상태 업데이트
    (sentMessage) => {
      console.log('메시지 전송 완료:', {
        messageId: sentMessage.messageId,
        isRead: sentMessage.isRead,
        hasMessage: !!sentMessage.message
      });
      
      // addMessage에서 임시 메시지 교체 로직 처리
      addMessage(sentMessage);
    },
    // 타이핑 상태 변경 시
    (isTyping, userId) => {
      if (userId !== chatAuth.userId) {
        setPartnerTyping(isTyping);
      }
    },
    // 메시지 읽음 처리 시 (상대방이 내 메시지를 읽었을 때)
    (messageId) => {
      console.log('상대방이 메시지를 읽음:', messageId);
      // 해당 메시지의 읽음 상태 업데이트
      updateMessage(messageId, { isRead: true });
    },
    // 사용자 입장 시 - 상대방이 입장하면 모든 내 메시지를 읽음 처리
    (joinedUserId) => {
      console.log('사용자 입장:', joinedUserId);
      
      // 상대방이 입장한 경우 (내가 아닌 경우)
      if (joinedUserId !== chatAuth.userId) {
        console.log('상대방이 입장했으므로 모든 내 메시지를 읽음 처리');
        
        // useChatMessages의 함수를 사용하여 안전하게 처리
        markMyMessagesAsRead();
      }
    },
    // 사용자 퇴장 시
    (leftUserId) => {
      console.log('사용자 퇴장:', leftUserId);
    }
  );

  // 자동 스크롤
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 메시지 목록이 변경될 때마다 스크롤
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, scrollToBottom]);

  // 채팅방이 열릴 때 읽음 처리 (상대방이 보낸 메시지만)
  useEffect(() => {
    if (isOpen && currentRoomId && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.isRead && msg.senderType !== chatAuth.userType && msg.senderId !== chatAuth.userId)
        .map(msg => msg.messageId);
      
      if (unreadMessageIds.length > 0) {
        // 개선된 읽음 처리 사용
        markSpecificMessagesAsRead(unreadMessageIds);
        updateUnreadCount(currentRoomId, 0);
      }
    }
  }, [isOpen, currentRoomId, messages, chatAuth.userType, chatAuth.userId, markSpecificMessagesAsRead, updateUnreadCount]);

  // 타이핑 상태 관리
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    console.log('⌨️ [useChatLogic] 타이핑 이벤트 발생:', {
      isTyping,
      currentRoomId,
      isConnected,
      timestamp: new Date().toISOString()
    });

    if (!isTyping && currentRoomId) {
      console.log('⌨️ [useChatLogic] 타이핑 시작 - 서버에 전송');
      setIsTyping(true);
      const success = sendTypingStatus(true);
      console.log('⌨️ [useChatLogic] 타이핑 시작 전송 결과:', success);
    }

    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3초 후 타이핑 상태 해제
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⌨️ [useChatLogic] 타이핑 종료 - 서버에 전송');
      setIsTyping(false);
      const success = sendTypingStatus(false);
      console.log('⌨️ [useChatLogic] 타이핑 종료 전송 결과:', success);
    }, 3000);
  }, [isTyping, currentRoomId, sendTypingStatus, isConnected]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [isTyping, sendTypingStatus]);

  // 컴포넌트 언마운트 시 타이핑 상태 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // 메시지 입력 변경 핸들러
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  // 채팅 모달 열기
  const openChat = useCallback(async () => {
    console.log('채팅 열기 시도 - 인증 상태:', {
      isAuthenticated: chatAuth.isAuthenticated,
      userId: chatAuth.userId,
      userType: chatAuth.userType,
      hasToken: !!chatAuth.token
    });
    
    if (!chatAuth.isAuthenticated) {
      console.log('로그인이 필요합니다.');
      return;
    }

    // 필수 파라미터 검증
    if (!chatPartner?.userId || !requestId) {
      console.error('채팅 파트너 정보 또는 요청 ID가 없습니다.');
      console.log('채팅을 시작하기 위한 정보가 부족합니다.');
      return;
    }

    setIsOpen(true);

    // 채팅방 찾기 또는 생성
    try {
      const expertId = chatPartner.userId || chatPartner.answerId || chatPartner.id;
      if (!expertId) {
        throw new Error('전문가 ID를 찾을 수 없습니다.');
      }

      console.log('채팅방 처리 시작:', { requestId, expertId });

      // 1. 먼저 기존 채팅방이 있는지 확인
      const existingRoomId = await findChatRoomByRequestId(requestId, expertId.toString());
      
      if (existingRoomId) {
        // 기존 채팅방이 있으면 연결
        setCurrentRoomId(existingRoomId);
        console.log('기존 채팅방 연결:', existingRoomId);
      } else {
        // 기존 채팅방이 없으면 새로 생성
        console.log('새 채팅방 생성 시도:', { requestId, expertId });
        const roomId = await createChatRoom(requestId, expertId.toString());
        
        if (roomId) {
          setCurrentRoomId(roomId);
          console.log('새 채팅방 생성 완료:', roomId);
        } else {
          throw new Error('채팅방 ID를 받지 못했습니다.');
        }
      }
    } catch (error) {
      console.error('채팅방 처리 오류:', error);
      setIsOpen(false);
      console.log('채팅방 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
    stopTyping();
  }, [stopTyping]);

  // 메시지 전송
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentRoomId || !isConnected) {
      return;
    }

    // 웹소켓이 연결되지 않은 경우
    if (!isConnected) {
      console.log('채팅방에 연결되지 않았습니다.');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    stopTyping();

    try {
      // 즉시 UI에 메시지 추가 (낙관적 업데이트)
      const tempMessage = {
        messageId: Date.now(), // 임시 ID
        senderType: chatAuth.userType || 'WEB',
        senderId: chatAuth.userId || '',
        message: messageText,
        filePath: null,
        isRead: false, // 내가 보낸 메시지는 상대방이 읽지 않았으므로 false
        createdAt: new Date().toISOString(),
        timeAgo: '방금 전'
      };
      
      // UI에 즉시 추가
      addMessage(tempMessage);
      
      // 웹소켓을 통해 메시지 전송
      const success = sendWebSocketMessage(messageText);
      
      if (success) {
        // 마지막 메시지 업데이트
        if (currentRoomId) {
          updateLastMessage(currentRoomId, messageText, new Date().toISOString());
        }
      } else {
        // 전송 실패 시 UI에서 메시지 제거
        removeMessage(tempMessage.messageId);
        setNewMessage(messageText); // 메시지 복원
        console.log('메시지 전송에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // 실패 시 메시지 복원
      setNewMessage(messageText);
    }
  }, [newMessage, currentRoomId, isConnected, sendWebSocketMessage, updateLastMessage, stopTyping, chatAuth.userType, chatAuth.userId, addMessage, removeMessage]);

  // 파일 업로드
  const uploadFile = useCallback(async (file: File) => {
    if (!currentRoomId || uploadingFile) {
      return;
    }

    setUploadingFile(true);
    try {
      const uploadedFile = await chatApi.uploadFile(currentRoomId, file);
      
      // 파일 메시지 전송
      await sendWebSocketMessage(`[파일] ${uploadedFile.fileName}`, 'file', uploadedFile.fileUrl);
      
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      console.log('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(false);
    }
  }, [currentRoomId, uploadingFile, sendWebSocketMessage]);

  // Enter 키 핸들러
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return {
    // 상태
    isOpen,
    newMessage,
    currentRoomId,
    isTyping,
    partnerTyping,
    uploadingFile,
    isConnected,
    isLoading,
    messages,
    messagesEndRef,
    
    // 액션
    openChat,
    closeChat,
    sendMessage,
    uploadFile,
    handleMessageChange,
    handleKeyPress,
    setNewMessage,
    refreshMessages,
    
    // 읽음 처리 관련
    markSpecificMessagesAsRead,
    markVisibleMessagesAsRead,
    observeMessage,
    unobserveMessage,
    
    // 채팅 파트너 정보
    chatPartner,
    requestId
  };
}; 