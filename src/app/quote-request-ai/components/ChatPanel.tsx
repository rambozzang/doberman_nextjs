'use client';
import { useEffect, useRef } from 'react';
import type { ChatMessage as Msg, QuickReply } from '@/lib/ai/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import AIThinkingDots from './AIThinkingDots';

interface Props {
  messages: Msg[];
  isThinking: boolean;
  onSendText: (text: string) => void;
  onUploadImage: (file: File) => Promise<unknown>;
  onQuickReply: (qr: QuickReply) => void;
}

export default function ChatPanel({ messages, isThinking, onSendText, onUploadImage, onQuickReply }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onQuickReply={onQuickReply} disabled={isThinking} />
        ))}
        {isThinking && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800/70 border border-slate-700">
              <AIThinkingDots />
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-900/30">
        <ChatInput disabled={isThinking} onSendText={onSendText} onUploadImage={onUploadImage} />
      </div>
    </div>
  );
}
