import { useState, useEffect, useCallback } from "react";
import { AuthManager } from "@/lib/auth";
import { ChatAuthState } from "@/components/chat/types";

export const useChatAuth = () => {
  const [chatAuth, setChatAuth] = useState<ChatAuthState>({
    token: null,
    userId: null,
    userType: null,
    isAuthenticated: false,
  });

  // 기존 시스템의 토큰과 사용자 정보를 채팅 시스템용으로 변환
  const initializeChatAuth = useCallback(() => {
    const token = AuthManager.getToken();
    const userInfo = AuthManager.getUserInfo();
    const isLoggedIn = AuthManager.isLoggedIn();

    if (token && userInfo && isLoggedIn) {
      // 기존 시스템의 사용자 정보를 채팅 시스템 형식으로 변환
      const userId = userInfo.customerId.toString();
      const userType = "WEB"; // 웹 고객으로 설정

      setChatAuth({
        token,
        userId,
        userType,
        isAuthenticated: true,
      });

      console.log("채팅 인증 초기화:", { userId, userType, hasToken: !!token });
    } else {
      setChatAuth({
        token: null,
        userId: null,
        userType: null,
        isAuthenticated: false,
      });
    }
  }, []);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeChatAuth();
  }, [initializeChatAuth]);

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