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
  async getChatRooms(): Promise<ChatApiResponse<any[]>> {
    try {
      const response = await this.api.get("/chat/list");
      return response.data;
    } catch (error) {
      console.error('Get chat rooms API error:', error);
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
  async createChatRoom(requestId: number, expertId: string): Promise<ChatApiResponse<{ roomId: number; isNew: boolean }>> {
    try {
      const response = await this.api.post("/chat/room", null, {
        params: {
          customerId: requestId,
          userId: expertId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Create chat room API error:', error);
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