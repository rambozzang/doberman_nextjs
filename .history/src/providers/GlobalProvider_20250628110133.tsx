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