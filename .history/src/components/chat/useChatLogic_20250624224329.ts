import { useState, useCallback } from "react";
import { ChatMessage } from "./types";
import { CustomerRequestAnswer } from "@/types/api";

interface UseChatLogicProps {
  customerName?: string;
}

export const useChatLogic = ({ customerName }: UseChatLogicProps = {}) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatPartner, setChatPartner] = useState<CustomerRequestAnswer | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 채팅 모달 열기
  const handleChatClick = useCallback((answer: CustomerRequestAnswer) => {
    setChatPartner(answer);
    setShowChatModal(true);
    
    // 임시 채팅 데이터 (실제로는 API에서 가져와야 함)
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: 'expert_1',
        senderName: answer.user?.userName || answer.webCustomer?.customerName || '전문가',
        senderType: 'expert',
        message: '안녕하세요! 견적을 채택해주셔서 감사합니다. 언제든지 궁금한 점이 있으시면 말씀해주세요.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: '2',
        senderId: 'customer_1',
        senderName: customerName || '고객',
        senderType: 'customer',
        message: '네, 감사합니다. 시공 일정은 언제 가능한가요?',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: '3',
        senderId: 'expert_1',
        senderName: answer.user?.userName || answer.webCustomer?.customerName || '전문가',
        senderType: 'expert',
        message: '다음 주부터 가능합니다. 정확한 날짜는 현장 확인 후에 조율하면 될 것 같습니다.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        isRead: false
      }
    ];
    
    setChatMessages(mockMessages);
  }, [customerName]);

  // 채팅 모달 닫기
  const handleCloseChatModal = useCallback(() => {
    setShowChatModal(false);
    setChatPartner(null);
    setChatMessages([]);
  }, []);

  // 메시지 전송 처리
  const handleSendMessage = useCallback((message: string) => {
    // 여기에 실제 메시지 전송 API 로직을 추가할 수 있습니다
    console.log('메시지 전송:', message);
    
    // TODO: 실제 API 호출
    // await chatService.sendMessage(chatPartner.id, message);
  }, []);

  return {
    showChatModal,
    chatPartner,
    chatMessages,
    handleChatClick,
    handleCloseChatModal,
    handleSendMessage
  };
}; 