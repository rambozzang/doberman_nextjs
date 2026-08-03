'use client';

// 주문 관리 — onGo 리디자인 시안의 목록 패턴
// - 화면 제목/부제/주요 액션은 상단바(BossHeader)가 담당하므로 페이지 내 헤더는 두지 않는다
// - 목록은 카드가 아닌 테이블 행, 숫자는 모노 우측 정렬
// - 마지막 행은 점선 CTA로 등록 화면 진입
// - 로딩은 행 높이를 유지한 스켈레톤

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Toolbar,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  AlertBanner,
  DashedCta,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem, OrderSortType } from '@/types/boss';
import { RefreshCw, Inbox, Phone, Plus } from 'lucide-react';

const SORT_OPTIONS: { key: OrderSortType; label: string }[] = [
  { key: 'CREATED_DT', label: '등록일' },
  { key: 'ESTIMATE_DATE', label: '견적일' },
  { key: 'WORK_DATE', label: '작업일' },
  { key: 'TODAY', label: '오늘' },
];

function orderStatus(code?: string) {
  const c = (code ?? '').toUpperCase();
  if (c.includes('NEW') || c.includes('대기')) return { label: '대기', tone: 'default' as const };
  if (c.includes('CONFIRM') || c.includes('확정')) return { label: '확정', tone: 'emerald' as const };
  if (c.includes('PROGRESS') || c.includes('진행')) return { label: '진행', tone: 'sky' as const };
  if (c.includes('DONE') || c.includes('완료')) return { label: '완료', tone: 'violet' as const };
  if (c.includes('CANCEL') || c.includes('취소')) return { label: '취소', tone: 'rose' as const };
  return { label: code || '신규', tone: 'default' as const };
}

function formatMoney(n?: number) {
  if (!n) return '-';
  return '₩' + n.toLocaleString('ko-KR');
}

export default function BossOrderListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossOrderItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<OrderSortType>('CREATED_DT');
  const [reloadKey, setReloadKey] = useState(0);

  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('고객명 · 전화 · 주소');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossOrdersApi.list({ page: page - 1, size: 24, sortType });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 1);
          setTotalCount(res.data.totalCount ?? (res.data.content?.length ?? 0));
        } else {
          setError(res.message || '주문 목록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 주문 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, sortType, reloadKey]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.name, it.phone, it.address1, it.address2, it.memo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [items, keyword]);

  const filteredCount = filtered.length;

  return (
    <div className="flex flex-col gap-3.5">
      <Toolbar>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => setReloadKey((v) => v + 1)}
          disabled={loading}
        >
          새로고침
        </Button>
        {keyword && (
          <span className="text-[11px] text-boss-text-muted">
            <span className="font-boss-mono text-boss-primary">{filteredCount}</span> 건 일치 ·
            현재 페이지 내 검색
          </span>
        )}
        <span className="ml-auto font-boss-mono text-[10.5px] text-boss-text-muted">
          전체 {totalCount.toLocaleString('ko-KR')}
        </span>
      </Toolbar>

      <ListTabs
        tabs={SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label }))}
        active={sortType}
        onChange={(key) => {
          setSortType(key);
          setPage(1);
        }}
      />

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => setReloadKey((v) => v + 1)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-card border border-boss-border bg-boss-surface">
          <RowSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 주문이 없습니다"
          description="조건을 변경하거나 새 주문을 등록해 보세요."
          action={
            <Button variant="primary" icon={Plus} onClick={() => router.push('/boss/orders/quick')}>
              주문 등록
            </Button>
          }
        />
      ) : (
        <div>
          <DataTable className="rounded-b-none border-b-0">
            <thead>
              <tr>
                <th>#</th>
                <th>고객명</th>
                <th>전화</th>
                <th>주소</th>
                <th>작업일</th>
                <th className="text-right">금액</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = orderStatus(item.statusCd);
                const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/boss/orders/${item.id}`)}
                  >
                    <td className="whitespace-nowrap font-boss-mono text-[11px] text-boss-text-muted">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap font-semibold text-boss-text">
                      {item.name ?? '-'}
                    </td>
                    <td className="whitespace-nowrap font-boss-mono text-[12px] text-boss-text-secondary">
                      {item.phone ?? '-'}
                    </td>
                    <td className="max-w-[240px]">
                      <span className="block truncate text-boss-text-secondary">
                        {fullAddr || '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-boss-mono text-[12px] text-boss-text-secondary">
                      {item.workDate ?? item.estimateDate ?? '-'}
                      {item.workDate && item.workEndDate && item.workEndDate !== item.workDate && (
                        <span className="block text-[10px] text-boss-text-muted">
                          ~ {item.workEndDate}
                        </span>
                      )}
                    </td>
                    <td className="num whitespace-nowrap font-semibold text-boss-text">
                      {formatMoney(item.totalAmount)}
                    </td>
                    <td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] !text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text"
                            title="전화"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={14} />
                          </a>
                        ) : null}
                        <RowActions onEdit={() => router.push(`/boss/orders/${item.id}`)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>

          {/* 마지막 행 = 점선 CTA → 등록 화면으로 직접 진입 */}
          <DashedCta href="/boss/orders/quick" className="rounded-t-none border-t-0">
            <Plus size={13} /> 새 주문 등록
          </DashedCta>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
