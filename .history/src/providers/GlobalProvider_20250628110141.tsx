"use client";

import React from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAuth, AuthProvider } from "@/providers/AuthProvider";
import { useClickableToast } from "@/hooks/useClickableToast";
import AutoLogoutWarning from "@/components/AutoLogoutWarning";

// 자동 로그아웃 컴포넌트
function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { showWarning, extendSession } = useAutoLogout();
  
  // 토스트 클릭으로 닫기 기능 활성화
  useClickableToast();

  return (
    <>
      {children}
      <AutoLogoutWarning
        isOpen={showWarning}
        onExtendSession={extendSession}
        onLogout={logout}
      />
    </>
  );
}

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AutoLogoutProvider>
        {children}
      </AutoLogoutProvider>
    </AuthProvider>
  );
} 