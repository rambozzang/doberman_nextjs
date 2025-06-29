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
    console.log('WebSocket Base URL:', this.baseURL);
  }

  // WebSocket 연결 (채팅방 전용)
  async connect(token: string, userId: string, userType: string, roomId: number, lastMessageId?: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // 기존 연결이 있으면 완전히 해제될 때까지 대기
        console.log('기존 연결 상태 체크:', {
          hasSocket: !!this.socket,
          isConnected: this.isConnected,
          readyState: this.socket?.readyState
        });

        if (this.socket || this.isConnected) {
          console.log('기존 연결 해제 대기 중...');
          await this.disconnect();
          console.log('기존 연결 해제 완료');
        }

        console.log('채팅 WebSocket 연결 시도:', { roomId });

        // 네이티브 WebSocket URL 구성 (token은 URL 인코딩 적용)
        const wsUrl = new URL(`${this.baseURL}/ws/room/${roomId}`);
        wsUrl.searchParams.set('token', encodeURIComponent(token));
        if (lastMessageId) {
          wsUrl.searchParams.set('lastMessageId', lastMessageId.toString());
        }

        console.log('WebSocket 연결 URL:', wsUrl.toString());
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
            console.log('🔵 [WebSocket 수신]', {
              type: data.type,
              messageId: data.messageId,
              message: data.message?.substring(0, 50) + (data.message && data.message.length > 50 ? '...' : ''),
              isRead: data.isRead,
              senderType: data.senderType,
              senderId: data.senderId,
              timestamp: new Date().toISOString()
            });
            
            // ping 메시지에 대한 pong 응답
            if (data.type === 'ping') {
              console.log('🏓 서버로부터 ping 수신, pong 응답 전송');
              this.socket?.send(JSON.stringify({ type: 'pong' }));
              return;
            }
            
            // 이벤트 타입별 핸들러만 호출 (중복 방지)
            this.emitEvent(data.type, data);
          } catch (error) {
            console.error('❌ WebSocket 메시지 파싱 오류:', error, 'Raw data:', event.data);
          }
        };

        // 연결 오류
        this.socket.onerror = (error) => {
          console.error('채팅 WebSocket 연결 오류:', error);
          console.error('WebSocket URL:', wsUrl.toString());
          console.error('WebSocket readyState:', this.socket?.readyState);
          this.isConnected = false;
          reject(new Error(`WebSocket 연결 실패: ${error.type || 'Unknown error'}`));
        };

        // 연결 해제
        this.socket.onclose = (event) => {
          console.log('채팅 WebSocket 연결 해제:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            url: wsUrl.toString()
          });
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
      console.error('❌ WebSocket이 연결되지 않았습니다. readyState:', this.socket?.readyState);
      return false;
    }

    const messageData = {
      roomId,
      senderType,
      senderId,
      message
    };

    console.log('🔴 [WebSocket 전송] 메시지:', {
      roomId,
      senderType,
      senderId,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    
    try {
      this.socket.send(JSON.stringify(messageData));
      console.log('✅ 메시지 전송 성공');
      return true;
    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      return false;
    }
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

  // 연결 해제 (Promise 반환으로 완전한 해제 대기 가능)
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        console.log('채팅 WebSocket 연결 해제 시작');
        
        // 이미 닫힌 상태라면 즉시 정리
        if (this.socket.readyState === WebSocket.CLOSED) {
          console.log('WebSocket이 이미 닫힌 상태');
          this.socket = null;
          this.isConnected = false;
          this.stopPingInterval();
          this.eventHandlers.clear();
          resolve();
          return;
        }

                 // 연결 해제 완료 대기
         const originalOnClose = this.socket.onclose;
         this.socket.onclose = (event) => {
           console.log('WebSocket 연결 해제 완료');
           // 원래 onclose 핸들러가 있다면 실행
           if (originalOnClose && this.socket) {
             originalOnClose.call(this.socket, event);
           }
          this.socket = null;
          this.isConnected = false;
          this.stopPingInterval();
          this.eventHandlers.clear();
          resolve();
        };

        // 연결 해제 시작
        this.socket.close(1000, '정상 종료');
        
        // 타임아웃 설정 (3초 후 강제 정리)
        setTimeout(() => {
          if (this.socket) {
            console.log('WebSocket 연결 해제 타임아웃, 강제 정리');
            this.socket = null;
            this.isConnected = false;
            this.stopPingInterval();
            this.eventHandlers.clear();
            resolve();
          }
        }, 3000);
      } else {
        console.log('해제할 WebSocket 연결이 없음');
        this.stopPingInterval();
        this.eventHandlers.clear();
        resolve();
      }
    });
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
    }, 5000); // 30초마다 ping
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