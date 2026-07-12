'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
} from '@/components/boss/ui';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem, OrderSortType } from '@/types/boss';
import { RefreshCw, Inbox, Phone, FilePlus } from 'lucide-react';

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
  const [keyword, setKeyword] = useState('');

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
    return () => { cancelled = true; };
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
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          icon={RefreshCw}
          size="sm"
          onClick={() => router.refresh()}
          disabled={loading}
        >
          새로고침
        </Button>
        <div className="ml-auto">
          <Link href="/boss/orders/quick">
            <Button variant="primary" icon={FilePlus} size="sm">
              빠른 주문
            </Button>
          </Link>
        </div>
      </Toolbar>

      <ListTabs
        tabs={SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label }))}
        active={sortType}
        onChange={(key) => { setSortType(key); setPage(1); }}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 주문이 없습니다"
          description="조건을 변경하거나 새 주문을 등록해 보세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>고객명</th>
              <th className="whitespace-nowrap">전화</th>
              <th>주소</th>
              <th className="whitespace-nowrap">작업일</th>
              <th className="text-right whitespace-nowrap">금액</th>
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
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">#{item.id}</td>
                  <td className="font-medium text-boss-text">{item.name ?? '-'}</td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {item.phone ?? '-'}
                  </td>
                  <td className="max-w-[240px]">
                    <span className="block truncate text-boss-text-secondary">
                      {fullAddr || '-'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {item.workDate ?? item.estimateDate ?? '-'}
                  </td>
                  <td className="text-right font-medium text-boss-primary whitespace-nowrap">
                    {formatMoney(item.totalAmount)}
                  </td>
                  <td>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    {item.phone ? (
                      <a
                        href={`tel:${item.phone}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-boss-text-secondary transition-colors hover:bg-boss-elevated hover:text-boss-text"
                        title="전화"
                      >
                        <Phone size={14} />
                      </a>
                    ) : null}
                  </td>
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
