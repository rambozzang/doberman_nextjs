'use client';

// 사장님 사진 편집 — Industry 패턴 (agent.opentohome.com)
// Flutter `lib/app/image/image_edit_page.dart` 의 편집 기능 중 웹에 필요한 핵심만 포팅:
//   - 한 장씩 큰 화면으로 미리보기 (image_one_view_page.dart)
//   - 좌/우 이동 (image_list_view.dart)
//   - 단건 삭제 (DELETE /orders/files/{fileId})
//   - 순서 변경 (위/아래 이동) → POST /orders/files 로 num 필드 갱신
// (자유 그리기/치수선/텍스트 같은 캔버스 편집은 웹 범위에서 제외)
//
//   상단 : "n / m"(Barlow Condensed) · 우측 갤러리로 · 새로고침 · 순서 저장
//   좌   : 뷰어 패널(사각 · 면색 스테이지 · 이전/다음 사각 버튼) + 캡션 줄(방 · 유형 · 날짜 · 위로/아래로/삭제)
//   우   : 썸네일 패널(사각, 선택 = accent 2px 안쪽 선)
//   삭제는 ConfirmDialog.
//
// 화면 제목("사진 편집")과 ← 사진 관리 링크는 셸 헤더(PAGE_META)가 그린다.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
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
  AlertBanner,
  Button,
  ButtonLink,
  ConfirmDialog,
  ContentCard,
  EmptyState,
  Skeleton,
  Tag,
  Kicker,
  type StatusTone,
} from '@/components/boss/ui';
import {
  getPhotoTypeDisplayName,
  getRoomDisplayName,
  type BossImageDataInfo,
} from '@/types/boss-image';

function photoTypeTone(code?: string): StatusTone {
  switch (code) {
    case 'before':
      return 'warn';
    case 'after':
      return 'ok';
    case 'detail':
      return 'info';
    default:
      return 'neutral';
  }
}

export default function BossPhotoEditPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <BossPhotoEditInner />
    </Suspense>
  );
}

function BossPhotoEditInner() {
  const search = useSearchParams();
  const customerId = search.get('customerId') ?? '';

  const [items, setItems] = useState<BossImageDataInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) {
      setError('고객이 지정되지 않았습니다. 사진 관리에서 고객을 고른 뒤 편집으로 들어오세요.');
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
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = items.length;
  const active = useMemo(() => items[current], [items, current]);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const next = () => setCurrent((c) => (c < total - 1 ? c + 1 : c));

  // 단건 삭제 — ConfirmDialog 확인 후
  const handleDelete = async () => {
    if (!active) return;
    setDeleting(true);

    const serverFileId = active.num ?? active.fileKey;
    if (serverFileId !== undefined && serverFileId !== null) {
      try {
        const res = await bossImageApi.remove(String(serverFileId));
        if (!res.success) {
          toast.error(res.message || '삭제에 실패했습니다.');
          setDeleting(false);
          return;
        }
      } catch {
        toast.error('네트워크 오류로 삭제에 실패했습니다.');
        setDeleting(false);
        return;
      }
    }
    setItems((prevList) => prevList.filter((_, i) => i !== current));
    setCurrent((c) => Math.max(0, c - 1));
    setConfirmDelete(false);
    setDeleting(false);
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

  // 순서 저장 (num 필드 부여 후 일괄 저장)
  // 백엔드 호환성을 위해 일괄 저장(POST) 방식 사용
  const handleSaveOrder = async () => {
    if (!customerId) {
      toast.error('고객이 지정되지 않았습니다.');
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
  const galleryHref = `/boss/photo?customerId=${encodeURIComponent(customerId)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-boss-head text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-boss-text">
          {total === 0 ? 0 : current + 1}
          <span className="text-boss-text-muted"> / {total}</span>
        </span>
        <p className="hidden text-[12px] text-boss-text-muted md:block">
          위로 · 아래로 로 순서를 바꾼 뒤 순서 저장을 누르세요
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ButtonLink href={galleryHref} variant="secondary" size="sm">
            갤러리로
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={load}
            disabled={loading || !customerId}
          >
            새로고침
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSaveOrder}
            disabled={saving || total === 0}
          >
            {saving ? '저장 중…' : '순서 저장'}
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            customerId ? (
              <Button variant="primary" size="sm" onClick={load}>
                다시 시도
              </Button>
            ) : (
              <ButtonLink href="/boss/customers" variant="primary" size="sm">
                고객 관리로
              </ButtonLink>
            )
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && total === 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : total === 0 ? (
        error ? null : (
          <EmptyState
            icon={ImageIcon}
            title="편집할 사진이 없습니다"
            description="사진 관리에서 먼저 사진을 올리고 저장한 뒤 순서를 바꿀 수 있습니다."
            action={
              <ButtonLink href={galleryHref} variant="primary" size="sm">
                사진 관리로
              </ButtonLink>
            }
          />
        )
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* 메인 뷰어 */}
          <ContentCard>
            <div className="relative flex aspect-video w-full items-center justify-center bg-boss-inset">
              {canPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={path}
                  alt={active?.fileNm ?? ''}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-boss-text-muted">
                  <ImageIcon size={36} strokeWidth={1.5} />
                  <span className="mt-2 text-[12px]">미리보기를 만들 수 없는 경로입니다</span>
                </div>
              )}

              <button
                type="button"
                onClick={prev}
                disabled={current === 0}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-boss-border bg-boss-surface text-boss-text shadow-boss transition-colors duration-[120ms] ease-out hover:border-boss-border-hover disabled:opacity-30"
                aria-label="이전"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={current >= total - 1}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-boss-border bg-boss-surface text-boss-text shadow-boss transition-colors duration-[120ms] ease-out hover:border-boss-border-hover disabled:opacity-30"
                aria-label="다음"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* 캡션 + 행 액션 */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-boss-border px-4 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]">
                <span className="font-semibold text-boss-text">
                  {getRoomDisplayName(active?.roomCategory)}
                </span>
                <Tag tone={photoTypeTone(active?.photoType)}>
                  {getPhotoTypeDisplayName(active?.photoType)}
                </Tag>
                {active?.crtDtm && (
                  <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                    {active.crtDtm.replace('T', ' ').slice(0, 16)}
                  </span>
                )}
                {active?.fileNm && (
                  <span className="min-w-0 truncate text-[12px] text-boss-text-secondary">
                    {active.fileNm}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" icon={ArrowUp} onClick={moveUp} disabled={current === 0}>
                  위로
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ArrowDown}
                  onClick={moveDown}
                  disabled={current >= total - 1}
                >
                  아래로
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="!text-boss-text-muted hover:!text-boss-error"
                  onClick={() => setConfirmDelete(true)}
                >
                  삭제
                </Button>
              </div>
            </div>
          </ContentCard>

          {/* 썸네일 패널 */}
          <ContentCard className="p-3">
            <Kicker className="mb-2">목록 · {total}장</Kicker>
            <div className="boss-scroll grid max-h-[70vh] grid-cols-3 gap-2 overflow-y-auto pr-1 lg:grid-cols-2">
              {items.map((it, idx) => {
                const p = it.filePath ?? '';
                const ok = p.startsWith('http') || p.startsWith('data:');
                const isActive = idx === current;
                return (
                  <button
                    key={`${p}-${idx}`}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    aria-current={isActive}
                    aria-label={`${idx + 1}번 ${getRoomDisplayName(it.roomCategory)}`}
                    className={`relative aspect-square overflow-hidden border bg-boss-inset transition-colors duration-[120ms] ease-out ${
                      isActive
                        ? 'border-boss-primary shadow-[inset_0_0_0_2px_rgb(var(--boss-primary))]'
                        : 'border-boss-border hover:border-boss-border-hover'
                    }`}
                  >
                    {ok ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                        <ImageIcon size={16} strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 truncate bg-boss-text/75 px-1.5 py-[2px] text-left font-boss-head text-[10px] tabular-nums text-boss-bg">
                      {idx + 1}. {getRoomDisplayName(it.roomCategory)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 border-t border-boss-border pt-2 text-[11.5px] text-boss-text-muted">
              썸네일을 누르면 큰 화면으로 봅니다.
            </p>
          </ContentCard>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="이 사진을 삭제할까요?"
        description={
          active && active.num === undefined && active.fileKey === undefined
            ? '아직 저장하지 않은 사진이라 목록에서만 빠집니다.'
            : '서버에서 바로 지워지며 되돌릴 수 없습니다.'
        }
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
