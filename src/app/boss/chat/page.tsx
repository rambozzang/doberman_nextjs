'use client';

// 고객 채팅 — onGo 리디자인 시안 `인박스` 화면
//
// 레이아웃: grid 178px / minmax(0,340px) / minmax(0,1fr), 높이 100%
//   1열 필터   : FILTER 라벨 + 분류, 하단 SAVED REPLY(저장된 답변)
//   2열 스레드 : sticky 헤더, 행 padding 12px 13px, 선택 시 bg #1f2233 + inset 2px accent
//   3열 상세   : 헤더(30px 아바타) → 메시지 → 하단 고정 답변 입력
//
// 시안 핸들링 원칙
//   - 목록을 벗어나지 않고 연속 처리한다 (상세 페이지 왕복 없음)
//   - J/K 로 목록 이동, ⌘↵ 로 전송
//   - 전송 후 자동으로 다음 미답변 스레드로 이동
//
// 반응형: <1024 는 목록 단일 열 + 상세는 기존 /boss/chat/[roomId] 로 푸시 전환

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Inbox, Send, ChevronRight } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useChatAuth } from '@/hooks/useChatAuth';
import type { ChatApiMessage, ChatRoom } from '@/components/chat/types';
import {
  Button,
  StatusPill,
  Chip,
  chipToneOf,
  EmptyState,
  AlertBanner,
  MonoLabel,
  Skeleton,
} from '@/components/boss/ui';
import {
  useBossSearch,
  useListNavHotkeys,
  useSubmitHotkey,
} from '@/components/boss/layout/BossSearchContext';

type FilterKey = 'all' | 'unread' | 'online' | 'done';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '미답변' },
  { key: 'online', label: '접속 중' },
  { key: 'done', label: '처리 완료' },
];

// 저장된 답변 — 반복 문의를 2클릭으로 끝내기 위한 매크로 (시안 SAVED REPLY)
const SAVED_REPLIES: { label: string; text: string }[] = [
  {
    label: '견적 방문 안내',
    text: '안녕하세요, 도배르만입니다. 견적 방문 가능한 날짜를 알려주시면 일정 잡아드리겠습니다.',
  },
  {
    label: '시공 일정 확정',
    text: '시공 일정이 확정되었습니다. 당일 오전에 다시 한 번 연락드리겠습니다.',
  },
  {
    label: '자재 선택 안내',
    text: '벽지 종류에 따라 금액이 달라집니다. 실크/합지 중 원하시는 쪽을 알려주세요.',
  },
  {
    label: 'AS 접수 확인',
    text: 'AS 접수되었습니다. 현장 확인 후 처리 일정 안내드리겠습니다.',
  },
];

function matchesFilter(room: ChatRoom, filter: FilterKey) {
  if (filter === 'unread') return room.unreadCount > 0;
  if (filter === 'online') return room.partnerStatus === 'ONLINE';
  if (filter === 'done') return room.unreadCount === 0;
  return true;
}

export default function BossChatInboxPage() {
  const { chatRooms, isLoading, error, refreshChatRooms } = useChatRooms();
  const { chatAuth } = useChatAuth();
  const { query } = useBossSearch('고객명 · 메시지');

  const [filter, setFilter] = useState<FilterKey>('all');
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── 목록 필터링 ──
  const rooms = useMemo(() => {
    let list = chatRooms.filter((r) => matchesFilter(r, filter));
    const k = query.trim().toLowerCase();
    if (k) {
      list = list.filter((r) =>
        [r.partnerName, r.lastMessage].filter(Boolean).some((v) => String(v).toLowerCase().includes(k))
      );
    }
    return list;
  }, [chatRooms, filter, query]);

  const counts = useMemo(
    () => ({
      all: chatRooms.length,
      unread: chatRooms.filter((r) => r.unreadCount > 0).length,
      online: chatRooms.filter((r) => r.partnerStatus === 'ONLINE').length,
      done: chatRooms.filter((r) => r.unreadCount === 0).length,
    }),
    [chatRooms]
  );

  // 필터/검색이 바뀌면 선택을 처음으로
  useEffect(() => {
    setIndex(0);
  }, [filter, query]);

  const selected = rooms[index] ?? null;
  const roomId = selected?.roomId ?? null;

  // ── 선택된 방의 메시지 ──
  const { messages, isLoading: msgLoading, addMessage, loadMessages } = useChatMessages(roomId);
  const handleNewMessage = useCallback((m: ChatApiMessage) => addMessage(m), [addMessage]);
  const { isConnected, connectionError, sendMessage } = useChatWebSocket(
    roomId,
    handleNewMessage,
    handleNewMessage
  );

  useEffect(() => {
    if (roomId) loadMessages(1, false);
    // loadMessages 는 roomId 별로 새로 만들어지므로 의존성에서 제외한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── 전송 후 다음 미답변으로 (시안 핸들링 원칙) ──
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !isConnected) return;
    sendMessage(text);
    setInput('');

    const nextUnread = rooms.findIndex((r, i) => i > index && r.unreadCount > 0);
    if (nextUnread !== -1) setIndex(nextUnread);
  }, [input, isConnected, sendMessage, rooms, index]);

  useSubmitHotkey(handleSend, Boolean(roomId) && isConnected);
  useListNavHotkeys({ count: rooms.length, index, onIndexChange: setIndex });

  const applyReply = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="boss-bleed grid grid-cols-1 lg:grid-cols-[178px_minmax(0,340px)_minmax(0,1fr)]">
      {/* ───── 1열 필터 ───── */}
      <div className="hidden flex-col gap-[3px] border-r border-boss-border px-3 py-[15px] lg:flex">
        <MonoLabel className="px-2 pb-2">Filter</MonoLabel>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-current={filter === f.key}
            onClick={() => setFilter(f.key)}
            className="boss-subnav-item text-left"
          >
            <span className="min-w-0 flex-1 truncate">{f.label}</span>
            <span className="font-boss-mono text-[10px] opacity-70">{counts[f.key]}</span>
          </button>
        ))}

        <MonoLabel className="px-2 pb-2 pt-4">Saved Reply</MonoLabel>
        {SAVED_REPLIES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => applyReply(r.text)}
            disabled={!roomId}
            className="rounded-chip px-2 py-[7px] text-left text-[12px] text-boss-text-tertiary transition-colors duration-[120ms] ease-out hover:bg-boss-hover hover:text-white disabled:opacity-40"
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ───── 2열 스레드 목록 ───── */}
      <div className="boss-scroll flex min-h-0 flex-col overflow-y-auto border-r border-boss-border">
        <div className="sticky top-0 z-10 flex items-center gap-[9px] border-b border-boss-border bg-boss-shell px-[13px] py-[11px]">
          <p className="flex-1 text-[12px] font-bold text-boss-text">
            {filter === 'unread' ? '미답변' : '대화'} {rooms.length}
          </p>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={refreshChatRooms}
            disabled={isLoading}
          >
            새로고침
          </Button>
        </div>

        {error && (
          <div className="p-3">
            <AlertBanner
              tone="bad"
              action={
                <Button variant="primary" size="sm" onClick={refreshChatRooms}>
                  다시 시도
                </Button>
              }
            >
              {error}
            </AlertBanner>
          </div>
        )}

        {isLoading && chatRooms.length === 0 ? (
          <div className="flex flex-col gap-px p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px]" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Inbox}
              title="표시할 대화가 없습니다"
              description="고객이 상담을 요청하면 여기에 표시됩니다."
            />
          </div>
        ) : (
          rooms.map((room, i) => {
            const active = i === index;
            return (
              <button
                key={room.roomId}
                type="button"
                onClick={() => setIndex(i)}
                className={`border-b border-boss-border-row px-[13px] py-3 text-left transition-colors duration-[120ms] ease-out ${
                  active
                    ? 'bg-boss-elevated shadow-[inset_2px_0_0_0_rgb(var(--boss-primary))]'
                    : 'hover:bg-boss-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Chip tone={chipToneOf(room.partnerName)} size={22}>
                    {room.partnerName.charAt(0)}
                  </Chip>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-boss-text">
                    {room.partnerName}
                  </span>
                  <span className="font-boss-mono text-[10px] text-boss-text-muted">
                    {room.lastMessageTime ?? ''}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-boss-text-body">
                  {room.lastMessage ?? '아직 메시지가 없습니다.'}
                </p>
                <div className="mt-[7px] flex items-center gap-[7px]">
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-boss-text-muted">
                    {room.partnerStatus === 'ONLINE' ? '접속 중' : '오프라인'}
                  </span>
                  {room.unreadCount > 0 && (
                    <StatusPill tone="bad">미답변 {room.unreadCount}</StatusPill>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ───── 3열 상세 ───── */}
      <div className="hidden min-h-0 flex-col lg:flex">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-[12px] text-boss-text-muted">
              왼쪽에서 대화를 선택하세요 · J / K 로 이동
            </p>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex flex-none items-center gap-2.5 border-b border-boss-border px-[18px] py-3.5">
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#2b2f47] text-[11px] text-boss-text-dim">
                {selected.partnerName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-boss-text">
                  {selected.partnerName}
                </p>
                <p className="text-[11px] text-boss-text-muted">
                  {isConnected ? '연결됨' : (connectionError ?? '연결 중…')}
                  {selected.unreadCount > 0 && ` · 미답변 ${selected.unreadCount}`}
                </p>
              </div>
              <Link
                href={`/boss/chat/${selected.roomId}`}
                className="boss-btn boss-btn-sm boss-btn-outline"
              >
                단독 보기 <ChevronRight size={12} />
              </Link>
            </div>

            {/* 메시지 */}
            <div className="boss-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-[18px]">
              {msgLoading && messages.length === 0 ? (
                <p className="text-center text-[12px] text-boss-text-muted">불러오는 중…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[12px] text-boss-text-muted">
                  아직 메시지가 없습니다.
                </p>
              ) : (
                messages
                  .filter((m) => m.message && m.message.trim() !== '')
                  .map((m) => {
                    const mine = m.senderType === 'APP' && m.senderId === chatAuth.userId;
                    return (
                      <div
                        key={m.messageId}
                        className={`max-w-[75%] rounded-card border px-3.5 py-3 ${
                          mine
                            ? 'self-end border-boss-primary/30 bg-[var(--boss-ac-dim)]'
                            : 'self-start border-boss-border bg-boss-surface'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-boss-text-soft">
                          {m.message}
                        </p>
                        <p className="mt-1.5 font-boss-mono text-[10px] text-boss-text-muted">
                          {m.timeAgo}
                        </p>
                      </div>
                    );
                  })
              )}
              <div ref={endRef} />
            </div>

            {/* 하단 고정 답변 입력 — 시안: border #2e3250 / radius 11px / 본문 min 62px */}
            <div className="flex-none p-[18px] pt-0">
              <div className="overflow-hidden rounded-card border border-boss-border-strong bg-boss-inset">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isConnected ? '답변을 입력하세요' : '연결 중…'}
                  disabled={!isConnected}
                  className="min-h-[62px] w-full resize-none bg-transparent px-3.5 py-3 text-[13px] leading-[1.6] text-boss-text-soft outline-none placeholder:text-boss-text-muted disabled:opacity-50"
                />
                <div className="flex items-center gap-[7px] border-t border-boss-border px-[11px] py-[9px]">
                  <select
                    value=""
                    onChange={(e) => {
                      const r = SAVED_REPLIES.find((x) => x.label === e.target.value);
                      if (r) applyReply(r.text);
                    }}
                    aria-label="저장된 답변"
                    className="rounded-[6px] border border-boss-border-strong bg-transparent px-2 py-[5px] text-[11px] text-boss-text-tertiary outline-none"
                  >
                    <option value="">저장된 답변</option>
                    {SAVED_REPLIES.map((r) => (
                      <option key={r.label} value={r.label}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <span className="hidden font-boss-mono text-[10px] text-boss-text-muted xl:block">
                    ⌘↵ 전송 후 다음
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={handleSend}
                    disabled={!isConnected || !input.trim()}
                  >
                    전송
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
