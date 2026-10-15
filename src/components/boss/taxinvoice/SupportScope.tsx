'use client';

// 발급 서비스 등록 화면 — 지원 범위(세금계산서 · 현금영수증)와 문서별 준비 상태
//
// 세금계산서: 사업자 권한 확인 → 팝빌 연동 → 공동인증서 등록이 끝나야 준비 완료.
// 현금영수증: 공동인증서를 요구하지 않는다. 준비 상태는 서버 GET /electronic/config?docType=CASH 로만 판단한다.
// 정식 오픈 값이 꺼져 있으면 준비가 끝나도 실제 발급은 열리지 않는다 — "완료"로 오해하지 않게 함께 적는다.
// 설정 조회는 권한 확인이 끝난 뒤에만 부른다(그 전에는 준비될 수 없다). 조회 실패는 "확인하지 못함"으로 둔다.

import { useEffect, useRef, useState } from 'react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
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
      <p className="mt-1 break-keep text-[12px] leading-relaxed text-boss-text-muted">{note}</p>
    </div>
  );
}

export default function SupportScope({ stage, refreshKey }: { stage: RegistrationStage; refreshKey: number }) {
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

  const closed = ELECTRONIC_TAX_INVOICE_OPEN ? '' : ' 정식 오픈 전이라 준비가 끝나도 실제 발급은 열리지 않습니다.';
  const taxReady = stage === 'READY';
  const taxTag = taxReady ? (ELECTRONIC_TAX_INVOICE_OPEN ? '준비 완료' : '준비 완료 · 오픈 전') : verified ? '등록 진행 중' : '권한 확인 전';

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
      cashTag = ELECTRONIC_TAX_INVOICE_OPEN ? '준비 완료' : '준비 완료 · 오픈 전';
      cashTone = 'ok';
      cashNote = `서버 확인 결과 현금영수증 발급 준비가 끝났습니다.${closed}`;
    } else {
      cashTag = '준비 필요';
      cashTone = 'warn';
      cashNote = cash.config?.reason || '서비스 연동을 마쳐야 합니다.';
    }
  }

  return (
    <Panel kicker="지원 범위" title="문서별 준비 상태">
      <Row
        title="전자세금계산서"
        tone={taxReady ? 'ok' : verified ? 'info' : 'neutral'}
        tag={taxTag}
        steps="사업자 권한 확인 → 팝빌 서비스 연동 → 공동인증서 등록"
        note={`일반 과세 정발행만 지원합니다.${taxReady ? closed : ''}`}
      />
      <Row
        title="현금영수증"
        tone={cashTone}
        tag={cashTag}
        steps="사업자 권한 확인 → 팝빌 서비스 연동 (공동인증서 필요 없음)"
        note={cashNote}
      />
      <p className="mt-3 break-keep text-[11.5px] leading-relaxed text-boss-text-muted">
        세금계산서 취소는 도배르만에서 전자 발급한 건의 전액만 됩니다 — 국세청 전송 전이면 발행취소, 전송 후면 수정세금계산서(환입 · 계약의
        해제 · 착오에 의한 이중발급) 1장. 일부 반품 · 공급가액 변동 · 기재사항 정정 · 영세율 전환 수정세금계산서와 역발행 · 대량 발급은 지원하지
        않습니다. 현금영수증 취소는 승인된 건의 전액 취소만 됩니다.{ELECTRONIC_TAX_INVOICE_OPEN ? '' : ' 발급 · 취소는 정식 오픈 후 열립니다.'}
      </p>
    </Panel>
  );
}
