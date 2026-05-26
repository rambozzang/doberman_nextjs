"use client";

import React, { useEffect } from 'react';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatLogic } from './useChatLogic';
import { ChatModal } from './ChatModal';
import { ChatRoom } from './types';

interface FABChatModalProps {
  room: ChatRoom;
  onClose: () => void;
}

/**
 * FAB에서 roomId만으로 채팅을 바로 여는 래퍼.
 * CustomerRequestAnswer / requestId 없이 기존 채팅방에 바로 연결한다.
 */
export const FABChatModal: React.FC<FABChatModalProps> = ({ room, onClose }) => {
  const {
    isOpen,
    openChatByRoomId,
    closeChat,
    partnerTyping,
    messages,
    newMessage,
    uploadingFile,
    isConnected,
    connectionError,
    isLoading,
    messagesEndRef,
    sendMessage,
    uploadFile,
    handleMessageChange,
    handleKeyPress,
    observeMessage,
    unobserveMessage,
  } = useChatLogic();

  // 마운트 즉시 해당 채팅방 연결
  useEffect(() => {
    openChatByRoomId(room.roomId);
  }, [room.roomId, openChatByRoomId]);

  // partnerName만 포함하는 최소 chatPartner 객체
  const syntheticPartner = {
    user: { userName: room.partnerName },
  } as unknown as CustomerRequestAnswer;

  const handleClose = () => {
    closeChat();
    onClose();
  };

  return (
    <ChatModal
      isOpen={isOpen}
      onClose={handleClose}
      chatPartner={syntheticPartner}
      messages={messages}
      newMessage={newMessage}
      onMessageChange={handleMessageChange}
      onSendMessage={sendMessage}
      onKeyPress={handleKeyPress}
      onFileUpload={uploadFile}
      isLoading={isLoading}
      isConnected={isConnected}
      connectionError={connectionError}
      isTyping={partnerTyping}
      uploadingFile={uploadingFile}
      messagesEndRef={messagesEndRef}
      observeMessage={observeMessage}
      unobserveMessage={unobserveMessage}
    />
  );
};
