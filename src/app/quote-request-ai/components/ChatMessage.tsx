'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ChatMessage as Msg, QuickReply } from '@/lib/ai/types';
import QuickReplyChips from './QuickReplyChips';

interface Props {
  message: Msg;
  onQuickReply: (qr: QuickReply) => void;
  disabled?: boolean;
}

const TYPING_SPEED_MS = 22;

export default function ChatMessage({ message, onQuickReply, disabled }: Props) {
  const isAI = message.role === 'ai';
  const [displayedText, setDisplayedText] = useState(isAI && message.id !== 'init' ? '' : message.text);

  useEffect(() => {
    if (!isAI || message.id === 'init') {
      setDisplayedText(message.text);
      return;
    }
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      i += 1;
      setDisplayedText(message.text.slice(0, i));
      if (i >= message.text.length) clearInterval(timer);
    }, TYPING_SPEED_MS);
    return () => clearInterval(timer);
  }, [message.id, message.text, isAI]);

  if (isAI) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <span className="text-white text-sm">⚡</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-block max-w-full px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800/70 backdrop-blur border border-slate-700 text-slate-100 whitespace-pre-line">
            {displayedText}
          </div>
          {message.quickReplies && message.quickReplies.length > 0 && displayedText.length === message.text.length && (
            <QuickReplyChips replies={message.quickReplies} onSelect={onQuickReply} disabled={disabled} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-end gap-3">
      <div className="flex-1 min-w-0 flex justify-end">
        <div className="max-w-[85%]">
          {message.attachments?.map((a, i) => (
            <div key={i} className="mb-2 rounded-xl overflow-hidden border border-slate-600 max-w-[240px]">
              <Image src={a.url} alt="첨부 이미지" width={240} height={180} className="w-full h-auto" unoptimized />
            </div>
          ))}
          <div className="inline-block px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 whitespace-pre-line">
            {message.text}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
        <span className="text-slate-200 text-sm">👤</span>
      </div>
    </div>
  );
}
