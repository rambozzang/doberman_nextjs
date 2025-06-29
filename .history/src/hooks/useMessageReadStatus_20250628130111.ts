import { useEffect, useRef, useCallback, useState } from "react";
import { useChatAuth } from "./useChatAuth";
import { chatApi } from "@/lib/chatApi";

interface UseMessageReadStatusProps {
  roomId: number | null;
  onMarkAsRead?: (messageIds: number[]) => void;
}

export const useMessageReadStatus = ({
  roomId,
  onMarkAsRead,
}: UseMessageReadStatusProps) => {
  const { chatAuth } = useChatAuth();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleMessages = useRef<Set<number>>(new Set());
  const [isPageVisible, setIsPageVisible] = useState(true);

  // 메시지 읽음 처리 API 호출
  const markMessagesAsRead = useCallback(
    async (messageIds: number[]) => {
      if (!chatAuth.isAuthenticated || !roomId || messageIds.length === 0) return;

      try {
        // API 인증 헤더 설정
        if (chatAuth.token) {
          chatApi.setAuthHeader(chatAuth.token);
        }

        const response = await chatApi.markMessagesAsRead(roomId, messageIds);

        if (response.success && response.data) {
          const { readMessageIds, unreadCount } = response.data;
          console.log(`${readMessageIds.length}개 메시지 읽음 처리 완료`);
          console.log(`남은 안읽은 메시지: ${unreadCount}개`);

          // 상위 컴포넌트에 알림
          onMarkAsRead?.(readMessageIds);

          return { success: true, readMessageIds, unreadCount };
        }
      } catch (error) {
        console.error("메시지 읽음 처리 오류:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    },
    [chatAuth.isAuthenticated, chatAuth.token, roomId, onMarkAsRead]
  );

  // Intersection Observer 설정
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!isPageVisible) return; // 페이지가 보이지 않으면 처리하지 않음

        const newVisibleMessages: number[] = [];

        entries.forEach((entry) => {
          const messageElement = entry.target as HTMLElement;
          const messageId = parseInt(messageElement.dataset.messageId || "0");
          const isRead = messageElement.dataset.isRead === "true";
          const isMine = messageElement.classList.contains("own-message");

          if (entry.isIntersecting && messageId > 0) {
            // 상대방 메시지이고 아직 읽지 않은 경우만 처리
            if (!isMine && !isRead && !visibleMessages.current.has(messageId)) {
              visibleMessages.current.add(messageId);
              newVisibleMessages.push(messageId);

              // UI에서 즉시 읽음 상태로 표시 (낙관적 업데이트)
              messageElement.dataset.isRead = "true";
            }
          } else if (!entry.isIntersecting && messageId > 0) {
            visibleMessages.current.delete(messageId);
          }
        });

        // 읽음 처리할 메시지가 있으면 서버에 전송
        if (newVisibleMessages.length > 0) {
          markMessagesAsRead(newVisibleMessages);
        }
      },
      {
        threshold: 0.5, // 메시지의 50%가 보이면 읽음 처리
        rootMargin: "0px 0px -50px 0px", // 하단 50px 여백
      }
    );

    return observerRef.current;
  }, [markMessagesAsRead, isPageVisible]);

  // 메시지 요소 관찰 시작
  const observeMessage = useCallback((element: HTMLElement) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, []);

  // 메시지 요소 관찰 중단
  const unobserveMessage = useCallback((element: HTMLElement) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);

  // 현재 화면에 보이는 안읽은 메시지들 읽음 처리
  const markVisibleMessagesAsRead = useCallback(() => {
    if (!isPageVisible || !roomId) return;

    const visibleUnreadMessages = Array.from(
      document.querySelectorAll(
        '.message-item[data-is-read="false"]:not(.own-message)'
      )
    )
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      })
      .map((el) => parseInt((el as HTMLElement).dataset.messageId || "0"))
      .filter((id) => id > 0);

    if (visibleUnreadMessages.length > 0) {
      markMessagesAsRead(visibleUnreadMessages);
    }
  }, [isPageVisible, roomId, markMessagesAsRead]);

  // 페이지 가시성 변경 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsPageVisible(visible);

      if (visible) {
        // 페이지가 다시 보이면 현재 화면의 안읽은 메시지들 처리
        setTimeout(markVisibleMessagesAsRead, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markVisibleMessagesAsRead]);

  // 초기화 및 정리
  useEffect(() => {
    const observer = setupIntersectionObserver();

    return () => {
      if (observer) {
        observer.disconnect();
      }
      visibleMessages.current.clear();
    };
  }, [setupIntersectionObserver]);

  return {
    markMessagesAsRead,
    markVisibleMessagesAsRead,
    observeMessage,
    unobserveMessage,
  };
}; 