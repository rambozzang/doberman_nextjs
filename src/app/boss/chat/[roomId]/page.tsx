'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatAuth } from '@/hooks/useChatAuth';
import BossPageHeader from '@/components/boss/BossPageHeader';
import type { ChatApiMessage } from '@/components/chat/types';
import { Send } from 'lucide-react';

export default function BossChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params?.roomId);
  const { chatAuth } = useChatAuth();
  const { findChatRoom } = useChatRooms();
  const room = findChatRoom(roomId);

  const { messages, isLoading, addMessage, loadMessages } = useChatMessages(roomId);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const handleNewMessage = useCallback(
    (msg: ChatApiMessage) => {
      addMessage(msg);
    },
    [addMessage],
  );

  const { isConnected, connectionError, sendMessage } = useChatWebSocket(
    roomId || null,
    handleNewMessage,
    handleNewMessage,
  );

  useEffect(() => {
    if (roomId && !Number.isNaN(roomId)) {
      loadMessages(1, false);
    }
  }, [roomId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    sendMessage(text);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col gap-3">
      <BossPageHeader
        title={room?.partnerName ?? `채팅방 #${roomId}`}
        backHref="/boss/chat"
        description={isConnected ? '연결됨' : connectionError ?? '연결 중...'}
      />

      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        {isLoading && messages.length === 0 ? (
          <div className="text-center text-sm text-slate-400">불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500">아직 메시지가 없습니다.</div>
        ) : (
          messages
            .filter((m) => m.message && m.message.trim() !== '')
            .map((m) => {
              const isMine = m.senderType === 'APP' && m.senderId === chatAuth.userId;
              return (
                <div
                  key={m.messageId}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                    <div className={`mt-1 text-[10px] ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {m.timeAgo}
                    </div>
                  </div>
                </div>
              );
            })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isConnected ? '메시지를 입력하세요' : '연결 중...'}
          disabled={!isConnected}
          className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-600/40"
        >
          <Send size={14} /> 전송
        </button>
      </div>
    </div>
  );
}
