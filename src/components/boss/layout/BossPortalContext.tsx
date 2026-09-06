'use client';

// 셸(레일·헤더)이 공유하는 부속 정보 — 회사 · 구독 상태
//
// 참조(AgentShell)의 me · entitlement 와 같은 역할이다.
// 화면 본문을 기다리게 하지 않는다 — 늦게 도착해도 레일의 플랜 카드와 헤더 태그만 채운다.
// 실패해도 본문은 그대로 둔다(본문은 자기 에러를 따로 낸다).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useBossAuth } from '@/hooks/useBossAuth';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { bossBillingApi } from '@/lib/api/boss/billing';
import type { BossCompanyData } from '@/types/boss';
import type { BossSubscriptionStatusResponse } from '@/types/boss-billing';

type PortalValue = {
  company: BossCompanyData | null;
  subscription: BossSubscriptionStatusResponse | null;
  /** 구독 상태를 다시 읽는다 — 결제·취소 화면이 부른다 */
  refreshSubscription: () => void;
};

const PortalCtx = createContext<PortalValue>({
  company: null,
  subscription: null,
  refreshSubscription: () => {},
});

/** BossChrome 안에서만 의미가 있다 — 밖에서 부르면 전부 null 이다. */
export function useBossPortal(): PortalValue {
  return useContext(PortalCtx);
}

export function BossPortalProvider({ children }: { children: ReactNode }) {
  const { bossAuth } = useBossAuth();
  const [company, setCompany] = useState<BossCompanyData | null>(null);
  const [subscription, setSubscription] = useState<BossSubscriptionStatusResponse | null>(null);
  const [tick, setTick] = useState(0);

  const companyId = bossAuth.userInfo?.companyId;
  const authed = bossAuth.isAuthenticated;

  useEffect(() => {
    if (!authed || !companyId) {
      setCompany(null);
      return;
    }
    let alive = true;
    bossCompanyApi
      .get(companyId)
      .then((res) => {
        if (!alive) return;
        setCompany(res.success !== false && res.data ? res.data : null);
      })
      .catch(() => alive && setCompany(null));
    return () => {
      alive = false;
    };
  }, [authed, companyId]);

  useEffect(() => {
    if (!authed) {
      setSubscription(null);
      return;
    }
    let alive = true;
    bossBillingApi
      .getStatus()
      .then((res) => {
        if (!alive) return;
        setSubscription(res.success !== false && res.data ? res.data : null);
      })
      .catch(() => alive && setSubscription(null));
    return () => {
      alive = false;
    };
  }, [authed, tick]);

  return (
    <PortalCtx.Provider
      value={{ company, subscription, refreshSubscription: () => setTick((n) => n + 1) }}
    >
      {children}
    </PortalCtx.Provider>
  );
}
