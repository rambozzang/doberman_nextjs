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