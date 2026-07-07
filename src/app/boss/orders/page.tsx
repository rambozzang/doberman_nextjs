'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Card,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
  ViewToggle,
} from '@/components/boss/ui';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem, OrderSortType } from '@/types/boss';
import {
  RefreshCw,
  Inbox,
  MapPin,
  Phone,
  Calendar,
  Wallet,
  ListChecks,
  Image as ImageIcon,
  FilePlus,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

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

function relativeTime(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function BossOrderListPage() {
  const [items, setItems] = useState<BossOrderItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [sortType, setSortType] = useState<OrderSortType>('CREATED_DT');
  const [keyword, setKeyword] = useState('');

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossOrdersApi.list({ page: page - 1, size: 24, sortType });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.totalCount ?? (res.data.content?.length ?? 0));
      } else {
        setError(res.message || '주문 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
  }, [page, sortType]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.name, it.phone, it.address1, it.address2, it.memo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0),
    [filtered],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="주문 관리"
        description="등록된 주문과 시공 일정을 조회·관리합니다."
        actions={
          <Link href="/boss/orders/quick">
            <Button variant="primary" icon={FilePlus} size="sm">
              주문 등록
            </Button>
          </Link>
        }
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="고객명·전화·주소"
          className="w-56"
        />
        <Button variant="secondary" icon={RefreshCw} size="sm" onClick={reload} disabled={loading}>
          새로고침
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <Link href="/boss/orders/quick">
            <Button variant="primary" icon={FilePlus} size="sm">
              빠른 주문
            </Button>
          </Link>
        </div>
      </Toolbar>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card padded={false} className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">총 주문</p>
          <p className="mt-1 text-base font-semibold text-boss-text">{totalCount.toLocaleString()}건</p>
        </Card>
        <Card padded={false} className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">필터 합계</p>
          <p className="mt-1 text-base font-semibold text-boss-primary">{formatMoney(totalAmount)}</p>
        </Card>
        <Card padded={false} className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">정렬 기준</p>
          <p className="mt-1 text-base font-semibold text-boss-text">
            {SORT_OPTIONS.find((s) => s.key === sortType)?.label ?? '-'}
          </p>
        </Card>
        <Card padded={false} className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">표시 중</p>
          <p className="mt-1 text-base font-semibold text-boss-text">{filtered.length}건</p>
        </Card>
      </div>

      <ListTabs
        tabs={SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label }))}
        active={sortType}
        onChange={(key) => {
          setSortType(key);
          setPage(1);
        }}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg border border-boss-border" />
            ))}
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                {['#', '고객', '전화', '주소', '작업일', '금액', '상태', '등록'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 주문이 없습니다"
          description="조건을 변경하거나 새 주문을 등록해 보세요."
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const status = orderStatus(item.statusCd);
            const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ') || '-';
            return (
              <Card key={item.id} padded={false} interactive className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {item.isExistChecklist === 'Y' && (
                    <Badge tone="amber">
                      <ListChecks size={10} /> 체크리스트
                    </Badge>
                  )}
                  {(item.imageCount ?? 0) > 0 && (
                    <Badge tone="default">
                      <ImageIcon size={10} /> {item.imageCount}
                    </Badge>
                  )}
                  <span className="ml-auto text-[11px] text-boss-text-muted">#{item.id}</span>
                </div>

                <h3 className="mb-0.5 line-clamp-1 text-sm font-semibold text-boss-text">
                  {item.name ?? '고객명 없음'}
                </h3>
                <p className="mb-2 line-clamp-1 text-xs text-boss-text-muted">{fullAddr}</p>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-boss-border pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Phone size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.phone ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <Calendar size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.workDate ?? item.estimateDate ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-boss-text-secondary">
                    <MapPin size={12} className="text-boss-text-muted" />
                    <span className="truncate">{item.post ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-boss-primary">
                    <Wallet size={12} />
                    <span className="truncate">{formatMoney(item.totalAmount)}</span>
                  </div>
                </div>

                <p className="mt-2 text-right text-[10px] text-boss-text-muted">{relativeTime(item.createdDt)}</p>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>#</th>
              <th>고객</th>
              <th>전화</th>
              <th>주소</th>
              <th>작업일</th>
              <th className="text-right">금액</th>
              <th>상태</th>
              <th>등록</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = orderStatus(item.statusCd);
              return (
                <tr key={item.id}>
                  <td className="text-xs text-boss-text-muted">#{item.id}</td>
                  <td className="font-medium text-boss-text">{item.name ?? '-'}</td>
                  <td className="text-boss-text-secondary">{item.phone ?? '-'}</td>
                  <td className="text-boss-text-secondary">
                    <span className="block max-w-[260px] truncate">
                      {[item.address1, item.address2].filter(Boolean).join(' ') || '-'}
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">{item.workDate ?? '-'}</td>
                  <td className="text-right font-medium text-boss-primary">{formatMoney(item.totalAmount)}</td>
                  <td>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="text-xs text-boss-text-muted">{relativeTime(item.createdDt)}</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
