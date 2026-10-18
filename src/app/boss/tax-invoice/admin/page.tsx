'use client';

// 전자 발급 운영 관리 — 운영자 전용
//
// 들어오면 먼저 서버에 운영자인지 묻는다(GET /taxinvoices/admin/access). 운영자가 아니면 아무 자료도 부르지 않는다.
// 탭: 신청 심사(승인 · 반려) / 문제 문서(상태 조회 · 이력) / 처리 이력. 고른 탭만 그 자료를 부른다.
// 화면에서 감추는 것은 보안이 아니다 — 모든 요청은 서버가 다시 검사하고, 권한이 없다는 답을 받으면 바로 내용을 닫는다.
// 계정이 바뀌면(공용 PC) 화면을 새로 그려 앞 계정의 내용을 버린다. 화면 제목은 셸 헤더(nav.ts PAGE_META)가 그린다.

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { bossTaxInvoiceApi, forgetTaxInvoiceAdminAccess, type OpsFailure } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { useElectronicTaxInvoiceOpen } from '@/lib/boss/electronicTaxInvoiceLaunch';
import AdminReview from '@/components/boss/taxinvoice/AdminReview';
import AdminProblems, { AdminHistory } from '@/components/boss/taxinvoice/AdminProblems';
import { Note } from '@/components/boss/taxinvoice/RegistrationParts';
import { AlertBanner, Button, ButtonLink, EmptyState, ListTabs, Skeleton } from '@/components/boss/ui';

type Tab = 'registrations' | 'problems' | 'history';
type Access = { state: 'checking' } | { state: 'admin' } | { state: 'denied' } | { state: 'error'; failure: OpsFailure; message: string };

const TABS: { key: Tab; label: string }[] = [
  { key: 'registrations', label: '신청 심사' },
  { key: 'problems', label: '문제 문서' },
  { key: 'history', label: '처리 이력' },
];

export default function TaxInvoiceAdminPage() {
  const scope = useBossScope();
  // 로그인 확인 전 · 로그아웃 · 계정 바뀌는 중에는 내용을 그리지 않는다
  if (!scope) return <Skeleton className="h-64" />;
  return <AdminConsole key={scope} scope={scope} />;
}

function AdminConsole({ scope }: { scope: string }) {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18)
  const issuanceOpen = useElectronicTaxInvoiceOpen();
  const [access, setAccess] = useState<Access>({ state: 'checking' });
  const [tab, setTab] = useState<Tab>('registrations');

  const check = useCallback(async () => {
    setAccess({ state: 'checking' });
    const r = await bossTaxInvoiceApi.adminAccess(scope);
    if (!isCurrentScope(scope)) return;
    if (r.ok) setAccess(r.data.isAdmin ? { state: 'admin' } : { state: 'denied' });
    else if (r.failure === 'forbidden') setAccess({ state: 'denied' });
    else setAccess({ state: 'error', failure: r.failure, message: r.message });
  }, [scope]);

  useEffect(() => {
    void check();
  }, [check]);

  const onForbidden = useCallback(() => {
    forgetTaxInvoiceAdminAccess();
    setAccess({ state: 'denied' });
  }, []);

  if (access.state === 'checking') return <Skeleton className="h-64" />;
  if (access.state === 'denied') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="운영자만 볼 수 있는 화면입니다"
        description="이 계정에는 운영 관리 권한이 없습니다. 세금계산서 목록으로 돌아가 주세요."
        action={
          <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">
            세금계산서 목록
          </ButtonLink>
        }
      />
    );
  }
  if (access.state === 'error') {
    return access.failure === 'not-deployed' ? (
      <EmptyState title="운영 관리 화면을 준비하고 있습니다" description="기능이 열리면 이 화면에서 신청 심사와 문서 상태 확인을 할 수 있습니다." />
    ) : (
      <AlertBanner
        tone="bad"
        action={
          <Button variant="primary" size="sm" onClick={() => void check()}>
            다시 시도
          </Button>
        }
      >
        운영자 권한을 확인하지 못했습니다. {access.message}
      </AlertBanner>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!issuanceOpen && (
        <Note tone="info">정식 오픈 전입니다. 승인해도 실제 발급은 열리지 않고, 문서 상태 조회는 막힐 수 있습니다.</Note>
      )}
      <ListTabs ariaLabel="운영 관리" tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'registrations' && <AdminReview scope={scope} onForbidden={onForbidden} />}
      {tab === 'problems' && <AdminProblems scope={scope} onForbidden={onForbidden} />}
      {tab === 'history' && <AdminHistory scope={scope} onForbidden={onForbidden} />}
    </div>
  );
}
