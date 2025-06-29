import { useState, useCallback, useRef, useEffect } from 'react';
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
      
      // 메시지가 화면에 보이면 읽음 처리
      if (isOpen && document.visibilityState === 'visible') {
        markRoomMessagesAsRead();
      }
      
      // 마지막 메시지 업데이트
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message, message.createdAt);
      }
    },
    // 메시지 전송 완료 시
    (message) => {
      console.log('메시지 전송 완료:', message);
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

  // 채팅방이 열릴 때 읽음 처리
  useEffect(() => {
    if (isOpen && currentRoomId && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.isRead && msg.senderType !== chatAuth.userType)
        .map(msg => msg.messageId);
      
      if (unreadMessageIds.length > 0) {
        markRoomMessagesAsRead(unreadMessageIds);
        updateUnreadCount(currentRoomId, 0);
      }
    }
  }, [isOpen, currentRoomId, messages, chatAuth.userType, markRoomMessagesAsRead, updateUnreadCount]);

  // 타이핑 상태 관리
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (!isTyping && currentRoomId) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3초 후 타이핑 상태 해제
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 3000);
  }, [isTyping, currentRoomId, sendTypingStatus]);

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
      // 웹소켓을 통해 메시지 전송
      await sendWebSocketMessage(messageText);
      
      // 마지막 메시지 업데이트
      if (currentRoomId) {
        updateLastMessage(currentRoomId, messageText, new Date().toISOString());
      }
      
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // 실패 시 메시지 복원
      setNewMessage(messageText);
    }
  }, [newMessage, currentRoomId, isConnected, sendWebSocketMessage, updateLastMessage, stopTyping]);

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
    
    // 채팅 파트너 정보
    chatPartner,
    requestId
  };
}; 