'use client';

// 시공 기록 상세 페이지
// Flutter `construction_record_detail_page.dart` 포팅
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Link2,
  ImageIcon,
  CheckCircle2,
  Clock3,
  X,
  ChevronLeft,
  ChevronRight,
  Hammer,
} from 'lucide-react';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';

type TabKey = 'BEFORE' | 'DURING' | 'AFTER';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'BEFORE', label: '시공 전' },
  { key: 'DURING', label: '시공 중' },
  { key: 'AFTER', label: '시공 후' },
];

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function BossConstructionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [item, setItem] = useState<ConstructionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('BEFORE');
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 단건 상세 엔드포인트가 없어 list 호출 후 id로 필터링한다 (Flutter도 동일 패턴)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = BossAuthManager.getJwtPayload();
      const custId = payload?.sub;
      if (!custId) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await bossConstructionApi.list(custId);
        if (cancelled) return;
        if (res.success && res.data) {
          const list = (res.data as unknown[]).map((r) => normalizeConstructionRecord(r));
          const found = list.find((x) => String(x.id) === String(id));
          if (found) setItem(found);
          else setError('시공 기록을 찾을 수 없습니다.');
        } else {
          setError(res.message || '시공 기록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 시공 기록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentImages = useMemo(() => {
    if (!item) return [] as string[];
    if (tab === 'BEFORE') return item.beforeImages;
    if (tab === 'DURING') return item.duringImages;
    return item.afterImages;
  }, [item, tab]);

  const totalImages = item
    ? item.beforeImages.length + item.duringImages.length + item.afterImages.length
    : 0;

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('이 시공 기록을 삭제하시겠습니까?\n삭제된 시공 기록은 복구할 수 없습니다.')) {
      return;
    }
    const payload = BossAuthManager.getJwtPayload();
    const custId = payload?.sub;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossConstructionApi.remove(item.id, custId);
      if (res.success !== false) {
        toast.success('시공 기록이 삭제되었습니다.');
        router.push('/boss/construction');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);
  const prevLightbox = () =>
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb,
    );
  const nextLightbox = () =>
    setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-800/60" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/40" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-800/40" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <Link
          href="/boss/construction"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록
        </Link>
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-4 text-sm text-rose-200">
          {error || '시공 기록을 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const isDone = item.status === '완료';

  return (
    <div className="space-y-5">
      {/* 상단 네비 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/boss/construction"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/boss/construction/new?edit=${item.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <Pencil size={14} /> 수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-800/70 bg-rose-950/40 px-3 text-sm text-rose-200 hover:border-rose-700 hover:text-white disabled:opacity-50"
          >
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      </div>

      {/* 헤더 카드 */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/70 px-5 py-4">
          <Hammer size={18} className="text-emerald-300" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 ring-amber-500/30'
                }`}
              >
                {isDone ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
                {item.status}
              </span>
              <span className="text-[11px] text-slate-500">#{String(item.id)}</span>
            </div>
            <h1 className="truncate text-xl font-bold text-white">{item.title || '제목 없음'}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={14} className="text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500">시공일</p>
              <p className="font-semibold">{formatDate(item.constructionDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ImageIcon size={14} className="text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500">전체 사진</p>
              <p className="font-semibold">{totalImages}장</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Link2 size={14} className="text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500">연결된 주문</p>
              <p className="font-semibold">{item.orderId ? `#${item.orderId}` : '연결 없음'}</p>
            </div>
          </div>
        </div>

        {item.description && (
          <div className="border-t border-slate-800 px-5 py-4">
            <p className="text-[10px] text-slate-500">시공 설명</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{item.description}</p>
          </div>
        )}
      </div>

      {/* 이미지 탭 */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-900/60 p-2">
          {TABS.map(({ key, label }) => {
            const count =
              key === 'BEFORE'
                ? item.beforeImages.length
                : key === 'DURING'
                  ? item.duringImages.length
                  : item.afterImages.length;
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-slate-950 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {currentImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                <ImageIcon size={20} />
              </div>
              <p className="text-sm text-slate-300">등록된 사진이 없습니다</p>
              <p className="mt-1 text-xs text-slate-500">
                수정 화면에서 {TABS.find((t) => t.key === tab)?.label} 사진을 추가하세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {currentImages.map((src, idx) => (
                <button
                  key={`${tab}-${idx}-${src}`}
                  type="button"
                  onClick={() => openLightbox(currentImages, idx)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${tab}-${idx}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightbox();
                }}
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                aria-label="이전"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightbox();
                }}
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                aria-label="다음"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.images[lightbox.index]}
            alt="시공 사진"
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}
