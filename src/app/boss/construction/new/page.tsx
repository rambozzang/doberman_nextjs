'use client';

// 시공 기록 등록/수정 — Industry 패턴 (참조 ListingForm 조판)
//   좌: 패널 섹션(시공 정보 · 사진) + 하단 액션 패널 / 우: 필수 누락 · 안내 패널.
//   화면 제목은 셸 헤더(PAGE_META)가 그린다.
// Flutter `construction_record_add_page.dart` 포팅 —
// 웹은 카메라/이미지 크롭 대신 URL 입력 기반으로 BEFORE/DURING/AFTER 사진을 관리한다.
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import {
  bossConstructionApi,
  buildImagePayload,
  normalizeConstructionRecord,
} from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import type { ConstructionImageType } from '@/types/boss-construction';
import {
  Panel,
  Field,
  TextareaField,
  FieldLabel,
  Segmented,
  Button,
  ButtonLink,
  AlertBanner,
  Skeleton,
} from '@/components/boss/ui';

type ImageBucket = 'beforeImages' | 'duringImages' | 'afterImages';

const SECTIONS: { key: ImageBucket; type: ConstructionImageType; label: string }[] = [
  { key: 'beforeImages', type: 'BEFORE', label: '시공 전' },
  { key: 'duringImages', type: 'DURING', label: '시공 중' },
  { key: 'afterImages', type: 'AFTER', label: '시공 후' },
];

const STATUS_OPTIONS: { key: '진행중' | '완료'; label: string }[] = [
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
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
  // 고객 상세 > "시공 기록"으로 들어오면 그 고객 번호 · 이름이 넘어온다. 연동이 안 돼도
  // 등록은 그대로 되도록, 이 값은 그냥 입력칸의 기본값일 뿐 자유롭게 지우거나 바꿀 수 있다.
  const linkedOrderId = isEditMode ? '' : sp?.get('orderId') ?? '';
  const linkedCustNm = sp?.get('custNm') ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState<string>(linkedOrderId);
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

  // 우측 안내 패널용 — 아직 채우지 않은 필수 항목
  const missing = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push('제목');
    if (!constructionDate) list.push('시공일');
    if (totalImageCount === 0) list.push('사진 1장 이상');
    return list;
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
      toast.error('고객 번호는 숫자여야 합니다.');
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
          markListDirty(LIST_KEYS.construction);
          router.push(`/boss/construction/${editId}`);
        } else {
          toast.error(res.message || '저장에 실패했습니다.');
        }
      } else {
        const res = await bossConstructionApi.create(basePayload);
        if (res.success !== false) {
          toast.success('시공 기록이 등록되었습니다.');
          markListDirty(LIST_KEYS.construction);
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

  const cancelHref = isEditMode && editId ? `/boss/construction/${editId}` : '/boss/construction';
  const submitLabel = saving ? '저장 중…' : isEditMode ? '수정 저장' : '시공 기록 등록';

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ── 좌: 폼 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}

        {/* 시공 정보 */}
        <Panel title="시공 정보" kicker={isEditMode ? 'EDIT' : 'NEW'}>
          <div className="flex flex-col gap-4">
            <Field
              id="title"
              label="제목"
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 신촌 OO아파트 거실 도배 시공"
              disabled={loadingDetail}
              maxLength={200}
            />
            <TextareaField
              id="description"
              label="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="자재 · 평수 · 특이사항 등 시공 내용을 자유롭게 적어 두세요"
              disabled={loadingDetail}
              maxLength={2000}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="constructionDate"
                label="시공일"
                required
                type="date"
                value={constructionDate}
                onChange={(e) => setConstructionDate(e.target.value)}
                disabled={loadingDetail}
              />
              <Field
                id="orderId"
                label="연결할 고객 번호"
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="예: 1234"
                hint={
                  linkedCustNm && orderId === linkedOrderId
                    ? `'${linkedCustNm}' 고객과 연결됩니다. 다른 번호로 바꾸거나 비워 둘 수 있습니다.`
                    : '고객 목록의 번호를 넣으면 상세에서 서로 오갈 수 있습니다. 비워 둬도 됩니다.'
                }
                disabled={loadingDetail}
              />
            </div>
            <div>
              <FieldLabel>상태</FieldLabel>
              <Segmented
                ariaLabel="시공 상태"
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
              />
            </div>
          </div>
        </Panel>

        {/* 사진 — 시공 전 / 중 / 후 */}
        <Panel
          title="사진"
          kicker="PHOTOS"
          right={
            <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
              전체 {totalImageCount}장
            </span>
          }
        >
          <div className="flex flex-col gap-6">
            {SECTIONS.map((section) => {
              const list = getBucket(section.key);
              const inputId = `url-${section.key}`;
              return (
                <div key={section.key} className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3 border-b border-boss-border-row pb-2">
                    <h4 className="text-[14px] font-semibold text-boss-text">{section.label}</h4>
                    <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                      {list.length} / 10
                    </span>
                  </div>

                  {/* URL 추가 입력 */}
                  <div className="flex gap-2">
                    <input
                      id={inputId}
                      type="url"
                      aria-label={`${section.label} 사진 URL`}
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
                      placeholder="https:// 로 시작하는 이미지 주소"
                      className="boss-input flex-1"
                      maxLength={500}
                    />
                    <Button
                      variant="secondary"
                      icon={Plus}
                      onClick={() => addImageUrl(section.key)}
                      disabled={list.length >= 10}
                    >
                      추가
                    </Button>
                  </div>

                  {/* 이미지 그리드 */}
                  {list.length === 0 ? (
                    <div className="boss-dashed-cta flex flex-col items-center justify-center py-8 text-center">
                      <ImageIcon size={22} strokeWidth={1.5} className="mb-2 text-boss-text-muted" />
                      <p className="text-[12.5px] text-boss-text-secondary">
                        {section.label} 사진이 아직 없습니다 — 위에 주소를 넣고 추가하세요
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {list.map((url, idx) => (
                        <div
                          key={`${section.key}-${idx}-${url}`}
                          className="group relative aspect-square overflow-hidden border border-boss-border bg-boss-bg"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`${section.label} ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(section.key, idx)}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-boss-error text-boss-primary-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label={`${section.label} 사진 ${idx + 1} 삭제`}
                          >
                            <Trash2 size={12} />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-boss-text/75 px-1.5 py-px font-boss-head text-[10px] font-semibold text-boss-bg">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
          <Button variant="primary" onClick={handleSave} disabled={saving || loadingDetail}>
            {submitLabel}
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
            사진은 전 · 중 · 후 중 한 곳에라도 1장 이상 있어야 저장됩니다. 구간별 최대 10장.
          </p>
        </Panel>

        <Panel kicker="사진 안내">
          <p className="text-[12.5px] leading-[1.7] text-boss-text-soft">
            웹에서는 파일 업로드 대신 <strong className="font-semibold">이미지 주소(URL)</strong>를
            붙여 넣습니다. 앱에서 찍은 사진은 사진 관리에서 주소를 복사해 오세요.
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-boss-text-soft">
            완료로 저장한 기록은 포트폴리오 · AS 접수에서 바로 연결할 수 있습니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}

export default function BossConstructionFormPage() {
  return (
    <Suspense
      fallback={
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-72" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-40" />
        </div>
      }
    >
      <ConstructionFormInner />
    </Suspense>
  );
}
