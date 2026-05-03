'use client';

// AS 요청 등록/수정 페이지
// Flutter: as_request_add_page.dart 포팅
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Calendar, X, Image as ImageIcon } from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsPriority, AsRequestImage, AsRequestItem } from '@/types/boss-as';

const PRIORITIES: AsPriority[] = ['긴급', '보통', '낮음'];

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toDateInput(value?: string | null): string {
  if (!value) return todayStr();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayStr();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function BossAsAddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id') ?? '';
  const isEditMode = !!editId;

  // 폼 상태
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestDate, setRequestDate] = useState(todayStr());
  const [priority, setPriority] = useState<AsPriority>('보통');
  const [orderId, setOrderId] = useState<number | null>(null);

  // 이미지(URL 입력 방식 - 웹은 Cloudflare 업로드 미구현)
  const [defectImages, setDefectImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  // 수정 모드 원본 보존(수리 사진 유지)
  const [original, setOriginal] = useState<AsRequestItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await bossAsApi.detail(editId);
        if (cancelled) return;
        if (res.success !== false && res.data) {
          const item = res.data;
          setOriginal(item);
          setCustomerName(item.customerName || '');
          setCustomerPhone(item.customerPhone || '');
          setAddress(item.address || '');
          setTitle(item.title || '');
          setDescription(item.description || '');
          setRequestDate(toDateInput(item.requestDate));
          setPriority((item.priority as AsPriority) || '보통');
          setOrderId(item.orderId ?? null);
          setDefectImages(
            (item.images || []).filter((i) => i.imageType === 'DEFECT').map((i) => i.filePath),
          );
        } else {
          toast.error(res.message || '데이터를 불러오지 못했습니다');
        }
      } catch {
        toast.error('데이터 로드 중 오류가 발생했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode]);

  const addImageUrl = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (defectImages.length >= 10) {
      toast.error('최대 10장까지 등록할 수 있습니다');
      return;
    }
    setDefectImages((prev) => [...prev, url]);
    setImageInput('');
  };

  const removeImage = (idx: number) => {
    setDefectImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!customerName.trim()) {
      toast.error('고객명을 입력해주세요');
      return;
    }
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // 이미지 페이로드 생성
    const defectPayload: AsRequestImage[] = defectImages.map((url, idx) => ({
      imageType: 'DEFECT',
      filePath: url,
      sortOrder: idx,
    }));

    // 수정 모드: 기존 수리 사진 유지
    const repairPayload: AsRequestImage[] =
      isEditMode && original
        ? (original.images || []).filter((i) => i.imageType === 'REPAIR')
        : [];

    const images = [...defectPayload, ...repairPayload];

    setSaving(true);
    try {
      if (isEditMode) {
        const res = await bossAsApi.update(editId, {
          id: Number(editId) || 0,
          custId,
          orderId: orderId ?? null,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          address: address.trim() || null,
          title: title.trim(),
          description: description.trim() || null,
          requestDate,
          priority,
          images,
        });
        if (res.success !== false) {
          toast.success('AS 요청이 수정되었습니다');
          router.push(`/boss/as/${editId}`);
        } else {
          toast.error(res.message || '저장에 실패했습니다');
        }
      } else {
        const res = await bossAsApi.create({
          custId,
          orderId: orderId ?? null,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          address: address.trim() || null,
          title: title.trim(),
          description: description.trim() || null,
          requestDate,
          priority,
          images,
        });
        if (res.success !== false) {
          toast.success('AS 요청이 등록되었습니다');
          router.push('/boss/as');
        } else {
          toast.error(res.message || '저장에 실패했습니다');
        }
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={isEditMode ? `/boss/as/${editId}` : '/boss/as'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold text-white">{isEditMode ? 'AS 요청 수정' : 'AS 요청 등록'}</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-200 hover:border-emerald-400 hover:text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          저장
        </button>
      </div>

      {/* 하자 사진 섹션 */}
      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-rose-300">
            <ImageIcon size={14} /> 하자 사진
            <span className="text-xs text-slate-500">{defectImages.length}/10</span>
          </h2>
        </div>

        {/* URL 입력 */}
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="이미지 URL 추가 (https://...)"
            className="h-9 flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={addImageUrl}
            disabled={defectImages.length >= 10}
            className="h-9 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-200 hover:border-emerald-400 disabled:opacity-50"
          >
            추가
          </button>
        </div>

        {/* 썸네일 목록 */}
        {defectImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {defectImages.map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative h-20 w-20 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`하자 ${idx + 1}`}
                  className="h-full w-full rounded-lg border border-slate-800 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                  aria-label="삭제"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 메인 폼 */}
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        {/* 주문 ID 연결 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-pink-300">주문 ID 연결 (선택)</label>
          <input
            type="number"
            value={orderId ?? ''}
            onChange={(e) => setOrderId(e.target.value ? Number(e.target.value) : null)}
            placeholder="연결할 주문 ID"
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* 요청일 + 우선순위 */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-indigo-300">
              <Calendar size={12} /> 요청일
            </label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">우선순위</label>
            <div className="flex gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-9 rounded-md px-3 text-xs font-bold ${
                    priority === p
                      ? 'bg-white text-black'
                      : 'border border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            제목 <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="AS 요청 제목"
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-base font-bold text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* 고객명 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            고객명 <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="고객명"
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* 전화 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">전화번호</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">주소</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="주소 입력"
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {/* 하자 설명 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">하자 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="하자 내용을 자세히 설명해주세요"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </section>
    </div>
  );
}

export default function BossAsAddPage() {
  // useSearchParams 사용 시 Suspense 경계 필요
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      }
    >
      <BossAsAddForm />
    </Suspense>
  );
}
