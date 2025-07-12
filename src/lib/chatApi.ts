import axios, { AxiosInstance } from "axios";
import { 
  ChatRoom, 
  ChatApiMessage, 
  ChatApiResponse, 
  PaginatedChatResponse 
} from "@/components/chat/types";

class ChatApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://www.tigerbk.com/chat-api',
      timeout: 10000,
    });

    // 응답 인터셉터 - 에러 처리
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 토큰 만료 시 로그아웃 처리
          if (typeof window !== 'undefined') {
            localStorage.removeItem("chatToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("userType");
            // 필요시 로그인 페이지로 리다이렉트
            // window.location.href = "/login";
          }
        }
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

  // 로그인
  async login(userId: string, userType: "APP" | "WEB"): Promise<ChatApiResponse<{ token: string; expiresIn: number }>> {
    try {
      const response = await this.api.post("/auth/login", { userId, userType });
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  // 채팅방 목록 조회
  async getChatRooms(userId?: string, userType?: "APP" | "WEB"): Promise<ChatApiResponse<ChatRoom[]>> {
    try {
      const params: any = {};
      if (userId) params.userId = userId;
      if (userType) params.userType = userType;
      
      const response = await this.api.get("/chat/list", { params });
      return response.data;
    } catch (error) {
      console.error('Get chat rooms API error:', error);
      throw error;
    }
  }



  // requestId로 기존 채팅방 조회
  async findChatRoom(requestId: number, userId: string, userType: "APP" | "WEB"): Promise<ChatApiResponse<{ roomId: number } | null>> {
    try {
      console.log('채팅방 조회 API 호출:', { requestId, userId, userType });
      
      const response = await this.api.get(`/chat/room/${requestId}`, {
        params: { userId, userType }
      });
      
      console.log('채팅방 조회 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('Find chat room API error:', error);
      // 404 오류는 채팅방이 없다는 의미이므로 null 반환
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
          return { success: true, data: null };
        }
      }
      throw error;
    }
  }

  // 채팅방 메시지 조회
  async getChatMessages(roomId: number, page: number = 1, limit: number = 20): Promise<ChatApiResponse<PaginatedChatResponse<ChatApiMessage>>> {
    try {
      const response = await this.api.get(`/chat/room/${roomId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get chat messages API error:', error);
      throw error;
    }
  }

  // 채팅방 생성
  async createChatRoom(requestId: number, expertId: string, customerId: string): Promise<ChatApiResponse<{ roomId: number; isNew: boolean }>> {
    try {
      console.log('채팅방 생성 API 호출:', { requestId: requestId , customerId: customerId, userId: expertId });
      
      // 아래 호출 방식으로 body에 json 형식으로 넘겨야 함
      const response = await this.api.post("/chat/room", {
        requestId: requestId,
        customerId: customerId,
        userId: expertId,
      });


      
      console.log('채팅방 생성 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create chat room API error:', error);
      
      // 에러 정보를 더 자세히 로깅
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      
      throw error;
    }
  }

  // 파일 업로드
  async uploadFile(roomId: number, file: File): Promise<ChatApiResponse<{ filePath: string; fileName: string; fileUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId.toString());

      const response = await this.api.post("/chat/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload file API error:', error);
      throw error;
    }
  }

  // 메시지 읽음 처리
  async markMessagesAsRead(roomId: number, messageIds: number[]): Promise<ChatApiResponse<{ readMessageIds: number[]; unreadCount: number }>> {
    try {
      const response = await this.api.post("/chat/messages/read", {
        roomId,
        messageIds,
      });
      return response.data;
    } catch (error) {
      console.error('Mark messages as read API error:', error);
      throw error;
    }
  }

  // 채팅방의 모든 읽지 않은 메시지 읽음 처리
  async markRoomMessagesAsRead(roomId: number): Promise<ChatApiResponse<{ readMessageIds: number[]; unreadCount: number }>> {
    try {
      const response = await this.api.post(`/chat/room/${roomId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark room messages as read API error:', error);
      throw error;
    }
  }

  // 사용자 상태 업데이트
  async updateUserStatus(userId: string, userType: "APP" | "WEB", status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE"): Promise<ChatApiResponse<any>> {
    try {
      const response = await this.api.put("/user/status", {
        userId,
        userType,
        status,
      });
      return response.data;
    } catch (error) {
      console.error('Update user status API error:', error);
      throw error;
    }
  }

  // 사용자 상태 조회
  async getUserStatus(userType: "APP" | "WEB", userId: string): Promise<ChatApiResponse<any>> {
    try {
      const response = await this.api.get(`/user/status/${userType}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user status API error:', error);
      throw error;
    }
  }
}

export const chatApi = new ChatApi(); 