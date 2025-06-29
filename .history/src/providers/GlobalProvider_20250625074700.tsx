"use client";

import React from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";

// 자동 로그아웃 컴포넌트
function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  useAutoLogout();
  return <>{children}</>;
}

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <AutoLogoutProvider>
      {children}
    </AutoLogoutProvider>
  );
} 