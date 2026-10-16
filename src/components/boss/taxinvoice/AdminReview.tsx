'use client';

// 운영자 — 발급 권한 신청 심사
//
//   목록: 심사 상태(대기 · 승인 · 반려) · 환경(전체 · 실제 · 시험) · 쪽 넘김. 넓은 화면은 표, 좁은 화면은 카드
//   심사: 신청 내용 요약 → 승인/반려 → 사유(필수) → 사업자 권한 확인 체크 → 요청 1회
//   보던 신청이 바뀌었거나 이미 처리됐으면 서버가 거절한다 → 목록을 다시 불러와 최신 내용으로 바꾸고 다시 확인을 받는다.
//   응답을 못 받았으면 처리됐을 수 있다 → 자동으로 다시 보내지 않고 목록을 다시 불러와 확인한다.
//   승인해도 팝빌 가입 · 발급 · 정식 오픈 상태는 바뀌지 않는다. 이미 승인한 권한을 되돌리는 기능은 없다.
//   계정이 바뀌었으면(공용 PC) 응답을 넣지 않고, 결정을 보내기 직전에도 다시 대조한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi, type OpsFailure } from '@/lib/api/boss/taxinvoice';
import { formatBizNo } from '@/lib/boss/bizno';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { REVIEW_REASON_MAX, formatOpsDateTime, reviewBlockers, totalPages, type ReviewForm } from '@/lib/boss/taxInvoiceOps';
import {
  REVIEW_STATUS_LABEL,
  type AdminRegistration,
  type AdminRegistrationPage,
  type AdminReviewDecision,
  type RegistrationReviewStatus,
} from '@/types/boss-taxinvoice';
import {
  AlertBanner,
  Button,
  CheckLine,
  DataTable,
  DescRow,
  EmptyState,
  Pagination,
  RadioOption,
  RowSkeleton,
  Segmented,
  Tag,
  TextareaField,
  type StatusTone,
} from '@/components/boss/ui';
import OpsDialog from './OpsDialog';
import { Note, SupplierSummary } from './RegistrationParts';

const PAGE_SIZE = 20;
type EnvFilter = 'all' | 'real' | 'test';

const STATUS_TONE: Record<RegistrationReviewStatus, StatusTone> = {
  PENDING: 'info',
  APPROVED: 'ok',
  REJECTED: 'bad',
};

const nameOf = (r: AdminRegistration) => r.companyName || r.supplier?.name || '(상호 없음)';

function StatusTag({ status }: { status: RegistrationReviewStatus | null }) {
  return status ? <Tag tone={STATUS_TONE[status]}>{REVIEW_STATUS_LABEL[status]}</Tag> : <Tag tone="warn">확인 필요</Tag>;
}

export default function AdminReview({ scope, onForbidden }: { scope: string; onForbidden: () => void }) {
  const [status, setStatus] = useState<RegistrationReviewStatus>('PENDING');
  const [env, setEnv] = useState<EnvFilter>('all');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminRegistrationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminRegistration | null>(null);
  const seq = useRef(0);

  const load = useCallback(
    async (p: number): Promise<AdminRegistrationPage | null> => {
      const my = ++seq.current;
      setLoading(true);
      try {
        const r = await bossTaxInvoiceApi.adminRegistrations(status, p, PAGE_SIZE, env === 'all' ? null : env === 'test');
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
    [status, env, onForbidden, scope],
  );

  useEffect(() => {
    setData(null);
    void load(0);
    return () => {
      seq.current += 1;
    };
  }, [load]);

  const done = (row: AdminRegistration) => {
    setNotice(`${nameOf(row)} 신청을 ${row.reviewStatus === 'APPROVED' ? '승인' : row.reviewStatus === 'REJECTED' ? '반려' : '처리'}했습니다. 사장님 화면과 알림에 반영됩니다.`);
    setSelected(null);
    void load(page);
  };

  const pages = data ? totalPages(data.totalElements, PAGE_SIZE) : 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented
          ariaLabel="심사 상태"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setNotice(null);
          }}
          options={[
            { key: 'PENDING', label: '심사 대기' },
            { key: 'APPROVED', label: '승인' },
            { key: 'REJECTED', label: '반려' },
          ]}
        />
        <Segmented
          ariaLabel="환경"
          value={env}
          onChange={setEnv}
          options={[
            { key: 'all', label: '전체 환경' },
            { key: 'real', label: '실제' },
            { key: 'test', label: '시험' },
          ]}
        />
        <span className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {loading ? '불러오는 중…' : data ? `${data.totalElements.toLocaleString()}건` : ''}
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading} onClick={() => void load(page)}>
          새로고침
        </Button>
      </div>

      {notice && <Note tone="ok" live>{notice}</Note>}
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
        <EmptyState
          title={status === 'PENDING' ? '심사를 기다리는 신청이 없습니다' : `${REVIEW_STATUS_LABEL[status]}한 신청이 없습니다`}
          description="환경 조건을 바꾸거나 새로고침해 보세요."
        />
      ) : (
        <>
          {/* 넓은 화면 — 표 */}
          <div className="hidden md:block">
            <DataTable>
              <thead>
                <tr>
                  <th>신청 시각</th>
                  <th>상호 · 사업자번호</th>
                  <th>신청자</th>
                  <th>환경</th>
                  <th>상태</th>
                  <th>처리 시각</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td className="font-boss-head tabular-nums text-boss-text-secondary">{formatOpsDateTime(r.submittedAt) ?? '-'}</td>
                    <td className="wrap">
                      <span className="font-semibold text-boss-text">{nameOf(r)}</span>
                      <span className="mt-0.5 block font-boss-head text-[12px] tabular-nums text-boss-text-muted">{r.supplier?.bizNo ? formatBizNo(r.supplier.bizNo) : '사업자번호 없음'}</span>
                    </td>
                    <td className="text-boss-text-secondary">{r.userId || '-'}</td>
                    <td>{r.isTest ? <Tag tone="warn">시험</Tag> : <Tag tone="neutral">실제</Tag>}</td>
                    <td>
                      <StatusTag status={r.reviewStatus} />
                    </td>
                    <td className="font-boss-head tabular-nums text-boss-text-muted">{formatOpsDateTime(r.reviewedAt) ?? '-'}</td>
                    <td>
                      <Button variant={r.reviewStatus === 'PENDING' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelected(r)}>
                        {r.reviewStatus === 'PENDING' ? '심사' : '보기'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
          {/* 좁은 화면 — 카드 */}
          <ul className="flex flex-col gap-2 md:hidden">
            {data.items.map((r) => (
              <li key={r.id} className="boss-card flex flex-col gap-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-keep text-[13.5px] font-semibold text-boss-text [overflow-wrap:anywhere]">{nameOf(r)}</span>
                  <StatusTag status={r.reviewStatus} />
                  {r.isTest && <Tag tone="warn">시험</Tag>}
                </div>
                <p className="break-keep text-[12px] leading-relaxed text-boss-text-secondary [overflow-wrap:anywhere]">
                  {r.supplier?.bizNo ? formatBizNo(r.supplier.bizNo) : '사업자번호 없음'} · 신청자 {r.userId || '-'} · {formatOpsDateTime(r.submittedAt) ?? '시각 확인 전'}
                </p>
                <div>
                  <Button variant={r.reviewStatus === 'PENDING' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelected(r)}>
                    {r.reviewStatus === 'PENDING' ? '심사' : '보기'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {data.totalElements > PAGE_SIZE && <Pagination page={page + 1} totalPages={pages} disabled={loading} onChange={(p) => void load(p - 1)} />}
        </>
      )}

      {selected && (
        <ReviewDialog
          scope={scope}
          row={selected}
          onClose={() => setSelected(null)}
          onDone={done}
          onForbidden={onForbidden}
          reload={async () => {
            const fresh = await load(page);
            return fresh ? fresh.items.find((x) => x.id === selected.id) ?? 'gone' : null;
          }}
        />
      )}
    </div>
  );
}

/**
 * 승인 · 반려 대화상자.
 * reload — 목록을 다시 불러와 같은 신청의 최신 내용을 돌려준다. 목록에서 빠졌으면 'gone', 못 읽었으면 null.
 */
export function ReviewDialog({
  scope,
  row: initial,
  onClose,
  onDone,
  onForbidden,
  reload,
}: {
  scope: string;
  row: AdminRegistration;
  onClose: () => void;
  onDone: (row: AdminRegistration) => void;
  onForbidden: () => void;
  reload: () => Promise<AdminRegistration | 'gone' | null>;
}) {
  const [row, setRow] = useState(initial);
  const [form, setForm] = useState<ReviewForm>({ decision: null, reason: '', verified: false });
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<{ tone: 'bad' | 'warn'; text: string } | null>(null);
  // 결과를 모르거나 목록에서 빠졌으면 다시 확인 전까지 보내지 않는다
  const [locked, setLocked] = useState(false);
  const inFlight = useRef(false);

  const pending = row.reviewStatus === 'PENDING';
  const blockers = reviewBlockers(row, form).concat(row.supplier ? [] : ['신청 내용을 불러오지 못했습니다. 목록을 새로 불러 주세요.']);
  const canSend = blockers.length === 0 && !busy && !locked;

  const refresh = async (why: OpsFailure | 'unconfirmed') => {
    const fresh = await reload();
    // 체크는 늘 다시 받는다 — 바뀐 내용을 보고 다시 확인해야 한다
    setForm((f) => ({ ...f, verified: false }));
    if (fresh === 'gone') {
      setLocked(true);
      setMessage({ tone: 'warn', text: '이 신청은 이미 처리되어 지금 목록에서 빠졌습니다. 승인 · 반려 목록에서 결과를 확인하세요. 다시 보내지 않았습니다.' });
      return;
    }
    if (!fresh) {
      setLocked(true);
      setMessage({ tone: 'warn', text: '최신 내용을 불러오지 못했습니다. 창을 닫고 목록을 새로고침한 뒤 결과를 확인하세요. 다시 보내지 않았습니다.' });
      return;
    }
    setRow(fresh);
    setLocked(false);
    if (fresh.reviewStatus !== 'PENDING') {
      setMessage({ tone: 'warn', text: `이미 ${fresh.reviewStatus ? REVIEW_STATUS_LABEL[fresh.reviewStatus] : '처리'}된 신청입니다. 결과를 확인하세요. 다시 보내지 않았습니다.` });
      return;
    }
    setMessage({
      tone: 'warn',
      text:
        why === 'stale'
          ? '그사이 신청 내용이 바뀌었거나 다른 운영자가 먼저 처리를 시도했습니다. 최신 내용으로 바꿨으니 다시 확인하고 체크한 뒤 결정해 주세요.'
          : '결과를 받지 못해 최신 내용을 다시 불러왔습니다. 아직 심사 대기라면 다시 확인하고 체크한 뒤 결정해 주세요.',
    });
  };

  const send = async () => {
    setAttempted(true);
    if (!canSend || inFlight.current || !form.decision) return;
    // 그사이 계정이 바뀌었으면 보내지 않는다 — 다른 사람 이름으로 결정이 나가면 안 된다
    if (!isCurrentScope(scope)) {
      setLocked(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const r = await bossTaxInvoiceApi.adminReview(row.id, {
        decision: form.decision,
        reviewToken: row.reviewToken,
        reason: form.reason.trim(),
        confirmed: true,
      });
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        onDone(r.data);
        return;
      }
      if (r.failure === 'forbidden') {
        onForbidden();
        return;
      }
      if (r.failure === 'stale' || r.failure === 'network' || r.failure === 'unconfirmed') {
        await refresh(r.failure);
        return;
      }
      setMessage({ tone: 'bad', text: r.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const decide = (decision: AdminReviewDecision) => setForm((f) => ({ ...f, decision }));
  const reject = form.decision === 'REJECT';

  return (
    <OpsDialog
      title={pending ? '발급 권한 신청 심사' : '발급 권한 신청'}
      subtitle={pending ? '신청 내용을 사업자등록증과 대조한 뒤 결정합니다. 결정은 한 번만 보냅니다.' : '처리된 신청입니다. 이 화면에서 결과를 바꾸지 않습니다.'}
      busy={busy}
      danger={reject}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            닫기
          </Button>
          {pending && (
            <Button variant={reject ? 'danger' : 'primary'} onClick={() => void send()} disabled={!canSend} aria-busy={busy || undefined}>
              {busy ? '보내는 중…' : reject ? '반려하기' : form.decision === 'APPROVE' ? '승인하기' : '결정 보내기'}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
        {row.isTest ? (
          <Note tone="warn">시험 환경 신청입니다. 실제 발급 권한과 섞이지 않습니다.</Note>
        ) : (
          <Note tone="info">실제 환경 신청입니다.</Note>
        )}

        {/* 좁은 화면 · 큰 글꼴에서도 신청 시각 · 긴 아이디가 잘리지 않게 이 표만 줄바꿈(공용 DescRow 는 그대로) */}
        <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
          <DescRow label="상호" value={nameOf(row)} />
          <DescRow label="회사 번호" value={row.companyId || '-'} />
          <DescRow label="신청자" value={row.userId || '-'} />
          <DescRow label="신청 시각" value={formatOpsDateTime(row.submittedAt) ?? '-'} />
          <DescRow label="심사 상태" value={<StatusTag status={row.reviewStatus} />} />
          {row.reviewedAt && <DescRow label="처리 시각" value={formatOpsDateTime(row.reviewedAt) ?? '-'} />}
        </dl>

        <div>
          <p className="mb-1.5 text-[12.5px] font-semibold text-boss-text">신청한 사업자 정보</p>
          {row.supplier ? <SupplierSummary supplier={row.supplier} /> : <Note tone="warn">신청 내용이 비어 있습니다.</Note>}
        </div>

        {!pending ? (
          row.reviewReason && (
            <div className="border border-boss-border bg-boss-bg px-3 py-2.5">
              <p className="text-[12px] text-boss-text-muted">
                {row.reviewStatus === 'REJECTED' ? '반려 사유' : row.reviewStatus === 'APPROVED' ? '승인 사유' : '심사 사유'} (사장님 화면에 공개됨)
              </p>
              <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-boss-text">{row.reviewReason}</p>
            </div>
          )
        ) : (
          <>
            <div role="radiogroup" aria-label="결정" className="grid gap-2 sm:grid-cols-2">
              <RadioOption checked={form.decision === 'APPROVE'} onChange={() => decide('APPROVE')} label="승인" />
              <RadioOption checked={form.decision === 'REJECT'} onChange={() => decide('REJECT')} label="반려" />
            </div>
            {form.decision === 'APPROVE' && (
              <Note tone="info">
                승인하면 사장님 화면에 팝빌 연동 단계가 열립니다. 팝빌 가입 · 인증서 등록 · 발급 · 정식 오픈 상태는 이 결정으로 바뀌지 않습니다.
              </Note>
            )}
            {reject && <Note tone="warn">반려하면 사장님이 아래 사유를 보고 정보를 고쳐 다시 신청할 수 있습니다.</Note>}
            <TextareaField
              id="review-reason"
              label={reject ? '반려 사유 (사장님 화면에 공개)' : '승인 사유 (사장님 화면에 공개)'}
              required
              rows={3}
              maxLength={REVIEW_REASON_MAX}
              value={form.reason}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              hint="사장님 화면에 그대로 보입니다. 공개해도 되는 내용만 적고, 내부 메모 · 다른 사람 정보는 적지 마세요."
              placeholder={reject ? '예: 사업자등록증의 대표자 이름과 신청 내용이 다릅니다.' : '예: 사업자등록증과 신청 내용이 같아 승인합니다.'}
            />
            <div className="border border-boss-border bg-boss-inset px-4 py-3">
              <CheckLine checked={form.verified} onChange={(v) => setForm((f) => ({ ...f, verified: v }))} disabled={busy}>
                사업자등록증의 번호 · 상호 · 대표자가 위 신청 내용과 같고, 신청자가 이 회사 소속임을 확인했습니다.
              </CheckLine>
            </div>
            {attempted && blockers.length > 0 && !busy && (
              <ul role="alert" className="flex list-disc flex-col gap-0.5 pl-5 text-[12px] text-boss-error">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {!attempted && blockers.length > 0 && (
              <p className="text-[12px] leading-relaxed text-boss-text-muted">남은 항목: {blockers.join(' · ')}</p>
            )}
          </>
        )}
      </div>
    </OpsDialog>
  );
}
