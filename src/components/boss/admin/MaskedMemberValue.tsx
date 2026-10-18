'use client';

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { MemberRevealSession, type MemberPrivateField, type MemberRevealState } from '@/lib/boss/memberPrivacy';
import { usePlatformAdmin } from './PlatformAdminShell';

const RevealContext = createContext<{ session: MemberRevealSession; state: MemberRevealState } | null>(null);

export function MemberPrivacyProvider({ children }: { children: ReactNode }) {
  const { scope, onForbidden } = usePlatformAdmin();
  const [state, setState] = useState<MemberRevealState>(null);
  const [session] = useState(() => new MemberRevealSession({
    current: () => isCurrentScope(scope) && document.visibilityState !== 'hidden',
    send: platformAdminApi.revealMemberField,
    change: setState,
    forbidden: onForbidden,
  }));

  useEffect(() => {
    const clear = () => session.hide();
    const visibility = () => { if (document.visibilityState !== 'visible') clear(); };
    window.addEventListener('blur', clear);
    window.addEventListener('pagehide', clear);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', clear);
      window.removeEventListener('pagehide', clear);
      document.removeEventListener('visibilitychange', visibility);
      clear();
    };
  }, [session]);

  return <RevealContext.Provider value={{ session, state: isCurrentScope(scope) ? state : null }}>{children}</RevealContext.Provider>;
}

/** title/data-* 속성에도 원본을 두지 않는다. 마스킹된 문자열만 처음 렌더링한다. */
export function MaskedMemberValue({ memberId, field, masked, label }: {
  memberId: number; field: MemberPrivateField; masked: string | null; label: string;
}) {
  const context = useContext(RevealContext);
  const instance = useId();
  const key = `${memberId}:${field}:${instance}`;
  const session = context?.session;
  const active = context?.state?.key === key ? context.state : null;
  useEffect(() => () => session?.hide(key), [session, key]);

  if (!masked) return <span className="text-boss-text-muted">-</span>;
  return (
    <span className="inline-flex min-w-0 flex-col items-start">
      <button
        type="button"
        aria-label={`${label} 잠깐 확인 (회원 ${memberId})`}
        aria-busy={active?.loading || undefined}
        className="min-h-7 max-w-full cursor-help break-all rounded-sm border-b border-dotted border-boss-text-muted/50 text-left text-inherit outline-none transition-colors hover:border-boss-primary hover:text-boss-primary focus-visible:ring-2 focus-visible:ring-boss-primary focus-visible:ring-offset-2 focus-visible:ring-offset-boss-bg"
        onMouseEnter={() => session?.show(key, memberId, field)}
        onMouseLeave={() => session?.hide(key)}
        onFocus={() => session?.show(key, memberId, field)}
        onBlur={() => session?.hide(key)}
        onClick={() => session?.show(key, memberId, field)}
        onKeyDown={(event) => { if (event.key === 'Escape') session?.hide(key); }}
      >
        {active?.revealed ? active.value || '등록된 정보 없음' : masked}
      </button>
      <span role="status" className="max-w-64 break-keep text-[11px] font-normal leading-snug text-boss-text-muted">
        {active?.loading ? '확인 중…' : active?.error || (active?.revealed ? '잠시 후 다시 가려집니다' : '')}
      </span>
    </span>
  );
}
