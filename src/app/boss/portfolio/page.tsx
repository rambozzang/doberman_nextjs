'use client';

// 사장님 포트폴리오 목록
// Flutter `lib/app/portfolio/portfolio_list_page.dart` 의 기능을
// B2B 다크 톤으로 재구성한다. 실 API: GET /portfolios/{custId}
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem } from '@/types/boss-portfolio';
import {
  Image as ImageIcon,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  MapPin,
  Ruler,
  Calendar,
  Inbox,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Toolbar,
  Button,
  ListTabs,
  DataTable,
  Card,
  Badge,
  StatCard,
  StatusPill,
  MetricBox,
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

  return (
    <div className="flex flex-col gap-3.5">
      {/* 시안 채널 화면: KPI → 섹션 헤더 → 카드 그리드 */}
      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        <StatCard
          label="등록된 사례"
          value={items.length.toLocaleString()}
          delta={publicCount > 0 ? `공개 ${publicCount}` : undefined}
          deltaTone="ok"
          hint="전체 포트폴리오"
          loading={loading}
        />
        <StatCard
          label="비공개"
          value={privateCount.toLocaleString()}
          delta={privateCount > 0 ? '노출 안 됨' : undefined}
          deltaTone="warn"
          hint="고객에게 보이지 않습니다"
          loading={loading}
        />
        <StatCard
          label="공개율"
          value={`${items.length > 0 ? Math.round((publicCount / items.length) * 100) : 0}%`}
          hint="공개 사례가 많을수록 문의가 늘어납니다"
          loading={loading}
        />
      </section>

      <ListTabs
        tabs={[
          { key: 'all', label: '전체', count: items.length },
          { key: 'public', label: '공개', count: publicCount },
          { key: 'private', label: '비공개', count: privateCount },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Toolbar>
        <Segmented
          value={sort}
          onChange={(k) => setSort(k as typeof sort)}
          options={[
            { key: 'CREATED_DT', label: '등록일순' },
            { key: 'WORK_DATE', label: '시공일순' },
          ]}
        />
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
          새로고침
        </Button>
        <p className="text-[11.5px] text-boss-text-muted">
          공개 사례는 고객 검색 결과에 노출됩니다
        </p>
        <div className="ml-auto flex items-center gap-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg border border-boss-border" />
            ))}
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>포트폴리오</th>
                <th>지역</th>
                <th>평형</th>
                <th>시공일</th>
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
      ) : sortedFiltered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Inbox}
            title={keyword || tab !== 'all' ? '검색 결과가 없습니다' : '등록된 포트폴리오가 없습니다'}
            description={keyword || tab !== 'all' ? '조건을 변경해 다시 검색하세요.' : '새 시공 사례를 등록해 포트폴리오를 시작하세요.'}
            action={
              <Link href="/boss/portfolio/new" passHref>
                <Button variant="primary" icon={Plus}>
                  포트폴리오 등록
                </Button>
              </Link>
            }
          />
        </Card>
      ) : view === 'grid' ? (
        // 시안 채널 카드 그리드: repeat(auto-fill, minmax(268px,1fr)) / gap 11px
        <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-[11px]">
          {sortedFiltered.map((item) => {
            const isPublic = normalizeIsPublic(item.isPublic);
            const thumb = getThumbnail(item);
            const { before, after } = splitImages(item);
            const linkCount = (item.links ?? item.externalLinks ?? []).length;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-[11px] rounded-frame border border-boss-border bg-boss-surface p-3.5 transition-colors duration-[120ms] ease-out hover:border-boss-border-card-hover"
              >
                {/* 헤더: 썸네일 칩 + 제목/설명 + 상태 배지 */}
                <div className="flex items-start gap-2.5">
                  <Link
                    href={`/boss/portfolio/${item.id}`}
                    className="boss-placeholder h-[42px] w-[42px] flex-none overflow-hidden rounded-chip"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-boss-text-muted">
                        <ImageIcon size={16} />
                      </span>
                    )}
                  </Link>
                  <Link href={`/boss/portfolio/${item.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold !text-boss-text">
                      {item.title || '제목 없음'}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] !text-boss-text-muted">
                      {item.region ?? '지역 미입력'}
                      {item.area != null && ` · ${Math.round(item.area)}평`}
                    </p>
                  </Link>
                  <StatusPill tone={isPublic ? 'ok' : 'neutral'}>
                    {isPublic ? '공개' : '비공개'}
                  </StatusPill>
                </div>

                {/* 3칸 지표 — 시안 채널 카드 stats */}
                <div className="grid grid-cols-3 gap-[7px]">
                  <MetricBox label="시공 전" value={before.length} />
                  <MetricBox label="시공 후" value={after.length} />
                  <MetricBox label="링크" value={linkCount} />
                </div>

                {/* 하단: 노트 + 액션 */}
                <div className="flex items-center gap-[7px] text-[11px] text-boss-text-muted">
                  <span className="min-w-0 flex-1 truncate">
                    {formatDate(item.workDate)} 시공
                  </span>
                  <RowActions
                    onEdit={() => router.push(`/boss/portfolio/${item.id}`)}
                    onDelete={() => setPendingDelete(item)}
                    deleting={deleting && pendingDelete?.id === item.id}
                  />
                </div>
              </div>
            );
          })}

          {/* 마지막 점선 카드 — 시안 `+ 새 플랫폼 연결` */}
          <DashedCta href="/boss/portfolio/new" className="min-h-[148px] !rounded-frame">
            <Plus size={13} /> 새 시공 사례 등록
          </DashedCta>
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>포트폴리오</th>
              <th>지역</th>
              <th>평형</th>
              <th>시공일</th>
              <th>이미지</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.map((item) => {
              const isPublic = normalizeIsPublic(item.isPublic);
              const { before, after } = splitImages(item);
              const linkCount = (item.links ?? item.externalLinks ?? []).length;
              return (
                <tr key={item.id} className="cursor-pointer">
                  <td>
                    <Link
                      href={`/boss/portfolio/${item.id}`}
                      className="block font-medium text-boss-text hover:text-boss-primary"
                    >
                      {item.title || '제목 없음'}
                    </Link>
                    {item.description && (
                      <p className="line-clamp-1 text-xs text-boss-text-muted">{item.description}</p>
                    )}
                  </td>
                  <td className="text-boss-text-secondary">{item.region ?? '-'}</td>
                  <td className="text-boss-text-secondary">
                    {item.area != null ? `${Math.round(item.area)}평` : '-'}
                  </td>
                  <td className="text-boss-text-secondary">{formatDate(item.workDate)}</td>
                  <td className="text-boss-text-secondary">
                    전 {before.length} / 후 {after.length}
                    {linkCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-boss-text-muted">
                        <LinkIcon size={10} /> {linkCount}
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge tone={isPublic ? 'emerald' : 'default'}>
                      {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                      {isPublic ? '공개' : '비공개'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <RowActions
                      onEdit={() => router.push(`/boss/portfolio/${item.id}`)}
                      onDelete={() => setPendingDelete(item)}
                      deleting={deleting && pendingDelete?.id === item.id}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 삭제 확인 모달 */}
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
