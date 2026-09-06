'use client';

// 사장님 포트폴리오 목록 — Industry 패턴
// Flutter `lib/app/portfolio/portfolio_list_page.dart` 의 기능. 실 API: GET /portfolios/{custId}
//
// 사진이 주인공인 유일한 목록이라 카드 그리드를 허용한다 — 사각 썸네일(4:3) + 아래 제목 · 메타 · 태그.
// hover 는 테두리만 진해진다. 필터 줄 한 줄: ListTabs(공개 상태) + 정렬 Seg + 우측 "전체 n건".
// 검색은 헤더 검색(`/`)을 그대로 쓴다. 표 보기(ViewToggle)도 남긴다.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem } from '@/types/boss-portfolio';
import { Image as ImageIcon, RefreshCw, Plus, Link as LinkIcon } from 'lucide-react';
import {
  Toolbar,
  Button,
  ButtonLink,
  ListTabs,
  DataTable,
  StatusPill,
  TagPill,
  DashedCta,
  AlertBanner,
  Segmented,
  EmptyState,
  Skeleton,
  ViewToggle,
  RowActions,
  ConfirmDialog,
} from '@/components/boss/ui';
import { useBossSearch } from '@/components/boss/layout/BossSearchContext';

// 응답이 'Y'/'N' 또는 boolean 두 형태로 모두 올 수 있어 통일
function normalizeIsPublic(v: BossPortfolioItem['isPublic']): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toUpperCase() === 'Y';
  return true;
}

// 응답에서 BEFORE/AFTER 이미지를 분리
function splitImages(item: BossPortfolioItem): { before: string[]; after: string[] } {
  if (item.images && item.images.length > 0) {
    const sorted = [...item.images].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    return {
      before: sorted.filter((i) => i.imageType === 'BEFORE').map((i) => i.filePath),
      after: sorted.filter((i) => i.imageType === 'AFTER').map((i) => i.filePath),
    };
  }
  return {
    before: item.beforeImages ?? [],
    after: item.afterImages ?? [],
  };
}

function getThumbnail(item: BossPortfolioItem): string | null {
  const { before, after } = splitImages(item);
  if (after.length > 0) return after[0];
  if (before.length > 0) return before[0];
  const links = item.links ?? item.externalLinks ?? [];
  const linkThumb = links.find((l) => l.thumbnailUrl)?.thumbnailUrl;
  return linkThumb ?? null;
}

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

type SortType = 'CREATED_DT' | 'WORK_DATE';
type TabType = 'all' | 'public' | 'private';
type ViewType = 'grid' | 'list';

export default function BossPortfolioListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossPortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 상단바 검색(`/` 로 포커스)을 이 화면에 연결한다
  const { query: keyword } = useBossSearch('제목 · 지역 · 유형');
  const [sort, setSort] = useState<SortType>('CREATED_DT');
  const [tab, setTab] = useState<TabType>('all');
  const [view, setView] = useState<ViewType>('grid');
  const [pendingDelete, setPendingDelete] = useState<BossPortfolioItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 포트폴리오 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (!target) return;
    const custId = BossAuthManager.getUserInfo()?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossPortfolioApi.remove(target.id, custId);
      if (res.success) {
        toast.success('포트폴리오를 삭제했습니다.');
        setItems((prev) => prev.filter((it) => it.id !== target.id));
        setPendingDelete(null);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const load = async () => {
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossPortfolioApi.list(custId);
      if (res.success && res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || '포트폴리오를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 포트폴리오를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedFiltered = useMemo(() => {
    let list = [...items];
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((it) =>
        [it.title, it.region, it.buildingType, it.wallpaperType]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    if (tab !== 'all') {
      list = list.filter((it) =>
        tab === 'public' ? normalizeIsPublic(it.isPublic) : !normalizeIsPublic(it.isPublic),
      );
    }
    list.sort((a, b) => {
      const aKey = sort === 'WORK_DATE' ? a.workDate ?? '' : a.createdAt ?? '';
      const bKey = sort === 'WORK_DATE' ? b.workDate ?? '' : b.createdAt ?? '';
      return bKey.localeCompare(aKey);
    });
    return list;
  }, [items, keyword, sort, tab]);

  const publicCount = useMemo(
    () => items.filter((i) => normalizeIsPublic(i.isPublic)).length,
    [items],
  );
  const privateCount = items.length - publicCount;

  // 첫 조회 실패(아무것도 못 받음)와 0건은 다르게 말한다
  const failedEmpty = !!error && items.length === 0;
  const filtered = keyword.trim().length > 0 || tab !== 'all';

  return (
    <div className="flex flex-col gap-3.5">
      {/* 필터 줄 — 참조 06-leads: Seg + … + 우측 건수 */}
      <Toolbar>
        <ListTabs
          tabs={[
            { key: 'all', label: '전체', count: items.length },
            { key: 'public', label: '공개', count: publicCount },
            { key: 'private', label: '비공개', count: privateCount },
          ]}
          active={tab}
          onChange={setTab}
        />
        <Segmented
          ariaLabel="정렬"
          value={sort}
          onChange={(k) => setSort(k as typeof sort)}
          options={[
            { key: 'CREATED_DT', label: '등록일순' },
            { key: 'WORK_DATE', label: '시공일순' },
          ]}
        />
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
          새로고침
        </Button>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
            {filtered && !loading
              ? `${sortedFiltered.length.toLocaleString()}건 표시 · 전체 ${items.length.toLocaleString()}건`
              : `전체 ${items.length.toLocaleString()}건`}
          </span>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </Toolbar>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={load}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="boss-card">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="flex flex-col gap-2 p-3.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>사례</th>
                <th>지역</th>
                <th className="num">평형</th>
                <th className="num">시공일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton className="h-4 w-40" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-16" /></td>
                  <td><Skeleton className="h-4 w-20" /></td>
                  <td><Skeleton className="h-4 w-14" /></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )
      ) : failedEmpty ? (
        // 실패는 위 AlertBanner 가 말한다 — 여기서 "없다"고 하면 거짓말이 된다
        <EmptyState
          icon={ImageIcon}
          title="목록을 불러오지 못했습니다"
          description="네트워크나 로그인 상태를 확인한 뒤 다시 시도해 주세요."
        />
      ) : sortedFiltered.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={ImageIcon}
            title="조건에 맞는 사례가 없습니다"
            description="다른 상태 탭을 고르거나 검색어를 지워 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setTab('all')}>
                전체 보기
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ImageIcon}
            title="아직 등록한 시공 사례가 없습니다"
            description="시공 전·후 사진을 올리면 고객 검색 결과에 노출됩니다. 첫 사례를 등록해 보세요."
            action={
              <ButtonLink href="/boss/portfolio/new" variant="primary" icon={Plus}>
                새 사례 등록
              </ButtonLink>
            }
          />
        )
      ) : view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {sortedFiltered.map((item) => {
            const isPublic = normalizeIsPublic(item.isPublic);
            const thumb = getThumbnail(item);
            const { before, after } = splitImages(item);
            const linkCount = (item.links ?? item.externalLinks ?? []).length;
            const href = `/boss/portfolio/${item.id}`;
            return (
              <article
                key={item.id}
                className="boss-card flex flex-col transition-colors duration-[120ms] ease-out hover:border-boss-border-hover"
              >
                {/* 사각 썸네일 4:3 — 시공 후 사진이 대표 */}
                <Link
                  href={href}
                  className="boss-placeholder relative block aspect-[4/3] w-full overflow-hidden border-b border-boss-border"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-boss-text-muted">
                      <ImageIcon size={18} strokeWidth={1.5} />
                      <span className="font-boss-head text-[11px] uppercase tracking-[0.08em]">
                        사진 없음
                      </span>
                    </span>
                  )}
                  <span className="absolute left-2 top-2">
                    <StatusPill tone={isPublic ? 'ok' : 'neutral'}>
                      {isPublic ? '공개' : '비공개'}
                    </StatusPill>
                  </span>
                </Link>

                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  <Link href={href} className="min-w-0">
                    <p className="truncate text-[14px] font-bold !text-boss-text">
                      {item.title || '제목 없음'}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] !text-boss-text-secondary">
                      {item.region ?? '지역 미입력'}
                      {item.area != null && (
                        <>
                          {' · '}
                          <span className="font-boss-head tabular-nums">{Math.round(item.area)}</span>평
                        </>
                      )}
                      {' · '}
                      <span className="font-boss-head tabular-nums">{formatDate(item.workDate)}</span>
                    </p>
                  </Link>

                  <div className="flex flex-wrap items-center gap-1">
                    {item.buildingType && <TagPill>{item.buildingType}</TagPill>}
                    {item.wallpaperType && <TagPill>{item.wallpaperType}</TagPill>}
                  </div>

                  <div className="mt-auto flex items-center gap-2 border-t border-boss-border-row pt-2 text-[11.5px] text-boss-text-muted">
                    <span className="font-boss-head tabular-nums">
                      전 {before.length} · 후 {after.length}
                    </span>
                    {linkCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-boss-head tabular-nums">
                        <LinkIcon size={10} /> {linkCount}
                      </span>
                    )}
                    <span className="ml-auto">
                      <RowActions
                        onEdit={() => router.push(href)}
                        onDelete={() => setPendingDelete(item)}
                        deleting={deleting && pendingDelete?.id === item.id}
                        editLabel="보기"
                      />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* 마지막 점선 슬롯 — 다음 사례 등록 */}
          <DashedCta href="/boss/portfolio/new" className="min-h-[200px]">
            <Plus size={13} /> 새 시공 사례 등록
          </DashedCta>
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>사례</th>
              <th>유형</th>
              <th>지역</th>
              <th className="num">평형</th>
              <th className="num">시공일</th>
              <th className="num">사진</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.map((item) => {
              const isPublic = normalizeIsPublic(item.isPublic);
              const { before, after } = splitImages(item);
              const linkCount = (item.links ?? item.externalLinks ?? []).length;
              const href = `/boss/portfolio/${item.id}`;
              return (
                <tr key={item.id}>
                  <td className="wrap">
                    <Link href={href} className="block font-semibold !text-boss-text hover:!text-boss-primary">
                      {item.title || '제목 없음'}
                    </Link>
                    {item.description && (
                      <p className="line-clamp-1 text-[12px] text-boss-text-muted">{item.description}</p>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex flex-wrap gap-1">
                      {item.buildingType && <TagPill>{item.buildingType}</TagPill>}
                      {item.wallpaperType && <TagPill>{item.wallpaperType}</TagPill>}
                      {!item.buildingType && !item.wallpaperType && (
                        <span className="text-boss-text-muted">-</span>
                      )}
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="num">{item.area != null ? Math.round(item.area) : '-'}</td>
                  <td className="num">{formatDate(item.workDate)}</td>
                  <td className="num">
                    {before.length} / {after.length}
                    {linkCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-boss-text-muted">
                        <LinkIcon size={10} /> {linkCount}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusPill tone={isPublic ? 'ok' : 'neutral'}>
                      {isPublic ? '공개' : '비공개'}
                    </StatusPill>
                  </td>
                  <td className="text-right">
                    <RowActions
                      onEdit={() => router.push(href)}
                      onDelete={() => setPendingDelete(item)}
                      deleting={deleting && pendingDelete?.id === item.id}
                      editLabel="보기"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="포트폴리오 삭제"
        description={`'${pendingDelete?.title ?? '선택한 포트폴리오'}'을(를) 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
