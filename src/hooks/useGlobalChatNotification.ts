import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { chatApi } from '@/lib/chatApi';
import { useChatAuth } from './useChatAuth';
import { ChatRoom } from '@/components/chat/types';

const POLL_INTERVAL = 30_000; // 30초

interface UseGlobalChatNotificationOptions {
  /** 채팅 모달이 열려있으면 true — 토스트 알림을 억제한다 */
  isChatModalOpen?: boolean;
}

interface UseGlobalChatNotificationReturn {
  /** 전체 미읽음 메시지 수 */
  totalUnread: number;
  /** 미읽음이 1개 이상인 채팅방 목록 */
  unreadRooms: ChatRoom[];
}

export const useGlobalChatNotification = (
  options: UseGlobalChatNotificationOptions = {}
): UseGlobalChatNotificationReturn => {
  const { isChatModalOpen = false } = options;
  const { chatAuth } = useChatAuth();

  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadRooms, setUnreadRooms] = useState<ChatRoom[]>([]);

  // 이전 미읽음 수 — null 이면 아직 최초 로드 전
  const prevTotalRef = useRef<number | null>(null);
  // 모달 열림 여부를 ref 로 유지해 콜백 클로저 문제 방지
  const isChatModalOpenRef = useRef(isChatModalOpen);
  useEffect(() => {
    isChatModalOpenRef.current = isChatModalOpen;
  }, [isChatModalOpen]);

  const fetchAndNotify = useCallback(async () => {
    if (!chatAuth.isAuthenticated || !chatAuth.token || !chatAuth.userId || !chatAuth.userType) {
      return;
    }

    try {
      chatApi.setAuthHeader(chatAuth.token);
      const response = await chatApi.getChatRooms(
        chatAuth.userId ?? undefined,
        chatAuth.userType ?? undefined,
      );

      if (!response.success || !response.data) return;

      const rooms: ChatRoom[] = response.data;
      const newTotal = rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0);
      const newUnreadRooms = rooms.filter(r => (r.unreadCount ?? 0) > 0);

      setTotalUnread(newTotal);
      setUnreadRooms(newUnreadRooms);

      const prev = prevTotalRef.current;

      if (prev !== null && newTotal > prev && !isChatModalOpenRef.current) {
        // 새 메시지 알림 토스트
        const added = newTotal - prev;
        const message =
          newUnreadRooms.length === 1
            ? `💬 ${newUnreadRooms[0].partnerName} 전문가에게서 새 메시지가 왔습니다`
            : `💬 채팅 ${newUnreadRooms.length}개에서 새 메시지 ${added}건이 왔습니다`;

        toast(message, {
          duration: 5000,
          style: {
            background: '#1e40af',
            color: '#fff',
            border: '1px solid #3b82f6',
            cursor: 'pointer',
          },
          icon: '💬',
        });
      }

      prevTotalRef.current = newTotal;
    } catch {
      // 조용히 실패 — 다음 폴링에서 재시도
    }
  }, [chatAuth.isAuthenticated, chatAuth.token, chatAuth.userId, chatAuth.userType]);

  useEffect(() => {
    if (!chatAuth.isAuthenticated) {
      // 로그아웃 시 상태 초기화
      setTotalUnread(0);
      setUnreadRooms([]);
      prevTotalRef.current = null;
      return;
    }

    // 즉시 한 번 실행
    fetchAndNotify();

    const interval = setInterval(fetchAndNotify, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [chatAuth.isAuthenticated, fetchAndNotify]);

  return { totalUnread, unreadRooms };
};
