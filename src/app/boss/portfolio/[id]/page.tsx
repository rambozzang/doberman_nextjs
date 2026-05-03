'use client';

// 사장님 포트폴리오 상세
// Flutter `lib/app/portfolio/portfolio_detail_page.dart` 와 동일 동작:
// - 공개/비공개 토글 (PUT /portfolios/{id}/toggle-public)
// - 삭제 (DELETE /portfolios/{id})
// - 시공 전/후 이미지 그리드, 외부 링크 카드
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem, PortfolioExternalLink } from '@/types/boss-portfolio';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  MapPin,
  Ruler,
  Calendar,
  Wallet,
  Building2,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react';

function normalizeIsPublic(v: BossPortfolioItem['isPublic']): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toUpperCase() === 'Y';
  return true;
}

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

function moneyFormat(n?: number | null): string {
  if (n == null) return '-';
  return n.toLocaleString('ko-KR') + '원';
}

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

type Tab = 'before' | 'after';

export default function BossPortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [item, setItem] = useState<BossPortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('after');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossPortfolioApi.detail(custId, id);
        if (cancelled) return;
        if (res.success && res.data) {
          setItem(res.data);
        } else {
          setError(res.message || '포트폴리오를 찾을 수 없습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 포트폴리오를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isPublic = item ? normalizeIsPublic(item.isPublic) : true;
  const { before, after } = useMemo(
    () => (item ? splitImages(item) : { before: [], after: [] }),
    [item],
  );
  const links: PortfolioExternalLink[] = useMemo(
    () => item?.links ?? item?.externalLinks ?? [],
    [item],
  );

  const handleToggle = async () => {
    if (!item) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setToggling(true);
    try {
      const res = await bossPortfolioApi.togglePublic(item.id, custId);
      if (res.success) {
        setItem({ ...item, isPublic: !isPublic });
        toast.success(!isPublic ? '공개로 전환되었습니다' : '비공개로 전환되었습니다');
      } else {
        toast.error(res.message || '상태 변경에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?\n삭제된 포트폴리오는 복구할 수 없습니다.')) {
      return;
    }
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossPortfolioApi.remove(item.id, custId);
      if (res.success) {
        toast.success('포트폴리오가 삭제되었습니다');
        router.push('/boss/portfolio');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Loader2 size={20} className="mr-2 animate-spin" /> 불러오는 중...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link
          href="/boss/portfolio"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 포트폴리오로 돌아가기
        </Link>
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error || '포트폴리오를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const images = tab === 'before' ? before : after;

  return (
    <div className="space-y-5">
      {/* 상단 바 */}
      <div className="flex items-center justify-between">
        <Link
          href="/boss/portfolio"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPublic ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
            {isPublic ? '비공개로 전환' : '공개로 전환'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 text-sm text-rose-300 hover:border-rose-700 hover:text-rose-200 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            삭제
          </button>
        </div>
      </div>

      {/* 헤더 카드 */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="relative aspect-[21/9] w-full bg-slate-950">
          {after[0] || before[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={after[0] || before[0]}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-700">
              <ImageIcon size={64} />
            </div>
          )}
          <div className="absolute left-4 top-4">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                isPublic
                  ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 ring-slate-600/40'
              }`}
            >
              {isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
              {isPublic ? '공개' : '비공개'}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h1 className="mb-2 text-2xl font-bold text-white">{item.title}</h1>
          {item.description && (
            <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-400">
              {item.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-sm md:grid-cols-3 lg:grid-cols-6">
            <InfoCell icon={<Building2 size={14} />} label="건물 유형" value={item.buildingType} />
            <InfoCell icon={<MapPin size={14} />} label="지역" value={item.region} />
            <InfoCell
              icon={<Ruler size={14} />}
              label="면적"
              value={item.area != null ? `${Math.round(item.area)}평` : null}
            />
            <InfoCell icon={<Layers size={14} />} label="벽지" value={item.wallpaperType} />
            <InfoCell icon={<Wallet size={14} />} label="비용" value={moneyFormat(item.cost)} />
            <InfoCell icon={<Calendar size={14} />} label="작업일" value={formatDate(item.workDate)} />
          </div>
        </div>
      </div>

      {/* 이미지 탭 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-1 border-b border-slate-800 px-3">
          <TabButton
            active={tab === 'before'}
            onClick={() => setTab('before')}
            label={`시공 전 (${before.length})`}
          />
          <TabButton
            active={tab === 'after'}
            onClick={() => setTab('after')}
            label={`시공 후 (${after.length})`}
          />
        </div>
        <div className="p-4">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center text-slate-500">
              <ImageIcon size={36} className="mb-2" />
              <p className="text-sm">등록된 사진이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((src, idx) => (
                <a
                  key={`${src}-${idx}`}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${tab}-${idx}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 외부 링크 */}
      {links.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <ExternalLink size={14} className="text-emerald-300" />
            외부 포트폴리오 링크
            <span className="text-xs font-normal text-slate-500">({links.length})</span>
          </h2>
          <ul className="space-y-2">
            {links.map((link, idx) => (
              <li key={`${link.url}-${idx}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-slate-500">
                    {link.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={link.thumbnailUrl} alt="thumb" className="h-full w-full object-cover" />
                    ) : (
                      <ExternalLink size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-100">
                      {link.title || '외부 링크'}
                    </p>
                    <p className="line-clamp-1 text-xs text-slate-500">{link.url}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-500" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 신규 등록 안내 */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/boss/portfolio/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <Pencil size={14} /> 새 포트폴리오 등록
        </Link>
      </div>
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-inset ring-slate-800">
      <div className="mb-1 flex items-center gap-1 text-[11px] text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="truncate text-sm font-medium text-slate-200">{value || '-'}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3 text-sm transition-colors ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
      {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-emerald-400" />}
    </button>
  );
}
