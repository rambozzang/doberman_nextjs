'use client';

// 시공 기록 등록/수정 페이지
// Flutter `construction_record_add_page.dart` 포팅
// 웹은 카메라/이미지 크롭 대신 URL 입력 기반으로 BEFORE/DURING/AFTER 사진을 관리한다.
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ImageIcon,
  Calendar,
  CheckCircle2,
  Clock3,
  Hammer,
  Link2,
} from 'lucide-react';
import {
  bossConstructionApi,
  buildImagePayload,
  normalizeConstructionRecord,
} from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionImageType } from '@/types/boss-construction';

type ImageBucket = 'beforeImages' | 'duringImages' | 'afterImages';

const SECTIONS: { key: ImageBucket; type: ConstructionImageType; label: string }[] = [
  { key: 'beforeImages', type: 'BEFORE', label: '시공 전' },
  { key: 'duringImages', type: 'DURING', label: '시공 중' },
  { key: 'afterImages', type: 'AFTER', label: '시공 후' },
];

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ConstructionFormInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp?.get('edit') ?? null;
  const isEditMode = !!editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState<string>('');
  const [constructionDate, setConstructionDate] = useState<string>(todayStr());
  const [status, setStatus] = useState<'진행중' | '완료'>('진행중');
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [duringImages, setDuringImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [newUrlMap, setNewUrlMap] = useState<Record<ImageBucket, string>>({
    beforeImages: '',
    duringImages: '',
    afterImages: '',
  });

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드: 기존 데이터 로드 (목록 조회 후 id 매칭)
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      const payload = BossAuthManager.getJwtPayload();
      const custId = payload?.sub;
      if (!custId) {
        setError('로그인이 필요합니다.');
        return;
      }
      setLoadingDetail(true);
      try {
        const res = await bossConstructionApi.list(custId);
        if (cancelled) return;
        if (res.success && res.data) {
          const list = (res.data as unknown[]).map((r) => normalizeConstructionRecord(r));
          const found = list.find((x) => String(x.id) === String(editId));
          if (found) {
            setTitle(found.title ?? '');
            setDescription(found.description ?? '');
            setOrderId(found.orderId != null ? String(found.orderId) : '');
            setConstructionDate(
              (found.constructionDate || todayStr()).slice(0, 10),
            );
            setStatus((found.status as '진행중' | '완료') ?? '진행중');
            setBeforeImages(found.beforeImages);
            setDuringImages(found.duringImages);
            setAfterImages(found.afterImages);
          } else {
            setError('수정할 시공 기록을 찾을 수 없습니다.');
          }
        } else {
          setError(res.message || '시공 기록을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 시공 기록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editId]);

  const totalImageCount = beforeImages.length + duringImages.length + afterImages.length;

  const setBucket = (bucket: ImageBucket, next: string[]) => {
    if (bucket === 'beforeImages') setBeforeImages(next);
    else if (bucket === 'duringImages') setDuringImages(next);
    else setAfterImages(next);
  };

  const getBucket = (bucket: ImageBucket): string[] => {
    if (bucket === 'beforeImages') return beforeImages;
    if (bucket === 'duringImages') return duringImages;
    return afterImages;
  };

  const addImageUrl = (bucket: ImageBucket) => {
    const url = (newUrlMap[bucket] || '').trim();
    if (!url) {
      toast.error('이미지 URL을 입력해주세요.');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast.error('http(s):// 로 시작하는 URL을 입력해주세요.');
      return;
    }
    const list = getBucket(bucket);
    if (list.length >= 10) {
      toast.error('최대 10장까지 등록할 수 있습니다.');
      return;
    }
    setBucket(bucket, [...list, url]);
    setNewUrlMap((m) => ({ ...m, [bucket]: '' }));
  };

  const removeImage = (bucket: ImageBucket, index: number) => {
    const list = getBucket(bucket);
    setBucket(
      bucket,
      list.filter((_, i) => i !== index),
    );
  };

  const valid = useMemo(() => {
    if (!title.trim()) return false;
    if (!constructionDate) return false;
    if (totalImageCount === 0) return false;
    return true;
  }, [title, constructionDate, totalImageCount]);

  const handleSave = async () => {
    if (!valid) {
      if (!title.trim()) toast.error('제목을 입력해주세요.');
      else if (totalImageCount === 0) toast.error('최소 1장의 사진을 등록해주세요.');
      else toast.error('필수 항목을 확인해주세요.');
      return;
    }
    const payloadJwt = BossAuthManager.getJwtPayload();
    const custId = payloadJwt?.sub;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const images = buildImagePayload(beforeImages, duringImages, afterImages);
    const parsedOrderId = orderId.trim() === '' ? null : Number(orderId);
    if (parsedOrderId !== null && Number.isNaN(parsedOrderId)) {
      toast.error('주문 ID는 숫자여야 합니다.');
      return;
    }

    const basePayload = {
      custId,
      orderId: parsedOrderId,
      title: title.trim(),
      description: description.trim() || null,
      constructionDate,
      status,
      images,
    };

    setSaving(true);
    try {
      if (isEditMode && editId) {
        const res = await bossConstructionApi.update(Number(editId), {
          id: Number(editId),
          ...basePayload,
        });
        if (res.success !== false) {
          toast.success('시공 기록이 수정되었습니다.');
          router.push(`/boss/construction/${editId}`);
        } else {
          toast.error(res.message || '저장에 실패했습니다.');
        }
      } else {
        const res = await bossConstructionApi.create(basePayload);
        if (res.success !== false) {
          toast.success('시공 기록이 등록되었습니다.');
          router.push('/boss/construction');
        } else {
          toast.error(res.message || '저장에 실패했습니다.');
        }
      }
    } catch {
      toast.error('네트워크 오류로 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 상단 네비 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isEditMode && editId ? `/boss/construction/${editId}` : '/boss/construction'}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 취소
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingDetail}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover disabled:opacity-50"
        >
          <Save size={14} /> {isEditMode ? '수정 저장' : '시공 기록 등록'}
        </button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Hammer size={20} className="text-boss-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-boss-text">
          {isEditMode ? '시공 기록 수정' : '시공 기록 등록'}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 이미지 섹션 (3개) */}
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const list = getBucket(section.key);
          return (
            <div
              key={section.key}
              className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface"
            >
              <div className="flex items-center justify-between gap-2 border-b border-boss-border bg-boss-surface px-5 py-3">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-boss-primary" />
                  <h2 className="text-sm font-semibold text-boss-text">{section.label}</h2>
                  <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-[10px] font-semibold text-boss-text-secondary">
                    {list.length}/10
                  </span>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {/* URL 추가 입력 */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newUrlMap[section.key]}
                    onChange={(e) =>
                      setNewUrlMap((m) => ({ ...m, [section.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageUrl(section.key);
                      }
                    }}
                    placeholder="https://... 이미지 URL 입력 후 추가"
                    className="h-10 flex-1 rounded-lg border border-boss-border bg-boss-bg/60 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => addImageUrl(section.key)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover"
                  >
                    <Plus size={14} /> 추가
                  </button>
                </div>

                {/* 이미지 그리드 */}
                {list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-boss-border bg-boss-bg/40 py-10 text-center">
                    <ImageIcon size={28} className="mb-2 text-boss-text-muted" />
                    <p className="text-xs text-boss-text-muted">아직 등록된 사진이 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {list.map((url, idx) => (
                      <div
                        key={`${section.key}-${idx}-${url}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-boss-border bg-boss-bg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${section.label}-${idx}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(section.key, idx)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-boss-error/100 text-boss-text opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-boss-text">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 메타 정보 */}
      <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface">
        <div className="border-b border-boss-border bg-boss-surface px-5 py-3">
          <h2 className="text-sm font-semibold text-boss-text">시공 정보</h2>
        </div>
        <div className="space-y-4 p-5">
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-xs text-boss-text-muted">
              제목 <span className="text-boss-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 신촌 OO아파트 거실 도배 시공"
              className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/60 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-xs text-boss-text-muted">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="시공 내용을 자유롭게 작성하세요"
              className="w-full rounded-lg border border-boss-border bg-boss-bg/60 px-3 py-2 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 시공일 */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-boss-text-muted">
                <Calendar size={11} /> 시공일 <span className="text-boss-error">*</span>
              </label>
              <input
                type="date"
                value={constructionDate}
                onChange={(e) => setConstructionDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/60 px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
              />
            </div>

            {/* 주문 ID */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-boss-text-muted">
                <Link2 size={11} /> 연결할 주문 ID (선택)
              </label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="예: 1234"
                className="h-10 w-full rounded-lg border border-boss-border bg-boss-bg/60 px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
              />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label className="mb-1 block text-xs text-boss-text-muted">상태</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('진행중')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
                  status === '진행중'
                    ? 'bg-boss-warning/20 text-boss-warning ring-amber-500/40'
                    : 'bg-boss-elevated/60 text-boss-text-muted ring-boss-border'
                }`}
              >
                <Clock3 size={12} /> 진행중
              </button>
              <button
                type="button"
                onClick={() => setStatus('완료')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
                  status === '완료'
                    ? 'bg-boss-primary/20 text-boss-primary ring-emerald-500/40'
                    : 'bg-boss-elevated/60 text-boss-text-muted ring-boss-border'
                }`}
              >
                <CheckCircle2 size={12} /> 완료
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 저장 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingDetail}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-boss-primary px-6 text-sm font-semibold text-emerald-950 hover:bg-boss-primary-hover disabled:opacity-50"
        >
          <Save size={16} /> {saving ? '저장 중...' : isEditMode ? '수정 저장' : '시공 기록 등록'}
        </button>
      </div>
    </div>
  );
}

export default function BossConstructionFormPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-boss-elevated/60" />
          <div className="h-96 animate-pulse rounded-2xl bg-boss-elevated/40" />
        </div>
      }
    >
      <ConstructionFormInner />
    </Suspense>
  );
}
