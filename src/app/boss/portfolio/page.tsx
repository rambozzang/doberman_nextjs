'use client';

// 사장님 포트폴리오 목록 (그리드 갤러리)
// Flutter `lib/app/portfolio/portfolio_list_page.dart` 의 기능을
// B2B 다크 톤으로 재구성한다. 실 API: GET /portfolios/{custId}
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem } from '@/types/boss-portfolio';
import {
  Image as ImageIcon,
  Search,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  MapPin,
  Ruler,
  Calendar,
  Inbox,
  Link as LinkIcon,
  ArrowUpRight,
} from 'lucide-react';

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

export default function BossPortfolioListPage() {
  const [items, setItems] = useState<BossPortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortType>('CREATED_DT');

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
    list.sort((a, b) => {
      const aKey = sort === 'WORK_DATE' ? a.workDate ?? '' : a.createdAt ?? '';
      const bKey = sort === 'WORK_DATE' ? b.workDate ?? '' : b.createdAt ?? '';
      return bKey.localeCompare(aKey);
    });
    return list;
  }, [items, keyword, sort]);

  const publicCount = useMemo(
    () => items.filter((i) => normalizeIsPublic(i.isPublic)).length,
    [items],
  );

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">시공 포트폴리오</h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {items.length.toLocaleString()}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              공개 {publicCount}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            완료한 시공 사례를 모아 고객에게 전문성을 어필하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="제목·지역·유형 검색"
              className="h-9 w-56 rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
          <div className="flex h-9 items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSort('CREATED_DT')}
              className={`h-8 rounded-md px-3 ${
                sort === 'CREATED_DT' ? 'bg-slate-800 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              등록일순
            </button>
            <button
              type="button"
              onClick={() => setSort('WORK_DATE')}
              className={`h-8 rounded-md px-3 ${
                sort === 'WORK_DATE' ? 'bg-slate-800 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              시공일순
            </button>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/portfolio/new"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <Plus size={14} /> 신규 등록
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 컨텐츠 */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40"
            />
          ))}
        </div>
      ) : sortedFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">등록된 포트폴리오가 없습니다</p>
          <p className="mt-1 text-xs text-slate-500">새 시공 사례를 등록해 갤러리를 채워보세요.</p>
          <Link
            href="/boss/portfolio/new"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <Plus size={14} /> 포트폴리오 등록
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedFiltered.map((item) => {
            const isPublic = normalizeIsPublic(item.isPublic);
            const thumb = getThumbnail(item);
            const { before, after } = splitImages(item);
            const linkCount = (item.links ?? item.externalLinks ?? []).length;
            return (
              <Link
                key={item.id}
                href={`/boss/portfolio/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                {/* 썸네일 */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-700">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                        isPublic
                          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-300 ring-slate-600/40'
                      }`}
                    >
                      {isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                      {isPublic ? '공개' : '비공개'}
                    </span>
                  </div>
                  <div className="absolute left-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight size={16} className="text-emerald-300" />
                  </div>
                </div>

                {/* 본문 */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-1 text-base font-semibold text-white">
                    {item.title || '제목 없음'}
                  </h3>
                  <p className="mb-3 line-clamp-1 text-xs text-slate-400">
                    {item.description || '설명 없음'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin size={12} className="text-slate-500" />
                      <span className="truncate">{item.region ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Ruler size={12} className="text-slate-500" />
                      <span className="truncate">
                        {item.area != null ? `${Math.round(item.area)}평` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar size={12} className="text-slate-500" />
                      <span className="truncate">{formatDate(item.workDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <ImageIcon size={12} className="text-slate-500" />
                      <span className="truncate">
                        전 {before.length} / 후 {after.length}
                        {linkCount > 0 && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-slate-500">
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
      )}
    </div>
  );
}
