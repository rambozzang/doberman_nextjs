'use client';

// 처리 이력 — 발급 · 상태 확인 · 취소 · 심사가 언제 누구에 의해 어떻게 됐는지
//
//   HistoryBrowser — 쪽 넘김 · 새로고침 · 빈 상태 · 오류를 갖춘 목록(불러오는 함수만 바꿔 쓴다)
//   InvoiceHistoryPanel — 문서 상세: 열었을 때만 불러온다(그 전에는 아무것도 부르지 않는다)
//   대행사 원문 · 식별번호는 서버가 담지 않는다. 처리 종류 · 결과 코드는 쉬운 말로 바꿔 보인다.
//   권한 없음(403)이면 받아 둔 이력을 지우고 onForbidden 으로 알린다. 일반 연결 실패만 마지막 이력을 남긴다.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi, type OpsCall } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { formatOpsDateTime, historyActionLabel, historyOutcome, totalPages } from '@/lib/boss/taxInvoiceOps';
import type { TaxInvoiceHistoryItem, TaxInvoiceHistoryPage } from '@/types/boss-taxinvoice';
import { Button, Pagination, Panel, RowSkeleton, Tag } from '@/components/boss/ui';
import { Note } from './RegistrationParts';

export function HistoryRows({ items, extra }: { items: TaxInvoiceHistoryItem[]; extra?: (h: TaxInvoiceHistoryItem) => ReactNode }) {
  return (
    <ol className="flex flex-col">
      {items.map((h) => {
        const outcome = historyOutcome(h.outcome);
        return (
          <li key={h.id} className="border-b border-boss-border-row py-2.5 last:border-b-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">{formatOpsDateTime(h.createdAt) ?? '시각 확인 전'}</span>
              <span className="break-keep text-[13px] font-semibold text-boss-text">{historyActionLabel(h.action)}</span>
              <Tag tone={outcome.tone}>{outcome.label}</Tag>
              {h.actorLabel && <span className="break-keep text-[12px] text-boss-text-secondary">{h.actorLabel}</span>}
            </div>
            {h.message && <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary [overflow-wrap:anywhere]">{h.message}</p>}
            {extra?.(h)}
          </li>
        );
      })}
    </ol>
  );
}

export function HistoryBrowser({
  scope,
  load,
  size = 20,
  empty,
  extra,
  reloadKey = 0,
  onForbidden,
}: {
  /** 이 목록을 연 계정 — 다른 계정으로 바뀐 뒤 온 응답은 넣지 않는다 */
  scope: string;
  /** 권한 없음 응답 — 운영자 화면은 권한이 취소된 것으로 보고 화면을 닫는다 */
  onForbidden?: () => void;
  load: (page: number, size: number) => Promise<OpsCall<TaxInvoiceHistoryPage>>;
  size?: number;
  empty: string;
  extra?: (h: TaxInvoiceHistoryItem) => ReactNode;
  /** 바뀌면 지금 쪽을 다시 읽는다 */
  reloadKey?: number;
}) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TaxInvoiceHistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<{ notDeployed: boolean; message: string } | null>(null);
  const seq = useRef(0);
  const loadRef = useRef(load);
  const forbiddenRef = useRef(onForbidden);
  useEffect(() => {
    loadRef.current = load;
    forbiddenRef.current = onForbidden;
  });

  const fetchPage = useCallback(
    async (p: number) => {
      const my = ++seq.current;
      setLoading(true);
      try {
        const r = await loadRef.current(p, size);
        if (my !== seq.current || !isCurrentScope(scope)) return;
        if (r.ok) {
          setData(r.data);
          setPage(p);
          setFailure(null);
        } else {
          // 권한이 없으면 예전에 받은 이력도 더는 보이면 안 된다
          if (r.failure === 'forbidden') {
            setData(null);
            forbiddenRef.current?.();
          }
          setFailure({ notDeployed: r.failure === 'not-deployed', message: r.message });
        }
      } finally {
        if (my === seq.current) setLoading(false);
      }
    },
    [size, scope],
  );

  useEffect(() => {
    void fetchPage(0);
    return () => {
      seq.current += 1;
    };
  }, [fetchPage]);

  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    void fetchPage(page);
    // 다시 읽기 신호에만 반응한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const pages = data ? totalPages(data.totalElements, size) : 1;

  return (
    <div className="flex flex-col gap-3">
      {failure && (
        <Note tone={failure.notDeployed ? 'info' : 'warn'} live>
          {failure.notDeployed ? '처리 이력 보기를 준비하고 있습니다.' : failure.message}
          {data && !failure.notDeployed ? ' 아래는 마지막으로 불러온 이력입니다.' : ''}
        </Note>
      )}
      {loading && !data ? (
        <RowSkeleton rows={3} />
      ) : data && data.items.length === 0 ? (
        <p className="break-keep text-[13px] text-boss-text-secondary">{empty}</p>
      ) : data ? (
        <HistoryRows items={data.items} extra={extra} />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {data && data.totalElements > size ? (
          <Pagination page={page + 1} totalPages={pages} disabled={loading} onChange={(p) => void fetchPage(p - 1)} />
        ) : (
          <span />
        )}
        <Button variant="ghost" size="sm" icon={RefreshCw} disabled={loading} onClick={() => void fetchPage(page)}>
          {loading ? '불러오는 중…' : '새로고침'}
        </Button>
      </div>
    </div>
  );
}

/** 문서 상세 — "처리 이력 보기"를 눌러야 불러온다 */
export function InvoiceHistoryPanel({ invoiceId, scope, reloadKey = 0 }: { invoiceId: number; scope: string; reloadKey?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel
      kicker="처리 이력"
      title="발급 · 상태 확인 · 취소 기록"
      right={
        <Button variant="secondary" size="sm" icon={History} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? '접기' : '이력 보기'}
        </Button>
      }
    >
      {open ? (
        <HistoryBrowser
          key={`${scope}-${invoiceId}`}
          scope={scope}
          load={(p, s) => bossTaxInvoiceApi.history(invoiceId, p, s)}
          size={10}
          reloadKey={reloadKey}
          empty="아직 처리 기록이 없습니다. 전자 발급 · 상태 확인 · 취소를 하면 여기에 남습니다."
        />
      ) : (
        <p className="break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
          이 문서와 연결된 원본 · 수정분의 전자 발급 · 상태 확인 · 취소 기록을 시간순으로 봅니다.
        </p>
      )}
    </Panel>
  );
}
