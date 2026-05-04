import { useState, useEffect, useCallback } from "react";
import { AuthManager } from "@/lib/auth";
import { BossAuthManager } from "@/lib/bossAuth";
import { ChatAuthState } from "@/components/chat/types";

// 현재 라우트가 사장님(boss) 영역인지 판별
const isBossContext = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/boss");
};

export const useChatAuth = () => {
  const [chatAuth, setChatAuth] = useState<ChatAuthState>({
    token: null,
    userId: null,
    userType: null,
    isAuthenticated: false,
  });

  // 기존 시스템의 토큰과 사용자 정보를 채팅 시스템용으로 변환
  // /boss/* 컨텍스트에서는 BossAuthManager + userType='APP' 사용
  const initializeChatAuth = useCallback(() => {
    const boss = isBossContext();

    if (boss) {
      const token = BossAuthManager.getToken();
      const userInfo = BossAuthManager.getUserInfo();
      const isLoggedIn = BossAuthManager.isLoggedIn();

      if (token && userInfo && isLoggedIn) {
        setChatAuth({
          token,
          userId: userInfo.userId ?? null,
          userType: "APP",
          isAuthenticated: true,
        });
        console.log("채팅 인증 초기화 (boss):", { userId: userInfo.userId, userType: "APP", hasToken: !!token });
        return;
      }
    } else {
      const token = AuthManager.getToken();
      const userInfo = AuthManager.getUserInfo();
      const isLoggedIn = AuthManager.isLoggedIn();

      if (token && userInfo && isLoggedIn) {
        const userId = userInfo.customerId.toString();
        const userType = "WEB"; // 웹 고객
        setChatAuth({
          token,
          userId,
          userType,
          isAuthenticated: true,
        });
        console.log("채팅 인증 초기화 (web):", { userId, userType, hasToken: !!token });
        return;
      }
    }

    setChatAuth({
      token: null,
      userId: null,
      userType: null,
      isAuthenticated: false,
    });
  }, []);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeChatAuth();
  }, [initializeChatAuth]);

  // 주기적으로 인증 상태 확인 (토큰 변경 감지)
  useEffect(() => {
    const interval = setInterval(() => {
      const boss = isBossContext();
      const currentToken = boss ? BossAuthManager.getToken() : AuthManager.getToken();
      const currentIsLoggedIn = boss ? BossAuthManager.isLoggedIn() : AuthManager.isLoggedIn();

      // 토큰 상태가 변경되었을 때만 업데이트
      if (currentToken !== chatAuth.token || currentIsLoggedIn !== chatAuth.isAuthenticated) {
        console.log('인증 상태 변경 감지 - 채팅 인증 상태 업데이트');
        initializeChatAuth();
      }
    }, 5000); // 5초마다 확인

    return () => clearInterval(interval);
  }, [chatAuth.token, chatAuth.isAuthenticated, initializeChatAuth]);

  // 기존 인증 상태 변경 감지를 위한 함수
  const refreshChatAuth = useCallback(() => {
    initializeChatAuth();
  }, [initializeChatAuth]);

  // 채팅 시스템 로그아웃 (기존 시스템과 연동)
  const chatLogout = useCallback(() => {
    setChatAuth({
      token: null,
      userId: null,
      userType: null,
      isAuthenticated: false,
    });
  }, []);

  // Authorization 헤더 생성
  const getAuthHeader = useCallback(() => {
    if (chatAuth.token) {
      return {
        Authorization: `Bearer ${chatAuth.token}`
      };
    }
    return {};
  }, [chatAuth.token]);

  // WebSocket 연결용 토큰 파라미터 생성
  const getWebSocketParams = useCallback(() => {
    if (chatAuth.token && chatAuth.userId && chatAuth.userType) {
      return {
        token: chatAuth.token,
        userId: chatAuth.userId,
        userType: chatAuth.userType
      };
    }
    return null;
  }, [chatAuth.token, chatAuth.userId, chatAuth.userType]);

  return {
    chatAuth,
    refreshChatAuth,
    chatLogout,
    getAuthHeader,
    getWebSocketParams,
    isReady: chatAuth.isAuthenticated
  };
}; 