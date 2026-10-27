'use client';

// 세금계산서 첫 화면 — 작성 단추 아래 '지금 할 일' 한 칸 (2026-10-27) · 앱 TaxHomeStatus 와 같은 규칙(taxHomePhase)
//
// 사장님 요청: "승인 전에는 그 화면, 승인 나면 승인 관련 내용은 모두 없애고 바로 전자세금계산서 · 현금영수증을 쓰기 편하게.
// 지금은 너무 많이 들어가 헷갈린다." 예전엔 준비를 마친 뒤에도 '발급 서비스' 안내 · 요금 · 등록 단추가 늘 위에 있었다.
//   시작 전 → '전자 발급 시작하기' · 반려 → 사유와 '고쳐서 다시 신청' · 확인 중 → 한 칸 안내 · 팝빌/인증서 남음 → '이어서 하기'
//   준비 끝 → 아무것도 그리지 않는다(공동인증서 만료가 다가올 때만 한 줄)
// 단계별 화면은 /boss/tax-invoice/start, 인증서 · 구독 관리는 한 화면 등록 화면(/registration)이다.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Hourglass, RefreshCw } from 'lucide-react';
import { ButtonLink } from '@/components/boss/ui';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { daysUntil } from '@/lib/boss/taxInvoiceRegistration';
import { taxHomePhase } from '@/lib/boss/taxSetupFlow';
import type { ElectronicRegistrationStatus } from '@/types/boss-taxinvoice';

const START = '/boss/tax-invoice/start';

export default function RegistrationEntry() {
  const scope = useBossScope();
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const [status, setStatus] = useState<ElectronicRegistrationStatus | null>(null);
  const [cashReady, setCashReady] = useState(false);
  const [certExpiresAt, setCertExpiresAt] = useState<string | null>(null);
  // 처음 읽기가 끝나기 전에는 아무것도 그리지 않는다 — 준비 끝난 사장님에게 안내가 잠깐 보였다 사라지지 않게
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!scope) return;
    setLoading(true);
    try {
      const r = await bossTaxInvoiceApi.registrationStatus();
      if (!isCurrentScope(scope)) return;
      // 못 읽었으면 마지막으로 읽은 상태를 그대로 둔다
      if (r.ok) {
        setStatus(r.status);
        if (r.status.stage === 'NEEDS_CERTIFICATE' || r.status.stage === 'READY') {
          const cash = await bossTaxInvoiceApi.electronicConfig('CASH').catch(() => null);
          if (!isCurrentScope(scope)) return;
          setCashReady(!!(cash?.success && cash.data?.ready));
        }
        setCertExpiresAt(r.status.certificateExpiresAt ?? null);
      }
    } finally {
      if (isCurrentScope(scope)) {
        setChecked(true);
        setLoading(false);
      }
    }
  }, [scope]);

  useEffect(() => {
    setStatus(null);
    setChecked(false);
    void load();
    // 팝빌 인증서 창 · 다른 탭에서 돌아오면 다시 읽는다(승인 · 인증서 등록을 바로 반영)
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  if (!scope || !checked) return null;
  const phase = taxHomePhase(status, cashReady);

  switch (phase) {
    case 'unknown':
      return (
        <Line icon={<RefreshCw size={16} strokeWidth={1.75} aria-hidden />} text="전자 발급 준비 상태를 확인하지 못했어요.">
          <button type="button" className="font-semibold text-boss-primary" disabled={loading} onClick={() => void load()}>
            {loading ? '확인 중…' : '다시 확인'}
          </button>
        </Line>
      );
    case 'start':
      return (
        <Card
          title="전자 발급, 화면이 시키는 대로만 하면 돼요"
          body="사업자 정보 확인 → 도배르만 확인 → 팝빌 계정 만들기 → (세금계산서만) 공동인증서. 처음 한 번만 하면 돼요."
          action={{ href: START, label: '전자 발급 시작하기' }}
        />
      );
    case 'rejected':
      return (
        <Card
          tone="bad"
          title="신청이 반려됐어요"
          body={`${status?.reviewReason?.trim() ? `사유: ${status.reviewReason.trim()}\n` : ''}사유에 맞게 고쳐 다시 신청해 주세요.`}
          action={{ href: START, label: '고쳐서 다시 신청' }}
        />
      );
    case 'pending':
      return (
        <Card
          tone="wait"
          icon={<Hourglass size={17} strokeWidth={1.75} aria-hidden />}
          title="신청을 확인하고 있어요"
          body="확인이 끝나면 알림으로 알려 드려요. 그동안에도 작성 · 서식 미리보기 · PDF는 그대로 쓸 수 있어요."
          link={{ href: START, label: '신청 내용 보기' }}
        />
      );
    case 'preparing':
      return (
        <Card
          tone="wait"
          icon={<Hourglass size={17} strokeWidth={1.75} aria-hidden />}
          title="발급 연결을 준비하고 있어요"
          body="사업자 확인은 끝났어요. 도배르만이 발급 연결을 마치면 알려 드려요."
        />
      );
    case 'continueLink':
      return (
        <Card
          title="확인이 끝났어요. 한 단계만 하면 돼요"
          body="발급용 팝빌 계정을 만들어요. 아이디 · 비밀번호만 정하면 돼요."
          action={{ href: START, label: '이어서 하기' }}
        />
      );
    case 'continueCert':
      return (
        <Card
          title="마지막 한 단계, 공동인증서 등록"
          body="세금계산서 전자 발급에 쓰는 사업자용 공동인증서를 등록해요. 현금영수증만 쓰시면 인증서 없이도 돼요."
          action={{ href: START, label: '이어서 하기' }}
        />
      );
    case 'readyCash':
      return (
        <Line
          icon={<CheckCircle2 size={16} strokeWidth={1.75} className="text-boss-success" aria-hidden />}
          text={
            cashOpen
              ? '현금영수증은 바로 발급할 수 있어요. 세금계산서 전자 발급은 공동인증서를 등록하면 열려요.'
              : '현금영수증 발급은 곧 열려요. 세금계산서 전자 발급은 공동인증서를 등록하면 열려요.'
          }
        >
          <Link href={START} className="font-semibold text-boss-primary">
            인증서 등록
          </Link>
        </Line>
      );
    case 'ready': {
      // 준비 끝 — 등록 · 승인 이야기는 보이지 않는다. 인증서 만료가 다가올 때만 한 줄
      const left = daysUntil(certExpiresAt);
      if (!taxOpen && !cashOpen) {
        return <Line icon={<CheckCircle2 size={16} strokeWidth={1.75} className="text-boss-success" aria-hidden />} text="등록 준비를 마쳤어요. 정식 오픈하면 바로 발급할 수 있어요." />;
      }
      if (left === null || left > 30) return null;
      return (
        <Line
          warn
          icon={<AlertTriangle size={16} strokeWidth={1.75} aria-hidden />}
          text={
            left < 0
              ? `공동인증서가 만료됐어요(${certExpiresAt?.slice(0, 10)}). 새 인증서를 등록해야 세금계산서를 발급할 수 있어요.`
              : `공동인증서가 곧 만료돼요(${certExpiresAt?.slice(0, 10)}까지). 미리 갱신해 두세요.`
          }
        >
          <Link href="/boss/tax-invoice/registration" className="font-semibold text-boss-primary">
            {left < 0 ? '새로 등록' : '갱신'}
          </Link>
        </Line>
      );
    }
  }
}

/** 할 일 카드 — 제목 · 한두 줄 설명 · 큰 단추 하나 */
function Card({
  title,
  body,
  action,
  link,
  icon,
  tone = 'normal',
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  link?: { href: string; label: string };
  icon?: React.ReactNode;
  tone?: 'normal' | 'wait' | 'bad';
}) {
  const box =
    tone === 'bad'
      ? 'border-boss-error/40 bg-boss-error/5'
      : tone === 'wait'
        ? 'border-boss-border bg-boss-surface'
        : 'border-boss-primary/30 bg-boss-primary/5';
  return (
    <section className={`flex flex-wrap items-center gap-x-6 gap-y-3 border px-5 py-4 ${box}`} aria-label={title}>
      <div className="min-w-0 flex-1 basis-[260px]">
        <h2 className="flex items-center gap-2 break-keep text-[16px] font-semibold text-boss-text">
          {icon}
          {title}
        </h2>
        <p className="mt-1 whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-boss-text-secondary">{body}</p>
        {link && (
          <Link href={link.href} className="mt-2 inline-block text-[13px] text-boss-text-secondary underline">
            {link.label}
          </Link>
        )}
      </div>
      {action && (
        <ButtonLink href={action.href} variant={tone === 'bad' ? 'danger' : 'primary'} className="min-h-[44px] w-full sm:w-auto">
          {action.label}
        </ButtonLink>
      )}
    </section>
  );
}

/** 한 줄 알림 — 거의 끝났을 때 · 인증서 만료 · 확인 실패 */
function Line({ icon, text, warn = false, children }: { icon: React.ReactNode; text: string; warn?: boolean; children?: React.ReactNode }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-2.5 text-[13px] ${
        warn ? 'border-boss-warning/40 bg-boss-warning/10 text-boss-text' : 'border-boss-border bg-boss-surface text-boss-text'
      }`}
    >
      <span className="flex min-w-0 flex-1 items-start gap-2 break-keep leading-relaxed">
        <span className="mt-[2px] flex-none">{icon}</span>
        {text}
      </span>
      {children}
    </div>
  );
}
