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

  // WebSocket 연결
  const connect = useCallback(async () => {
    if (!isReady || !chatAuth.token || !chatAuth.userId || !chatAuth.userType) {
      console.log('채팅 인증 정보가 준비되지 않음');
      return;
    }

    try {
      setConnectionError(null);
      console.log('WebSocket 연결 시도');

      const connected = await chatWebSocket.connect(
        chatAuth.token,
        chatAuth.userId,
        chatAuth.userType
      );

      if (connected) {
        setIsConnected(true);
        console.log('WebSocket 연결 성공');

        // 이벤트 리스너 등록
        chatWebSocket.on('message', handleMessage);
        chatWebSocket.on('message_sent', handleMessage);
        chatWebSocket.on('typing_status', handleMessage);
        chatWebSocket.on('message_read_update', handleMessage);
        chatWebSocket.on('connection', handleMessage);
        chatWebSocket.on('pong', handleMessage);

        // 현재 채팅방에 연결
        if (roomId) {
          chatWebSocket.connectToChatRoom(roomId);
          currentRoomRef.current = roomId;
        }
      } else {
        setIsConnected(false);
        setConnectionError('WebSocket 연결에 실패했습니다.');
      }
    } catch (error) {
      console.error('WebSocket 연결 오류:', error);
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'WebSocket 연결 오류');
    }
  }, [isReady, chatAuth.token, chatAuth.userId, chatAuth.userType, roomId, handleMessage]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    console.log('WebSocket 연결 해제');
    
    // 이벤트 리스너 제거
    chatWebSocket.off('message');
    chatWebSocket.off('message_sent');
    chatWebSocket.off('typing_status');
    chatWebSocket.off('message_read_update');
    chatWebSocket.off('connection');
    chatWebSocket.off('pong');

    // 채팅방 연결 해제
    if (currentRoomRef.current) {
      chatWebSocket.disconnectFromChatRoom(currentRoomRef.current);
      currentRoomRef.current = null;
    }

    chatWebSocket.disconnect();
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((message: string) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      console.error('메시지 전송 불가: WebSocket 연결되지 않음 또는 필수 정보 누락');
      return;
    }

    console.log('메시지 전송:', { roomId, message });
    chatWebSocket.sendMessage(roomId, message, chatAuth.userType, chatAuth.userId);
  }, [isConnected, roomId, chatAuth.userId, chatAuth.userType]);

  // 파일 메시지 전송
  const sendFileMessage = useCallback((filePath: string) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      console.error('파일 메시지 전송 불가: WebSocket 연결되지 않음 또는 필수 정보 누락');
      return;
    }

    console.log('파일 메시지 전송:', { roomId, filePath });
    chatWebSocket.sendFileMessage(roomId, filePath, chatAuth.userType, chatAuth.userId);
  }, [isConnected, roomId, chatAuth.userId, chatAuth.userType]);

  // 타이핑 상태 전송
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!isConnected || !roomId) {
      return;
    }

    chatWebSocket.sendTypingStatus(roomId, isTyping);

    // 타이핑 중지 자동 처리
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        chatWebSocket.sendTypingStatus(roomId, false);
      }, 3000); // 3초 후 자동으로 타이핑 중지
    }
  }, [isConnected, roomId]);

  // Ping 전송 (연결 상태 확인)
  const ping = useCallback(() => {
    if (isConnected) {
      chatWebSocket.ping();
    }
  }, [isConnected]);

  // 채팅방 변경 시 처리
  useEffect(() => {
    if (isConnected && roomId && currentRoomRef.current !== roomId) {
      // 이전 채팅방에서 나가기
      if (currentRoomRef.current) {
        chatWebSocket.disconnectFromChatRoom(currentRoomRef.current);
      }

      // 새 채팅방에 연결
      chatWebSocket.connectToChatRoom(roomId);
      currentRoomRef.current = roomId;
    }
  }, [isConnected, roomId]);

  // 인증 상태 변경 시 WebSocket 연결/해제
  useEffect(() => {
    if (isReady && chatAuth.isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isReady, chatAuth.isAuthenticated, connect, disconnect]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // 주기적 ping (연결 상태 유지)
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000); // 30초마다 ping

    return () => {
      clearInterval(pingInterval);
    };
  }, [isConnected, ping]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendFileMessage,
    sendTypingStatus,
    ping,
  };
}; 