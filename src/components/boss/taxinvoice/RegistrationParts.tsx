// 발급 서비스 등록 화면 조각 — 진행 단계 띠 · 안내 상자 · 사업자 정보 요약
//
// Industry 규칙: 모서리 0, boss-* 토큰만, 숫자는 Barlow Condensed. 320px · 큰 글꼴에서도 줄바꿈으로 버틴다(자르지 않는다).

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { formatBizNo } from '@/lib/boss/bizno';
import { SUPPLIER_FIELDS, SUPPLIER_LABEL, formatSupplierPhone, type RegistrationStep, type StepState } from '@/lib/boss/taxInvoiceRegistration';
import type { TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

type NoteTone = 'info' | 'warn' | 'bad' | 'ok';

const NOTE_BOX: Record<NoteTone, string> = {
  info: 'border-boss-primary/35 bg-boss-pill-info text-boss-pill-info-fg',
  warn: 'border-boss-warning/35 bg-boss-pill-warn text-boss-pill-warn-fg',
  bad: 'border-boss-error/35 bg-boss-pill-bad text-boss-pill-bad-fg',
  ok: 'border-boss-success/35 bg-boss-pill-ok text-boss-pill-ok-fg',
};

/**
 * 안내 상자 — AlertBanner 와 같은 모양이지만 늘 떠 있는 설명이라 role="alert" 를 달지 않는다.
 * 상태가 바뀌어 새로 나타나는 안내만 live 로 읽힌다.
 */
export function Note({ tone = 'info', live = false, children }: { tone?: NoteTone; live?: boolean; children: ReactNode }) {
  return (
    <div
      role={live ? 'status' : undefined}
      className={`break-keep border px-4 py-3 text-[13px] leading-relaxed ${NOTE_BOX[tone]}`}
    >
      {children}
    </div>
  );
}

const STEP_BAR: Record<StepState, string> = {
  done: 'bg-boss-success',
  current: 'bg-boss-primary',
  blocked: 'bg-boss-warning',
  waiting: 'bg-boss-info',
  todo: 'bg-transparent',
};

const STEP_NUM: Record<StepState, string> = {
  done: 'text-boss-success',
  current: 'text-boss-primary',
  blocked: 'text-boss-pill-warn-fg',
  waiting: 'text-boss-pill-info-fg',
  todo: 'text-boss-text-ghost',
};

const STEP_NOTE: Record<StepState, string> = {
  done: 'text-boss-pill-ok-fg',
  current: 'font-semibold text-boss-primary',
  blocked: 'font-semibold text-boss-pill-warn-fg',
  waiting: 'font-semibold text-boss-pill-info-fg',
  todo: 'text-boss-text-muted',
};

const STEP_SR: Record<StepState, string> = {
  done: '완료한 단계',
  current: '지금 진행할 단계',
  blocked: '진행이 막힌 단계',
  waiting: '정식 오픈을 기다리는 단계',
  todo: '아직 대기 중인 단계',
};

/** 진행 단계 띠 — 1px 칸막이 격자. 좁은 화면은 세로, sm 2열, lg 5열 */
export function RegistrationProgress({ steps }: { steps: RegistrationStep[] }) {
  return (
    <ol
      id="registration-progress"
      aria-label="등록 진행 단계"
      className="grid scroll-mt-4 gap-px border border-boss-border bg-boss-border sm:grid-cols-2 lg:grid-cols-5"
    >
      {steps.map((s, i) => (
        <li
          key={s.key}
          aria-current={s.state === 'current' || s.state === 'blocked' || s.state === 'waiting' ? 'step' : undefined}
          className={`relative min-w-0 px-4 pb-3 pt-3.5 ${s.state === 'current' ? 'bg-boss-elevated' : 'bg-boss-surface'}`}
        >
          <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${STEP_BAR[s.state]}`} />
          <div className="flex items-baseline gap-2">
            <span aria-hidden className={`font-boss-head text-[15px] font-semibold tabular-nums ${STEP_NUM[s.state]}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 break-keep text-[13.5px] font-semibold text-boss-text">{s.label}</span>
          </div>
          <p className={`mt-1 flex items-center gap-1 break-keep text-[12px] ${STEP_NOTE[s.state]}`}>
            {s.state === 'done' && <Check aria-hidden size={12} strokeWidth={2.25} />}
            <span className="sr-only">{STEP_SR[s.state]}: </span>
            {s.note}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** 사업자 정보 요약 — 긴 주소 · 이메일도 자르지 않고 줄을 바꾼다. 사업자번호 · 연락처는 하이픈을 넣어 보인다 */
export function SupplierSummary({ supplier }: { supplier: TaxInvoiceSupplier }) {
  return (
    <dl>
      {SUPPLIER_FIELDS.map((f) => {
        const v = supplier[f]?.trim();
        return (
          <div
            key={f}
            className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 border-b border-boss-border-row py-2 text-[13px] last:border-b-0"
          >
            <dt className="text-boss-text-secondary">{SUPPLIER_LABEL[f]}</dt>
            <dd className="min-w-0 break-words font-semibold text-boss-text [overflow-wrap:anywhere]">
              {v ? (f === 'bizNo' ? formatBizNo(v) : f === 'phone' ? formatSupplierPhone(v) : v) : <span className="font-normal text-boss-text-muted">비어 있음</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
