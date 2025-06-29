import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { chatApi } from '@/lib/chatApi';

export const useChatLogic = (chatPartner?: CustomerRequestAnswer) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅 시스템 훅들
  const { chatAuth } = useChatAuth();
  const { chatRooms, createChatRoom, updateLastMessage, updateUnreadCount } = useChatRooms();
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
      alert('로그인이 필요합니다.');
      return;
    }

    setIsOpen(true);

    // 채팅방 찾기 또는 생성
    if (chatPartner?.user?.id) {
      try {
        // 기존 채팅방 찾기
        const existingRoom = chatRooms.find(room => 
          room.partnerName === chatPartner.user?.userName
        );

        if (existingRoom) {
          setCurrentRoomId(existingRoom.roomId);
          console.log('기존 채팅방 연결:', existingRoom.roomId);
        } else {
          // 임시 roomId 생성 (실제로는 서버에서 생성되어야 함)
          const tempRoomId = Date.now(); // 임시 ID
          setCurrentRoomId(tempRoomId);
          console.log('임시 채팅방 ID 생성:', tempRoomId);
          
          // 실제 채팅방 생성은 백그라운드에서 처리
          try {
            const roomId = await createChatRoom(
              chatPartner.user.id.toString(),
              'APP'
            );
            
            if (roomId && roomId !== tempRoomId) {
              setCurrentRoomId(roomId);
              console.log('실제 채팅방 생성 완료:', roomId);
            }
          } catch (error) {
            console.error('채팅방 생성 오류 (계속 진행):', error);
            // 임시 ID로 계속 진행
          }
        }
      } catch (error) {
        console.error('채팅방 생성/연결 오류:', error);
        // 오류가 발생해도 임시 ID로 진행
        const tempRoomId = Date.now();
        setCurrentRoomId(tempRoomId);
        console.log('오류 발생, 임시 채팅방 ID로 진행:', tempRoomId);
      }
    } else {
      // chatPartner 정보가 없는 경우도 임시 ID 생성
      const tempRoomId = Date.now();
      setCurrentRoomId(tempRoomId);
      console.log('파트너 정보 없음, 임시 채팅방 ID 생성:', tempRoomId);
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
      alert('채팅방에 연결되지 않았습니다.');
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
      alert('파일 업로드에 실패했습니다.');
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