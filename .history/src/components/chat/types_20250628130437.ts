// 채팅 메시지 타입 정의
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'expert';
  message: string;
  timestamp: string;
  isRead: boolean;
}

// 채팅 시스템 전용 타입들 (개발가이드 기반)
export interface ChatRoom {
  roomId: number;
  partnerName: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  partnerStatus: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
}

export interface ChatApiMessage {
  messageId: number;
  senderType: "APP" | "WEB";
  senderId: string;
  message: string | null;
  filePath: string | null;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
}

export interface SendMessageData {
  roomId: number;
  senderType: "APP" | "WEB";
  senderId: string;
  message?: string;
  filePath?: string;
}

export interface WebSocketMessage {
  type: "message" | "typing_status" | "message_sent" | "connection" | "pong" | "ping" | "message_read_update" | "user_joined" | "user_left";
  messageId?: number;
  messageIds?: number[]; // 여러 메시지 읽음 처리용
  senderType?: "APP" | "WEB";
  senderId?: string;
  message?: string;
  filePath?: string;
  isRead?: boolean;
  createdAt?: string;
  timeAgo?: string;
  roomId?: number;
  isTyping?: boolean;
  userId?: string;
  userType?: string;
  success?: boolean;
  error?: string;
  // 사용자 입장/퇴장 관련
  joinedUserId?: string;
  leftUserId?: string;
}

export interface ChatApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedChatResponse<T> {
  messages: T[];
  page: number;
  limit: number;
  total: number;
  isLastPage: boolean;
}

// 채팅 인증 관련 타입
export interface ChatAuthState {
  token: string | null;
  userId: string | null;
  userType: "APP" | "WEB" | null;
  isAuthenticated: boolean;
}

export interface ChatLoginRequest {
  userId: string;
  userType: "APP" | "WEB";
}

export interface ChatLoginResponse {
  token: string;
  expiresIn: number;
} 