import { ChatMessage } from "@/components/chat/types";

export class ChatService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  /**
   * 채팅방의 메시지 목록을 가져옵니다
   */
  static async getChatMessages(chatRoomId: number): Promise<{
    success: boolean;
    data?: ChatMessage[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/${chatRoomId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('채팅 메시지 조회 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 메시지를 전송합니다
   */
  static async sendMessage(chatRoomId: number, message: string): Promise<{
    success: boolean;
    data?: ChatMessage;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/${chatRoomId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 채팅방을 생성합니다 (채택 시)
   */
  static async createChatRoom(requestId: number, answerId: number): Promise<{
    success: boolean;
    data?: { chatRoomId: number };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          answerId: answerId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 메시지를 읽음 처리합니다
   */
  static async markMessagesAsRead(chatRoomId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/${chatRoomId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  }
} 