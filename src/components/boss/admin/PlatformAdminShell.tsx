'use client';

// 도배르만 운영(대표 전용) 화면 껍데기 — /boss/admin 아래 모든 화면이 이 안에서 그려진다
//
//   1. 계정 범위(useBossScope)가 없으면(로그아웃 · 계정 바뀌는 중) 아무것도 그리지 않는다.
//   2. 서버에 운영자인지 묻는다(GET /platform-admin/access). 운영자라고 답하기 전에는 하위 화면을 그리지 않아 자료 요청도 없다.
//      거절(운영자 아님)과 확인 실패(서버 미반영 · 연결 실패)를 따로 말하고, 확인 실패는 다시 시도할 수 있다.
//   3. 하위 화면이 어느 요청에서든 403 을 받으면 onForbidden → 즉시 거절로 바꿔 열린 창 · 자료를 함께 닫는다(레일 메뉴도 사라진다).
//   4. 계정 범위가 바뀌면 판정을 새로 묻는 동안 내용을 감추고, 범위를 key 로 하위 화면을 새로 그려 앞 계정의 자료 · 작성값을 버린다.
// 화면에서 감추는 것은 보안이 아니다 — 모든 운영 요청은 서버가 다시 검사한다.

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useBossScope } from '@/lib/boss/bossScope';
import { BossAuthManager } from '@/lib/bossAuth';
import { checkPlatformAdminAccess, denyPlatformAdminAccess, usePlatformAdminAccess } from '@/lib/boss/platformAdminAccess';
import { AlertBanner, Button, ButtonLink, EmptyState, Skeleton } from '@/components/boss/ui';

type PlatformAdminContextValue = {
  /** 이 화면을 연 계정 범위 — 응답을 넣기 직전 · 처리 요청을 보내기 직전에 isCurrentScope 로 대조한다 */
  scope: string;
  /** 지금 로그인한 운영자 아이디 — 본인 계정 변경을 화면에서 먼저 막는 데만 쓴다(서버가 다시 막는다) */
  myUserId: string | null;
  /** 서버가 403 을 줬을 때 — 내용을 바로 닫는다 */
  onForbidden: () => void;
};

const PlatformAdminContext = createContext<PlatformAdminContextValue | null>(null);

export function usePlatformAdmin(): PlatformAdminContextValue {
  const ctx = useContext(PlatformAdminContext);
  if (!ctx) throw new Error('usePlatformAdmin 은 PlatformAdminShell 안에서만 씁니다.');
  return ctx;
}

const ADMIN_NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: '/boss/admin', label: '개요', exact: true },
  { href: '/boss/admin/members', label: '회원' },
  { href: '/boss/admin/subscriptions', label: '구독' },
  { href: '/boss/admin/payments', label: '결제' },
  { href: '/boss/admin/notices', label: '공지 · 이벤트' },
  { href: '/boss/admin/reports', label: '신고' },
  { href: '/boss/admin/inquiries', label: '문의' },
  { href: '/boss/admin/audit', label: '감사 이력' },
];

export default function PlatformAdminShell({ children }: { children: ReactNode }) {
  const scope = useBossScope();
  const access = usePlatformAdminAccess(scope);

  if (!scope || access.status === 'signed-out' || access.status === 'checking') {
    return <Skeleton className="h-64" />;
  }

  if (access.status === 'denied') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="운영자만 이용할 수 있습니다"
        description="이 계정에는 도배르만 운영 권한이 없습니다. 다른 계정으로 들어왔다면 로그아웃한 뒤 운영자 계정으로 다시 들어와 주세요."
        action={
          <ButtonLink href="/boss" variant="secondary" size="sm">
            대시보드로
          </ButtonLink>
        }
      />
    );
  }

  if (access.status === 'error') {
    const retry = (
      <Button variant="primary" size="sm" onClick={() => checkPlatformAdminAccess(scope, true)}>
        다시 확인
      </Button>
    );
    return access.failure === 'not-deployed' ? (
      <EmptyState
        icon={ShieldCheck}
        title="운영 관리 기능을 준비하고 있습니다"
        description="서버에 운영 관리 기능이 아직 반영되지 않았습니다. 반영된 뒤 다시 확인해 주세요."
        action={retry}
      />
    ) : (
      <AlertBanner tone="bad" action={retry}>
        운영자 권한을 확인하지 못했습니다. 권한이 없다는 뜻은 아닙니다. {access.message}
      </AlertBanner>
    );
  }

  return (
    <AdminScope key={scope} scope={scope}>
      {children}
    </AdminScope>
  );
}

function AdminScope({ scope, children }: { scope: string; children: ReactNode }) {
  const onForbidden = useCallback(() => denyPlatformAdminAccess(scope), [scope]);
  const value = useMemo<PlatformAdminContextValue>(
    () => ({ scope, myUserId: BossAuthManager.getUserInfo()?.userId ?? null, onForbidden }),
    [scope, onForbidden],
  );
  return (
    <PlatformAdminContext.Provider value={value}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start gap-2.5 border border-boss-primary/35 bg-boss-pill-info px-4 py-2.5 text-boss-pill-info-fg">
          <ShieldCheck size={16} strokeWidth={1.75} className="mt-[2px] shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 break-keep text-[12.5px] leading-relaxed">
            <strong className="font-semibold">도배르만 운영 화면</strong> · 여기서 바꾼 내용은 실제 회원 · 공지에 바로 반영되고, 모든 변경은
            처리자 · 사유와 함께 감사 이력에 남습니다.
          </p>
        </div>
        <AdminNav />
        {children}
      </div>
    </PlatformAdminContext.Provider>
  );
}

function AdminNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav aria-label="운영 메뉴" className="flex flex-wrap gap-1.5">
      {ADMIN_NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-[36px] items-center border px-3 py-1.5 text-[13px] transition-colors duration-[120ms] ease-out ${
              active
                ? 'border-boss-primary bg-boss-primary font-semibold !text-boss-primary-foreground'
                : 'border-boss-border bg-boss-bg !text-boss-text hover:border-boss-border-hover hover:bg-boss-hover'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
