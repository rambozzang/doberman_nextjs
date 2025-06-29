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
  const { chatRooms, createChatRoom, findChatRoomByRequestAndExpert, updateLastMessage, updateUnreadCount } = useChatRooms();
  const { 
    messages, 
    isLoading, 
    addMessage, 
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
    // 새 메시지 수신 시
    (message) => {
      addMessage(message);
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message || '', message.createdAt);
        // 읽지 않은 메시지 수 업데이트는 실제 API에서 처리
      }
      scrollToBottom();
    },
    // 메시지 전송 완료 시
    (message) => {
      addMessage(message);
      if (currentRoomId) {
        updateLastMessage(currentRoomId, message.message || '', message.createdAt);
      }
      scrollToBottom();
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

  // 메시지 끝으로 스크롤
  const scrollToBottom = useCallback(() => {
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

    setIsOpen(true);

    // 채팅방 찾기 또는 생성
    if (chatPartner?.user?.id && requestId) {
      try {
        // 1. requestId와 전문가 ID로 기존 채팅방 조회
        console.log('채팅방 조회 시작 - requestId:', requestId, 'expertId:', chatPartner.user.id);
        const existingRoomId = await findChatRoomByRequestAndExpert(requestId, chatPartner.user.id.toString());

        if (existingRoomId) {
          // 기존 채팅방이 있으면 조인
          setCurrentRoomId(existingRoomId);
          console.log('기존 채팅방 조인:', existingRoomId);
        } else {
          // 2. 기존 채팅방이 없으면 새로 생성
          console.log('새 채팅방 생성 시작 - requestId:', requestId, 'expertId:', chatPartner.user.id);
          const roomId = await createChatRoom(
            chatPartner.user.id.toString(),
            'APP',
            requestId
          );
          
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
    } else {
      console.error('채팅 파트너 정보 또는 요청 ID가 없습니다.');
      setIsOpen(false);
      toast.error('채팅을 시작하기 위한 정보가 부족합니다.');
      return;
    }

    scrollToBottom();
  }, [chatAuth.isAuthenticated, chatPartner, chatRooms, createChatRoom]);

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
      // WebSocket으로 메시지 전송
      sendWebSocketMessage(messageText);
      console.log('메시지 전송:', messageText);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      // 실패 시 메시지 복원
      setNewMessage(messageText);
    }
  }, [newMessage, currentRoomId, isConnected, sendWebSocketMessage]);

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

  // 메시지 변경 시 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // 기존 ChatMessage 형식으로 변환하는 함수
  const getFormattedMessages = useCallback((): ChatMessage[] => {
    return messages.map(msg => ({
      id: msg.messageId.toString(),
      senderId: msg.senderId,
      senderName: msg.senderType === 'WEB' ? '나' : (chatPartner?.user?.userName || '전문가'),
      senderType: msg.senderType === 'WEB' ? 'customer' : 'expert',
      message: msg.message || msg.filePath || '',
      timestamp: msg.createdAt,
      isRead: msg.isRead
    }));
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