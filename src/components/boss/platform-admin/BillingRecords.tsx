'use client';

import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Search } from 'lucide-react';
import { AlertBanner, Button, DataTable, EmptyState, Pagination, Skeleton, Tag } from '@/components/boss/ui';
import { platformAdminApi, type AdminFailure } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { denyPlatformAdminAccess, usePlatformAdminAccess } from '@/lib/boss/platformAdminAccess';
import { formatAmount, formatCount, pageCount, QUERY_MAX } from '@/lib/boss/platformAdmin';
import type { PlatformPayment, PlatformPaymentPage, PlatformSubscription, PlatformSubscriptionPage } from '@/types/boss-platform-admin';

type Kind = 'subscriptions' | 'payments';
type RecordsPage = PlatformSubscriptionPage | PlatformPaymentPage;
type RecordRow = PlatformSubscription | PlatformPayment;
const PAGE_SIZE = 20;
const date = (value: string | null) => value ? value.slice(0, 16).replace('T', ' ') : '미기록';

/** 저장된 스토어 기록 조회. 현재 계정의 서버 운영자 판정 이후에만 자료를 읽는다. */
export default function BillingRecords({ kind }: { kind: Kind }) {
  const scope = useBossScope();
  const access = usePlatformAdminAccess(scope);
  if (!scope || access.status !== 'admin') return <Skeleton className="h-48" />;
  return <Records key={`${scope}:${kind}`} scope={scope} kind={kind} />;
}

function Records({ scope, kind }: { scope: string; kind: Kind }) {
  const subscription = kind === 'subscriptions';
  const noun = subscription ? '구독' : '결제';
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState({ q: '', page: 0 });
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<RecordsPage | null>(null);
  const [failure, setFailure] = useState<{ failure: AdminFailure; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    setFailure(null);
    const read = subscription ? platformAdminApi.subscriptions : platformAdminApi.payments;
    void read({ ...filter, size: PAGE_SIZE }).then((result) => {
      if (!alive || !isCurrentScope(scope)) return;
      if (result.ok) setData(result.data);
      else {
        setFailure(result);
        if (result.failure === 'forbidden') denyPlatformAdminAccess(scope);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [filter, revision, scope, subscription]);

  const reload = () => setRevision((value) => value + 1);
  const empty = filter.q ? `검색에 맞는 ${noun} 기록이 없습니다` : `저장된 ${noun} 기록이 없습니다`;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AlertBanner tone="info">
        서버에 저장된 {noun} 내역입니다. 앱스토어·구글플레이의 실시간 상태와 다를 수 있습니다.
        {subscription ? ' 구독 변경은 각 스토어에서 처리합니다.' : ' 금액은 기록된 통화로 표시합니다.'}
      </AlertBanner>

      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <form className="flex min-w-0 flex-1 flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setFilter({ q: draft.trim(), page: 0 }); }}>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] text-boss-text-secondary">
            {noun} 기록 검색
            <input className="boss-input w-full sm:w-72" value={draft} maxLength={QUERY_MAX} onChange={(event) => setDraft(event.target.value)} placeholder={subscription ? '회원 이름 · 아이디 · 상품' : '회원 이름 · 아이디 · 거래 번호'} />
          </label>
          <Button type="submit" size="sm" icon={Search} disabled={loading}>검색</Button>
          {filter.q && <Button size="sm" variant="ghost" disabled={loading} onClick={() => { setDraft(''); setFilter({ q: '', page: 0 }); }}>초기화</Button>}
        </form>
        <Button size="sm" icon={RefreshCw} disabled={loading} onClick={reload}>새로고침</Button>
      </div>

      {loading ? <Skeleton className="h-56" /> : failure ? (
        <AlertBanner tone="bad" action={<Button size="sm" onClick={reload}>다시 확인</Button>}>{failure.message}</AlertBanner>
      ) : data && !data.available ? (
        <EmptyState icon={CreditCard} title={`${noun} 기록 조회를 사용할 수 없습니다`} description="기록 저장소의 연결 상태를 확인한 뒤 다시 조회해 주세요." action={<Button onClick={reload}>다시 확인</Button>} />
      ) : data && (
        <>
          <p className="text-[13px] text-boss-text-secondary" role="status">{noun} 기록 {formatCount(data.totalElements)}건{filter.q && ` · “${filter.q}” 검색 결과`}</p>
          {data.items.length === 0 ? (
            <EmptyState icon={CreditCard} title={empty} description={filter.q ? '다른 검색어로 찾아보세요.' : '기록 조회는 연결되어 있습니다. 저장된 내역이 생기면 이곳에서 확인할 수 있습니다.'} />
          ) : (
            <section className="boss-card min-w-0" aria-label={`${noun} 기록 목록`}>
              <div className="hidden md:block">
                <DataTable>
                  <thead><tr><th>회원</th><th>상품</th><th>저장된 상태</th><th>{subscription ? '시작일' : '거래일'}</th><th>{subscription ? '만료일' : '금액 · 통화'}</th><th>기록 번호</th></tr></thead>
                  <tbody>{data.items.map((row) => <DesktopRow key={row.id} row={row} subscription={subscription} />)}</tbody>
                </DataTable>
              </div>
              <ul className="divide-y divide-boss-border-row md:hidden">
                {data.items.map((row) => <MobileRow key={row.id} row={row} subscription={subscription} />)}
              </ul>
            </section>
          )}
          {data.totalElements > data.size && <Pagination page={filter.page + 1} totalPages={pageCount(data.totalElements, data.size)} disabled={loading} onChange={(page) => setFilter((value) => ({ ...value, page: page - 1 }))} />}
        </>
      )}
    </div>
  );
}

function Status({ status }: { status: string | null }) {
  const tone = status === 'ACTIVE' || status === 'SUCCESS' ? 'ok' : status === 'FAILED' ? 'bad' : 'neutral';
  return <Tag tone={tone}>{status ?? '미기록'}</Tag>;
}

function dates(row: RecordRow, subscription: boolean): [string, string] {
  if (subscription && 'startedAt' in row) return [date(row.startedAt), date(row.expiresAt)];
  if ('amount' in row) return [date(row.createdAt), formatAmount(row.amount, row.currency) ?? '금액 미기록'];
  return ['미기록', '미기록'];
}

function DesktopRow({ row, subscription }: { row: RecordRow; subscription: boolean }) {
  const [first, second] = dates(row, subscription);
  return (
    <tr>
      <td className="wrap"><p className="font-semibold">{row.name || row.userId || '미기록'}</p><p className="break-all text-[12px] text-boss-text-muted">{row.userId || '아이디 미기록'}</p></td>
      <td className="wrap max-w-60 break-all">{row.productName || '상품명 미기록'}</td>
      <td><Status status={row.status} /></td><td>{first}</td><td className="num">{second}</td>
      <td className="wrap max-w-64 break-all text-[12px] text-boss-text-muted">{row.id}</td>
    </tr>
  );
}

function MobileRow({ row, subscription }: { row: RecordRow; subscription: boolean }) {
  const [first, second] = dates(row, subscription);
  return (
    <li className="min-w-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-all text-[14px] font-semibold text-boss-text">{row.name || row.userId || '미기록'}</p><Status status={row.status} /></div>
      <p className="mt-1 break-all text-[12px] text-boss-text-secondary">{row.userId || '아이디 미기록'}</p>
      <p className="mt-3 break-all text-[13px] text-boss-text">{row.productName || '상품명 미기록'}</p>
      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 text-[12px]">
        <div className="min-w-0"><dt className="text-boss-text-muted">{subscription ? '시작일' : '거래일'}</dt><dd className="mt-1 break-words text-boss-text">{first}</dd></div>
        <div className="min-w-0"><dt className="text-boss-text-muted">{subscription ? '만료일' : '금액 · 통화'}</dt><dd className="mt-1 break-words text-boss-text">{second}</dd></div>
        <div className="col-span-2 min-w-0"><dt className="text-boss-text-muted">기록 번호</dt><dd className="mt-1 break-all text-boss-text-secondary">{row.id}</dd></div>
      </dl>
    </li>
  );
}
