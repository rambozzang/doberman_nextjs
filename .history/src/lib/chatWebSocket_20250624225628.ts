import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/components/chat/types';

export type WebSocketEventHandler = (data: WebSocketMessage) => void;

export class ChatWebSocketManager {
  private socket: Socket | null = null;
  private baseURL: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'wss://www.tigerbk.com/chat-api';
  }

  // WebSocket 연결
  connect(token: string, userId: string, userType: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // 기존 연결이 있으면 해제
        this.disconnect();

        console.log('채팅 WebSocket 연결 시도:', { userId, userType });

        this.socket = io(this.baseURL, {
          query: {
            token,
            userId,
            userType
          },
          transports: ['websocket'],
          timeout: 10000,
        });

        // 연결 성공
        this.socket.on('connect', () => {
          console.log('채팅 WebSocket 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        // 연결 오류
        this.socket.on('connect_error', (error) => {
          console.error('채팅 WebSocket 연결 오류:', error);
          this.isConnected = false;
          reject(error);
        });

        // 연결 해제
        this.socket.on('disconnect', (reason) => {
          console.log('채팅 WebSocket 연결 해제:', reason);
          this.isConnected = false;
          
          // 자동 재연결 시도
          if (reason === 'io server disconnect') {
            // 서버에서 연결을 끊은 경우 재연결 시도
            this.attemptReconnect(token, userId, userType);
          }
        });

        // 일반적인 메시지 수신
        this.socket.on('message', (data: WebSocketMessage) => {
          console.log('WebSocket 메시지 수신:', data);
        });

      } catch (error) {
        console.error('WebSocket 연결 설정 오류:', error);
        reject(error);
      }
    });
  }

  // 채팅방 WebSocket 연결
  connectToChatRoom(roomId: number): void {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    console.log('채팅방 WebSocket 연결:', roomId);
    this.socket.emit('join_room', { roomId });
  }

  // 채팅방 WebSocket 연결 해제
  disconnectFromChatRoom(roomId: number): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    console.log('채팅방 WebSocket 연결 해제:', roomId);
    this.socket.emit('leave_room', { roomId });
  }

  // 메시지 전송
  sendMessage(roomId: number, message: string, senderType: string, senderId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    const messageData = {
      roomId,
      senderType,
      senderId,
      message
    };

    console.log('메시지 전송:', messageData);
    this.socket.emit('send_message', messageData);
  }

  // 파일 메시지 전송
  sendFileMessage(roomId: number, filePath: string, senderType: string, senderId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    const messageData = {
      roomId,
      senderType,
      senderId,
      filePath
    };

    console.log('파일 메시지 전송:', messageData);
    this.socket.emit('send_message', messageData);
  }

  // 타이핑 상태 전송
  sendTypingStatus(roomId: number, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_status', { roomId, isTyping });
  }

  // 이벤트 리스너 등록
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.socket) {
      console.error('WebSocket이 초기화되지 않았습니다.');
      return;
    }

    this.socket.on(event, handler);
  }

  // 이벤트 리스너 제거
  off(event: string, handler?: WebSocketEventHandler): void {
    if (!this.socket) {
      return;
    }

    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.socket) {
      console.log('채팅 WebSocket 연결 해제');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 재연결 시도
  private attemptReconnect(token: string, userId: string, userType: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 지수 백오프

    console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);

    setTimeout(() => {
      this.connect(token, userId, userType).catch((error) => {
        console.error('재연결 실패:', error);
      });
    }, delay);
  }

  // 연결 상태 확인
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Ping 전송 (연결 상태 확인)
  ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }
}

// 싱글톤 인스턴스
export const chatWebSocket = new ChatWebSocketManager(); 