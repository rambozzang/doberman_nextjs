import { useEffect, useCallback, useRef, useState } from 'react';
import { chatWebSocket } from '@/lib/chatWebSocket';
import { WebSocketMessage, ChatApiMessage } from '@/components/chat/types';
import { useChatAuth } from './useChatAuth';

export const useChatWebSocket = (
  roomId: number | null,
  onNewMessage?: (message: ChatApiMessage) => void,
  onMessageSent?: (message: ChatApiMessage) => void,
  onTypingStatus?: (isTyping: boolean, userId: string) => void,
  onMessageRead?: (messageId: number) => void,
  onUserJoined?: (userId: string) => void,
  onUserLeft?: (userId: string) => void
) => {
  const { chatAuth, isReady } = useChatAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const currentRoomRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false); // 연결 중 상태 추적
  
  // 콜백 함수들을 ref로 저장하여 안정적인 참조 유지
  const callbacksRef = useRef({
    onNewMessage,
    onMessageSent,
    onTypingStatus,
    onMessageRead,
    onUserJoined,
    onUserLeft
  });

  // 콜백들을 최신 상태로 업데이트
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onMessageSent,
      onTypingStatus,
      onMessageRead,
      onUserJoined,
      onUserLeft
    };
  });

  // WebSocket 이벤트 핸들러들 (ref를 통해 최신 콜백 참조)
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('🔵 [useChatWebSocket] 메시지 수신:', { 
      type: data.type, 
      success: data.success,
      messageId: data.messageId,
      isRead: data.isRead,
      fullData: data
    });

    // messages_read_notification 특별 로깅
    if (data.type === 'messages_read_notification') {
      console.log('📖 [useChatWebSocket] messages_read_notification 수신!', {
        fullData: data,
        timestamp: new Date().toISOString()
      });
    }

    // messages_read 특별 로깅
    if (data.type === 'messages_read') {
      console.log('📖 [useChatWebSocket] messages_read 수신!', {
        roomId: data.roomId,
        readBy: data.readBy,
        count: data.count,
        fullData: data,
        timestamp: new Date().toISOString()
      });
    }

    switch (data.type) {
      case 'message':
        if (data.messageId && data.createdAt && callbacksRef.current.onNewMessage) {
          // 빈 메시지 필터링 - 단, 첨부파일만 있는 메시지는 유효하므로 통과시킨다
          const messageContent = data.message === 'undefined' ? '' : (data.message || '');
          if (!messageContent.trim() && !data.filePath) {
            console.log('빈 새 메시지 무시:', data.messageId);
            break;
          }

          const newMessage: ChatApiMessage = {
            messageId: data.messageId,
            senderType: data.senderType || 'APP',
            senderId: data.senderId || '',
            message: messageContent,
            filePath: data.filePath || null,
            isRead: data.isRead !== undefined ? data.isRead : false,
            createdAt: data.createdAt,
            timeAgo: data.timeAgo || ''
          };
          callbacksRef.current.onNewMessage(newMessage);
        }
        break;

      case 'message_sent':
        if (data.messageId && callbacksRef.current.onMessageSent) {
          console.log('🔵 [WebSocket] message_sent 처리:', {
            messageId: data.messageId,
            isRead: data.isRead,
            success: data.success,
            hasMessage: !!data.message,
            hasCreatedAt: !!data.createdAt,
            rawData: data
          });
          
          // 메시지 전송 성공만 확인 (메시지 내용은 이미 UI에 추가됨)
          if (data.success) {
            console.log('✅ [WebSocket] 메시지 전송 성공 확인:', data.messageId);
            
            // 콜백이 있는 경우에만 호출
            if (callbacksRef.current.onMessageSent) {
              // 서버에서 메시지 내용이 없는 경우 (일반적인 상황)
              // messageId와 isRead 정보만으로 기존 임시 메시지 업데이트
              const sentMessage: ChatApiMessage = {
                messageId: data.messageId,
                senderType: data.senderType || 'WEB',
                senderId: data.senderId || '',
                message: '', // 서버에서 메시지 내용을 주지 않으므로 빈 문자열
                filePath: data.filePath || null,
                isRead: data.isRead !== undefined ? data.isRead : false, // 서버의 실제 isRead 값 사용
                createdAt: data.createdAt || new Date().toISOString(),
                timeAgo: data.timeAgo || '방금 전'
              };
              
              console.log('📤 [WebSocket] 메시지 전송 완료 - isRead 업데이트:', {
                messageId: sentMessage.messageId,
                isRead: sentMessage.isRead,
                hasMessage: !!data.message
              });
              
              callbacksRef.current.onMessageSent(sentMessage);
            }
          } else {
            console.log('❌ [WebSocket] 메시지 전송 실패:', data.messageId);
          }
        } else {
          console.log('⚠️ [WebSocket] message_sent 처리 조건 미충족:', {
            hasMessageId: !!data.messageId,
            hasCallback: !!callbacksRef.current.onMessageSent,
            data: data
          });
        }
        break;

      case 'typing_status':
        if (data.isTyping !== undefined && data.userId && callbacksRef.current.onTypingStatus) {
          callbacksRef.current.onTypingStatus(data.isTyping, data.userId);
        }
        break;

      case 'message_read_update':
        if (data.messageId && callbacksRef.current.onMessageRead) {
          console.log('🔵 [WebSocket] message_read_update 처리:', data.messageId);
          callbacksRef.current.onMessageRead(data.messageId);
        } else if (data.messageIds && Array.isArray(data.messageIds) && callbacksRef.current.onMessageRead) {
          // 여러 메시지 읽음 처리
          console.log('🔵 [WebSocket] multiple message_read_update 처리:', data.messageIds);
          data.messageIds.forEach((messageId: number) => {
            callbacksRef.current.onMessageRead?.(messageId);
          });
        }
        break;

      case 'messages_read_notification':
        // 상대방이 입장하여 메시지들을 읽음 처리
        console.log('📖 [WebSocket] messages_read_notification 수신 - 상대방 입장으로 판단');
        if (callbacksRef.current.onUserJoined) {
          // 가상의 사용자 ID로 입장 이벤트 처리 (실제 userId가 없어도 상대방 입장으로 처리)
          callbacksRef.current.onUserJoined('partner');
        }
        break;

      case 'messages_read':
        // 상대방이 메시지들을 읽음 처리
        console.log('📖 [WebSocket] messages_read 수신 - 모든 내 메시지를 읽음 처리:', {
          roomId: data.roomId,
          readBy: data.readBy,
          count: data.count,
          timestamp: new Date().toISOString()
        });
        if (callbacksRef.current.onUserJoined) {
          // 상대방이 메시지들을 읽었으므로 입장 이벤트와 같이 처리
          callbacksRef.current.onUserJoined(data.readBy || 'partner');
        }
        break;

      case 'user_joined':
        if (data.joinedUserId && callbacksRef.current.onUserJoined) {
          console.log('🚪 [WebSocket] 사용자 입장 이벤트:', {
            joinedUserId: data.joinedUserId,
            timestamp: new Date().toISOString()
          });
          callbacksRef.current.onUserJoined(data.joinedUserId);
        }
        break;

      case 'user_left':
        if (data.leftUserId && callbacksRef.current.onUserLeft) {
          console.log('🚶 [WebSocket] 사용자 퇴장 이벤트:', {
            leftUserId: data.leftUserId,
            timestamp: new Date().toISOString()
          });
          callbacksRef.current.onUserLeft(data.leftUserId);
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
  }, []); // 의존성 배열에서 콜백들 제거

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
  const disconnect = useCallback(async () => {
    console.log('수동 WebSocket 연결 해제');
    
    // 이벤트 리스너 제거
    chatWebSocket.off('message');
    chatWebSocket.off('message_sent');
    chatWebSocket.off('typing_status');
    chatWebSocket.off('message_read_update');
    chatWebSocket.off('messages_read_notification');
    chatWebSocket.off('messages_read');
    chatWebSocket.off('user_joined');
    chatWebSocket.off('user_left');
    chatWebSocket.off('connection');
    chatWebSocket.off('pong');

    await chatWebSocket.disconnect();
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
  const sendFileMessage = useCallback((filePath: string, fileName?: string) => {
    if (!isConnected || !roomId || !chatAuth.userId || !chatAuth.userType) {
      console.error('파일 메시지 전송 불가: WebSocket 연결되지 않음 또는 필수 정보 누락');
      return false;
    }

    console.log('파일 메시지 전송:', { roomId, filePath, fileName });
    return chatWebSocket.sendFileMessage(roomId, filePath, chatAuth.userType, chatAuth.userId, fileName);
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
    const handleRoomChange = async () => {
      const connectToRoom = async () => {
        if (!isReady || !chatAuth.token || !chatAuth.userId || !chatAuth.userType || !roomId) {
          console.log('채팅 인증 정보 또는 roomId가 준비되지 않음');
          return;
        }

        // 이미 연결 중이거나 같은 방에 연결되어 있거나 이미 연결된 상태면 중단
        if (isConnectingRef.current || currentRoomRef.current === roomId || (isConnected && currentRoomRef.current === roomId)) {
          console.log('연결 중단 조건:', { 
            isConnecting: isConnectingRef.current, 
            currentRoom: currentRoomRef.current, 
            targetRoom: roomId,
            isConnected: isConnected
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

                      // 기존 이벤트 리스너 제거 후 새로 등록 (중복 방지)
          chatWebSocket.off('message');
          chatWebSocket.off('message_sent');
          chatWebSocket.off('typing_status');
          chatWebSocket.off('message_read_update');
          chatWebSocket.off('messages_read_notification');
          chatWebSocket.off('messages_read');
          chatWebSocket.off('user_joined');
          chatWebSocket.off('user_left');
          chatWebSocket.off('connection');
          chatWebSocket.off('pong');
          
          // 새 이벤트 리스너 등록
          chatWebSocket.on('message', handleMessage);
          chatWebSocket.on('message_sent', handleMessage);
          chatWebSocket.on('typing_status', handleMessage);
          chatWebSocket.on('message_read_update', handleMessage);
          chatWebSocket.on('messages_read_notification', handleMessage);
          chatWebSocket.on('messages_read', handleMessage);
          chatWebSocket.on('user_joined', handleMessage);
          chatWebSocket.on('user_left', handleMessage);
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
        } finally {
          isConnectingRef.current = false; // 연결 완료 (성공/실패 무관)
        }
      };

      const disconnectFromRoom = async (reason: string = '알 수 없음') => {
        console.log('WebSocket 연결 해제 - 이유:', reason);
        
        // 이벤트 리스너 제거
        chatWebSocket.off('message');
        chatWebSocket.off('message_sent');
        chatWebSocket.off('typing_status');
        chatWebSocket.off('message_read_update');
        chatWebSocket.off('messages_read_notification');
        chatWebSocket.off('messages_read');
        chatWebSocket.off('user_joined');
        chatWebSocket.off('user_left');
        chatWebSocket.off('connection');
        chatWebSocket.off('pong');

        await chatWebSocket.disconnect();
        setIsConnected(false);
        setConnectionError(null);
        currentRoomRef.current = null;
        isConnectingRef.current = false; // 연결 상태 리셋
      };

      if (roomId && roomId !== currentRoomRef.current) {
        // 기존 연결 해제
        if (currentRoomRef.current) {
          console.log('기존 연결 해제 후 새 채팅방 연결:', currentRoomRef.current, '->', roomId);
          await disconnectFromRoom('새 채팅방 연결을 위한 기존 연결 해제');
        }
        
        // 새로운 채팅방에 연결
        await connectToRoom();
      } else if (!roomId && currentRoomRef.current) {
        // roomId가 null이 되면 연결 해제
        console.log('roomId가 null이 되어 연결 해제:', currentRoomRef.current);
        await disconnectFromRoom('roomId가 null이 됨');
      }
    };

    // async 함수 실행
    handleRoomChange();
  }, [roomId, isReady, chatAuth.token, chatAuth.userId, chatAuth.userType]); // handleMessage 의존성 제거

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 정리 시 연결 해제 (동기적으로 처리)
      console.log('컴포넌트 언마운트로 인한 WebSocket 연결 해제');
      chatWebSocket.off('message');
      chatWebSocket.off('message_sent');
      chatWebSocket.off('typing_status');
      chatWebSocket.off('message_read_update');
      chatWebSocket.off('messages_read_notification');
      chatWebSocket.off('messages_read');
      chatWebSocket.off('user_joined');
      chatWebSocket.off('user_left');
      chatWebSocket.off('connection');
      chatWebSocket.off('pong');
      
      // 언마운트 시에는 동기적으로 즉시 해제
      if (chatWebSocket.isSocketConnected()) {
        chatWebSocket.disconnect();
      }
      
      setIsConnected(false);
      setConnectionError(null);
      currentRoomRef.current = null;
      isConnectingRef.current = false; // 연결 상태 리셋
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