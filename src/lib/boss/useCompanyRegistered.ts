'use client';

// 회사를 등록했는가 — 웹견적서를 보내기 전에 쓴다(2026-10-21 사장님 결정: 회사 미등록이면 보내지 못한다).
//
// 회사 미등록 사장님도 견적 요청은 전국으로 받아 본다(2026-10-18) — 보는 것은 그대로 두고 보내는 것만 막는다.
// 서버도 같은 이유로 막는다(WebRequestAnswerSvc.requireCanSendQuotation). 화면은 다 쓰고 나서 막히지 않게 먼저 알린다.
//
// 브라우저에 저장된 로그인 정보의 회사 번호가 비어 있으면 서버에 한 번 더 묻는다 —
// 앱에서 회사를 등록한 뒤 웹을 열면 저장된 값이 옛 값(0)일 수 있다. 확인되면 저장된 값도 고친다.

import { useEffect, useState } from 'react';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';

/** null = 확인 중, true = 등록함, false = 미등록 */
export function useCompanyRegistered(): boolean | null {
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const cached = BossAuthManager.getUserInfo();
    if (cached?.companyId) {
      setRegistered(true);
      return;
    }
    if (!cached?.userId) {
      setRegistered(false);
      return;
    }
    bossUserApi
      .get(cached.userId)
      .then((res) => {
        if (!alive) return;
        const companyId = res.success !== false ? res.data?.companyId : null;
        if (companyId) {
          BossAuthManager.setUserInfo({ ...cached, companyId });
          setRegistered(true);
        } else {
          setRegistered(false);
        }
      })
      .catch(() => {
        if (alive) setRegistered(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return registered;
}
