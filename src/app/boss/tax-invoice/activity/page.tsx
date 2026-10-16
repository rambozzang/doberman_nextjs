'use client';

// 세금계산서 알림 — 내 발급 · 국세청 전송 · 취소 결과, 권한 심사 결과, 인증서 만료 안내
//
// 전체 / 안 읽음 · 쪽 넘김 · 새로고침. 행을 열면 읽음으로 표시하고 그 문서(없으면 발급 서비스 등록)로 간다.
// 첫 쪽을 보는 동안에는 정해진 횟수만 다시 읽고(화면이 가려지면 멈춤), 화면으로 돌아오면 한 번 더 읽는다.
// 출시 값과 상관없이 열린다(알림 읽기는 팝빌을 부르지 않는다). 계정이 바뀌면 새로 그린다.
// 화면 제목은 셸 헤더(nav.ts PAGE_META)가 그린다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing, RefreshCw } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { totalPages } from '@/lib/boss/taxInvoiceOps';
import { useBoundedRefresh } from '@/lib/boss/useBoundedRefresh';
import { ActivityRows, useActivityReader } from '@/components/boss/taxinvoice/ActivityList';
import { Note } from '@/components/boss/taxinvoice/RegistrationParts';
import type { TaxInvoiceActivityPage } from '@/types/boss-taxinvoice';
import { AlertBanner, Button, ButtonLink, ContentCard, EmptyState, ListTabs, Pagination, RowSkeleton, Skeleton, Tag } from '@/components/boss/ui';

const PAGE_SIZE = 20;
type Filter = 'all' | 'unread';

export default function TaxInvoiceActivityPage() {
  const scope = useBossScope();
  if (!scope) return <Skeleton className="h-64" />;
  return <ActivityScreen key={scope} scope={scope} />;
}

function ActivityScreen({ scope }: { scope: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TaxInvoiceActivityPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<{ notDeployed: boolean; message: string } | null>(null);
  const seq = useRef(0);

  const load = useCallback(
    async (p: number, f: Filter) => {
      const my = ++seq.current;
      setLoading(true);
      try {
        const r = await bossTaxInvoiceApi.activity(p, PAGE_SIZE, f === 'unread');
        if (my !== seq.current || !isCurrentScope(scope)) return;
        if (r.ok) {
          setData(r.data);
          setPage(p);
          setFailure(null);
        } else {
          // 권한이 없으면 받아 둔 알림도 지운다(일반 연결 실패만 마지막 알림을 남긴다)
          if (r.failure === 'forbidden') setData(null);
          setFailure({ notDeployed: r.failure === 'not-deployed', message: r.message });
        }
      } finally {
        if (my === seq.current) setLoading(false);
      }
    },
    [scope],
  );

  useEffect(() => {
    void load(0, filter);
    return () => {
      seq.current += 1;
    };
  }, [load, filter]);

  // 첫 쪽만 — 넘겨 보던 쪽이 바뀌지 않게
  useBoundedRefresh({ enabled: page === 0 && failure?.notDeployed !== true, run: () => load(0, filter) });

  const { reading, error, markRead } = useActivityReader(scope, (a) => {
    setData((d) =>
      d
        ? {
            ...d,
            items: filter === 'unread' ? d.items.filter((x) => x.id !== a.id) : d.items.map((x) => (x.id === a.id ? a : x)),
            totalElements: filter === 'unread' ? Math.max(0, d.totalElements - 1) : d.totalElements,
            unreadCount: d.unreadCount == null ? null : Math.max(0, d.unreadCount - 1),
          }
        : d,
    );
  });

  const pages = data ? totalPages(data.totalElements, PAGE_SIZE) : 1;

  if (failure?.notDeployed && !data) {
    return (
      <EmptyState
        icon={BellRing}
        title="알림 모아 보기를 준비하고 있습니다"
        description="발급 결과 · 권한 심사 · 인증서 만료 안내를 이 화면에서 모아 볼 수 있게 됩니다."
        action={
          <ButtonLink href="/boss/tax-invoice/registration" variant="secondary" size="sm">
            발급 서비스 등록 보기
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          ariaLabel="알림 구분"
          tabs={[
            { key: 'all', label: '전체' },
            { key: 'unread', label: '안 읽음' },
          ]}
          active={filter}
          onChange={(f) => {
            setData(null);
            setFilter(f);
          }}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {data?.unreadCount ? <Tag tone="info">안 읽음 {data.unreadCount}</Tag> : null}
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : data ? `${data.totalElements.toLocaleString()}건` : ''}
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading} onClick={() => void load(page, filter)}>
            새로고침
          </Button>
        </div>
      </div>

      {failure && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load(page, filter)}>
              다시 시도
            </Button>
          }
        >
          {failure.message}
          {data ? ' 아래는 마지막으로 불러온 알림입니다.' : ''}
        </AlertBanner>
      )}
      {error && <Note tone="warn" live>{error}</Note>}

      {loading && !data ? (
        <ContentCard>
          <RowSkeleton rows={5} />
        </ContentCard>
      ) : !data ? null : data.items.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={filter === 'unread' ? '안 읽은 알림이 없습니다' : '아직 받은 알림이 없습니다'}
          description="권한 심사 결과 · 발급 결과 · 국세청 전송 · 인증서 만료 안내가 생기면 여기와 앱에서 알려 드립니다."
        />
      ) : (
        <div className="boss-card px-4 py-1">
          <ActivityRows items={data.items} reading={reading} onRead={(a) => void markRead(a)} />
        </div>
      )}
      {data && data.totalElements > PAGE_SIZE && (
        <Pagination page={page + 1} totalPages={pages} disabled={loading} onChange={(p) => void load(p - 1, filter)} />
      )}
    </div>
  );
}
