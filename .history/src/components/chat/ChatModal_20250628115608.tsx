"use client";

import React, { useRef, useMemo } from 'react';
import { ChatMessage, ChatApiMessage } from './types';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatAuth } from '@/hooks/useChatAuth';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatPartner: CustomerRequestAnswer | undefined;
  messages: ChatApiMessage[];
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  isConnected: boolean;
  connectionError: string | null;
  isTyping: boolean;
  uploadingFile: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  chatPartner,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  onFileUpload,
  isLoading,
  isConnected,
  connectionError,
  isTyping,
  uploadingFile,
  messagesEndRef
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API 메시지를 UI용 메시지로 변환
  const convertedMessages = useMemo(() => {
    return messages.map((apiMessage): ChatMessage => ({
      id: apiMessage.messageId.toString(),
      senderId: apiMessage.senderId,
      senderName: apiMessage.senderId, // API에 senderName이 없으므로 senderId 사용
      senderType: apiMessage.senderType === 'WEB' ? 'customer' : 'expert',
      message: apiMessage.message || '',
      timestamp: apiMessage.createdAt,
      isRead: apiMessage.isRead
    }));
  }, [messages]);

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 파일 업로드 버튼 클릭
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // 유효하지 않은 날짜 체크
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp);
        return '시간 정보 없음';
      }

      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        return date.toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error, 'timestamp:', timestamp);
      return '시간 정보 없음';
    }
  };

  // 연결 상태 표시
  const getConnectionStatus = () => {
    if (connectionError) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">연결 오류</span>
        </div>
      );
    }
    if (!isConnected) {
      return (
        <div className="flex items-center gap-1 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">연결 중...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-xs font-medium">온라인</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md h-[700px] flex flex-col shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* 채팅 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-t-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {(chatPartner?.user?.userName || '도배전문가').charAt(0)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white">
                {chatPartner?.user?.userName || '도배전문가'}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                {getConnectionStatus()}
                {chatPartner?.cost && (
                  <span className="text-blue-300 font-medium">
                    견적: {chatPartner.cost.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <span className="text-white text-xl group-hover:rotate-90 transition-transform duration-200">×</span>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
          {isLoading && convertedMessages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-400 font-medium">메시지를 불러오는 중...</div>
              </div>
            </div>
          ) : convertedMessages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-slate-300 font-medium mb-2">아직 메시지가 없습니다</p>
                <p className="text-slate-500 text-sm">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          ) : (
            convertedMessages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                } animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex flex-col ${message.senderType === 'customer' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
                      message.senderType === 'customer'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                        : 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/20 rounded-bl-md'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-2 text-xs text-slate-400">
                    <span>{formatTime(message.timestamp)}</span>
                    {message.senderType === 'customer' && (
                      <div className="flex items-center gap-1">
                        {message.isRead ? (
                          <div className="flex items-center gap-1 text-blue-400 animate-in fade-in-0 duration-300">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                              <div className="w-2 h-2 rounded-full bg-blue-400 -ml-1 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="font-semibold">읽음</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            <span>안읽음</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 text-xs mr-2">입력 중</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* 스크롤 타겟 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-b-3xl">
          <div className="flex items-end space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx"
              className="hidden"
            />
            
            <button
              onClick={handleFileButtonClick}
              disabled={uploadingFile || !isConnected}
              className="group flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-700/50 to-slate-600/50 hover:from-slate-600/60 hover:to-slate-500/60 border border-white/20 hover:border-white/30 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 backdrop-blur-sm"
              title="파일 첨부"
            >
              <span className="text-slate-300 group-hover:text-white transition-colors duration-200 text-lg">
                {uploadingFile ? '⏳' : '📎'}
              </span>
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder={
                  !isConnected 
                    ? "연결 중..." 
                    : uploadingFile 
                      ? "파일 업로드 중..." 
                      : "메시지를 입력하세요..."
                }
                disabled={!isConnected || uploadingFile}
                className="w-full px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-slate-400 transition-all duration-200"
              />
            </div>

            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim() || !isConnected || uploadingFile}
              className="group flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/25"
            >
              <span className="text-white text-lg group-hover:scale-110 transition-transform duration-200">
                ➤
              </span>
            </button>
          </div>

          {/* 상태 표시 */}
          {(uploadingFile || !isConnected || connectionError) && (
            <div className="mt-3 text-xs text-center animate-in fade-in-0 duration-300">
              {uploadingFile && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>파일 업로드 중...</span>
                </div>
              )}
              {!isConnected && !uploadingFile && (
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>서버에 연결 중...</span>
                </div>
              )}
              {connectionError && (
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <span>⚠️</span>
                  <span>연결 오류: {connectionError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 