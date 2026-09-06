'use client';

// 시공 기록 상세 — Industry 패턴
//   좌: 시공 내용 + 전/중/후 사진(탭 · 라이트박스) / 우: DescRow 요약 + 수정 · 삭제.
//   화면 제목과 ← 시공 기록 링크는 셸 헤더가 그린다. 삭제는 ConfirmDialog.
// Flutter `construction_record_detail_page.dart` 포팅 — 단건 API 가 없어 목록에서 id 로 찾는다.
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';
import {
  Panel,
  ContentCard,
  CardHead,
  Button,
  ButtonLink,
  StatusPill,
  EmptyState,
  AlertBanner,
  ListTabs,
  DescRow,
  Skeleton,
  ConfirmDialog,
} from '@/components/boss/ui';

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

function formatDateTime(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  // 로딩 상태 — 최종 레이아웃과 같은 2열 골격
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // 에러 / 찾을 수 없음
  if (error || !item) {
    return (
      <div className="flex flex-col gap-4">
        <AlertBanner tone="bad">{error || '시공 기록을 찾을 수 없습니다.'}</AlertBanner>
        <EmptyState
          icon={ImageIcon}
          title="시공 기록을 열 수 없습니다"
          description="삭제됐거나 주소가 잘못됐을 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/construction" variant="primary" size="sm" icon={ArrowLeft}>
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const isDone = item.status === '완료';
  const orderLabel = item.orderId != null ? `#${item.orderId}` : '연결 없음';
  const activeTabLabel = TABS.find((t) => t.key === tab)?.label ?? '';

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── 좌: 본문 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* 제목 · 상태 */}
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={isDone ? 'ok' : 'warn'}>{item.status}</StatusPill>
            <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
              #{String(item.id)}
            </span>
          </div>
          <h2 className="mt-2 font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.01em] text-boss-text">
            {item.title || '제목 없음'}
          </h2>
          <p className="mt-1 text-[12.5px] text-boss-text-secondary">
            시공일{' '}
            <span className="font-boss-head tabular-nums text-boss-text">
              {formatDate(item.constructionDate)}
            </span>
          </p>
        </Panel>

        {/* 시공 내용 */}
        <Panel title="시공 내용" kicker="DESCRIPTION">
          {item.description ? (
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-boss-text">
              {item.description}
            </p>
          ) : (
            <p className="text-[13px] text-boss-text-secondary">
              등록된 시공 설명이 없습니다. 수정 화면에서 자재 · 평수 · 특이사항을 남겨 두면 AS 때 도움이 됩니다.
            </p>
          )}
        </Panel>

        {/* 사진 */}
        <ContentCard>
          <CardHead title="사진" count={`${totalImages}장`} countTone="muted" />
          <div className="flex flex-col gap-4 p-5">
            <ListTabs
              tabs={TABS.map((t) => ({
                key: t.key,
                label: t.label,
                count:
                  t.key === 'BEFORE'
                    ? item.beforeImages.length
                    : t.key === 'DURING'
                      ? item.duringImages.length
                      : item.afterImages.length,
              }))}
              active={tab}
              onChange={setTab}
            />

            {currentImages.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title={`${activeTabLabel} 사진이 없습니다`}
                description="수정 화면에서 이미지 URL 을 추가하면 여기에 표시됩니다."
                action={
                  <ButtonLink
                    href={`/boss/construction/new?edit=${item.id}`}
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                  >
                    사진 추가하기
                  </ButtonLink>
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {currentImages.map((src, idx) => (
                  <button
                    key={`${tab}-${idx}-${src}`}
                    type="button"
                    onClick={() => openLightbox(currentImages, idx)}
                    className="group relative aspect-square overflow-hidden border border-boss-border bg-boss-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-boss-primary"
                    aria-label={`${activeTabLabel} 사진 ${idx + 1} 크게 보기`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${activeTabLabel} ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 bg-boss-text/75 px-1.5 py-px font-boss-head text-[10px] font-semibold text-boss-bg">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ContentCard>
      </div>

      {/* ── 우: 요약 ── */}
      <div className="flex flex-col gap-4">
        <Panel title="요약" kicker="RECORD">
          <dl>
            <DescRow label="상태" value={<StatusPill tone={isDone ? 'ok' : 'warn'}>{item.status}</StatusPill>} />
            <DescRow
              label="시공일"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.constructionDate)}</span>}
            />
            <DescRow
              label="연결 주문"
              value={
                item.orderId != null ? (
                  <span className="font-boss-head tabular-nums text-boss-primary">{orderLabel}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">{orderLabel}</span>
                )
              }
            />
            <DescRow
              label="사진"
              value={
                <span className="font-boss-head tabular-nums">
                  전 {item.beforeImages.length} · 중 {item.duringImages.length} · 후 {item.afterImages.length}
                </span>
              }
            />
            <DescRow
              label="등록"
              value={
                <span className="font-boss-head tabular-nums">
                  {formatDateTime(item.createdAt ?? item.createdDt)}
                </span>
              }
            />
            <DescRow
              label="수정"
              value={<span className="font-boss-head tabular-nums">{formatDateTime(item.updatedDt)}</span>}
            />
          </dl>
        </Panel>

        <Panel title="작업" kicker="ACTIONS">
          <div className="flex flex-col gap-2">
            <ButtonLink
              href={`/boss/construction/new?edit=${item.id}`}
              variant="primary"
              icon={Pencil}
              className="w-full"
            >
              기록 수정
            </ButtonLink>
            <ButtonLink href="/boss/construction" variant="secondary" icon={ArrowLeft} className="w-full">
              목록으로
            </ButtonLink>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="w-full !text-boss-text-muted hover:!text-boss-error"
            >
              삭제
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            삭제한 기록과 사진 링크는 복구할 수 없습니다.
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="이 시공 기록을 삭제할까요?"
        description="삭제된 시공 기록은 복구할 수 없습니다. 연결된 주문은 그대로 남습니다."
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />

      {/* 라이트박스 — 사진을 크게 보는 오버레이라 어두운 배경을 쓴다 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-boss-text/90 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center bg-boss-surface text-boss-text hover:bg-boss-elevated"
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
                className="absolute left-4 flex h-12 w-12 items-center justify-center bg-boss-surface text-boss-text hover:bg-boss-elevated"
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
                className="absolute right-4 flex h-12 w-12 items-center justify-center bg-boss-surface text-boss-text hover:bg-boss-elevated"
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
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-boss-surface px-3 py-1 font-boss-head text-[12px] tabular-nums text-boss-text">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}
