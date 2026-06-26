'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type BossTheme = 'light' | 'dark' | 'system';

interface BossThemeContextValue {
  theme: BossTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: BossTheme) => void;
  toggleTheme: () => void;
}

const BossThemeContext = createContext<BossThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'boss-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function BossThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BossTheme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as BossTheme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (mounted ? getSystemTheme() : 'dark') : theme;

  const setTheme = (next: BossTheme) => {
    setThemeState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <BossThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      <div className={resolvedTheme === 'dark' ? 'dark' : ''}>{children}</div>
    </BossThemeContext.Provider>
  );
}

export function useBossTheme() {
  const ctx = useContext(BossThemeContext);
  if (!ctx) throw new Error('useBossTheme must be used within BossThemeProvider');
  return ctx;
}
