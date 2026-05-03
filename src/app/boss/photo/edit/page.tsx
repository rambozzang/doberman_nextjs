'use client';

// 사장님 사진 편집 페이지
// Flutter `lib/app/image/image_edit_page.dart` 의 편집 기능 중 웹에 필요한 핵심만 포팅:
//   - 한 장씩 큰 화면으로 미리보기 (image_one_view_page.dart)
//   - 좌/우 이동 (image_list_view.dart)
//   - 단건 삭제 (DELETE /orders/files/{fileId})
//   - 순서 변경 (위/아래 이동) → PUT /orders/files 로 num 필드 갱신 후 저장은 갤러리 페이지에서
// (자유 그리기/치수선/텍스트 같은 캔버스 편집은 웹 범위에서 제외)

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { bossImageApi } from '@/lib/api/boss/image';
import {
  getPhotoTypeDisplayName,
  getRoomDisplayName,
  type BossImageDataInfo,
} from '@/types/boss-image';

export default function BossPhotoEditPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/[0.04]" />}>
      <BossPhotoEditInner />
    </Suspense>
  );
}

function BossPhotoEditInner() {
  const router = useRouter();
  const search = useSearchParams();
  const customerId = search.get('customerId') ?? '';

  const [items, setItems] = useState<BossImageDataInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);

  const load = async () => {
    if (!customerId) {
      setError('customerId 가 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossImageApi.list(customerId);
      if (Array.isArray(res.data)) {
        setItems(res.data);
        setCurrent(0);
      } else {
        setError(res.message || '이미지를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 이미지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const total = items.length;
  const active = useMemo(() => items[current], [items, current]);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const next = () => setCurrent((c) => (c < total - 1 ? c + 1 : c));

  // 단건 삭제
  const handleDelete = async () => {
    if (!active) return;
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;

    const serverFileId = active.num ?? active.fileKey;
    if (serverFileId !== undefined && serverFileId !== null) {
      try {
        const res = await bossImageApi.remove(String(serverFileId));
        if (!res.success) {
          toast.error(res.message || '삭제에 실패했습니다.');
          return;
        }
      } catch {
        toast.error('네트워크 오류로 삭제에 실패했습니다.');
        return;
      }
    }
    setItems((prevList) => prevList.filter((_, i) => i !== current));
    setCurrent((c) => Math.max(0, c - 1));
    toast.success('삭제되었습니다.');
  };

  // 순서 변경 (로컬)
  const moveUp = () => {
    if (current <= 0) return;
    setItems((prevList) => {
      const next = [...prevList];
      [next[current - 1], next[current]] = [next[current], next[current - 1]];
      return next;
    });
    setCurrent((c) => c - 1);
  };

  const moveDown = () => {
    if (current >= total - 1) return;
    setItems((prevList) => {
      const next = [...prevList];
      [next[current], next[current + 1]] = [next[current + 1], next[current]];
      return next;
    });
    setCurrent((c) => c + 1);
  };

  // 순서 저장 (num 필드 부여 후 PUT /orders/files 로 단건 업데이트, 또는 POST /orders/files 일괄)
  // 백엔드 호환성을 위해 일괄 저장(POST) 방식 사용
  const handleSaveOrder = async () => {
    if (!customerId) {
      toast.error('customerId 가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const ordered: BossImageDataInfo[] = items.map((it, i) => ({
        ...it,
        num: i + 1,
      }));
      const res = await bossImageApi.save({
        customerId,
        orderFiles: ordered,
      });
      if (res.success) {
        toast.success('순서가 저장되었습니다.');
        load();
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const path = active?.filePath ?? '';
  const canPreview = path.startsWith('http') || path.startsWith('data:');

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-300 hover:border-slate-700 hover:text-white"
            aria-label="뒤로"
          >
            <ArrowLeft size={14} />
          </button>
          <h1 className="text-xl font-bold text-white">사진 편집</h1>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
            {total === 0 ? 0 : current + 1} / {total}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={saving || total === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? '저장 중...' : '순서 저장'}
          </button>
          <Link
            href={`/boss/photo?customerId=${encodeURIComponent(customerId)}`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            갤러리로
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-20 text-center">
          <ImageIcon size={28} className="mb-3 text-slate-600" />
          <p className="text-sm text-slate-300">편집할 이미지가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* 메인 뷰어 */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <div className="relative flex aspect-video w-full items-center justify-center bg-black">
              {canPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={path}
                  alt={active?.fileNm ?? ''}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-600">
                  <ImageIcon size={36} />
                  <span className="mt-2 text-xs">미리보기 불가</span>
                </div>
              )}

              <button
                type="button"
                onClick={prev}
                disabled={current === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:opacity-30"
                aria-label="이전"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={current >= total - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:opacity-30"
                aria-label="다음"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-3">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  {getRoomDisplayName(active?.roomCategory)}
                </span>
                {' · '}
                <span>{getPhotoTypeDisplayName(active?.photoType)}</span>
                {active?.crtDtm && (
                  <span className="ml-2 text-slate-500">
                    {active.crtDtm.replace('T', ' ').slice(0, 16)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={moveUp}
                  disabled={current === 0}
                  className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowUp size={12} /> 위로
                </button>
                <button
                  type="button"
                  onClick={moveDown}
                  disabled={current >= total - 1}
                  className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowDown size={12} /> 아래로
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-8 items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 text-xs text-rose-200 hover:bg-rose-500/20"
                >
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </div>
          </div>

          {/* 썸네일 사이드바 */}
          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="mb-1 text-xs font-semibold text-slate-400">목록</div>
            <div className="grid max-h-[70vh] grid-cols-3 gap-2 overflow-y-auto pr-1 lg:grid-cols-2">
              {items.map((it, idx) => {
                const p = it.filePath ?? '';
                const ok = p.startsWith('http') || p.startsWith('data:');
                const active = idx === current;
                return (
                  <button
                    key={`${p}-${idx}`}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    className={`relative aspect-square overflow-hidden rounded-lg border ${
                      active ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-slate-800'
                    }`}
                  >
                    {ok ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-700">
                        <ImageIcon size={16} />
                      </div>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[9px] text-white">
                      {idx + 1}. {getRoomDisplayName(it.roomCategory)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
              <span>좌우 화살표로 탐색</span>
              <span className="flex items-center gap-1">
                <ArrowLeft size={10} />
                <ArrowRight size={10} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
