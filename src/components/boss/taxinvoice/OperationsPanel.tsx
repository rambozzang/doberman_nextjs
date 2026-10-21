'use client';

// 발급 운영 상태 — 발급 서비스 등록 화면 오른쪽
//
//   안내 항목(서버가 고른 할 일) → 공동인증서(세금계산서 전용) → 구독 · 요금(2026-10-17) → 발급 비용 정책 → 자동 상태 확인
//   읽기만 한다. 충전 · 결제 · 가입 버튼은 없다. 모르는 금액 · 날짜는 "확인 전"으로 둔다.
//   refreshKey 가 바뀔 때마다(등록 화면의 다시 확인) 다시 읽는다. 늦게 온 이전 응답 · 다른 계정으로 바뀐 뒤 온 응답은 버린다.
//   서버 안내 중 '정식 오픈 준비 중'(LAUNCH_PENDING)은 등록 화면 맨 위 띠가 이미 말하므로 여기서는 빼고(2026-10-21 — 한 화면에 네 번),
//   자동 상태 확인은 세금계산서 · 현금영수증 중 하나라도 열리면 켜진 것으로 본다(문서 종류별 오픈 값 · 2026-10-21).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { bossTaxInvoiceApi, type OpsCall } from '@/lib/api/boss/taxinvoice';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { isCurrentScope } from '@/lib/boss/bossScope';
import {
  ISSUE_ACTION_LABEL,
  SEVERITY_TONE,
  autoSyncView,
  billingView,
  certificateView,
  issueHref,
} from '@/lib/boss/taxInvoiceOps';
import {
  TAX_SUBSCRIPTION_CASH_ONLY,
  TAX_SUBSCRIPTION_FREE_USES,
  TAX_SUBSCRIPTION_POLICY,
  TAX_SUBSCRIPTION_WHERE,
  subscriptionView,
} from '@/lib/boss/taxInvoiceSubscription';
import type { ElectronicOperations, RegistrationStage, TaxInvoiceSubscriptionStatus } from '@/types/boss-taxinvoice';
import { Panel, Skeleton, Tag, type StatusTone } from '@/components/boss/ui';
import { Note } from './RegistrationParts';

type Load = { state: 'loading' } | { state: 'done'; data: ElectronicOperations } | { state: 'error'; result: Exclude<OpsCall<ElectronicOperations>, { ok: true }> };

function Block({ id, title, tone, tag, children }: { id?: string; title: string; tone: StatusTone; tag: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 border-b border-boss-border-row py-3 first:pt-0 last:border-b-0 last:pb-0" aria-label={title}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="break-keep text-[13.5px] font-semibold text-boss-text">{title}</h4>
        <Tag tone={tone}>{tag}</Tag>
      </div>
      <div className="mt-1.5 flex flex-col gap-1.5 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <dl className="mt-0.5">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-boss-border-row py-1.5 text-[12.5px] last:border-b-0">
          <dt className="text-boss-text-secondary">{r.label}</dt>
          <dd className="min-w-0 break-words text-right font-semibold text-boss-text [overflow-wrap:anywhere]">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 구독 · 요금 — 서버가 정한 상태(무료 남은 날 · 구독 중 · 구독 필요)와 정책 한 줄. 결제는 앱에서만 한다 */
function SubscriptionBlock({ status }: { status: TaxInvoiceSubscriptionStatus | null | undefined }) {
  if (status === undefined) {
    return (
      <Block id="subscription" title="구독 · 요금" tone="neutral" tag="확인 중">
        <Skeleton className="h-10" />
      </Block>
    );
  }
  const view = subscriptionView(status);
  const reason = status?.reason;
  const subscribed = reason === 'SUBSCRIBED' || reason === 'NOT_REQUIRED';
  // 상태 문장에 요금이 이미 들어 있는 경우(무료 · 구독 필요)는 정책 문장을 되풀이하지 않는다
  const known = reason === 'FREE_NOT_STARTED' || reason === 'FREE_PERIOD' || reason === 'SUBSCRIPTION_REQUIRED';
  return (
    <Block id="subscription" title="구독 · 요금" tone={view.tone} tag={view.tag}>
      <p className={view.needsSubscription ? 'font-semibold text-boss-pill-warn-fg' : 'text-boss-text'}>
        {status ? view.text : '구독 상태를 확인하지 못했습니다. 위의 다시 확인을 눌러 주세요.'}
      </p>
      {!subscribed && !known && <p>{TAX_SUBSCRIPTION_POLICY}</p>}
      {!subscribed && (
        <>
          {/* 현금영수증만 쓰는 사장님은 인증서를 등록하지 않는다 — 무료 시작일을 따로 알린다(2026-10-21) */}
          <p>{TAX_SUBSCRIPTION_CASH_ONLY}</p>
          <p>{TAX_SUBSCRIPTION_WHERE}</p>
          <p className="text-[12px]">{TAX_SUBSCRIPTION_FREE_USES}</p>
        </>
      )}
    </Block>
  );
}

/**
 * scope — 이 화면을 연 계정(부모가 계정이 바뀌면 key 로 새로 그린다)
 * stage — 등록 단계. 인증서 등록(4단계) 전이면 인증서 칸을 "확인하지 못함" 대신 "아직 등록 전"으로 쓴다
 */
export default function OperationsPanel({ refreshKey, scope, stage }: { refreshKey: number; scope: string; stage?: RegistrationStage | null }) {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18). 현금영수증은 따로 연다(2026-10-21)
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  // 구독 상태 — 따로 읽는다(못 읽어도 운영 상태는 그대로 보인다). undefined: 읽는 중 · null: 못 읽음
  const [subscription, setSubscription] = useState<TaxInvoiceSubscriptionStatus | null | undefined>(undefined);
  const seq = useRef(0);

  useEffect(() => {
    const my = ++seq.current;
    // 이미 받은 내용이 있으면 그대로 두고 새로 읽는다(깜빡임 없이)
    setLoad((l) => (l.state === 'done' ? l : { state: 'loading' }));
    void bossTaxInvoiceApi.operations().then((r) => {
      if (my !== seq.current || !isCurrentScope(scope)) return;
      setLoad(r.ok ? { state: 'done', data: r.data } : { state: 'error', result: r });
    });
    bossTaxInvoiceApi
      .electronicSubscription()
      .then((r) => {
        if (my !== seq.current || !isCurrentScope(scope)) return;
        setSubscription(r.success !== false && r.data ? r.data : null);
      })
      .catch(() => {
        if (my === seq.current && isCurrentScope(scope)) setSubscription(null);
      });
    return () => {
      seq.current += 1;
    };
  }, [refreshKey, scope]);

  if (load.state === 'loading') {
    return (
      <Panel kicker="운영 상태" title="발급 운영 준비">
        <Skeleton className="h-40" />
      </Panel>
    );
  }
  if (load.state === 'error') {
    const notDeployed = load.result.failure === 'not-deployed';
    return (
      <Panel kicker="운영 상태" title="발급 운영 준비">
        <Note tone={notDeployed ? 'info' : 'warn'}>
          {notDeployed
            ? '인증서 만료 · 발급 비용 · 자동 상태 확인 안내를 준비하고 있습니다. 등록 단계는 왼쪽에서 그대로 진행할 수 있습니다.'
            : `${load.result.message} 위의 다시 확인을 눌러 주세요.`}
        </Note>
      </Panel>
    );
  }

  const { data } = load;
  const cert = certificateView(data.certificate, stage);
  const bill = billingView(data.billing);
  const sync = autoSyncView(data.autoSync, taxOpen || cashOpen);
  const issues = data.issues.filter((i) => i.code !== 'LAUNCH_PENDING');

  return (
    <Panel kicker="운영 상태" title="발급 운영 준비">
      {issues.length > 0 && (
        <ul aria-label="확인할 안내" className="mb-3 flex flex-col gap-2">
          {issues.map((issue, i) => {
            const href = issueHref(issue);
            return (
              <li key={`${issue.code}-${i}`} className="border border-boss-border bg-boss-bg px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={SEVERITY_TONE[issue.severity]}>{issue.severity === 'ERROR' ? '조치 필요' : issue.severity === 'WARNING' ? '확인 필요' : '안내'}</Tag>
                  <span className="min-w-0 break-keep text-[13px] font-semibold text-boss-text">{issue.title || issue.message}</span>
                </div>
                {issue.title && issue.message && <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">{issue.message}</p>}
                {href && (
                  <Link href={href} className="boss-touch-link mt-1.5 inline-block text-[12.5px] font-semibold text-boss-primary hover:underline">
                    {issue.invoiceId != null ? '문서 보기' : ISSUE_ACTION_LABEL[issue.action]}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Block id="certificate" title="공동인증서 (세금계산서)" tone={cert.tone} tag={cert.tag}>
        <p>{cert.text}</p>
        <p className="text-[12px] text-boss-text-secondary">현금영수증은 공동인증서 없이 발급합니다.</p>
      </Block>

      <SubscriptionBlock status={subscription} />

      <Block id="billing" title="발급 비용" tone={bill.tone} tag={bill.tag}>
        {bill.title !== bill.tag && <p className="font-semibold text-boss-text">{bill.title}</p>}
        {bill.lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
        <Rows rows={bill.rows} />
        {bill.error && <p className="text-boss-pill-warn-fg">잔액 · 비용을 확인하지 못했습니다: {bill.error}</p>}
        {bill.checkedAt && <p className="text-[12px] text-boss-text-secondary">확인 시각 {bill.checkedAt}</p>}
      </Block>

      <Block title="자동 상태 확인" tone={sync.tone} tag={sync.tag}>
        <p>{sync.text}</p>
        <Rows rows={sync.rows} />
      </Block>
    </Panel>
  );
}
