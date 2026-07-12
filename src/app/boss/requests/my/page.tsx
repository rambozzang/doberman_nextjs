'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
} from '@/components/boss/ui';
import { RefreshCw, Inbox } from 'lucide-react';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'violet';

function statusBadge(status?: string) {
  const s = (status ?? '').toLowerCase();
  if (s.includes('new') || s.includes('신규') || s.includes('대기')) {
    return { label: status || '신규', tone: 'emerald' as BadgeTone };
  }
  if (s.includes('progress') || s.includes('진행')) {
    return { label: status || '진행', tone: 'sky' as BadgeTone };
  }
  if (s.includes('done') || s.includes('완료')) {
    return { label: status || '완료', tone: 'violet' as BadgeTone };
  }
  return { label: status || '답변 완료', tone: 'default' as BadgeTone };
}

export default function BossMyRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossRequestsApi.myList({ page: targetPage - 1, size: 24 });
      if (res.success && res.data) {
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 1);
      } else {
        setError(res.message || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.region, it.buildingType, it.customerName, it.constructionLocation, it.preferredDate]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="내가 답변한 견적"
        description="제출한 견적 답변과 진행 상황을 확인하세요."
        breadcrumbs={[{ label: '견적 요청', href: '/boss/requests' }, { label: '내 답변' }]}
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="지역·건물·고객 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => (page === 1 ? load(1) : setPage(1))}
          disabled={loading}
        >
          새로고침
        </Button>
      </Toolbar>

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
          title="아직 답변한 견적이 없습니다"
          description="견적 요청에 답변하면 여기에 표시됩니다."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>유형</th>
              <th>지역</th>
              <th className="whitespace-nowrap">희망일</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = statusBadge(item.status);
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/requests/${item.id}`)}
                >
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">#{item.id}</td>
                  <td>
                    <span className="font-medium text-boss-text">
                      {item.buildingType ?? '견적 요청'}
                    </span>
                    {item.areaSize ? (
                      <span className="ml-1 text-boss-text-secondary">· {item.areaSize}㎡</span>
                    ) : null}
                    {item.roomCount ? (
                      <span className="ml-1 text-xs text-boss-text-muted">/ 방 {item.roomCount}개</span>
                    ) : null}
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {item.preferredDate ?? '-'}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/boss/requests/${item.id}`)}
                    >
                      상세
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      ) : isFiltering ? (
        <div className="flex justify-end border-t border-boss-border pt-3">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            현재 페이지 내 필터
          </span>
        </div>
      ) : null}
    </div>
  );
}
