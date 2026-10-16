'use client';

// 세금계산서 목록 위 — 운영 관리 진입. 서버가 운영자라고 답했을 때만 보인다(화면 쪽 목록으로 판정하지 않는다).
// 아니거나 · 모르거나 · 아직 없는 기능이면 아무것도 그리지 않는다. 화면 표시일 뿐, 막는 것은 서버다.

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { ButtonLink } from '@/components/boss/ui';

export default function AdminEntry({ scope }: { scope: string }) {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    void bossTaxInvoiceApi.adminAccess(scope).then((r) => {
      if (alive && isCurrentScope(scope)) setAdmin(r.ok && r.data.isAdmin);
    });
    return () => {
      alive = false;
    };
  }, [scope]);

  if (!admin) return null;
  return (
    <ButtonLink href="/boss/tax-invoice/admin" variant="secondary" size="sm" icon={ShieldCheck}>
      운영 관리
    </ButtonLink>
  );
}
