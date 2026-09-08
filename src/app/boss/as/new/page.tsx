'use client';

// AS 요청 등록/수정 — Industry 패턴 (참조 ListingForm 조판)
//   좌: 패널 섹션(요청 정보 · 하자 내용 · 하자 사진) + 하단 액션 패널 / 우: 필수 누락 · 안내 패널.
//   화면 제목은 셸 헤더(PAGE_META)가 그린다.
// Flutter: as_request_add_page.dart 포팅 — 사진은 URL 입력 + 로컬 파일(dataURL). 수정 시 수리 사진은 원본 유지.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import type { AsPriority, AsRequestImage, AsRequestItem } from '@/types/boss-as';
import {
  Panel,
  Field,
  TextareaField,
  FieldLabel,
  Segmented,
  Button,
  ButtonLink,
  Skeleton,
} from '@/components/boss/ui';

const PRIORITIES: AsPriority[] = ['긴급', '보통', '낮음'];
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ key: p, label: p }));

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
  // 고객 상세 > "AS 요청"으로 들어오면 그 고객 정보가 넘어온다. 연동이 안 돼도 등록은
  // 그대로 되도록, 아래 값들은 입력칸의 기본값일 뿐 자유롭게 지우거나 바꿀 수 있다.
  const linkedOrderId = isEditMode ? null : searchParams?.get('orderId');
  const linkedCustNm = isEditMode ? '' : (searchParams?.get('custNm') ?? '');
  const linkedCustPhone = isEditMode ? '' : (searchParams?.get('custPhone') ?? '');
  const linkedAddr = isEditMode ? '' : (searchParams?.get('addr') ?? '');

  // 폼 상태
  const [customerName, setCustomerName] = useState(linkedCustNm);
  const [customerPhone, setCustomerPhone] = useState(linkedCustPhone);
  const [address, setAddress] = useState(linkedAddr);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestDate, setRequestDate] = useState(todayStr());
  const [priority, setPriority] = useState<AsPriority>('보통');
  const [orderId, setOrderId] = useState<number | null>(
    linkedOrderId ? Number(linkedOrderId) : null,
  );

  // 이미지(URL 입력 + 로컬 파일 dataURL 방식)
  const [defectImages, setDefectImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 10 - defectImages.length;
    const targets = Array.from(files).slice(0, remaining);
    if (targets.length < files.length) {
      toast.error('최대 10장까지 등록할 수 있습니다');
    }
    setSaving(true);
    try {
      const urls = await Promise.all(targets.map((f) => fileToDataUrl(f)));
      setDefectImages((prev) => [...prev, ...urls]);
    } catch {
      toast.error('이미지를 읽는 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 우측 안내 패널용 — 아직 채우지 않은 필수 항목
  const missing = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push('제목');
    if (!customerName.trim()) list.push('고객명');
    return list;
  }, [title, customerName]);

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
        markListDirty(LIST_KEYS.as);
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
        markListDirty(LIST_KEYS.as);
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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const cancelHref = isEditMode ? `/boss/as/${editId}` : '/boss/as';
  const repairCount = isEditMode && original ? (original.images || []).filter((i) => i.imageType === 'REPAIR').length : 0;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ── 좌: 폼 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* 요청 정보 */}
        <Panel title="요청 정보" kicker={isEditMode ? 'EDIT' : 'NEW'}>
          <div className="flex flex-col gap-4">
            <Field
              id="title"
              label="제목"
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 안방 벽지 들뜸 재시공"
              maxLength={200}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="customerName"
                label="고객명"
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객 이름"
                maxLength={50}
              />
              <Field
                id="customerPhone"
                label="연락처"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                maxLength={13}
              />
            </div>
            <Field
              id="address"
              label="주소"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="시공 현장 주소"
              maxLength={200}
            />
          </div>
        </Panel>

        {/* 하자 내용 */}
        <Panel title="하자 내용" kicker="DEFECT">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="requestDate"
                label="요청일"
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
              <div>
                <FieldLabel>우선순위</FieldLabel>
                <Segmented
                  ariaLabel="우선순위"
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={setPriority}
                />
              </div>
            </div>
            <Field
              id="orderId"
              label="연결할 고객 번호"
              type="number"
              value={orderId ?? ''}
              onChange={(e) => setOrderId(e.target.value ? Number(e.target.value) : null)}
              placeholder="예: 1234"
              hint={
                linkedCustNm && String(orderId ?? '') === linkedOrderId
                  ? `'${linkedCustNm}' 고객과 연결됩니다. 다른 번호로 바꾸거나 비워 둘 수 있습니다.`
                  : '고객 목록의 번호를 넣으면 상세에서 서로 오갈 수 있습니다. 비워 둬도 됩니다.'
              }
              className="md:w-1/2 md:pr-2"
            />
            <TextareaField
              id="description"
              label="하자 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="위치 · 증상 · 발생 시점을 적어 두면 재방문 때 도움이 됩니다"
              maxLength={2000}
            />
          </div>
        </Panel>

        {/* 하자 사진 */}
        <Panel
          title="하자 사진"
          kicker="PHOTOS"
          right={
            <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
              {defectImages.length} / 10
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            {/* URL / 파일 입력 */}
            <div className="flex flex-wrap gap-2">
              <input
                type="url"
                aria-label="하자 사진 URL"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="https:// 로 시작하는 이미지 주소"
                className="boss-input min-w-0 flex-1"
                maxLength={500}
              />
              <Button
                variant="secondary"
                icon={Plus}
                onClick={addImageUrl}
                disabled={defectImages.length >= 10}
              >
                추가
              </Button>
              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={defectImages.length >= 10 || saving}
              >
                파일 선택
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 썸네일 목록 */}
            {defectImages.length === 0 ? (
              <div className="boss-dashed-cta flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon size={22} strokeWidth={1.5} className="mb-2 text-boss-text-muted" />
                <p className="text-[12.5px] text-boss-text-secondary">
                  하자 사진이 아직 없습니다 — 주소를 넣거나 파일을 골라 추가하세요
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {defectImages.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="group relative aspect-square overflow-hidden border border-boss-border bg-boss-bg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`하자 ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-boss-error text-boss-primary-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`하자 사진 ${idx + 1} 삭제`}
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-boss-text/75 px-1.5 py-px font-boss-head text-[10px] font-semibold text-boss-bg">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          <span className="text-[12.5px] text-boss-text-secondary">
            {missing.length > 0 ? `필수 ${missing.length}항목 남음` : '저장할 준비가 됐습니다'}
          </span>
          <ButtonLink href={cancelHref} variant="secondary" className="ml-auto">
            취소
          </ButtonLink>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : isEditMode ? '수정 저장' : 'AS 접수'}
          </Button>
        </div>
      </div>

      {/* ── 우: 안내 ── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="필수 누락">
          {missing.length === 0 ? (
            <p className="text-[13px] text-boss-success">필수 항목을 모두 채웠습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-[13px] text-boss-error">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            연락처 · 주소 · 사진은 선택이지만, 재방문 일정을 잡으려면 연락처는 꼭 남겨 두세요.
          </p>
        </Panel>

        <Panel kicker="안내">
          <p className="text-[12.5px] leading-[1.7] text-boss-text-soft">
            접수한 요청은 <strong className="font-semibold">접수</strong> 상태로 시작합니다. 상세 화면에서
            진행 → 완료로 바꿀 수 있고, 되돌릴 수는 없습니다.
          </p>
          {isEditMode && (
            <p className="mt-2 text-[12.5px] leading-[1.7] text-boss-text-soft">
              수리 사진 {repairCount}장은 여기서 바꾸지 않아도 그대로 유지됩니다.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function BossAsAddPage() {
  // useSearchParams 사용 시 Suspense 경계 필요
  return (
    <Suspense
      fallback={
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-40" />
        </div>
      }
    >
      <BossAsAddForm />
    </Suspense>
  );
}
