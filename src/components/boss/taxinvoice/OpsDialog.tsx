'use client';

// 운영 화면 대화상자 껍데기 — 전자 발급 · 취소 대화상자와 같은 모양(모바일은 아래에서 올라오는 전체 폭, sm 이상은 가운데).
// 요청을 보내는 중(busy)에는 닫기 · ESC · 배경 클릭을 막고, 창을 닫으려 하면 브라우저가 한 번 묻는다.
// 키보드 초점은 대화상자 안에서만 돈다(Tab · Shift+Tab). 닫히면 열기 전 초점(누른 버튼)으로 돌려준다.

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function OpsDialog({
  title,
  subtitle,
  busy = false,
  danger = false,
  wide = false,
  onClose,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  busy?: boolean;
  danger?: boolean;
  wide?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const busyRef = useRef(busy);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [busy]);

  // 열릴 때 대화상자로 초점을 옮기고, 닫힐 때 열기 전 자리로 돌려준다(키보드 · 화면 읽기 사용자)
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    return () => {
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);

  // 초점이 배경으로 빠지지 않게 — 마지막에서 Tab 이면 처음으로, 처음에서 Shift+Tab 이면 마지막으로
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && !el.closest('[hidden]'),
    );
    if (items.length === 0) {
      e.preventDefault();
      panel.current.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel.current || !panel.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  // 바깥(배경)으로 초점이 옮겨지면 대화상자로 되돌린다 — 마우스 · 보조기기로 옮겨 간 경우
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (panel.current && e.target instanceof Node && !panel.current.contains(e.target)) panel.current.focus();
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-boss-text/40" onClick={busy ? undefined : onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy || undefined}
        onKeyDown={onKeyDown}
        className={`relative flex max-h-[92dvh] w-full flex-col border bg-boss-surface shadow-boss-lg outline-none ${
          wide ? 'max-w-[760px]' : 'max-w-[560px]'
        } ${danger ? 'border-boss-error/35' : 'border-boss-border'}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-boss-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="break-keep text-[15px] font-semibold text-boss-text">{title}</p>
            {subtitle && <p className="mt-0.5 break-keep text-[12px] leading-relaxed text-boss-text-secondary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center text-boss-text-muted hover:bg-boss-hover hover:text-boss-text disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>
        <div className="boss-scroll min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-boss-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
