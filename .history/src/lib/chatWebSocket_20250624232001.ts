import { WebSocketMessage } from '@/components/chat/types';

export type WebSocketEventHandler = (data: WebSocketMessage) => void;

export class ChatWebSocketManager {
  private socket: WebSocket | null = null;
  private baseURL: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'wss://www.tigerbk.com/chat-api';
  }

  // WebSocket 연결 (채팅방 전용)
  connect(token: string, userId: string, userType: string, roomId: number, lastMessageId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // 기존 연결이 있으면 해제
        this.disconnect();

        console.log('채팅 WebSocket 연결 시도:', { userId, userType, roomId });

        // 네이티브 WebSocket URL 구성
        const wsUrl = new URL(`${this.baseURL}/ws/room/${roomId}`);
        wsUrl.searchParams.set('token', token);
        wsUrl.searchParams.set('userId', userId);
        wsUrl.searchParams.set('userType', userType);
        if (lastMessageId) {
          wsUrl.searchParams.set('lastMessageId', lastMessageId.toString());
        }

        this.socket = new WebSocket(wsUrl.toString());

        // 연결 성공
        this.socket.onopen = () => {
          console.log('채팅 WebSocket 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve(true);
        };

        // 메시지 수신
        this.socket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log('WebSocket 메시지 수신:', data);
            
            // 이벤트 타입별 핸들러 호출
            this.emitEvent(data.type, data);
            
            // 일반 메시지 핸들러도 호출
            this.emitEvent('message', data);
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };

        // 연결 오류
        this.socket.onerror = (error) => {
          console.error('채팅 WebSocket 연결 오류:', error);
          this.isConnected = false;
          reject(error);
        };

        // 연결 해제
        this.socket.onclose = (event) => {
          console.log('채팅 WebSocket 연결 해제:', event.code, event.reason);
          this.isConnected = false;
          this.stopPingInterval();
          
          // 자동 재연결 시도 (비정상 종료인 경우)
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(token, userId, userType, roomId, lastMessageId);
          }
        };

      } catch (error) {
        console.error('WebSocket 연결 설정 오류:', error);
        reject(error);
      }
    });
  }

  // 메시지 전송
  sendMessage(roomId: number, message: string, senderType: string, senderId: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return false;
    }

    const messageData = {
      roomId,
      senderType,
      senderId,
      message
    };

    console.log('메시지 전송:', messageData);
    this.socket.send(JSON.stringify(messageData));
    return true;
  }

  // 파일 메시지 전송
  sendFileMessage(roomId: number, filePath: string, senderType: string, senderId: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return false;
    }

    const messageData = {
      roomId,
      senderType,
      senderId,
      filePath
    };

    console.log('파일 메시지 전송:', messageData);
    this.socket.send(JSON.stringify(messageData));
    return true;
  }

  // 타이핑 상태 전송
  sendTypingStatus(roomId: number, isTyping: boolean, userId: string, userType: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const typingData = {
      type: 'typing',
      roomId,
      userId,
      userType,
      isTyping
    };

    this.socket.send(JSON.stringify(typingData));
    return true;
  }

  // 이벤트 리스너 등록
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  // 이벤트 리스너 제거
  off(event: string, handler?: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    if (handler) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(event, []);
    }
  }

  // 이벤트 발생
  private emitEvent(event: string, data: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`이벤트 핸들러 오류 (${event}):`, error);
        }
      });
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.socket) {
      console.log('채팅 WebSocket 연결 해제');
      this.socket.close(1000, '정상 종료');
      this.socket = null;
      this.isConnected = false;
    }
    this.stopPingInterval();
    this.eventHandlers.clear();
  }

  // 재연결 시도
  private attemptReconnect(token: string, userId: string, userType: string, roomId: number, lastMessageId?: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 지수 백오프

    console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);

    setTimeout(() => {
      this.connect(token, userId, userType, roomId, lastMessageId).catch((error) => {
        console.error('재연결 실패:', error);
      });
    }, delay);
  }

  // Ping 간격 시작
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30초마다 ping
  }

  // Ping 간격 중지
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // 연결 상태 확인
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
export const chatWebSocket = new ChatWebSocketManager(); 