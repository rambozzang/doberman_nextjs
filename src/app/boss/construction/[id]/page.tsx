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
  ClipboardList,
  FileText,
} from 'lucide-react';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/boss/ui';

type TabKey = 'BEFORE' | 'DURING' | 'AFTER';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'BEFORE', label: '시공 전' },
  { key: 'DURING', label: '시공 중' },
  { key: 'AFTER', label: '시공 후' },
];

const BREADCRUMBS = [{ label: '시공 기록', href: '/boss/construction' }, { label: '상세' }];

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

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="시공 기록 상세" breadcrumbs={BREADCRUMBS} />
        <div className="h-28 animate-pulse rounded-xl bg-boss-elevated/40" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-56 animate-pulse rounded-xl bg-boss-elevated/40" />
          <div className="h-56 animate-pulse rounded-xl bg-boss-elevated/40 lg:col-span-2" />
        </div>
      </div>
    );
  }

  // 에러 / 찾을 수 없음
  if (error || !item) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="시공 기록 상세"
          breadcrumbs={BREADCRUMBS}
          actions={
            <Link href="/boss/construction">
              <Button variant="secondary" icon={ArrowLeft}>
                목록
              </Button>
            </Link>
          }
        />
        <Card>
          <EmptyState
            icon={ImageIcon}
            title={error || '시공 기록을 찾을 수 없습니다.'}
            description="목록으로 돌아가 다시 시도해 주세요."
            action={
              <Link href="/boss/construction">
                <Button variant="primary" size="sm" icon={ArrowLeft}>
                  목록으로
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const isDone = item.status === '완료';
  const orderLabel = item.orderId != null ? `#${item.orderId}` : '연결 없음';

  return (
    <div className="space-y-5">
      <PageHeader
        title="시공 기록 상세"
        breadcrumbs={BREADCRUMBS}
        actions={
          <>
            <Link href="/boss/construction">
              <Button variant="secondary" icon={ArrowLeft}>
                목록
              </Button>
            </Link>
            <Link href={`/boss/construction/new?edit=${item.id}`}>
              <Button variant="secondary" icon={Pencil}>
                수정
              </Button>
            </Link>
            <Button variant="danger" icon={Trash2} onClick={handleDelete} disabled={deleting}>
              삭제
            </Button>
          </>
        }
      />

      {/* 개요 카드 */}
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={isDone ? 'emerald' : 'amber'}>
              {isDone ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
              {item.status}
            </Badge>
            <span className="text-xs text-boss-text-muted">#{String(item.id)}</span>
          </div>
          <h2 className="truncate text-lg font-semibold text-boss-text">
            {item.title || '제목 없음'}
          </h2>
          <p className="mt-1 text-sm text-boss-text-muted">
            시공일: {formatDate(item.constructionDate)}
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="text-center">
            <p className="text-xs text-boss-text-muted">전체 사진</p>
            <p className="font-semibold text-boss-text">{totalImages}장</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-boss-text-muted">연결 주문</p>
            <p className="font-semibold text-boss-text">{orderLabel}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 시공 정보 */}
        <Section title="시공 정보" icon={ClipboardList}>
          <Info
            label="상태"
            value={item.status}
            icon={isDone ? CheckCircle2 : Clock3}
          />
          <Info label="시공일" value={formatDate(item.constructionDate)} icon={Calendar} />
          <Info label="연결된 주문" value={orderLabel} icon={Link2} />
          <Info label="전체 사진" value={`${totalImages}장`} icon={ImageIcon} />
          <Info
            label="등록일"
            value={formatDateTime(item.createdAt ?? item.createdDt)}
            icon={Clock3}
          />
          <Info label="수정일" value={formatDateTime(item.updatedDt)} icon={Clock3} />
        </Section>

        {/* 시공 내용 */}
        <Section title="시공 내용" icon={FileText} className="lg:col-span-2">
          {item.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-boss-text">
              {item.description}
            </p>
          ) : (
            <p className="text-sm text-boss-text-muted">등록된 시공 설명이 없습니다.</p>
          )}
        </Section>
      </div>

      {/* 사진 */}
      <Section title="사진" icon={ImageIcon}>
        {/* 시공 전/중/후 탭 */}
        <div className="flex items-center gap-1 rounded-lg border border-boss-border bg-boss-bg p-1">
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
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-boss-surface text-boss-primary ring-1 ring-inset ring-boss-primary/30'
                    : 'text-boss-text-muted hover:bg-boss-elevated/60 hover:text-boss-text'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? 'bg-boss-primary/20 text-boss-primary'
                      : 'bg-boss-elevated text-boss-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 사진 그리드 */}
        {currentImages.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="등록된 사진이 없습니다"
            description={`수정 화면에서 ${TABS.find((t) => t.key === tab)?.label} 사진을 추가하세요.`}
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {currentImages.map((src, idx) => (
              <button
                key={`${tab}-${idx}-${src}`}
                type="button"
                onClick={() => openLightbox(currentImages, idx)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-boss-border bg-boss-bg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${tab}-${idx}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </Section>

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
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-boss-surface/80 text-boss-text hover:bg-boss-elevated"
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
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-boss-surface/80 text-boss-text hover:bg-boss-elevated"
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
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-boss-surface/80 text-boss-text hover:bg-boss-elevated"
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-boss-surface/80 px-3 py-1 text-xs text-boss-text">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────
// 로컬 헬퍼 — 참조 페이지(requests/[id])와 동일 패턴
// ───────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  className = '',
  children,
}: {
  title: string;
  icon: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-boss-text">
        <Icon size={15} className="text-boss-primary" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon: React.ElementType;
}) {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="mt-0.5 text-boss-text-muted" />
      <div>
        <p className="text-xs text-boss-text-muted">{label}</p>
        <p className="text-boss-text">{value}</p>
      </div>
    </div>
  );
}
