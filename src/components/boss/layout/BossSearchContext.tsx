'use client';

// 상단바 전역 검색 — 시안의 `⌕ 검색 [/]` 필드를 실제로 동작시키기 위한 컨텍스트
//
// 시안은 상단바에 검색 필드를 상시 두지만, 검색 대상이 없는 화면에서 죽은 UI가 되면 안 된다.
// 그래서 페이지가 useBossSearch(placeholder) 로 등록한 경우에만 상단바에 필드를 렌더링한다.
//
// 키보드: `/` 로 포커스 (시안 KEYBOARD 원칙)

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { usePathname } from 'next/navigation';

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
  placeholder: string | null;
  setPlaceholder: (p: string | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const BossSearchCtx = createContext<Ctx | null>(null);

export function BossSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 화면을 옮기면 검색어를 비운다
  useEffect(() => {
    setQuery('');
  }, [pathname]);

  // `/` 로 검색 포커스 — 입력 중일 때는 가로채지 않는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      if (!inputRef.current) return;
      e.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(
    () => ({ query, setQuery, placeholder, setPlaceholder, inputRef }),
    [query, placeholder]
  );

  return <BossSearchCtx.Provider value={value}>{children}</BossSearchCtx.Provider>;
}

/** 상단바(BossHeader)에서만 사용 */
export function useBossSearchBar(): Ctx | null {
  return useContext(BossSearchCtx);
}

/**
 * 페이지에서 상단바 검색을 사용한다고 선언한다.
 * @example const { query } = useBossSearch('고객명 · 전화 · 주소');
 */
export function useBossSearch(placeholder: string) {
  const ctx = useContext(BossSearchCtx);
  const setPlaceholder = ctx?.setPlaceholder;

  useEffect(() => {
    if (!setPlaceholder) return;
    setPlaceholder(placeholder);
    return () => setPlaceholder(null);
  }, [placeholder, setPlaceholder]);

  const setQuery = useCallback((q: string) => ctx?.setQuery(q), [ctx]);
  return { query: ctx?.query ?? '', setQuery };
}

/**
 * ⌘↵ / Ctrl+↵ 단축키 — 저장·전송 확정용 (시안 KEYBOARD 원칙)
 * @param enabled false 면 등록하지 않는다 (예: 저장 불가 상태)
 */
export function useSubmitHotkey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handler();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}

/**
 * J / K 로 목록 위아래 이동 (시안 KEYBOARD 원칙)
 * 입력 중에는 동작하지 않는다.
 */
export function useListNavHotkeys({
  count,
  index,
  onIndexChange,
  enabled = true,
}: {
  count: number;
  index: number;
  onIndexChange: (next: number) => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || count === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'j') {
        e.preventDefault();
        onIndexChange(Math.min(index + 1, count - 1));
      } else if (k === 'k') {
        e.preventDefault();
        onIndexChange(Math.max(index - 1, 0));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [count, index, onIndexChange, enabled]);
}
