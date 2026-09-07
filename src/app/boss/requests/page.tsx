'use client';

// 견적 요청 목록 — Industry 패턴 (참조 leads 표)
// 화면 제목 · 부제 · "내 답변" 버튼은 셸 헤더(nav.ts PAGE_META)가 담당한다.
// 필터 한 줄: 상태 탭(ListTabs) + 헤더 검색 + 우측 "전체 n건". 목록은 표, 행 CTA 는 답변 화면으로 바로 진입.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
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
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';
import { useBossPortal } from '@/components/boss/layout/BossPortalContext';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import RegionPicker from '@/components/boss/RegionPicker';
import { formatRegions, matchesMyRegions, isNationwide } from '@/lib/boss/regions';
import toast from 'react-hot-toast';
import { MapPin, RefreshCw } from 'lucide-react';

type StatusFilter = 'all' | 'new' | 'progress' | 'done';
type BadgeTone = 'default' | 'emerald' | 'sky' | 'violet';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'progress', label: '진행 중' },
  { key: 'done', label: '완료' },
];

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

export default function BossRequestListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<StatusFilter>('all');

  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('지역 · 건물 · 고객');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossRequestsApi.list({ page: targetPage - 1, size: 24 });
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

  // ── 내 견적 수신 지역 ──
  // 사장님에게 가장 중요한 정보다: 어느 지역 요청을 받을 수 있는지.
  const { company, refreshCompany } = useBossPortal();
  const myRegions = company?.region ?? '';
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSaving, setRegionSaving] = useState(false);
  const [onlyMyRegion, setOnlyMyRegion] = useState(true);

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

  useEffect(() => {
    void load(page);
  }, [load, page]);

  useEffect(() => {
    setPage(1);
  }, [tab, keyword, onlyMyRegion]);

  const filtered = useMemo(() => {
    let list = items;
    // 내 수신 지역 밖의 요청은 답변해도 매칭되기 어렵다 — 기본으로 걸러 준다
    if (onlyMyRegion && myRegions) {
      list = list.filter((it) => matchesMyRegions(it.region, myRegions));
    }
    if (tab !== 'all') {
      list = list.filter((it) => {
        const s = (it.status ?? '').toLowerCase();
        if (tab === 'new') return s.includes('new') || s.includes('신규') || s.includes('대기') || !s;
        if (tab === 'progress') return s.includes('progress') || s.includes('진행');
        if (tab === 'done') return s.includes('done') || s.includes('완료');
        return true;
      });
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((it) =>
        [it.region, it.buildingType, it.constructionLocation, it.wallpaper]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    return list;
  }, [items, tab, keyword, onlyMyRegion, myRegions]);

  const counts = useMemo(() => {
    const c = { all: items.length, new: 0, progress: 0, done: 0 };
    items.forEach((it) => {
      const s = (it.status ?? '').toLowerCase();
      if (s.includes('progress') || s.includes('진행')) c.progress++;
      else if (s.includes('done') || s.includes('완료')) c.done++;
      else c.new++;
    });
    return c;
  }, [items]);

  const isFiltering = tab !== 'all' || keyword.trim().length > 0;

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
          tabs={STATUS_TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
          active={tab}
          onChange={setTab}
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
            title="견적 요청을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도하세요. 서버 응답이 없으면 잠시 후에 다시 열어 주세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => load(page)}>
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
        {/* 폰: 표를 옆으로 밀지 않게 카드로 */}
        <ul className="flex flex-col border border-boss-border lg:hidden">
          {filtered.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <li key={`m-${item.id}`} className="border-b border-boss-border-row last:border-b-0">
                <button
                  type="button"
                  onClick={() => router.push(`/boss/requests/${item.id}`)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-boss-elevated"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-boss-text">
                        {item.region ?? '지역 미지정'}
                      </span>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-boss-text-secondary">
                      {[item.buildingType, item.constructionLocation].filter(Boolean).join(' · ') || '유형 미지정'}
                    </p>
                    <p className="mt-0.5 truncate font-boss-head text-[11.5px] tabular-nums text-boss-text-muted">
                      희망 {item.preferredDate ?? '-'} · 접수 {relativeTime(item.requestDate ?? item.createdDt)}
                    </p>
                  </div>
                  <span className="boss-btn boss-btn-sm boss-btn-secondary shrink-0">답변</span>
                </button>
              </li>
            );
          })}
        </ul>

        <DataTable className="hidden lg:block">
          <thead>
            <tr>
              <th>번호</th>
              <th>유형</th>
              <th>지역</th>
              <th>희망일</th>
              <th>상태</th>
              <th className="text-right">답변</th>
              <th>접수</th>
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
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {item.id}
                  </td>
                  <td>
                    <span className="font-semibold text-boss-text">
                      {item.buildingType ?? '견적 요청'}
                    </span>
                    {item.areaSize ? (
                      <span className="ml-1.5 font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                        {item.areaSize}㎡
                      </span>
                    ) : null}
                    {item.roomCount ? (
                      <span className="ml-1.5 text-[12px] text-boss-text-secondary">
                        방 {item.roomCount}개
                      </span>
                    ) : null}
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                    {item.preferredDate ?? '-'}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="num text-boss-text-secondary">
                    {typeof item.answerCount === 'number' && item.answerCount > 0
                      ? item.answerCount
                      : '-'}
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {relativeTime(item.createdDt ?? item.requestDate)}
                  </td>
                  <td className="text-right">
                    <RowActions
                      editLabel="답변"
                      onEdit={() => router.push(`/boss/requests/${item.id}/answer`)}
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
