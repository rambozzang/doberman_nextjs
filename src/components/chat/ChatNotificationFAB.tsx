"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalChatNotification } from '@/hooks/useGlobalChatNotification';
import { useChatAuth } from '@/hooks/useChatAuth';

export const ChatNotificationFAB: React.FC = () => {
  const router = useRouter();
  const { chatAuth } = useChatAuth();
  const { totalUnread } = useGlobalChatNotification();

  // 비로그인이거나 boss 유저(APP)이면 렌더링 안 함
  if (!chatAuth.isAuthenticated || chatAuth.userType !== 'WEB') {
    return null;
  }

  const handleClick = () => {
    router.push('/quote-request/list');
  };

  return (
    <button
      onClick={handleClick}
      aria-label={
        totalUnread > 0
          ? `읽지 않은 채팅 메시지 ${totalUnread}건`
          : '채팅 목록 보기'
      }
      className={[
        'fixed bottom-6 right-6 z-40',
        'relative w-14 h-14 rounded-full shadow-2xl',
        'flex items-center justify-center',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
        totalUnread > 0
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 scale-100 hover:scale-110'
          : 'bg-slate-700/60 hover:bg-slate-600/70 scale-90 hover:scale-100',
      ].join(' ')}
    >
      {/* 채팅 아이콘 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>

      {/* 미읽음 배지 */}
      {totalUnread > 0 && (
        <>
          {/* pulse 링 */}
          <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30" />
          {/* 숫자 배지 */}
          <span
            className={[
              'absolute -top-1 -right-1',
              'min-w-[1.25rem] h-5 px-1',
              'bg-red-500 text-white text-xs font-bold',
              'rounded-full flex items-center justify-center',
              'shadow-lg border border-white/20',
            ].join(' ')}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        </>
      )}
    </button>
  );
};
