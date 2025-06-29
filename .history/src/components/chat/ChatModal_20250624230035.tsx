"use client";

import React, { useRef, useEffect } from 'react';
import {
  XIcon,
  UserIcon,
  StarIcon,
  MessageSquareIcon,
  SendIcon,
  CheckIcon,
  CheckCheckIcon
} from "lucide-react";
import { ChatMessage } from "./types";
import { CustomerRequestAnswer } from "@/types/api";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatPartner: CustomerRequestAnswer | undefined;
  messages: ChatMessage[];
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
  messagesEndRef: React.RefObject<HTMLDivElement>;
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
    const date = new Date(timestamp);
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
  };

  // 연결 상태 표시
  const getConnectionStatus = () => {
    if (connectionError) {
      return <span className="text-red-500 text-xs">⚠️ 연결 오류: {connectionError}</span>;
    }
    if (!isConnected) {
      return <span className="text-yellow-500 text-xs">🔄 연결 중...</span>;
    }
    return <span className="text-green-500 text-xs">🟢 연결됨</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 h-[600px] flex flex-col shadow-xl">
        {/* 채팅 헤더 */}
        <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">
              {chatPartner?.user?.userName || chatPartner?.webCustomer?.customerName || '채팅'}
            </h3>
            <div className="flex items-center gap-2">
              {getConnectionStatus()}
              {chatPartner?.cost && (
                <span className="text-xs text-blue-100">
                  견적: {chatPartner.cost.toLocaleString()}원
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500">메시지를 불러오는 중...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500 text-center">
                <p>아직 메시지가 없습니다.</p>
                <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'customer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border'
                  }`}
                >
                  <div className="text-sm">{message.message}</div>
                  <div className="flex justify-between items-center mt-1">
                    <div
                      className={`text-xs ${
                        message.senderType === 'customer'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                    {message.senderType === 'customer' && (
                      <div
                        className={`text-xs ${
                          message.isRead ? 'text-blue-200' : 'text-yellow-200'
                        }`}
                      >
                        {message.isRead ? '읽음' : '전송됨'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* 스크롤 타겟 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          <div className="flex space-x-2">
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
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="파일 첨부"
            >
              {uploadingFile ? '⏳' : '📎'}
            </button>

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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim() || !isConnected || uploadingFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>

          {/* 상태 표시 */}
          {(uploadingFile || !isConnected || connectionError) && (
            <div className="mt-2 text-xs text-center">
              {uploadingFile && <span className="text-blue-600">파일 업로드 중...</span>}
              {!isConnected && !uploadingFile && (
                <span className="text-yellow-600">서버에 연결 중...</span>
              )}
              {connectionError && (
                <span className="text-red-600">연결 오류: {connectionError}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 