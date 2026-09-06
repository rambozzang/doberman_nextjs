'use client';

// 고객 목록 — Industry 패턴 (참조 leads 표)
// - 화면 제목 · 부제 · "고객 등록" 버튼은 셸 헤더(nav.ts PAGE_META)가 담당한다
// - 필터 한 줄: 정렬 탭(ListTabs) + 헤더 검색 + 우측 "전체 n건"
// - 목록은 표, 숫자 · 날짜 · 금액은 Barlow Condensed 우측 정렬
// - 마지막 행은 점선 CTA 로 등록 화면 진입, 로딩은 행 높이를 유지한 스켈레톤

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  ButtonLink,
  ListTabs,
  DataTable,
  Tag,
  Segmented,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  AlertBanner,
  DashedCta,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import { CUSTOMER_LIST_TABS, customerStatus } from '@/lib/boss/customerStatus';
import { formatAppDateTime, maskPhoneForList } from '@/lib/boss/format';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem, OrderSortType } from '@/types/boss';
import { RefreshCw, Phone, Plus } from 'lucide-react';

const SORT_OPTIONS: { key: OrderSortType; label: string }[] = [
  { key: 'CREATED_DT', label: '등록일' },
  { key: 'ESTIMATE_DATE', label: '견적일' },
  { key: 'WORK_DATE', label: '작업일' },
  { key: 'TODAY', label: '오늘' },
];


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
  // 앱 고객 리스트의 탭: 전체 '' · 진행중 00 · 수금중 01 · 수금완료 10 — 서버가 거른다
  const [statusCd, setStatusCd] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);

  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('고객명 · 전화 · 주소');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossOrdersApi.list({ page: page - 1, size: 24, sortType, statusCd: statusCd || undefined });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 1);
          setTotalCount(res.data.totalCount ?? (res.data.content?.length ?? 0));
        } else {
          setError(res.message || '고객 목록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 고객 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, sortType, statusCd, reloadKey]);

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
  const isSearching = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 한 줄 — 상태 탭(앱과 동일) · 정렬 · (헤더 검색) · 우측 건수 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          ariaLabel="진행 상태"
          tabs={CUSTOMER_LIST_TABS.map((t) => ({ key: t.key, label: t.label }))}
          active={statusCd as '' | '00' | '01' | '10'}
          onChange={(key) => {
            setStatusCd(key);
            setPage(1);
          }}
        />
        <span className="boss-mono-label">정렬</span>
        <Segmented
          ariaLabel="정렬 기준"
          options={SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label }))}
          value={sortType}
          onChange={(key) => {
            setSortType(key);
            setPage(1);
          }}
        />
        {isSearching && (
          <span className="text-[12px] text-boss-text-secondary">
            <span className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-primary">
              {filteredCount}
            </span>
            건 일치 · 현재 페이지 안에서만 찾습니다
          </span>
        )}
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading ? '불러오는 중…' : `전체 ${totalCount.toLocaleString('ko-KR')}건`}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => setReloadKey((v) => v + 1)}
          disabled={loading}
        >
          새로고침
        </Button>
      </div>

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
        <div className="boss-card-content">
          <RowSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="고객 목록을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도하세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setReloadKey((v) => v + 1)}>
                다시 시도
              </Button>
            }
          />
        ) : isSearching ? (
          <EmptyState
            title="검색어에 맞는 고객이 없습니다"
            description="검색은 현재 페이지 안에서만 적용됩니다. 다른 페이지나 정렬로 바꿔 보세요."
          />
        ) : (
          <EmptyState
            title="아직 등록된 고객이 없습니다"
            description="첫 고객을 등록하면 견적서 · 체크리스트 · 시공 기록을 이 고객에 이어서 남길 수 있습니다."
            action={
              <ButtonLink href="/boss/customers/new" variant="primary" size="sm" icon={Plus}>
                고객 등록
              </ButtonLink>
            }
          />
        )
      ) : (
        <div>
          <DataTable className="border-b-0">
            <thead>
              <tr>
                <th>번호</th>
                <th>고객</th>
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
                const status = customerStatus(item.statusCd, item.workDate);
                const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/boss/customers/${item.id}`)}
                  >
                    <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                      {item.id}
                    </td>
                    <td className="font-semibold text-boss-text">{item.name ?? '-'}</td>
                    <td className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
                      {maskPhoneForList(item.phone)}
                    </td>
                    <td className="max-w-[240px]">
                      <span className="block truncate text-boss-text-secondary">
                        {fullAddr || '-'}
                      </span>
                    </td>
                    <td className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
                      {formatAppDateTime(item.workDate ?? item.estimateDate)}
                      {item.workDate && item.workEndDate && item.workEndDate !== item.workDate && (
                        <span className="block text-[11px] text-boss-text-muted">
                          ~ {formatAppDateTime(item.workEndDate)}
                        </span>
                      )}
                    </td>
                    <td className="num font-semibold text-boss-text">
                      {formatMoney(item.totalAmount)}
                    </td>
                    <td>
                      <Tag tone={status.tone}>{status.label}</Tag>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text"
                            title="전화"
                            aria-label={`${item.name ?? '고객'}에게 전화`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={14} strokeWidth={1.75} />
                          </a>
                        ) : null}
                        <RowActions
                          editLabel="상세"
                          onEdit={() => router.push(`/boss/customers/${item.id}`)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>

          {/* 마지막 행 = 점선 CTA → 등록 화면으로 직접 진입 */}
          <DashedCta href="/boss/customers/new" className="border-t-0">
            <Plus size={13} /> 새 고객 등록
          </DashedCta>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
