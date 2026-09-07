'use client';

// 내 답변 목록 — Industry 패턴 (참조 leads 표)
// 화면 제목 · "← 견적 요청" 링크는 셸 헤더가 그린다.
// 필터 한 줄: 검색 + 우측 "전체 n건". 목록은 표.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  AlertBanner,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';
import { formatPreferredDate, requestSummary } from '@/lib/boss/requestFormat';
import { RefreshCw } from 'lucide-react';

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
      [it.region, it.buildingType, it.constructionLocation, it.preferredDate]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 한 줄 — 검색 · 우측 건수 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="지역 · 건물 · 고객"
          hint={false}
          className="w-full sm:w-[260px]"
        />
        {isFiltering && (
          <span className="text-[12px] text-boss-text-secondary">
            <span className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-primary">
              {filtered.length}
            </span>
            건 일치 · 현재 페이지 안에서만 거릅니다
          </span>
        )}
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading ? '불러오는 중…' : `전체 ${items.length.toLocaleString('ko-KR')}건`}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => (page === 1 ? load(1) : setPage(1))}
          disabled={loading}
        >
          새로고침
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load(page)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        <div className="boss-card-content">
          <RowSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="답변 목록을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도하세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => load(page)}>
                다시 시도
              </Button>
            }
          />
        ) : isFiltering ? (
          <EmptyState
            title="검색어에 맞는 답변이 없습니다"
            description="검색은 현재 페이지 안에서만 적용됩니다. 검색어를 지우면 전체가 보입니다."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색어 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="아직 답변한 견적이 없습니다"
            description="견적 요청에 답변을 보내면 여기에 쌓입니다. 신규 요청부터 확인해 보세요."
            action={
              <ButtonLink href="/boss/requests" variant="primary" size="sm">
                견적 요청 보기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>접수</th>
              <th>지역</th>
              <th>요청 내용</th>
              <th>희망일</th>
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
                  <td>
                    <ListDateCell at={item.requestDate ?? item.createdDt} id={item.id} />
                  </td>
                  <td className="font-semibold text-boss-text">{item.region ?? '-'}</td>
                  <td className="wrap max-w-[360px] text-boss-text">
                    {requestSummary(item) || '-'}
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                    {formatPreferredDate(item.preferredDate)}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="text-right">
                    <RowActions
                      editLabel="상세"
                      onEdit={() => router.push(`/boss/requests/${item.id}`)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
