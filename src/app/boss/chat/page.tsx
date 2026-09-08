'use client';

// 고객 채팅 인박스 — Industry 패턴 (agent.opentohome.com)
//
// 레이아웃(lg↑): boss-bleed 3열 grid 178px / minmax(0,340px) / minmax(0,1fr)
//   셸이 페이지 스크롤이므로 컨테이너가 스스로 높이(100dvh − 헤더)를 잡고 각 열이 내부 스크롤한다.
//   1열 필터   : SubNav(전체 · 미답변 · 접속 중 · 처리 완료 + 건수) + 저장된 답변
//   2열 대화   : sticky 헤더(대화 n · 새로고침), 행 = 사각 Chip 아바타 + 이름 + 시간 + 미리보기,
//                선택 행은 accent-100 배경 + 좌측 3px accent(레일과 같은 표시)
//   3열 본문   : 헤더(아바타 · 이름 · 연결 상태) → 말풍선(사각 — 내 메시지 accent 채움 / 상대 패널+테두리)
//                → 하단 고정 답변 입력
//
// 처리 원칙
//   - 목록을 벗어나지 않고 연속 처리한다 (상세 페이지 왕복 없음)
//   - J/K 로 목록 이동, ⌘↵ 로 전송, 전송 후 자동으로 다음 미답변으로
//
// 반응형: <lg 는 목록 단일 열 + 본문은 /boss/chat/[roomId] 로 이동

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Inbox, Send, ChevronRight } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useChatAuth } from '@/hooks/useChatAuth';
import toast from 'react-hot-toast';
import { BossAuthManager } from '@/lib/bossAuth';
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
  SubNav,
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

// 저장된 답변 — 반복 문의를 2클릭으로 끝내기 위한 매크로
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

export default function BossChatInboxPage() {
  const router = useRouter();
  // realtime: true — 지금 열어 둔 방이 아닌 다른 방에 새 메시지가 와도 목록이 바로 갱신된다
  const { chatRooms, isLoading, error, refreshChatRooms } = useChatRooms({ realtime: true });
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
    // 메시지 칸만 내린다. scrollIntoView 는 창 전체를 끌어내려서 화면이 잘려 보였다.
    const end = endRef.current;
    if (!end) return;
    const box = end.closest('[data-chat-scroll]') as HTMLElement | null;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    else end.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  // ── 전송 후 다음 미답변으로 ──
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !isConnected) return;
    const ok = sendMessage(text);
    if (!ok) {
      toast.error('메시지를 보내지 못했습니다. 연결 상태를 확인해 주세요.');
      return;
    }
    addMessage(optimisticMessage(text));
    setInput('');

    const nextUnread = rooms.findIndex((r, i) => i > index && r.unreadCount > 0);
    if (nextUnread !== -1) setIndex(nextUnread);
  }, [input, isConnected, sendMessage, addMessage, rooms, index]);

  useSubmitHotkey(handleSend, Boolean(roomId) && isConnected);
  useListNavHotkeys({ count: rooms.length, index, onIndexChange: setIndex });

  const applyReply = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const isFiltered = filter !== 'all' || query.trim().length > 0;

  return (
    // 헤더(부제 포함) 높이 ≈ 111px. lg 에서만 고정 높이 + 내부 스크롤. boss-bleed 의 min-height 는 여기서 끈다.
    <div className="boss-bleed grid grid-cols-1 lg:h-[calc(100dvh-112px)] lg:!min-h-0 lg:grid-cols-[178px_minmax(0,340px)_minmax(0,1fr)] lg:overflow-hidden">
      {/* ───── 1열 필터 ───── */}
      <div className="boss-scroll hidden min-h-0 flex-col overflow-y-auto border-r border-boss-border py-[15px] lg:flex">
        <SubNav
          label="필터"
          items={FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))}
          value={filter}
          onChange={(k) => setFilter(k as FilterKey)}
        />

        <MonoLabel className="px-3 pb-2 pt-5">저장된 답변</MonoLabel>
        {SAVED_REPLIES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => applyReply(r.text)}
            disabled={!roomId}
            title={r.text}
            className="px-3 py-[7px] text-left text-[12.5px] text-boss-text-secondary transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:text-boss-text disabled:opacity-40"
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ───── 2열 대화 목록 ───── */}
      <div className="boss-scroll flex min-h-0 flex-col overflow-y-auto border-r border-boss-border">
        <div className="sticky top-0 z-10 flex items-center gap-[9px] border-b border-boss-border bg-boss-bg px-[13px] py-[9px]">
          <p className="flex-1 text-[12.5px] font-semibold text-boss-text">
            {filter === 'unread' ? '미답변' : '대화'}{' '}
            <span className="font-boss-head tabular-nums text-boss-text-secondary">{rooms.length}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={refreshChatRooms}
            disabled={isLoading}
            className="-mr-2"
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
          error ? null : (
            <div className="p-4">
              <EmptyState
                icon={Inbox}
                title={isFiltered ? '조건에 맞는 대화가 없습니다' : '아직 대화가 없습니다'}
                description={
                  isFiltered
                    ? "필터를 '전체'로 바꾸거나 검색어를 지워 보세요."
                    : '고객이 앱에서 상담을 시작하면 여기에 쌓입니다.'
                }
                action={
                  isFiltered ? (
                    <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                      전체 보기
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )
        ) : (
          rooms.map((room, i) => {
            const active = i === index;
            return (
              <button
                key={room.roomId}
                type="button"
                aria-current={active}
                onClick={() => {
                  setIndex(i);
                  // 좁은 화면에서는 본문 열이 숨겨져 있다 — 대화 화면으로 이동한다
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    router.push(`/boss/chat/${room.roomId}`);
                  }
                }}
                className={`border-b border-boss-border-row px-[13px] py-3 text-left transition-colors duration-[120ms] ease-out ${
                  active
                    ? 'bg-boss-elevated shadow-[inset_3px_0_0_0_rgb(var(--boss-primary))]'
                    : 'hover:bg-boss-inset'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Chip tone={chipToneOf(room.partnerName)} size={22}>
                    {room.partnerName.charAt(0)}
                  </Chip>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-boss-text">
                    {room.partnerName}
                  </span>
                  <span className="font-boss-head text-[11px] tabular-nums text-boss-text-muted">
                    {room.lastMessageTime ?? ''}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.5] text-boss-text-body">
                  {room.lastMessage ?? '아직 메시지가 없습니다.'}
                </p>
                <div className="mt-[7px] flex items-center gap-[7px]">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[11px] text-boss-text-muted">
                    <span
                      aria-hidden
                      className={`inline-block h-[6px] w-[6px] rounded-full ${
                        room.partnerStatus === 'ONLINE' ? 'bg-boss-success' : 'bg-boss-text-ghost'
                      }`}
                    />
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

      {/* ───── 3열 본문 ───── */}
      <div className="hidden min-h-0 flex-col lg:flex">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
            <p className="text-[13px] text-boss-text-secondary">왼쪽에서 대화를 선택하세요</p>
            <p className="font-boss-head text-[11.5px] text-boss-text-muted">J / K 이동 · ⌘↵ 전송</p>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex flex-none items-center gap-2.5 border-b border-boss-border px-[18px] py-3">
              <Chip tone={chipToneOf(selected.partnerName)} size={30}>
                {selected.partnerName.charAt(0)}
              </Chip>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-boss-text">
                  {selected.partnerName}
                </p>
                <p className="flex items-center gap-1.5 text-[11.5px] text-boss-text-muted">
                  <span
                    aria-hidden
                    className={`inline-block h-[6px] w-[6px] rounded-full ${
                      isConnected ? 'bg-boss-success' : 'bg-boss-warning'
                    }`}
                  />
                  {isConnected ? '연결됨' : (connectionError ?? '연결 중…')}
                  {selected.unreadCount > 0 && ` · 미답변 ${selected.unreadCount}`}
                </p>
              </div>
              <Link
                href={`/boss/chat/${selected.roomId}`}
                className="boss-btn boss-btn-sm boss-btn-secondary"
              >
                단독 보기 <ChevronRight size={12} />
              </Link>
            </div>

            {/* 메시지 */}
            <div data-chat-scroll className="boss-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-boss-bg p-[18px]">
              {msgLoading && messages.length === 0 ? (
                <p className="text-center text-[12.5px] text-boss-text-secondary">불러오는 중…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[12.5px] text-boss-text-secondary">
                  아직 주고받은 메시지가 없습니다. 아래에서 첫 답변을 보내세요.
                </p>
              ) : (
                messages
                  .filter((m) => m.message && m.message.trim() !== '')
                  .map((m) => {
                    const mine = m.senderType === 'APP' && m.senderId === chatAuth.userId;
                    return (
                      <div
                        key={m.messageId}
                        className={`max-w-[75%] px-3.5 py-2.5 ${
                          mine
                            ? 'self-end bg-boss-primary text-boss-primary-foreground'
                            : 'self-start border border-boss-border bg-boss-surface text-boss-text'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.6]">
                          {m.message}
                        </p>
                        <p
                          className={`mt-1 font-boss-head text-[10.5px] tabular-nums ${
                            mine ? 'text-boss-primary-foreground/70' : 'text-boss-text-muted'
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

            {/* 하단 고정 답변 입력 */}
            <div className="flex-none border-t border-boss-border bg-boss-surface p-[14px]">
              <div className="border border-boss-border-strong bg-boss-inset transition-colors duration-[120ms] ease-out focus-within:border-boss-primary">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isConnected ? '답변을 입력하세요' : '연결 중…'}
                  aria-label="답변 입력"
                  disabled={!isConnected}
                  className="min-h-[62px] w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px] leading-[1.6] text-boss-text outline-none placeholder:text-boss-text-faint disabled:opacity-50"
                  maxLength={2000}
                />
                <div className="flex items-center gap-[7px] border-t border-boss-border px-[11px] py-[8px]">
                  <select
                    value=""
                    onChange={(e) => {
                      const r = SAVED_REPLIES.find((x) => x.label === e.target.value);
                      if (r) applyReply(r.text);
                    }}
                    aria-label="저장된 답변"
                    disabled={!isConnected}
                    className="border border-boss-border bg-boss-bg px-2 py-[4px] text-[11.5px] text-boss-text-dim outline-none focus:border-boss-primary disabled:opacity-50"
                  >
                    <option value="">저장된 답변</option>
                    {SAVED_REPLIES.map((r) => (
                      <option key={r.label} value={r.label}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <span className="hidden font-boss-head text-[11px] text-boss-text-muted xl:block">
                    ⌘↵ 전송 후 다음 미답변으로
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
