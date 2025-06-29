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

// 채팅 파트너 정보 타입 (CustomerRequestAnswer에서 필요한 부분만)
export interface ChatPartner {
  id: number;
  answerTitle?: string;
  cost?: number;
  user?: {
    userName: string;
  };
  webCustomer?: {
    customerName: string;
  };
} 