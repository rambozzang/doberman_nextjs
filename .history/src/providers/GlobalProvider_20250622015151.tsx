"use client";

import React from "react";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
} 