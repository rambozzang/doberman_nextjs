'use client';

// 사장님 포트폴리오 목록
// Flutter `lib/app/portfolio/portfolio_list_page.dart` 의 기능을
// B2B 다크 톤으로 재구성한다. 실 API: GET /portfolios/{custId}
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Card,
  Badge,
  EmptyState,
  Skeleton,
  ViewToggle,
} from '@/components/boss/ui';

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
  const [items, setItems] = useState<BossPortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortType>('CREATED_DT');
  const [tab, setTab] = useState<TabType>('all');
  const [view, setView] = useState<ViewType>('grid');

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
    <div className="space-y-4">
      <PageHeader
        title="시공 포트폴리오"
        description="완료한 시공 사례를 관리하고 고객에게 전문성을 어필하세요."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>
              새로고침
            </Button>
            <Link href="/boss/portfolio/new" passHref>
              <Button variant="primary" icon={Plus}>
                신규 등록
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <p className="text-xs text-boss-text-muted">전체</p>
          <p className="mt-1 text-lg font-semibold text-boss-text">{items.length.toLocaleString()}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-boss-text-muted">공개</p>
          <p className="mt-1 text-lg font-semibold text-boss-primary">{publicCount.toLocaleString()}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-boss-text-muted">비공개</p>
          <p className="mt-1 text-lg font-semibold text-boss-text">{privateCount.toLocaleString()}</p>
        </Card>
      </div>

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
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·지역·유형 검색"
          className="w-60"
        />
        <div className="flex items-center rounded-md border border-boss-border bg-boss-bg p-0.5">
          <button
            type="button"
            onClick={() => setSort('CREATED_DT')}
            className={`h-7 rounded-sm px-2.5 text-xs ${
              sort === 'CREATED_DT'
                ? 'bg-boss-elevated font-medium text-boss-text'
                : 'text-boss-text-muted hover:text-boss-text-secondary'
            }`}
          >
            등록일순
          </button>
          <button
            type="button"
            onClick={() => setSort('WORK_DATE')}
            className={`h-7 rounded-sm px-2.5 text-xs ${
              sort === 'WORK_DATE'
                ? 'bg-boss-elevated font-medium text-boss-text'
                : 'text-boss-text-muted hover:text-boss-text-secondary'
            }`}
          >
            시공일순
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedFiltered.map((item) => {
            const isPublic = normalizeIsPublic(item.isPublic);
            const thumb = getThumbnail(item);
            const { before, after } = splitImages(item);
            const linkCount = (item.links ?? item.externalLinks ?? []).length;
            return (
              <Link
                key={item.id}
                href={`/boss/portfolio/${item.id}`}
                className="block overflow-hidden rounded-lg border border-boss-border bg-boss-surface transition-colors hover:border-boss-border-strong"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-boss-elevated">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute right-2.5 top-2.5">
                    <Badge tone={isPublic ? 'emerald' : 'default'}>
                      {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                      {isPublic ? '공개' : '비공개'}
                    </Badge>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-boss-text">
                    {item.title || '제목 없음'}
                  </h3>
                  <p className="line-clamp-1 text-xs text-boss-text-muted">
                    {item.description || '설명 없음'}
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-boss-border pt-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-boss-text-secondary">
                      <MapPin size={12} className="text-boss-text-muted" />
                      <span className="truncate">{item.region ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-boss-text-secondary">
                      <Ruler size={12} className="text-boss-text-muted" />
                      <span className="truncate">
                        {item.area != null ? `${Math.round(item.area)}평` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-boss-text-secondary">
                      <Calendar size={12} className="text-boss-text-muted" />
                      <span className="truncate">{formatDate(item.workDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-boss-text-secondary">
                      <ImageIcon size={12} className="text-boss-text-muted" />
                      <span className="truncate">
                        전 {before.length} / 후 {after.length}
                        {linkCount > 0 && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-boss-text-muted">
                            <LinkIcon size={10} /> {linkCount}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
