'use client';

// AS 요청 상세 — Industry 패턴
//   좌: 제목 · 하자 설명 · 현장 사진(하자/수리 탭) / 우: 고객 · 처리 이력(DescRow) + 다음 상태 · 수정 · 삭제.
//   화면 제목과 ← AS 요청 링크는 셸 헤더가 그린다. 상태 변경 · 삭제는 ConfirmDialog.
// Flutter: as_request_detail_page.dart 포팅
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, CheckCircle2, Image as ImageIcon, Wrench } from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';
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
  type StatusTone,
} from '@/components/boss/ui';

type Tab = 'defect' | 'repair';
type PendingAction = { type: 'status'; next: string; label: string } | { type: 'delete' } | null;

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function statusBadge(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case '접수':
      return { tone: 'info', label: '접수' };
    case '진행중':
      return { tone: 'warn', label: '진행중' };
    case '완료':
      return { tone: 'ok', label: '완료' };
    case '취소':
      return { tone: 'neutral', label: '취소' };
    default:
      return { tone: 'neutral', label: status || '접수' };
  }
}

function priorityBadge(priority: string): { tone: StatusTone; label: string; urgent: boolean } {
  if (priority === '긴급') return { tone: 'bad', label: '긴급', urgent: true };
  return { tone: 'neutral', label: priority || '보통', urgent: false };
}

function nextStatus(status: string): { next: string; label: string } | null {
  if (status === '접수') return { next: '진행중', label: '진행 시작' };
  if (status === '진행중') return { next: '완료', label: '완료 처리' };
  return null;
}

export default function BossAsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [item, setItem] = useState<AsRequestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('defect');
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossAsApi.detail(id);
      if (res.success !== false && res.data) {
        setItem(res.data);
      } else {
        setError(res.message || '상세 정보를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 상세 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangeStatus = async (newStatus: string) => {
    if (!item) return;
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setStatusChanging(true);
    try {
      const res = await bossAsApi.changeStatus(item.id, custId, newStatus);
      if (res.success !== false) {
        toast.success(`상태가 "${newStatus}"(으)로 변경되었습니다`);
        await load();
      } else {
        toast.error(res.message || '상태 변경에 실패했습니다');
      }
    } catch {
      toast.error('상태 변경 중 오류가 발생했습니다');
    } finally {
      setStatusChanging(false);
      setPending(null);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossAsApi.remove(item.id, custId);
      if (res.success !== false) {
        toast.success('AS 요청이 삭제되었습니다');
        router.push('/boss/as');
      } else {
        toast.error(res.message || '삭제에 실패했습니다');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
      setPending(null);
    }
  };

  const badge = item ? statusBadge(item.status) : null;
  const prio = item ? priorityBadge(item.priority) : null;
  const next = item ? nextStatus(item.status) : null;
  const isClosed = item ? item.status === '완료' || item.status === '취소' : false;
  const defectImages = item?.images?.filter((i) => i.imageType === 'DEFECT') ?? [];
  const repairImages = item?.images?.filter((i) => i.imageType === 'REPAIR') ?? [];
  const phoneDigits = item?.customerPhone?.replace(/[^0-9+]/g, '') ?? '';

  if (loading && !item) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}
        <EmptyState
          icon={Wrench}
          title="AS 요청을 열 수 없습니다"
          description="삭제됐거나 주소가 잘못됐을 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/as" variant="primary" size="sm" icon={ArrowLeft}>
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const images = tab === 'defect' ? defectImages : repairImages;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── 좌: 본문 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}

        {/* 제목 · 상태 */}
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            {badge && <StatusPill tone={badge.tone}>{badge.label}</StatusPill>}
            {prio && prio.urgent && <StatusPill tone={prio.tone}>{prio.label}</StatusPill>}
            <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">#{item.id}</span>
          </div>
          <h2 className="mt-2 font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.01em] text-boss-text">
            {item.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-boss-text-secondary">
            {item.customerName} · 접수{' '}
            <span className="font-boss-head tabular-nums text-boss-text">{formatDate(item.requestDate)}</span>
          </p>
        </Panel>

        {/* 하자 설명 */}
        <Panel title="하자 설명" kicker="DESCRIPTION">
          {item.description ? (
            <p className="whitespace-pre-line text-[13.5px] leading-[1.7] text-boss-text">{item.description}</p>
          ) : (
            <p className="text-[13px] text-boss-text-secondary">
              하자 설명이 없습니다. 수정 화면에서 위치 · 증상 · 발생 시점을 남겨 두면 재방문 때 도움이 됩니다.
            </p>
          )}
        </Panel>

        {/* 현장 사진 */}
        <ContentCard>
          <CardHead
            title="현장 사진"
            count={`${defectImages.length + repairImages.length}장`}
            countTone="muted"
          />
          <div className="flex flex-col gap-4 p-5">
            <ListTabs
              tabs={[
                { key: 'defect', label: '하자', count: defectImages.length },
                { key: 'repair', label: '수리', count: repairImages.length },
              ]}
              active={tab}
              onChange={(key) => setTab(key)}
            />
            {images.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title={tab === 'defect' ? '하자 사진이 없습니다' : '수리 사진이 없습니다'}
                description={
                  tab === 'defect'
                    ? '수정 화면에서 하자 사진을 추가할 수 있습니다.'
                    : '수리 사진은 앱에서 완료 처리할 때 올라옵니다.'
                }
                action={
                  tab === 'defect' ? (
                    <ButtonLink
                      href={`/boss/as/new?id=${encodeURIComponent(item.id)}`}
                      variant="secondary"
                      size="sm"
                      icon={Pencil}
                    >
                      사진 추가하기
                    </ButtonLink>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {images.map((img, idx) => (
                  <a
                    key={`${img.filePath}-${idx}`}
                    href={img.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden border border-boss-border bg-boss-bg"
                    aria-label={`${tab === 'defect' ? '하자' : '수리'} 사진 ${idx + 1} 새 창에서 보기`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.filePath}
                      alt={`${tab === 'defect' ? '하자' : '수리'} 사진 ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 bg-boss-text/75 px-1.5 py-px font-boss-head text-[10px] font-semibold text-boss-bg">
                      {idx + 1}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </ContentCard>
      </div>

      {/* ── 우: 요약 · 작업 ── */}
      <div className="flex flex-col gap-4">
        <Panel title="고객" kicker="CUSTOMER">
          <dl>
            <DescRow label="고객명" value={item.customerName || '—'} />
            <DescRow
              label="연락처"
              value={
                phoneDigits ? (
                  <a href={`tel:${phoneDigits}`} className="font-boss-head tabular-nums">
                    {item.customerPhone}
                  </a>
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow
              label="주소"
              value={item.address || <span className="font-normal text-boss-text-muted">—</span>}
            />
            <DescRow
              label="연결 주문"
              value={
                item.orderId != null ? (
                  <span className="font-boss-head tabular-nums text-boss-primary">#{item.orderId}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">연결 없음</span>
                )
              }
            />
          </dl>
        </Panel>

        <Panel title="처리 이력" kicker="TIMELINE">
          <dl>
            <DescRow label="상태" value={badge && <StatusPill tone={badge.tone}>{badge.label}</StatusPill>} />
            <DescRow label="우선순위" value={prio && <StatusPill tone={prio.tone}>{prio.label}</StatusPill>} />
            <DescRow
              label="접수일"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.requestDate)}</span>}
            />
            <DescRow
              label="완료일"
              value={
                item.completedDate ? (
                  <span className="font-boss-head tabular-nums">{formatDate(item.completedDate)}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow
              label="등록"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.createdAt)}</span>}
            />
            <DescRow
              label="수정"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.updatedAt)}</span>}
            />
          </dl>
        </Panel>

        <Panel title="작업" kicker="ACTIONS">
          <div className="flex flex-col gap-2">
            {!isClosed && next && (
              <Button
                variant="primary"
                icon={CheckCircle2}
                onClick={() => setPending({ type: 'status', next: next.next, label: next.label })}
                disabled={statusChanging}
                className="w-full"
              >
                {statusChanging ? '변경 중…' : next.label}
              </Button>
            )}
            <ButtonLink
              href={`/boss/as/new?id=${encodeURIComponent(item.id)}`}
              variant="secondary"
              icon={Pencil}
              className="w-full"
            >
              요청 수정
            </ButtonLink>
            <ButtonLink href="/boss/as" variant="secondary" icon={ArrowLeft} className="w-full">
              목록으로
            </ButtonLink>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setPending({ type: 'delete' })}
              disabled={deleting}
              className="w-full !text-boss-text-muted hover:!text-boss-error"
            >
              삭제
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            {isClosed
              ? '종료된 요청입니다. 상태는 더 바꿀 수 없습니다.'
              : '상태는 접수 → 진행중 → 완료 순으로만 바뀌며 되돌릴 수 없습니다.'}
          </p>
        </Panel>
      </div>

      {/* 상태 변경 확인 */}
      <ConfirmDialog
        open={pending?.type === 'status'}
        tone="primary"
        title={pending?.type === 'status' ? `"${pending.next}" 상태로 바꿀까요?` : ''}
        description="상태는 되돌릴 수 없습니다. 고객에게 안내한 뒤 진행해 주세요."
        confirmLabel={pending?.type === 'status' ? pending.label : '변경'}
        loading={statusChanging}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.type === 'status') void handleChangeStatus(pending.next);
        }}
      />

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pending?.type === 'delete'}
        title="이 AS 요청을 삭제할까요?"
        description="삭제된 요청과 사진 링크는 복구할 수 없습니다. 연결된 주문은 그대로 남습니다."
        loading={deleting}
        onCancel={() => setPending(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
