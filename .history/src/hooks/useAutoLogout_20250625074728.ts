import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)
const WARNING_TIME = 5 * 60 * 1000; // 5분 (밀리초)

export const useAutoLogout = () => {
  const { isLoggedIn, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  // 경고 메시지 표시 함수
  const showLogoutWarning = useCallback(() => {
    setShowWarning(true);
    
    // 5분 후 자동 로그아웃 실행
    timeoutRef.current = setTimeout(() => {
      console.log('30분 비활성화로 인한 자동 로그아웃');
      setShowWarning(false);
      logout();
    }, WARNING_TIME);
  }, [logout]);

  // 경고 메시지 숨기기 및 타이머 연장
  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, []);

  // 타이머 리셋 함수
  const resetTimer = useCallback(() => {
    if (!isLoggedIn) return;

    // 기존 타이머들 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // 경고 메시지 숨기기
    setShowWarning(false);

    // 마지막 활동 시간 업데이트
    lastActivityRef.current = Date.now();

    // 25분 후 경고 메시지 표시 (30분 - 5분)
    warningTimeoutRef.current = setTimeout(() => {
      showLogoutWarning();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  }, [isLoggedIn, showLogoutWarning]);

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
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowWarning(false);
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
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };
  }, [isLoggedIn, handleUserActivity, resetTimer]);

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  return {
    resetTimer,
    extendSession,
    showWarning,
    lastActivity: lastActivityRef.current,
  };
}; 