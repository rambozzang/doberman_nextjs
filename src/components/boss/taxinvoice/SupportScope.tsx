'use client';

// 발급 서비스 등록 화면 — 지원 범위(세금계산서 · 현금영수증)와 문서별 준비 상태
//
// 세금계산서: 사업자 권한 확인 → 팝빌 연동 → 공동인증서 등록이 끝나야 준비 완료.
// 현금영수증: 공동인증서를 요구하지 않는다. 준비 상태는 서버 GET /electronic/config?docType=CASH 로만 판단한다.
// 정식 오픈 값이 꺼져 있으면 준비가 끝나도 실제 발급은 열리지 않는다 — "완료"로 오해하지 않게 함께 적는다.
// 오픈 값은 문서 종류별로 본다(세금계산서 taxOpen · 현금영수증 cashOpen, 2026-10-21) — 세금계산서만 먼저 열려도 현금영수증 줄은 "곧 열립니다"로 남는다.
// 설정 조회는 권한 확인이 끝난 뒤에만 부른다(그 전에는 준비될 수 없다). 조회 실패는 "확인하지 못함"으로 둔다.

import { useEffect, useRef, useState } from 'react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { Panel, Tag, type StatusTone } from '@/components/boss/ui';
import type { ElectronicConfig, RegistrationStage } from '@/types/boss-taxinvoice';

type CashCheck = { state: 'idle' | 'loading' | 'done' | 'error'; config: ElectronicConfig | null; message: string | null };

const VERIFIED_STAGES: RegistrationStage[] = ['VERIFIED', 'NEEDS_CERTIFICATE', 'READY'];

function Row({ title, tone, tag, steps, note }: { title: string; tone: StatusTone; tag: string; steps: string; note: string }) {
  return (
    <div className="border-b border-boss-border-row py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-semibold text-boss-text">{title}</span>
        <Tag tone={tone}>{tag}</Tag>
      </div>
      <p className="mt-1 break-keep text-[12px] leading-relaxed text-boss-text-secondary">{steps}</p>
      <p className="mt-1 break-keep text-[12px] leading-relaxed text-boss-text-secondary">{note}</p>
    </div>
  );
}

export default function SupportScope({ stage, refreshKey }: { stage: RegistrationStage; refreshKey: number }) {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18). 현금영수증은 따로 연다(2026-10-21)
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const [cash, setCash] = useState<CashCheck>({ state: 'idle', config: null, message: null });
  const seq = useRef(0);
  const verified = VERIFIED_STAGES.includes(stage);

  useEffect(() => {
    if (!verified) {
      setCash({ state: 'idle', config: null, message: null });
      return;
    }
    const my = ++seq.current;
    setCash((c) => ({ ...c, state: 'loading' }));
    (async () => {
      try {
        const res = await bossTaxInvoiceApi.electronicConfig('CASH');
        if (my !== seq.current) return;
        if (res.success !== false && res.data) setCash({ state: 'done', config: res.data, message: null });
        else setCash({ state: 'error', config: null, message: res.message || res.error || '현금영수증 준비 상태를 확인하지 못했습니다.' });
      } catch {
        if (my === seq.current) setCash({ state: 'error', config: null, message: '네트워크 오류로 현금영수증 준비 상태를 확인하지 못했습니다.' });
      }
    })();
  }, [verified, refreshKey]);

  // 닫힌 종류만 꼬리말을 단다 — 한쪽만 열렸으면 "곧 열립니다", 둘 다 닫혔으면 정식 오픈 전
  const closedTail = (open: boolean, label: string) =>
    open ? '' : taxOpen || cashOpen ? ` ${label} 발급은 곧 열립니다.` : ' 정식 오픈 전이라 준비가 끝나도 실제 발급은 열리지 않습니다.';
  const taxReady = stage === 'READY';
  const taxTag = taxReady ? (taxOpen ? '준비 완료' : '준비 완료 · 오픈 전') : verified ? '등록 진행 중' : '권한 확인 전';

  let cashTag = '권한 확인 전';
  let cashTone: StatusTone = 'neutral';
  let cashNote = '사업자 권한 확인이 끝나면 준비 상태를 확인합니다.';
  if (verified) {
    if (cash.state === 'loading' || cash.state === 'idle') {
      cashTag = '확인 중';
      cashTone = 'info';
      cashNote = '서버에서 현금영수증 준비 상태를 확인하고 있습니다.';
    } else if (cash.state === 'error') {
      cashTag = '확인하지 못함';
      cashTone = 'warn';
      cashNote = `${cash.message} 위의 다시 확인을 눌러 주세요.`;
    } else if (cash.config && !cash.config.enabled) {
      cashTag = '준비 중';
      cashTone = 'neutral';
      cashNote = cash.config.reason || '현금영수증 발급 기능을 준비하고 있습니다.';
    } else if (cash.config?.ready) {
      cashTag = cashOpen ? '준비 완료' : '준비 완료 · 오픈 전';
      cashTone = 'ok';
      cashNote = `현금영수증 발급 준비가 끝났습니다.${closedTail(cashOpen, '현금영수증')}`;
    } else {
      cashTag = '준비 필요';
      cashTone = 'warn';
      cashNote = cash.config?.reason || '서비스 연동을 마쳐야 합니다.';
    }
  }
  // 한쪽만 열렸으면 닫힌 쪽 줄에는 준비 상태와 상관없이 "곧 열립니다"를 남긴다(둘 다 닫힘은 화면 맨 위 띠가 말한다)
  const oneSideOpen = taxOpen !== cashOpen;
  const cashReady = verified && cash.state === 'done' && Boolean(cash.config?.enabled && cash.config.ready);
  if (oneSideOpen && !cashOpen && !cashReady) cashNote += closedTail(false, '현금영수증');

  return (
    <Panel kicker="지원 범위" title="문서별 준비 상태">
      <Row
        title="전자세금계산서"
        tone={taxReady ? 'ok' : verified ? 'info' : 'neutral'}
        tag={taxTag}
        steps="사업자 권한 확인 → 팝빌 서비스 연동 → 공동인증서 등록"
        note={`사업자 고객에게 보내는 일반(과세) 세금계산서를 발급합니다.${taxReady || (oneSideOpen && !taxOpen) ? closedTail(taxOpen, '전자세금계산서') : ''}`}
      />
      <Row
        title="현금영수증"
        tone={cashTone}
        tag={cashTag}
        steps="사업자 권한 확인 → 팝빌 서비스 연동 (공동인증서 필요 없음)"
        note={cashNote}
      />
      <p className="mt-3 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
        취소는 도배르만에서 전자 발급한 건을 통째로(전액) 취소할 때만 됩니다. 금액 일부만 고치거나 일부만 취소하려면 홈택스에서 해 주세요.
      </p>
      {/* 자세한 범위 — 세무 용어가 많아 접어 둔다(2026-10-17) */}
      <details className="mt-2 text-[12px] leading-relaxed text-boss-text-secondary">
        <summary className="cursor-pointer select-none font-semibold text-boss-text">자세한 지원 범위</summary>
        <p className="mt-1.5 break-keep">
          세금계산서: 국세청 전송 전이면 발행취소, 전송 후면 수정세금계산서(환입 · 계약의 해제 · 착오에 의한 이중발급) 1장을 발급합니다. 일부
          반품 · 공급가액 변동 · 기재사항 정정 · 영세율 전환 수정세금계산서와 역발행 · 대량 발급은 지원하지 않습니다. 현금영수증은 승인된 건의
          전액 취소만 됩니다.
          {taxOpen && cashOpen
            ? ''
            : taxOpen
              ? ' 현금영수증 발급 · 취소는 곧 열립니다.'
              : cashOpen
                ? ' 세금계산서 발급 · 취소는 곧 열립니다.'
                : ' 발급 · 취소는 정식 오픈 후 열립니다.'}
        </p>
      </details>
    </Panel>
  );
}
