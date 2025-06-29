import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)

export const useAutoLogout = () => {
  const { isLoggedIn, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // 타이머 리셋 함수
  const resetTimer = useCallback(() => {
    if (!isLoggedIn) return;

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 마지막 활동 시간 업데이트
    lastActivityRef.current = Date.now();

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      console.log('30분 비활성화로 인한 자동 로그아웃');
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [isLoggedIn, logout]);

  // 사용자 활동 감지 함수
  const handleUserActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isLoggedIn) {
      // 로그인하지 않은 경우 타이머 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // 로그인한 경우 이벤트 리스너 등록
    const events = [
      'click',
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
    ];

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // 초기 타이머 설정
    resetTimer();

    // 클린업 함수
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoggedIn, handleUserActivity, resetTimer]);

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}; 