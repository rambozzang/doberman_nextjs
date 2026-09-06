'use client';

// 채팅방 단독 보기 — Industry 패턴 (agent.opentohome.com)
//
// 인박스(/boss/chat)의 3열 본문을 한 화면으로 뺀 것. 좁은 화면(<lg)에서 목록을 누르면 여기로 온다.
//   패널 헤더 : 사각 Chip 아바타 + 고객명 + 연결 상태 점
//   말풍선    : 사각 — 내 메시지 accent 채움 / 상대 패널 + 테두리
//   입력      : boss-input + primary 전송 (Enter 전송, Shift+Enter 줄바꿈)
//
// 화면 제목("채팅")과 ← 채팅 링크는 셸 헤더(PAGE_META)가 그린다.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatAuth } from '@/hooks/useChatAuth';
import toast from 'react-hot-toast';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ChatApiMessage } from '@/components/chat/types';
import { Send } from 'lucide-react';
import { Button, Chip, chipToneOf, ContentCard } from '@/components/boss/ui';

/**
 * 보낸 메시지를 화면에 먼저 붙인다.
 *
 * 서버는 전송 성공(message_sent)에 messageId 만 주고 본문을 주지 않는다.
 * 화면이 임시 메시지를 먼저 만들어 두어야 useChatMessages 가 그것을 서버 ID 로 바꿔 준다.
 * 이게 없어서 웹에서는 보낸 글이 화면에 안 보였다(서버에는 저장됐다).
 */
function optimisticMessage(text: string): ChatApiMessage {
  return {
    messageId: Date.now(), // 1e12 보다 큰 값 = 임시 메시지
    senderType: 'APP',
    senderId: BossAuthManager.getUserInfo()?.userId ?? '',
    message: text,
    filePath: null,
    isRead: false,
    createdAt: new Date().toISOString(),
    timeAgo: '방금 전',
  };
}

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
    // 메시지 칸만 내린다. scrollIntoView 는 창 전체를 끌어내려서 화면이 잘려 보였다.
    const end = endRef.current;
    if (!end) return;
    const box = end.closest('[data-chat-scroll]') as HTMLElement | null;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    else end.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    const ok = sendMessage(text);
    if (!ok) {
      toast.error('메시지를 보내지 못했습니다. 연결 상태를 확인해 주세요.');
      return;
    }
    addMessage(optimisticMessage(text));
    setInput('');
  };

  const partnerName = room?.partnerName ?? `채팅방 #${roomId}`;

  return (
    // 헤더(≈111px) + 본문 패딩(20 + 56) 을 뺀 높이. 모바일은 상단 바 · 하단 탭이 더 있어 여유를 둔다.
    <ContentCard className="flex h-[calc(100dvh-300px)] min-h-[420px] flex-col lg:h-[calc(100dvh-190px)]">
      {/* 패널 헤더 */}
      <div className="flex flex-none items-center gap-2.5 border-b border-boss-border px-[18px] py-3">
        <Chip tone={chipToneOf(partnerName)} size={30}>
          {partnerName.charAt(0)}
        </Chip>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-boss-text">{partnerName}</p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-boss-text-muted">
            <span
              aria-hidden
              className={`inline-block h-[6px] w-[6px] rounded-full ${
                isConnected ? 'bg-boss-success' : 'bg-boss-warning'
              }`}
            />
            {isConnected ? '연결됨' : (connectionError ?? '연결 중…')}
          </p>
        </div>
      </div>

      {/* 메시지 */}
      <div data-chat-scroll className="boss-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-boss-bg p-[18px]">
        {isLoading && messages.length === 0 ? (
          <p className="text-center text-[12.5px] text-boss-text-secondary">불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-[12.5px] text-boss-text-secondary">
            아직 주고받은 메시지가 없습니다. 아래에서 첫 답변을 보내세요.
          </p>
        ) : (
          messages
            .filter((m) => m.message && m.message.trim() !== '')
            .map((m) => {
              const isMine = m.senderType === 'APP' && m.senderId === chatAuth.userId;
              return (
                <div
                  key={m.messageId}
                  className={`max-w-[75%] px-3.5 py-2.5 ${
                    isMine
                      ? 'self-end bg-boss-primary text-boss-primary-foreground'
                      : 'self-start border border-boss-border bg-boss-surface text-boss-text'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.6]">
                    {m.message}
                  </p>
                  <p
                    className={`mt-1 font-boss-head text-[10.5px] tabular-nums ${
                      isMine ? 'text-boss-primary-foreground/70' : 'text-boss-text-muted'
                    }`}
                  >
                    {m.timeAgo}
                  </p>
                </div>
              );
            })
        )}
        <div ref={endRef} />
      </div>

      {/* 입력 */}
      <div className="flex flex-none items-center gap-2 border-t border-boss-border bg-boss-surface p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isConnected ? '메시지를 입력하세요' : '연결 중…'}
          aria-label="메시지 입력"
          disabled={!isConnected}
          className="boss-input"
        />
        <Button
          variant="primary"
          icon={Send}
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
        >
          전송
        </Button>
      </div>
    </ContentCard>
  );
}
