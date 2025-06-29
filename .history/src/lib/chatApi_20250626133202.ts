import axios, { AxiosInstance, AxiosResponse } from "axios";
import { 
  ChatRoom, 
  ChatApiMessage, 
  ChatApiResponse, 
  PaginatedChatResponse 
} from "@/components/chat/types";

class ChatApi {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // 항상 실제 서버로 연결 (CORS 문제 해결을 위해)
    this.baseURL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://www.tigerbk.com/chat-api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 응답 인터셉터 설정
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('채팅 API 오류:', error);
        return Promise.reject(error);
      }
    );
  }

  // 인증 헤더 설정
  setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 인증 헤더 제거
  removeAuthHeader() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // 채팅방 목록 조회
  async getChatRooms(userId?: string, userType?: string): Promise<ChatApiResponse<ChatRoom[]>> {
    try {
      const params: Record<string, string> = {};
      if (userId) params.userId = userId;
      if (userType) params.userType = userType;

      const response = await this.api.get('/chat/list', { params });
      return response.data;
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '채팅방 목록 조회에 실패했습니다.'
      };
    }
  }

  // 채팅방 메시지 조회 (페이징)
  async getChatMessages(
    roomId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ChatApiResponse<PaginatedChatResponse<ChatApiMessage>>> {
    try {
      const response = await this.api.get(`/chat/room/${roomId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('채팅 메시지 조회 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '메시지 조회에 실패했습니다.'
      };
    }
  }

  // 특정 requestId와 전문가 ID로 채팅방 조회
  async findChatRoomByRequestAndExpert(requestId: number, expertId: string): Promise<ChatApiResponse<{ roomId: number } | null>> {
    try {
      const response = await this.api.get('/chat/room/find', {
        params: { requestId, expertId }
      });
      return response.data;
    } catch (error) {
      console.error('채팅방 조회 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '채팅방 조회에 실패했습니다.'
      };
    }
  }

  // 채팅방 생성
  async createChatRoom(partnerUserId: string, partnerUserType: string, requestId?: number): Promise<ChatApiResponse<{ roomId: number }>> {
    try {
      const requestData: {
        partnerUserId: string;
        partnerUserType: string;
        requestId?: number;
      } = {
        partnerUserId,
        partnerUserType
      };
      
      if (requestId) {
        requestData.requestId = requestId;
      }

      const response = await this.api.post('/chat/room', requestData);
      return response.data;
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '채팅방 생성에 실패했습니다.'
      };
    }
  }

  // 파일 업로드
  async uploadFile(file: File): Promise<ChatApiResponse<{ filePath: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.'
      };
    }
  }

  // 사용자 상태 조회
  async getUserStatus(userId: string, userType: string): Promise<ChatApiResponse<{ status: string }>> {
    try {
      const response = await this.api.get('/user/status', {
        params: { userId, userType }
      });
      return response.data;
    } catch (error) {
      console.error('사용자 상태 조회 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '사용자 상태 조회에 실패했습니다.'
      };
    }
  }

  // 사용자 상태 업데이트
  async updateUserStatus(status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE"): Promise<ChatApiResponse<void>> {
    try {
      const response = await this.api.post('/user/status', { status });
      return response.data;
    } catch (error) {
      console.error('사용자 상태 업데이트 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '사용자 상태 업데이트에 실패했습니다.'
      };
    }
  }

  // 메시지 읽음 처리
  async markMessagesAsRead(roomId: number, messageIds: number[]): Promise<ChatApiResponse<void>> {
    try {
      const response = await this.api.post('/chat/messages/read', {
        roomId,
        messageIds
      });
      return response.data;
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '메시지 읽음 처리에 실패했습니다.'
      };
    }
  }

  // 특정 채팅방의 읽지 않은 메시지 읽음 처리
  async markRoomMessagesAsRead(roomId: number): Promise<ChatApiResponse<void>> {
    try {
      const response = await this.api.post(`/${roomId}/read`);
      return response.data;
    } catch (error) {
      console.error('채팅방 메시지 읽음 처리 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '채팅방 메시지 읽음 처리에 실패했습니다.'
      };
    }
  }
}

// 싱글톤 인스턴스 생성
export const chatApi = new ChatApi();
export default ChatApi; 