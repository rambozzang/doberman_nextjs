"use client";

import { useState, useEffect, useRef } from "react";
import {
  XIcon,
  UserIcon,
  StarIcon,
  MessageSquareIcon,
  SendIcon,
  CheckIcon,
  CheckCheckIcon
} from "lucide-react";
import { ChatMessage, ChatPartner } from "./types";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatPartner: ChatPartner | null;
  customerName?: string;
  onSendMessage?: (message: string) => void;
  initialMessages?: ChatMessage[];
}

export default function ChatModal({
  isOpen,
  onClose,
  chatPartner,
  customerName,
  onSendMessage,
  initialMessages = []
}: ChatModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 채팅 메시지 스크롤 하단으로 이동
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    setChatMessages(initialMessages);
  }, [initialMessages]);

  // 시간 포맷팅
  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 채팅 메시지 전송
  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatPartner) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'customer_1',
      senderName: customerName || '고객',
      senderType: 'customer',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // 부모 컴포넌트에 메시지 전송 알림
    if (onSendMessage) {
      onSendMessage(message.message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !chatPartner) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 채팅 사이드바 */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[480px] lg:w-[520px] bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl transform transition-transform duration-300 ease-out">
        
        {/* 채팅 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/20">
              <UserIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {chatPartner.user?.userName || chatPartner.webCustomer?.customerName || '전문가'}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-slate-400 text-sm">온라인</p>
                {chatPartner.cost && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-blue-400 font-semibold text-sm">
                      {chatPartner.cost.toLocaleString()}원
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white group"
          >
            <XIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* 채팅 컨테이너 */}
        <div className="flex flex-col h-full">
          
          {/* 채택 정보 배너 */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400">
              <StarIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">채택된 전문가와의 대화</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              시공 관련 문의사항을 자유롭게 상담하세요
            </p>
          </div>

          {/* 메시지 영역 */}
          <div 
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
            style={{ height: 'calc(100vh - 200px)' }}
          >
            {chatMessages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-[85%] ${
                  message.senderType === 'customer' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20' 
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-600/20'
                } rounded-2xl px-4 py-3 shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                  
                  {/* 발신자 이름 (상대방 메시지에만 표시) */}
                  {message.senderType !== 'customer' && (
                    <p className="text-xs text-slate-300 mb-1 font-medium opacity-80">
                      {message.senderName}
                    </p>
                  )}
                  
                  <p className="text-white leading-relaxed whitespace-pre-wrap">
                    {message.message}
                  </p>
                  
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-xs text-slate-200 opacity-70">
                      {formatChatTime(message.timestamp)}
                    </span>
                    {message.senderType === 'customer' && (
                      <div className="flex items-center">
                        {message.isRead ? (
                          <CheckCheckIcon className="w-3 h-3 text-blue-200" />
                        ) : (
                          <CheckIcon className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 메시지가 없을 때 */}
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <MessageSquareIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-2">대화를 시작해보세요</h4>
                <p className="text-slate-400 text-sm max-w-xs">
                  채택된 전문가와 시공에 대한 상세한 상담을 나눠보세요
                </p>
              </div>
            )}
          </div>

          {/* 메시지 입력 영역 */}
          <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  rows={3}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 focus:border-blue-400/50 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 resize-none"
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-slate-500">
                    Shift + Enter로 줄바꿈
                  </span>
                  <span className="text-xs text-slate-500">
                    {newMessage.length}/1000
                  </span>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:hover:scale-100 disabled:hover:shadow-none group"
              >
                <SendIcon className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 