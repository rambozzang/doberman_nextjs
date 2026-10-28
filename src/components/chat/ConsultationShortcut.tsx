'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useChatAuth } from '@/hooks/useChatAuth';
import { FABChatModal } from './FABChatModal';
import type { ChatRoom } from './types';

/** 실제 읽지 않은 방만 표시하며, 카드의 상대방과 동일한 roomId로 연다. */
export default function ConsultationShortcut({
  boss = false
}: {
  boss?: boolean;
}) {
  const {
    chatAuth
  } = useChatAuth();
  const {
    chatRooms,
    error,
    refreshChatRooms
  } = useChatRooms({
    realtime: true
  });
  const [selected, setSelected] = useState<ChatRoom | null>(null);
  useEffect(() => {setSelected(null);}, [chatAuth.userId, chatAuth.userType, chatAuth.token]);
  if (!chatAuth.isAuthenticated || chatAuth.userType !== (boss ? 'APP' : 'WEB')) return null;
  const unread = chatRooms.filter(room => room.unreadCount > 0);
  if (!unread.length && !error) return null;
  return <section aria-label="답장할 상담" className={boss ? 'border border-boss-border bg-boss-surface p-5 text-boss-text' : 'my-5 rounded-xl border border-slate-600 bg-slate-800 p-5 text-slate-100'}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{unread.length ? `${boss ? '고객이 메시지를 보냈어요' : '사장님 답변이 왔어요'} · ${unread.length}개 대화` : '상담 메시지 확인'}</h2>{boss && <Link className="boss-btn boss-btn-sm boss-btn-secondary" href="/boss/chat">상담 전체보기</Link>}</div>
    {error && <p role="alert">상담 목록을 불러오지 못했습니다. <button type="button" onClick={refreshChatRooms} className="underline">다시 시도</button></p>}
    <div className="divide-y divide-current/10">{unread.slice(0, 3).map(room => {
        const content = <><span className="min-w-0 flex-1"><strong className="block truncate">{room.partnerName} <span className="text-sm font-normal">· 읽지 않음 {room.unreadCount}</span></strong><span className="mt-1 block truncate text-sm opacity-80">{room.lastMessage || '첨부파일을 보냈어요'}</span></span><span className="shrink-0 text-sm font-semibold">답장하기 ›</span></>;
        const className = 'flex min-h-16 w-full items-center gap-4 py-3 text-left focus-visible:outline focus-visible:outline-2';
        return boss ? <Link key={room.roomId} className={className} href={`/boss/chat/${room.roomId}`}>{content}</Link> : <button type="button" key={room.roomId} className={className} onClick={() => setSelected(room)}>{content}</button>;
      })}</div>
    {selected && <FABChatModal room={selected} onClose={() => {
      setSelected(null);
      refreshChatRooms();
    }} />}
  </section>;
}
