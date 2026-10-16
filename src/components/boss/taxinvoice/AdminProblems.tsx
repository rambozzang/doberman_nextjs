'use client';

// 운영자 — 결과를 모르는 문서 · 전송 실패 문서와 처리 이력
//
//   문제 문서: 문서 · 상태 · 문서 주인 · 마지막 오류 · 마지막 확인. 상태 조회는 이유 메모 + 확인 체크 후 1회만 보낸다.
//     서버가 그 문서 주인의 기존 상태 조회로 처리한다 — 다시 발급 · 새 문서 · 강제 성공 · 금액 수정은 없다.
//     조회할 수 없는 문서(canSync=false)는 버튼 대신 이유를 보인다. 응답을 못 받으면 다시 보내지 않고 목록을 다시 읽는다.
//   처리 이력: 전체 이력과 문서별 이력(대화상자).
//   계정이 바뀌었으면 응답을 넣지 않고, 조회를 보내기 직전에도 다시 대조한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { displayState, docKindLabel } from '@/lib/boss/taxInvoiceDocument';
import { SYNC_NOTE_MAX, formatOpsDateTime, syncBlockers, totalPages } from '@/lib/boss/taxInvoiceOps';
import type { AdminProblem, AdminProblemPage, TaxInvoice } from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  CheckLine,
  DataTable,
  DescRow,
  EmptyState,
  Pagination,
  RowSkeleton,
  Tag,
  TextareaField,
} from '@/components/boss/ui';
import { HistoryBrowser } from './HistoryList';
import OpsDialog from './OpsDialog';
import { Note } from './RegistrationParts';

const PAGE_SIZE = 20;
const fmt = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR');

const CANNOT_SYNC = '지금은 이 문서의 상태를 조회할 수 없습니다. 정식 오픈 전 · 환경 설정 · 문서 주인 권한 때문일 수 있으니 처리 이력을 먼저 확인하세요.';

function InvoiceState({ inv }: { inv: TaxInvoice }) {
  const s = displayState(inv);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Tag tone={s.tone}>{s.label}</Tag>
      {inv.providerIsTest && <Tag tone="warn">시험</Tag>}
    </span>
  );
}

export default function AdminProblems({ scope, onForbidden }: { scope: string; onForbidden: () => void }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminProblemPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<AdminProblem | null>(null);
  const [historyOf, setHistoryOf] = useState<TaxInvoice | null>(null);
  const seq = useRef(0);

  const load = useCallback(
    async (p: number): Promise<AdminProblemPage | null> => {
      const my = ++seq.current;
      setLoading(true);
      try {
        const r = await bossTaxInvoiceApi.adminProblems(p, PAGE_SIZE);
        if (my !== seq.current || !isCurrentScope(scope)) return null;
        if (r.ok) {
          setData(r.data);
          setPage(p);
          setError(null);
          return r.data;
        }
        if (r.failure === 'forbidden') onForbidden();
        setError(r.message);
        return null;
      } finally {
        if (my === seq.current) setLoading(false);
      }
    },
    [onForbidden, scope],
  );

  useEffect(() => {
    void load(0);
    return () => {
      seq.current += 1;
    };
  }, [load]);

  const pages = data ? totalPages(data.totalElements, PAGE_SIZE) : 1;
  const action = (p: AdminProblem) => (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="ghost" size="sm" icon={History} onClick={() => setHistoryOf(p.invoice)}>
        이력
      </Button>
      {p.canSync ? (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setSyncing(p)}>
          상태 조회
        </Button>
      ) : (
        <Tag tone="neutral">조회 불가</Tag>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="min-w-0 flex-1 basis-[260px] break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">
          발급 · 취소 결과를 모르거나 국세청 전송에 실패한 문서입니다. 상태 조회는 결과를 다시 읽기만 하고, 다시 발급하거나 상태를 고치지 않습니다.
        </p>
        <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : data ? `${data.totalElements.toLocaleString()}건` : ''}
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading} onClick={() => void load(page)}>
          새로고침
        </Button>
      </div>
      {!ELECTRONIC_TAX_INVOICE_OPEN && <Note tone="info">정식 오픈 전에는 상태 조회가 막힐 수 있습니다. 막히면 그 이유가 그대로 보입니다.</Note>}
      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load(page)}>
              다시 시도
            </Button>
          }
        >
          {error}
          {data ? ' 아래는 마지막으로 불러온 목록입니다.' : ''}
        </AlertBanner>
      )}

      {loading && !data ? (
        <div className="boss-card-content">
          <RowSkeleton rows={4} />
        </div>
      ) : !data ? null : data.items.length === 0 ? (
        <EmptyState title="확인이 필요한 문서가 없습니다" description="결과를 모르는 문서가 생기면 여기에 모입니다." />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable>
              <thead>
                <tr>
                  <th>문서</th>
                  <th>상태</th>
                  <th className="num">합계</th>
                  <th>문서 주인</th>
                  <th>마지막 오류</th>
                  <th>마지막 확인</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.invoice.id}>
                    <td className="wrap">
                      <span className="font-semibold text-boss-text">{p.invoice.buyerName || '(이름 없음)'}</span>
                      <span className="mt-0.5 block text-[12px] text-boss-text-muted">
                        {docKindLabel(p.invoice)} · {p.invoice.issueDate || '작성일 미정'} · #{p.invoice.id}
                      </span>
                    </td>
                    <td>
                      <InvoiceState inv={p.invoice} />
                    </td>
                    <td className="num">{fmt(p.invoice.totalAmount)}</td>
                    <td className="text-boss-text-secondary">{p.ownerUserId || '-'}</td>
                    <td className="wrap max-w-[240px] text-[12px] text-boss-text-secondary">{p.lastError || '-'}</td>
                    <td className="font-boss-head tabular-nums text-boss-text-muted">{formatOpsDateTime(p.lastSyncedAt) ?? '-'}</td>
                    <td>{action(p)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
          <ul className="flex flex-col gap-2 md:hidden">
            {data.items.map((p) => (
              <li key={p.invoice.id} className="boss-card flex flex-col gap-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-keep text-[13.5px] font-semibold text-boss-text [overflow-wrap:anywhere]">{p.invoice.buyerName || '(이름 없음)'}</span>
                  <InvoiceState inv={p.invoice} />
                </div>
                <p className="break-keep text-[12px] leading-relaxed text-boss-text-secondary [overflow-wrap:anywhere]">
                  {docKindLabel(p.invoice)} · {p.invoice.issueDate || '작성일 미정'} · {fmt(p.invoice.totalAmount)}원 · 주인 {p.ownerUserId || '-'}
                </p>
                {p.lastError && <p className="break-keep text-[12px] leading-relaxed text-boss-error [overflow-wrap:anywhere]">{p.lastError}</p>}
                <p className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">마지막 확인 {formatOpsDateTime(p.lastSyncedAt) ?? '-'}</p>
                {action(p)}
              </li>
            ))}
          </ul>
          {data.totalElements > PAGE_SIZE && <Pagination page={page + 1} totalPages={pages} disabled={loading} onChange={(p) => void load(p - 1)} />}
        </>
      )}

      {syncing && (
        <SyncDialog
          scope={scope}
          problem={syncing}
          onClose={() => setSyncing(null)}
          onForbidden={onForbidden}
          reload={async () => {
            const fresh = await load(page);
            return fresh ? fresh.items.find((x) => x.invoice.id === syncing.invoice.id) ?? 'gone' : null;
          }}
        />
      )}
      {historyOf && historyOf.id != null && (
        <InvoiceHistoryDialog
          scope={scope}
          onForbidden={onForbidden}
          invoiceId={historyOf.id}
          title={`처리 이력 · ${docKindLabel(historyOf)} #${historyOf.id}`}
          subtitle={historyOf.buyerName || undefined}
          onClose={() => setHistoryOf(null)}
        />
      )}
    </div>
  );
}

/** 문서 상태 조회 — 이유 메모 · 확인 체크 후 한 번만 보낸다. 결과는 대화상자 안에 보이고 목록은 다시 읽는다 */
export function SyncDialog({
  scope,
  problem: initial,
  onClose,
  onForbidden,
  reload,
}: {
  scope: string;
  problem: AdminProblem;
  onClose: () => void;
  onForbidden: () => void;
  /** 목록을 다시 읽어 같은 문서를 돌려준다. 목록에서 빠졌으면 'gone', 못 읽었으면 null */
  reload: () => Promise<AdminProblem | 'gone' | null>;
}) {
  const [problem, setProblem] = useState(initial);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [result, setResult] = useState<TaxInvoice | null>(null);
  const [message, setMessage] = useState<{ tone: 'bad' | 'warn'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const inFlight = useRef(false);

  const inv = problem.invoice;
  const blockers = syncBlockers(problem, note, confirmed);
  const canSend = blockers.length === 0 && !busy && !locked && result == null;

  const recheck = async (text: string) => {
    const fresh = await reload();
    setConfirmed(false);
    if (fresh && fresh !== 'gone') {
      setProblem(fresh);
      setLocked(false);
      setMessage({ tone: 'warn', text });
      return;
    }
    setLocked(true);
    setMessage({
      tone: 'warn',
      text:
        fresh === 'gone'
          ? '이 문서는 이제 확인이 필요한 목록에 없습니다. 조회가 처리됐을 수 있으니 처리 이력에서 확인하세요. 다시 보내지 않았습니다.'
          : '목록을 다시 불러오지 못했습니다. 창을 닫고 새로고침해 결과를 확인하세요. 다시 보내지 않았습니다.',
    });
  };

  const send = async () => {
    setAttempted(true);
    if (!canSend || inFlight.current || inv.id == null) return;
    if (!isCurrentScope(scope)) {
      setLocked(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const r = await bossTaxInvoiceApi.adminSync(inv.id, { confirmed: true, note: note.trim() });
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        setResult(r.data);
        void reload();
        return;
      }
      if (r.failure === 'forbidden') {
        onForbidden();
        return;
      }
      if (r.failure === 'network' || r.failure === 'unconfirmed') {
        await recheck('결과를 받지 못해 목록을 다시 불러왔습니다. 처리 이력에서 조회 결과를 먼저 확인하고, 필요할 때만 다시 조회하세요.');
        return;
      }
      if (r.failure === 'stale') {
        await recheck('그사이 문서 상태가 바뀌었습니다. 최신 내용으로 바꿨으니 다시 확인해 주세요.');
        return;
      }
      setMessage({ tone: 'bad', text: r.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const after = result ? displayState(result) : null;

  return (
    <OpsDialog
      title="문서 상태 조회"
      subtitle="문서 주인의 기존 상태 조회로 처리됩니다. 결과를 다시 읽기만 합니다."
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            닫기
          </Button>
          {!result && (
            <Button variant="primary" onClick={() => void send()} disabled={!canSend} aria-busy={busy || undefined}>
              {busy ? '조회 중…' : '상태 조회'}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
        {result && after && (
          <Note tone={after.tone === 'bad' ? 'bad' : after.tone === 'ok' ? 'ok' : 'info'} live>
            조회를 마쳤습니다. 지금 상태: <b>{after.label}</b>
            {result.providerError ? ` · ${result.providerError}` : ''}
          </Note>
        )}
        {/* 좁은 화면 · 큰 글꼴에서도 시각 · 승인번호 · 아이디가 잘리지 않게 이 표만 줄바꿈(공용 DescRow 는 그대로) */}
        <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
          <DescRow label="문서" value={`${docKindLabel(inv)} #${inv.id}`} />
          <DescRow label="고객" value={inv.buyerName || '-'} />
          <DescRow label="작성일자" value={inv.issueDate || '-'} />
          <DescRow label="합계" value={`${fmt(inv.totalAmount)}원`} />
          <DescRow label="지금 상태" value={<InvoiceState inv={result ?? inv} />} />
          <DescRow label="승인번호" value={(result ?? inv).approvalNo || '-'} />
          <DescRow label="문서 주인" value={problem.ownerUserId || '-'} />
          <DescRow label="마지막 확인" value={formatOpsDateTime(problem.lastSyncedAt) ?? '-'} />
        </dl>
        {problem.lastError && (
          <p className="break-keep text-[12.5px] leading-relaxed text-boss-error [overflow-wrap:anywhere]">마지막 오류: {problem.lastError}</p>
        )}
        {!problem.canSync && <Note tone="warn">{CANNOT_SYNC}</Note>}
        {!result && problem.canSync && (
          <>
            <TextareaField
              id="sync-note"
              label="조회 이유 (운영자 처리 이력에만 남습니다)"
              required
              rows={2}
              maxLength={SYNC_NOTE_MAX}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 사장님 문의 — 발급 결과 확인 요청"
            />
            <div className="border border-boss-border bg-boss-inset px-4 py-3">
              <CheckLine checked={confirmed} onChange={setConfirmed} disabled={busy}>
                상태를 다시 읽기만 하며, 다시 발급 · 새 문서 · 강제 성공 처리 · 금액 수정은 하지 않는다는 것을 확인했습니다.
              </CheckLine>
            </div>
            {attempted && blockers.length > 0 && !busy && (
              <ul role="alert" className="flex list-disc flex-col gap-0.5 pl-5 text-[12px] text-boss-error">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </OpsDialog>
  );
}

export function InvoiceHistoryDialog({
  scope,
  invoiceId,
  title,
  subtitle,
  onClose,
  onForbidden,
}: {
  scope: string;
  onForbidden: () => void;
  invoiceId: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <OpsDialog title={title} subtitle={subtitle} wide onClose={onClose}>
      <HistoryBrowser
        scope={scope}
        onForbidden={onForbidden}
        load={(p, s) => bossTaxInvoiceApi.adminInvoiceHistory(invoiceId, p, s)}
        size={10}
        empty="이 문서의 처리 기록이 없습니다."
      />
    </OpsDialog>
  );
}

/** 전체 처리 이력 — 문서가 있는 줄은 그 문서의 이력을 따로 연다. 권한 없음이면 운영자 화면을 닫는다(열린 이력 창 포함) */
export function AdminHistory({ scope, onForbidden }: { scope: string; onForbidden: () => void }) {
  const [historyOf, setHistoryOf] = useState<number | null>(null);
  return (
    <>
      <HistoryBrowser
        scope={scope}
        onForbidden={onForbidden}
        load={(p, s) => bossTaxInvoiceApi.adminHistory(p, s)}
        empty="아직 처리 기록이 없습니다."
        extra={(h) =>
          h.invoiceId != null ? (
            <button type="button" className="mt-1 text-[12px] font-semibold text-boss-primary hover:underline" onClick={() => setHistoryOf(h.invoiceId)}>
              문서 #{h.invoiceId} 이력 보기
            </button>
          ) : null
        }
      />
      {historyOf != null && (
        <InvoiceHistoryDialog
          scope={scope}
          onForbidden={onForbidden}
          invoiceId={historyOf}
          title={`처리 이력 · 문서 #${historyOf}`}
          onClose={() => setHistoryOf(null)}
        />
      )}
    </>
  );
}
