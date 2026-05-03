'use client';

import Link from 'next/link';
import { useChatRooms } from '@/hooks/useChatRooms';
import BossPageHeader from '@/components/boss/BossPageHeader';
import { MessageCircle } from 'lucide-react';

export default function BossChatListPage() {
  const { chatRooms, isLoading, error, refreshChatRooms } = useChatRooms();

  return (
    <div className="space-y-4">
      <BossPageHeader
        title="채팅"
        description="고객과의 상담 메시지를 확인하세요."
        actions={
          <button
            type="button"
            onClick={refreshChatRooms}
            className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:border-emerald-500"
          >
            새로고침
          </button>
        }
      />
      {error && (
        <div className="rounded border border-rose-700 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>
      )}
      {isLoading ? (
        <div className="rounded border border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-400">
          불러오는 중...
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="rounded border border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-400">
          진행 중인 채팅이 없습니다.
        </div>
      ) : (
        <ul className="space-y-2">
          {chatRooms.map((room) => (
            <li key={room.roomId}>
              <Link
                href={`/boss/chat/${room.roomId}`}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 p-4 hover:border-emerald-500/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-300">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{room.partnerName}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                      {room.lastMessage ?? '아직 메시지가 없습니다.'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-500">{room.lastMessageTime ?? ''}</span>
                  {room.unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
