'use client';

// 도배르만 운영 화면 공용 조각 — 목록 불러오기 · 검색 · 넓은 화면 표/좁은 화면 카드 · 상태 표 · 오류 구분
//
// Industry 규칙: 모서리 0, boss-* 토큰만, 숫자는 Barlow Condensed. 320px · 큰 글꼴에서도 이름과 핵심 상태는 카드로 보인다.
// 처음 불러오기 실패와 0건을 구분해 말한다. 서버 미반영 · 연결 실패 · 거절을 다른 문장으로 보인다.

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import type { AdminCall, AdminFailure } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { QUERY_MAX, pageCount, type AdminTone } from '@/lib/boss/platformAdmin';
import { formatOpsDateTime } from '@/lib/boss/taxInvoiceOps';
import { AlertBanner, Button, DataTable, EmptyState, Pagination, RowSkeleton, Tag } from '@/components/boss/ui';
import { usePlatformAdmin } from './PlatformAdminShell';

export { Note } from '@/components/boss/taxinvoice/RegistrationParts';

export type LoadError = { failure: AdminFailure; message: string };

/**
 * 목록 · 개요 불러오기.
 *   key   — 검색어 · 상태 등 조건(쪽 번호 제외). 바뀌면 앞 조건의 자료를 보이지 않는다.
 *   fetch — 조건 · 쪽이 바뀌면 새 함수(useCallback). 바뀔 때마다 한 번 부른다.
 * 늦게 온 앞 요청의 응답 · 계정이 바뀐 뒤 온 응답은 넣지 않는다. 403 이면 화면 껍데기가 내용을 닫는다.
 */
export function useAdminQuery<T>(key: string, fetch: () => Promise<AdminCall<T>>) {
  const { scope, onForbidden } = usePlatformAdmin();
  const [result, setResult] = useState<{ key: string; data: T } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const seq = useRef(0);

  const run = useCallback(async (): Promise<T | null> => {
    const my = ++seq.current;
    setLoading(true);
    const r = await fetch();
    if (my !== seq.current || !isCurrentScope(scope)) return null;
    setLoading(false);
    if (r.ok) {
      setResult({ key, data: r.data });
      setError(null);
      return r.data;
    }
    if (r.failure === 'forbidden') {
      onForbidden();
      return null;
    }
    setError({ failure: r.failure, message: r.message });
    return null;
  }, [fetch, key, scope, onForbidden]);

  useEffect(() => {
    void run();
    return () => {
      seq.current += 1;
    };
  }, [run]);

  return { data: result && result.key === key ? result.data : null, loading, error, reload: run };
}

/** 검색 — 입력 중에는 부르지 않고, 검색 버튼 · Enter 로 한 번 부른다 */
export function AdminSearch({
  value,
  onSearch,
  placeholder,
  disabled,
}: {
  value: string;
  onSearch: (q: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(draft.trim());
  };
  return (
    <form role="search" onSubmit={submit} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
      <div className="relative min-w-0 flex-1 sm:w-[280px] sm:flex-none">
        <Search
          size={14}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-boss-text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={QUERY_MAX}
          className="boss-input pl-[30px]"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" icon={Search} disabled={disabled}>
        검색
      </Button>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          disabled={disabled}
          onClick={() => {
            setDraft('');
            onSearch('');
          }}
        >
          검색 지우기
        </Button>
      )}
    </form>
  );
}

/** 상태 표 — 모르는 상태는 "확인 필요" */
export function StatusTag<S extends string>({ status, view }: { status: S | null; view: Record<S, { label: string; tone: AdminTone }> }) {
  return status ? <Tag tone={view[status].tone}>{view[status].label}</Tag> : <Tag tone="warn">확인 필요</Tag>;
}

/** 서버가 저장한 원천 상태값 그대로(구독 · 결제) — 뜻을 바꾸지 않는다 */
export function RawStatus({ value }: { value: string | null }) {
  return value ? <Tag tone="neutral">{value}</Tag> : <span className="text-boss-text-muted">기록 없음</span>;
}

/** 일시 — 한국시간 "2026-10-17 14:05". 없으면 대신할 글자 */
export function When({ value, empty = '-' }: { value: string | null; empty?: string }) {
  const t = formatOpsDateTime(value);
  return t ? (
    <time dateTime={value ?? undefined} className="font-boss-head tabular-nums">
      {t}
    </time>
  ) : (
    <span className="text-boss-text-muted">{empty}</span>
  );
}

/** 일반 글자 본문 — 줄바꿈만 살리고 HTML 로 해석하지 않는다(React 가 글자로 넣는다) */
export function PlainText({ children, className = '' }: { children: string; className?: string }) {
  return <div className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${className}`}>{children}</div>;
}

export type AdminColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** 넓은 화면 셀 class(.wrap = 줄바꿈 허용) */
  className?: string;
  /**
   * 좁은 화면 카드에서의 자리.
   *   title — 첫 줄 굵게(이름 · 제목) / badge — 첫 줄 옆 상태 표 / line — 아래 "머리글 · 값" 줄 / hide — 감춘다
   */
  card: 'title' | 'badge' | 'line' | 'hide';
};

/** 넓은 화면(md↑)은 표, 좁은 화면은 카드 — 카드는 이름 · 핵심 상태를 첫 줄에 둔다 */
export function AdminTable<T>({
  rows,
  rowKey,
  columns,
  action,
  caption,
}: {
  rows: T[];
  rowKey: (row: T) => string | number;
  columns: AdminColumn<T>[];
  action?: (row: T) => ReactNode;
  /** 표 설명(화면 읽기용 · 좁은 화면에서는 위에 글로) */
  caption: string;
}) {
  const titles = columns.filter((c) => c.card === 'title');
  const badges = columns.filter((c) => c.card === 'badge');
  const lines = columns.filter((c) => c.card === 'line');
  return (
    <>
      <div className="hidden md:block">
        <DataTable>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.header}
                </th>
              ))}
              {action && (
                <th scope="col">
                  <span className="sr-only">처리</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key} className={c.className}>
                    {c.cell(r)}
                  </td>
                ))}
                {action && <td className="text-right">{action(r)}</td>}
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
      <ul aria-label={caption} className="flex flex-col gap-2 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className="boss-card flex min-w-0 flex-col gap-2 px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {titles.map((c) => (
                <span key={c.key} className="min-w-0 break-keep text-[14px] font-semibold text-boss-text [overflow-wrap:anywhere]">
                  {c.cell(r)}
                </span>
              ))}
              {badges.map((c) => (
                <span key={c.key}>{c.cell(r)}</span>
              ))}
            </div>
            {lines.length > 0 && (
              <dl className="flex flex-col gap-1 text-[12.5px] leading-relaxed">
                {lines.map((c) => (
                  <div key={c.key} className="flex min-w-0 flex-wrap gap-x-2">
                    <dt className="shrink-0 text-boss-text-muted">{c.header}</dt>
                    <dd className="min-w-0 break-keep text-boss-text-secondary [overflow-wrap:anywhere]">{c.cell(r)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {action && <div>{action(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

/** 목록 위 줄 — 조건(왼쪽) · 건수 · 새로고침 */
export function ListBar({
  children,
  total,
  loading,
  onRefresh,
}: {
  children?: ReactNode;
  total: number | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {children}
      <span className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
        {loading ? '불러오는 중…' : total != null ? `${total.toLocaleString('ko-KR')}건` : ''}
      </span>
      <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading} onClick={onRefresh}>
        새로고침
      </Button>
    </div>
  );
}

/**
 * 불러오기 실패 — 서버 미반영 · 연결 실패 · 거절을 다른 문장으로. 앞서 불러온 자료가 있으면 그대로 둔다고 말한다.
 * (403 은 화면 껍데기가 닫으므로 여기 오지 않는다)
 */
export function LoadFailure({ error, hasData, onRetry }: { error: LoadError; hasData: boolean; onRetry: () => void }) {
  const retry = (
    <Button variant="primary" size="sm" onClick={onRetry}>
      다시 시도
    </Button>
  );
  if (error.failure === 'not-deployed' && !hasData) {
    return <EmptyState title="이 기능은 서버에 아직 반영되지 않았습니다" description="서버가 반영되면 이 화면에서 실제 자료를 볼 수 있습니다." action={retry} />;
  }
  const lead =
    error.failure === 'network' ? '서버에 연결하지 못했습니다.' : error.failure === 'not-deployed' ? '서버에 아직 반영되지 않은 기능입니다.' : '불러오지 못했습니다.';
  return (
    <AlertBanner tone={error.failure === 'network' ? 'warn' : 'bad'} action={retry}>
      {lead} {error.message}
      {hasData ? ' 아래는 마지막으로 불러온 내용입니다.' : ''}
    </AlertBanner>
  );
}

/** 목록 본문 — 처음 불러오는 중(행 자리) · 0건 · 표 · 쪽 넘김 */
export function ListBody<T>({
  data,
  loading,
  emptyTitle,
  emptyDescription,
  page,
  onPage,
  children,
}: {
  data: { items: T[]; size: number; totalElements: number } | null;
  loading: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  /** 0부터 */
  page: number;
  onPage: (page: number) => void;
  children: (items: T[]) => ReactNode;
}) {
  if (!data) {
    return loading ? (
      <div className="boss-card-content">
        <RowSkeleton rows={4} />
      </div>
    ) : null;
  }
  if (data.items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  const pages = pageCount(data.totalElements, data.size);
  return (
    <>
      {children(data.items)}
      {pages > 1 && <Pagination page={page + 1} totalPages={pages} disabled={loading} onChange={(p) => onPage(p - 1)} />}
    </>
  );
}

/** 처리 요청을 보내지 못하는 이유 — 보내 보기 전에는 회색으로 남은 항목만, 보내 본 뒤에는 붉게 */
export function Blockers({ items, attempted, busy }: { items: string[]; attempted: boolean; busy: boolean }) {
  if (items.length === 0 || busy) return null;
  return attempted ? (
    <ul role="alert" className="flex list-disc flex-col gap-0.5 pl-5 text-[12px] text-boss-error">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  ) : (
    <p className="text-[12px] leading-relaxed text-boss-text-muted">남은 항목: {items.join(' · ')}</p>
  );
}
