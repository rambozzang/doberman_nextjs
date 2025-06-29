import { useEffect, useCallback, useRef, useState } from 'react';
import { chatWebSocket } from '@/lib/chatWebSocket';
import { WebSocketMessage, ChatApiMessage } from '@/components/chat/types';
import { useChatAuth } from './useChatAuth';

export const useChatWebSocket = (
  roomId: number | null,
  onNewMessage?: (message: ChatApiMessage) => void,
  onMessageSent?: (message: ChatApiMessage) => void,
  onTypingStatus?: (isTyping: boolean, userId: string) => void,
  onMessageRead?: (messageId: number) => void
) => {
  const { chatAuth, isReady } = useChatAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const currentRoomRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false); // 연결 중 상태 추적

  // WebSocket 이벤트 핸들러들
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('WebSocket 메시지 수신:', data);

    switch (data.type) {
      case 'message':
        if (data.messageId && data.message && data.createdAt && onNewMessage) {
          const newMessage: ChatApiMessage = {
            messageId: data.messageId,
            senderType: data.senderType || 'APP',
            senderId: data.senderId || '',
            message: data.message,
            filePath: data.filePath || null,
            isRead: data.isRead || false,
            createdAt: data.createdAt,
            timeAgo: data.timeAgo || ''
          };
          onNewMessage(newMessage);
        }
        break;

      case 'message_sent':
        if (data.messageId && data.message && data.createdAt && onMessageSent) {
          const sentMessage: ChatApiMessage = {
            messageId: data.messageId,
            senderType: data.senderType || 'WEB',
            senderId: data.senderId || '',
            message: data.message,
            filePath: data.filePath || null,
            isRead: data.isRead || false,
            createdAt: data.createdAt,
            timeAgo: data.timeAgo || ''
          };
          onMessageSent(sentMessage);
        }
        break;

      case 'typing_status':
        if (data.isTyping !== undefined && data.userId && onTypingStatus) {
          onTypingStatus(data.isTyping, data.userId);
        }
        break;

      case 'message_read_update':
        if (data.messageId && onMessageRead) {
          onMessageRead(data.messageId);
        }
        break;

      case 'connection':
        console.log('WebSocket 연결 상태:', data.success ? '성공' : '실패');
        if (!data.success && data.error) {
          setConnectionError(data.error);
        }
        break;

      case 'pong':
        console.log('WebSocket pong 수신');
        break;

      default:
        console.log('알 수 없는 WebSocket 메시지 타입:', data.type);
    }
  }, [onNewMessage, onMessageSent, onTypingStatus, onMessageRead]);

  // WebSocket 수동 연결 (외부 호출용)
  const connect = useCallback(async () => {
    if (!isReady || !chatAuth.token || !chatAuth.userId || !chatAuth.userType || !roomId) {
      console.log('수동 연결: 채팅 인증 정보 또는 roomId가 준비되지 않음');
      return;
    }
    
    console.log('수동 WebSocket 연결 시도');
    // useEffect의 connectToRoom 로직과 동일하게 처리됨
  }, [isReady, chatAuth.token, chatAuth.userId, chatAuth.userType, roomId]);

  // WebSocket 수동 연결 해제 (외부 호출용)
  const disconnect = useCallback(() => {
    console.log('수동 WebSocket 연결 해제');
    
    // 이벤트 리스너 제거
    chatWebSocket.off('message');
    chatWebSocket.off('message_sent');
    chatWebSocket.off('typing_status');
    chatWebSocket.off('message_read_update');
    chatWebSocket.off('connection');
    chatWebSocket.off('pong');

    chatWebSocket.disconnect();
    setIsConnected(false);
    setConnectionError(null);
    currentRoomRef.current = null;
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((message: string) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      console.error('메시지 전송 불가: WebSocket 연결되지 않음 또는 필수 정보 누락');
      return false;
    }

    console.log('메시지 전송:', { roomId, message });
    return chatWebSocket.sendMessage(roomId, message, chatAuth.userType, chatAuth.userId);
  }, [isConnected, roomId, chatAuth.userId, chatAuth.userType]);

  // 파일 메시지 전송
  const sendFileMessage = useCallback((filePath: string) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      console.error('파일 메시지 전송 불가: WebSocket 연결되지 않음 또는 필수 정보 누락');
      return false;
    }

    console.log('파일 메시지 전송:', { roomId, filePath });
    return chatWebSocket.sendFileMessage(roomId, filePath, chatAuth.userType, chatAuth.userId);
  }, [isConnected, roomId, chatAuth.userId, chatAuth.userType]);

  // 타이핑 상태 전송
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      return false;
    }

    const success = chatWebSocket.sendTypingStatus(roomId, isTyping, chatAuth.userId, chatAuth.userType);

    // 타이핑 중지 자동 처리
    if (isTyping && success) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (chatAuth.userId && chatAuth.userType) {
          chatWebSocket.sendTypingStatus(roomId, false, chatAuth.userId, chatAuth.userType);
        }
      }, 3000); // 3초 후 자동으로 타이핑 중지
    }

    return success;
  }, [isConnected, roomId, chatAuth.userId, chatAuth.userType]);

  // roomId 변경 시 재연결
  useEffect(() => {
    const connectToRoom = async () => {
      if (!isReady || !chatAuth.token || !chatAuth.userId || !chatAuth.userType || !roomId) {
        console.log('채팅 인증 정보 또는 roomId가 준비되지 않음');
        return;
      }

      // 이미 연결 중이거나 같은 방에 연결되어 있으면 중단
      if (isConnectingRef.current || currentRoomRef.current === roomId) {
        console.log('이미 연결 중이거나 같은 방에 연결됨:', { 
          isConnecting: isConnectingRef.current, 
          currentRoom: currentRoomRef.current, 
          targetRoom: roomId 
        });
        return;
      }

      try {
        isConnectingRef.current = true; // 연결 시작
        setConnectionError(null);
        console.log('WebSocket 연결 시도:', { roomId });

        const connected = await chatWebSocket.connect(
          chatAuth.token,
          chatAuth.userId,
          chatAuth.userType,
          roomId
        );

        if (connected) {
          setIsConnected(true);
          currentRoomRef.current = roomId;
          console.log('WebSocket 연결 성공');

          // 이벤트 리스너 등록
          chatWebSocket.on('message', handleMessage);
          chatWebSocket.on('message_sent', handleMessage);
          chatWebSocket.on('typing_status', handleMessage);
          chatWebSocket.on('message_read_update', handleMessage);
          chatWebSocket.on('connection', handleMessage);
          chatWebSocket.on('pong', handleMessage);
        } else {
          setIsConnected(false);
          setConnectionError('WebSocket 연결에 실패했습니다.');
        }
      } catch (error) {
        console.error('WebSocket 연결 오류:', error);
        setIsConnected(false);
        setConnectionError(error instanceof Error ? error.message : 'WebSocket 연결 오류');
      }
    };

    const disconnectFromRoom = () => {
      console.log('WebSocket 연결 해제');
      
      // 이벤트 리스너 제거
      chatWebSocket.off('message');
      chatWebSocket.off('message_sent');
      chatWebSocket.off('typing_status');
      chatWebSocket.off('message_read_update');
      chatWebSocket.off('connection');
      chatWebSocket.off('pong');

      chatWebSocket.disconnect();
      setIsConnected(false);
      setConnectionError(null);
      currentRoomRef.current = null;
    };

    if (roomId && roomId !== currentRoomRef.current) {
      // 기존 연결 해제
      if (currentRoomRef.current) {
        console.log('기존 연결 해제 후 새 채팅방 연결:', currentRoomRef.current, '->', roomId);
        disconnectFromRoom();
      }
      
      // 새로운 채팅방에 연결
      connectToRoom();
    } else if (!roomId && currentRoomRef.current) {
      // roomId가 null이 되면 연결 해제
      console.log('roomId가 null이 되어 연결 해제:', currentRoomRef.current);
      disconnectFromRoom();
    }
  }, [roomId, isReady, chatAuth.token, chatAuth.userId, chatAuth.userType, handleMessage]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 정리 시 연결 해제
      console.log('컴포넌트 언마운트로 인한 WebSocket 연결 해제');
      chatWebSocket.off('message');
      chatWebSocket.off('message_sent');
      chatWebSocket.off('typing_status');
      chatWebSocket.off('message_read_update');
      chatWebSocket.off('connection');
      chatWebSocket.off('pong');
      chatWebSocket.disconnect();
      setIsConnected(false);
      setConnectionError(null);
      currentRoomRef.current = null;
    };
  }, []); // 의존성 제거

  // 연결 상태 확인
  const checkConnection = useCallback(() => {
    const actuallyConnected = chatWebSocket.isSocketConnected();
    if (isConnected !== actuallyConnected) {
      setIsConnected(actuallyConnected);
    }
    return actuallyConnected;
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendFileMessage,
    sendTypingStatus,
    checkConnection,
    currentRoomId: currentRoomRef.current
  };
}; 