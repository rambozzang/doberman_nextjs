'use client';

// 견적 요청 목록 — Industry 패턴 (참조 leads 표)
// 화면 제목 · 부제 · "내 답변" 버튼은 셸 헤더(nav.ts PAGE_META)가 담당한다.
// 필터 한 줄: 상태 탭(ListTabs) + 헤더 검색 + 우측 "전체 n건". 목록은 표, 행 CTA 는 답변 화면으로 바로 진입.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import type {
  BossRequestTab,
  BossUnifiedRequestItem,
  BossUnifiedRequestSummary,
} from '@/types/boss';
import {
  Button,
  ButtonLink,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  AlertBanner,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import RegionPicker from '@/components/boss/RegionPicker';
import { formatRegions, matchesMyRegions, isNationwide } from '@/lib/boss/regions';
import toast from 'react-hot-toast';
import { MapPin, RefreshCw } from 'lucide-react';
import {
  formatReceivedAt,
  formatPreferredDate,
  isToday,
  requestSummary,
  stripBrackets,
} from '@/lib/boss/requestFormat';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';

type Filters = { page: number; tab: BossRequestTab; onlyMyRegion: boolean };
type Data = {
  items: BossUnifiedRequestItem[];
  totalPages: number;
  totalCount: number;
  summary: BossUnifiedRequestSummary;
};

// 탭 — "웹견적 요청"과 "나의 견적"을 한 화면에서 본다(2026-09-08).
// 같은 요청이 두 메뉴로 갈라져 있어 "내가 답변했는지" 를 보려면 메뉴를 오가야 했다.
// '전체' 를 맨 앞에 둔다 — 사장님이 가장 먼저 훑어보는 게 전체 흐름이다.
// '새 요청' 탭은 없앴다 — 배지 건수(상태=검토중 기준)와 실제 목록 건수(상태 무관 미답변 전체)가
// 서로 달라 혼란스러웠고, '전체' 에서도 미답변 여부가 배지로 바로 보여 굳이 따로 둘 필요가 없었다.
const TABS: { key: BossRequestTab; label: string; hint: string }[] = [
  { key: 'all', label: '전체', hint: '들어온 모든 요청' },
  { key: 'answered', label: '내가 답변함', hint: '내가 견적을 보낸 요청' },
  { key: 'adopted', label: '채택됨', hint: '고객이 내 견적을 고른 요청' },
];

/** 내 답변 상태 — 목록에서 이것만 보면 다음 할 일이 정해진다 */
function myAnswerBadge(item: BossUnifiedRequestItem): { label: string; tone: BadgeTone } {
  if (item.myAnswerYn !== 'Y') return { label: '미답변', tone: 'default' };
  const s = item.myAnswerStatus ?? '';
  if (s.includes('채택 성공')) return { label: '채택', tone: 'emerald' };
  if (s.includes('미채택')) return { label: '미채택', tone: 'rose' };
  return { label: '답변함', tone: 'sky' };
}

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
  return { label: status || '신규', tone: 'default' as BadgeTone };
}

export default function BossRequestListPage() {
  return (
    <Suspense fallback={null}>
      <RequestList />
    </Suspense>
  );
}

function RequestList() {
  const router = useRouter();
  const search = useSearchParams();
  // 답변 화면을 다녀왔으면 보던 탭 · 쪽 · 목록을 그대로 되살린다 (답변을 냈으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.requests), []);
  const [items, setItems] = useState<BossUnifiedRequestItem[]>(restored?.data.items ?? []);
  const [page, setPage] = useState(restored?.filters.page ?? 1);
  const [totalPages, setTotalPages] = useState(restored?.data.totalPages ?? 1);
  const [totalCount, setTotalCount] = useState(restored?.data.totalCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ?tab=answered 로 들어오면 그 탭으로 — 예전 "나의 견적" 링크가 여기로 온다
  // ?tab=new 처럼 이제 없는 탭으로 들어오면(오래된 링크·즐겨찾기·남아 있던 캐시) '전체' 로 보여 준다
  const [tab, setTab] = useState<BossRequestTab>(() => {
    const t = search.get('tab');
    if (t === 'answered' || t === 'adopted' || t === 'all') return t;
    const restoredTab = restored?.filters.tab;
    if (restoredTab === 'answered' || restoredTab === 'adopted' || restoredTab === 'all') return restoredTab;
    return 'all';
  });
  const [summary, setSummary] = useState<BossUnifiedRequestSummary>(restored?.data.summary ?? {});
  const [loaded, setLoaded] = useState(restored != null);
  // 되살린 첫 렌더에서는 다시 부르지 않는다
  const skipFirstLoad = useRef(restored != null);

  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('지역 · 건물 · 고객');

  const load = useCallback(
    async (targetPage: number, currentTab: BossRequestTab, myRegionOnly: boolean, kw: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: targetPage - 1,
          size: 24,
          tab: currentTab,
          myRegionOnly,
          keyword: kw.trim() || undefined,
        };
        const [listRes, sumRes] = await Promise.all([
          bossRequestsApi.unified(params),
          bossRequestsApi.unifiedSummary({ myRegionOnly }),
        ]);
        if (listRes.success !== false && listRes.data) {
          setItems(listRes.data.content ?? []);
          setTotalPages(Math.max(1, listRes.data.totalPages ?? 1));
          setTotalCount(listRes.data.totalCount ?? listRes.data.content?.length ?? 0);
        } else {
          setError(listRes.message || '목록을 불러오지 못했습니다.');
        }
        if (sumRes.success !== false && sumRes.data) setSummary(sumRes.data);
        if (listRes.success !== false && listRes.data) setLoaded(true);
      } catch {
        setError('네트워크 오류로 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── 내 견적 수신 지역 ──
  // 사장님에게 가장 중요한 정보다: 어느 지역 요청을 받을 수 있는지.
  const { company, refreshCompany } = useBossPortal();
  const myRegions = company?.region ?? '';
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSaving, setRegionSaving] = useState(false);
  const [onlyMyRegion, setOnlyMyRegion] = useState(restored?.filters.onlyMyRegion ?? true);

  const saveRegions = async (regions: string) => {
    const companyId = company?.id ?? BossAuthManager.getUserInfo()?.companyId;
    if (!companyId) {
      toast.error('회사 정보가 없습니다. 설정에서 회사를 먼저 등록해 주세요.');
      return;
    }
    setRegionSaving(true);
    try {
      const res = await bossCompanyApi.updateRegion(companyId, regions);
      if (res.success !== false) {
        toast.success('견적 수신 지역을 저장했습니다.');
        setRegionOpen(false);
        refreshCompany?.();
      } else {
        toast.error(res.message || res.error || '지역을 저장하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 지역을 저장하지 못했습니다.');
    } finally {
      setRegionSaving(false);
    }
  };

  // 탭 · 지역범위 · 검색어(필터)와 페이지를 한 effect 에서 함께 다룬다.
  //
  // 예전엔 "필터가 바뀌면 1쪽으로" 를 별도 effect 로 뒀었다. 탭을 누르면 두 effect 가
  // 거의 동시에 fetch 를 쐈다 — 하나는 (예전 페이지, 새 탭), 하나는 (1쪽, 새 탭). 두 요청이
  // 응답 순서가 뒤바뀌면(예전 페이지 쪽이 늦게 도착) 화면엔 "1쪽" 이라고 표시된 채 다른 쪽
  // 데이터가 남아 접수 순서가 뒤죽박죽으로 보였다.
  //
  // 필터가 바뀐 프레임에서는 절대 fetch 하지 않고 setPage(1) 만 하고 되돌아간다 — 페이지가
  // 바뀌면 이 effect 가 다시 돌고, 그때는 filtersChanged 가 false 이므로 정확히 한 번만 부른다.
  const prevFilters = useRef({ tab, onlyMyRegion, keyword });
  useEffect(() => {
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      prevFilters.current = { tab, onlyMyRegion, keyword };
      return;
    }

    const filtersChanged =
      prevFilters.current.tab !== tab ||
      prevFilters.current.onlyMyRegion !== onlyMyRegion ||
      prevFilters.current.keyword !== keyword;
    prevFilters.current = { tab, onlyMyRegion, keyword };

    if (filtersChanged) {
      // 탭 · 검색 조건을 바꾼 순간, 이전 탭 목록이 새 데이터가 올 때까지 화면에 남아 있으면
      // "접수 순서가 이상하게 보인다" — 다른 탭 데이터가 잠깐 얹혀 있는 것뿐인데 뒤섞인
      // 것처럼 읽힌다. 곧바로 비워서 로딩 표시로 넘긴다.
      setItems([]);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    void load(page, tab, onlyMyRegion, keyword);
  }, [load, page, tab, onlyMyRegion, keyword]);

  // 나갈 때를 위해 지금 조회조건 · 목록을 남겨 둔다
  useSaveListSnapshot<Filters, Data>(
    LIST_KEYS.requests,
    { page, tab, onlyMyRegion },
    { items, totalPages, totalCount, summary },
    loaded
  );

  // 거르기 · 세기는 서버가 한다 — 페이지를 넘겨도 어긋나지 않는다
  const filtered = items;
  const counts: Record<BossRequestTab, number | undefined> = {
    new: summary.newCount,
    answered: summary.answeredCount,
    adopted: summary.adoptedCount,
    all: summary.totalCount,
  };
  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 내 견적 수신 지역 — 이 지역의 요청만 알림이 오고, 답변해도 채택될 확률이 높다 */}
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 border px-4 py-3 ${
          myRegions ? 'border-boss-border bg-boss-surface' : 'border-boss-warning/40 bg-boss-warning/10'
        }`}
      >
        <MapPin size={15} strokeWidth={1.75} className="shrink-0 text-boss-text-secondary" />
        <span className="boss-mono-label">내 견적 수신 지역</span>
        {myRegions ? (
          <span className="text-[14px] font-semibold text-boss-text">{formatRegions(myRegions)}</span>
        ) : (
          <span className="text-[13px] font-semibold text-boss-warning">
            아직 지정하지 않았습니다 — 지역을 정해야 새 요청 알림을 받습니다
          </span>
        )}
        {isNationwide(myRegions) && (
          <span className="text-[12px] text-boss-text-secondary">
            모든 지역의 요청을 받습니다. 알림이 많으면 시 · 도를 골라 좁히세요.
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {myRegions ? (
            <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-boss-text-secondary">
              <input
                type="checkbox"
                checked={onlyMyRegion}
                onChange={(e) => setOnlyMyRegion(e.target.checked)}
              />
              내 지역만 보기
            </label>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => setRegionOpen(true)}>
            지역 {myRegions ? '변경' : '설정'}
          </Button>
        </div>
      </div>

      <RegionPicker
        open={regionOpen}
        value={myRegions}
        saving={regionSaving}
        onCancel={() => setRegionOpen(false)}
        onSave={(r) => void saveRegions(r)}
      />

      {/* 필터 한 줄 — 상태 탭 · (헤더 검색) · 우측 건수 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
          active={tab}
          onChange={(k) => setTab(k as BossRequestTab)}
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
          onClick={() => (page === 1 ? load(1, tab, onlyMyRegion, keyword) : setPage(1))}
          disabled={loading}
        >
          새로고침
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load(page, tab, onlyMyRegion, keyword)}>
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
            title="견적 요청을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도하세요. 서버 응답이 없으면 잠시 후에 다시 열어 주세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => load(page, tab, onlyMyRegion, keyword)}>
                다시 시도
              </Button>
            }
          />
        ) : isFiltering ? (
          <EmptyState
            title="조건에 맞는 견적 요청이 없습니다"
            description="다른 상태 탭을 고르거나 검색어를 지워 보세요. 필터는 현재 페이지 안에서만 적용됩니다."
            action={
              <Button variant="secondary" size="sm" onClick={() => setTab('all')}>
                전체 보기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="아직 들어온 견적 요청이 없습니다"
            description="고객이 견적을 요청하면 여기에 쌓입니다. 포트폴리오를 채워 두면 요청이 늘어납니다."
            action={
              <ButtonLink href="/boss/portfolio" variant="secondary" size="sm">
                포트폴리오 관리
              </ButtonLink>
            }
          />
        )
      ) : (
        <>
        {/* 폰: 표를 옆으로 밀지 않게 카드로 — 접수 시각과 NEW 를 맨 앞에 둔다 */}
        <ul className="flex flex-col border border-boss-border lg:hidden">
          {filtered.map((item) => {
            const mine = myAnswerBadge(item);
            const at = item.requestDate ?? item.createdDt;
            const fresh = isToday(at);
            return (
              <li key={`m-${item.id}`} className="border-b border-boss-border-row last:border-b-0">
                <button
                  type="button"
                  onClick={() => router.push(`/boss/requests/${item.id}`)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-boss-elevated"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-boss-head text-[12.5px] font-semibold tabular-nums text-boss-text">
                        {formatReceivedAt(at)}
                      </span>
                      {fresh && <Badge tone="emerald">NEW</Badge>}
                      <Badge tone={mine.tone}>{mine.label}</Badge>
                    </div>
                    <p className="mt-1 truncate text-[14px] font-semibold text-boss-text">
                      {item.region ?? '지역 미지정'}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] text-boss-text-secondary">
                      {requestSummary(item) || '요청 내용 미기재'}
                    </p>
                    <p className="mt-0.5 truncate font-boss-head text-[11.5px] tabular-nums text-boss-text-muted">
                      희망 {formatPreferredDate(item.preferredDate)} · 답변 {item.answerCount ?? 0}건
                      {item.myAnswerCost ? ` · 내 견적 ₩${item.myAnswerCost.toLocaleString('ko-KR')}` : ''}
                    </p>
                  </div>
                  <span className="boss-btn boss-btn-sm boss-btn-secondary shrink-0">
                    {item.myAnswerYn === 'Y' ? '내 답변' : '답변'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <DataTable className="hidden lg:block">
          <thead>
            <tr>
              <th>접수</th>
              <th>지역</th>
              <th>요청 내용</th>
              <th>희망일</th>
              <th>내 답변</th>
              <th className="text-right">내 견적</th>
              <th className="text-right">답변 수</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const mine = myAnswerBadge(item);
              const at = item.requestDate ?? item.createdDt;
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/requests/${item.id}`)}
                >
                  {/* 접수 시각을 맨 앞에 — 사장님은 새 요청부터 본다 */}
                  <td>
                    <ListDateCell at={at} id={item.id} />
                  </td>
                  <td className="font-semibold text-boss-text">{item.region ?? '-'}</td>
                  <td className="wrap max-w-[360px]">
                    <span className="text-boss-text">{requestSummary(item) || '-'}</span>
                    {item.specialInfo ? (
                      <span className="block text-[11.5px] text-boss-text-muted">
                        {stripBrackets(item.specialInfo)}
                      </span>
                    ) : null}
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                    {formatPreferredDate(item.preferredDate)}
                  </td>
                  <td>
                    <Badge tone={mine.tone}>{mine.label}</Badge>
                  </td>
                  <td className="num text-boss-text">
                    {item.myAnswerCost ? `₩${item.myAnswerCost.toLocaleString('ko-KR')}` : '-'}
                  </td>
                  <td className="num text-boss-text-secondary">{item.answerCount ?? 0}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      editLabel={item.myAnswerYn === 'Y' ? '내 답변' : '답변'}
                      onEdit={() =>
                        router.push(
                          item.myAnswerYn === 'Y'
                            ? `/boss/requests/${item.id}`
                            : `/boss/requests/${item.id}/answer`
                        )
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
        </>
      )}

      {!isFiltering && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}
