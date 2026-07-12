'use client';

// AS 요청 상세 페이지
// Flutter: as_request_detail_page.dart 포팅
// 레이아웃: boss/requests/[id] 상세 페이지의 컴팩트 B2B 패턴을 따름
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Wrench,
  Phone,
  MapPin,
  User,
  Receipt,
  Loader2,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';
import { PageHeader, Card, Button, Badge, EmptyState, ListTabs } from '@/components/boss/ui';

type Tab = 'defect' | 'repair';

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function statusBadge(status: string): { tone: 'sky' | 'amber' | 'emerald' | 'default'; label: string } {
  switch (status) {
    case '접수':
      return { tone: 'sky', label: '접수' };
    case '진행중':
      return { tone: 'amber', label: '진행중' };
    case '완료':
      return { tone: 'emerald', label: '완료' };
    case '취소':
      return { tone: 'default', label: '취소' };
    default:
      return { tone: 'default', label: status || '접수' };
  }
}

function priorityBadge(priority: string): { tone: 'rose' | 'default'; label: string; urgent: boolean } {
  if (priority === '긴급') return { tone: 'rose', label: '긴급', urgent: true };
  return { tone: 'default', label: priority || '보통', urgent: false };
}

function nextStatus(status: string): { next: string; label: string } | null {
  if (status === '접수') return { next: '진행중', label: '진행' };
  if (status === '진행중') return { next: '완료', label: '완료' };
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
    if (!confirm(`상태를 "${newStatus}"(으)로 변경하시겠습니까?`)) return;
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
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('이 AS 요청을 삭제하시겠습니까?\n삭제된 요청은 복구할 수 없습니다.')) return;
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
    }
  };

  const badge = item ? statusBadge(item.status) : null;
  const prio = item ? priorityBadge(item.priority) : null;
  const next = item ? nextStatus(item.status) : null;
  const isClosed = item ? item.status === '완료' || item.status === '취소' : false;
  const defectImages = item?.images?.filter((i) => i.imageType === 'DEFECT') ?? [];
  const repairImages = item?.images?.filter((i) => i.imageType === 'REPAIR') ?? [];

  const headerActions = item ? (
    <>
      {!isClosed && next && (
        <Button
          variant="primary"
          size="sm"
          icon={statusChanging ? Loader2 : CheckCircle2}
          onClick={() => handleChangeStatus(next.next)}
          disabled={statusChanging}
        >
          {next.label}
        </Button>
      )}
      <Link href={`/boss/as/new?id=${encodeURIComponent(item.id)}`}>
        <Button variant="secondary" size="sm" icon={Pencil}>
          수정
        </Button>
      </Link>
      <Button
        variant="danger"
        size="sm"
        icon={deleting ? Loader2 : Trash2}
        onClick={handleDelete}
        disabled={deleting}
      >
        삭제
      </Button>
    </>
  ) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="AS 요청 상세"
        breadcrumbs={[{ label: 'AS 요청', href: '/boss/as' }, { label: '상세' }]}
        actions={headerActions}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && !item ? (
        <div className="boss-empty">불러오는 중...</div>
      ) : !item ? (
        !error ? (
          <EmptyState
            icon={Wrench}
            title="데이터를 찾을 수 없습니다"
            description="AS 요청 정보를 불러올 수 없습니다."
            action={
              <Link href="/boss/as">
                <Button variant="secondary" size="sm" icon={ArrowLeft}>
                  목록으로
                </Button>
              </Link>
            }
          />
        ) : null
      ) : (
        <>
          {/* 개요 카드 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
                {prio && (
                  <Badge tone={prio.tone}>
                    {prio.urgent && <AlertTriangle size={10} />}
                    {prio.label}
                  </Badge>
                )}
                <span className="text-xs text-boss-text-muted">#{item.id}</span>
              </div>
              <h2 className="text-lg font-semibold text-boss-text">{item.title}</h2>
              <p className="mt-1 text-sm text-boss-text-muted">
                고객: {item.customerName} · 접수일: {formatDate(item.requestDate)}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">하자 사진</p>
                <p className="font-semibold text-boss-text">{defectImages.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">수리 사진</p>
                <p className="font-semibold text-boss-text">{repairImages.length}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* 고객·연락처 */}
            <Section title="고객·연락처" icon={User}>
              <Info label="고객명" value={item.customerName} icon={User} />
              <Info
                label="전화"
                value={item.customerPhone}
                icon={Phone}
                href={item.customerPhone ? `tel:${item.customerPhone}` : undefined}
              />
              <Info label="주소" value={item.address} icon={MapPin} />
            </Section>

            {/* 요청 내용 */}
            <Section title="요청 내용" icon={Wrench}>
              <Info label="제목" value={item.title} icon={FileText} />
              <Info label="우선순위" value={item.priority} icon={AlertTriangle} />
              <Info
                label="연결 주문"
                value={item.orderId != null ? `#${item.orderId}` : undefined}
                icon={Receipt}
              />
              {item.description && (
                <div className="flex items-start gap-2.5 text-sm">
                  <FileText size={14} className="mt-0.5 text-boss-text-muted" />
                  <div>
                    <p className="text-xs text-boss-text-muted">하자 설명</p>
                    <p className="whitespace-pre-line text-boss-text">{item.description}</p>
                  </div>
                </div>
              )}
            </Section>

            {/* 처리 상태·이력 */}
            <Section title="처리 상태·이력" icon={Clock}>
              <Info label="현재 상태" value={item.status} icon={CheckCircle2} />
              <Info label="접수일" value={formatDate(item.requestDate)} icon={Calendar} />
              <Info
                label="완료일"
                value={item.completedDate ? formatDate(item.completedDate) : undefined}
                icon={CheckCircle2}
              />
              <Info
                label="등록일시"
                value={item.createdAt ? formatDate(item.createdAt) : undefined}
                icon={Clock}
              />
              <Info
                label="수정일시"
                value={item.updatedAt ? formatDate(item.updatedAt) : undefined}
                icon={Clock}
              />
            </Section>
          </div>

          {/* 현장 사진 (하자/수리 탭) */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-boss-text">
              <ImageIcon size={15} className="text-boss-primary" />
              현장 사진
            </h3>
            <ListTabs
              tabs={[
                { key: 'defect', label: '하자', count: defectImages.length },
                { key: 'repair', label: '수리', count: repairImages.length },
              ]}
              active={tab}
              onChange={(key) => setTab(key)}
            />
            <div className="mt-4">
              <ImageGrid
                images={
                  tab === 'defect'
                    ? defectImages.map((i) => i.filePath)
                    : repairImages.map((i) => i.filePath)
                }
                emptyMessage={tab === 'defect' ? '등록된 하자 사진이 없습니다' : '등록된 수리 사진이 없습니다'}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
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
  href,
}: {
  label: string;
  value?: string | number | null;
  icon: React.ElementType;
  href?: string;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="mt-0.5 text-boss-text-muted" />
      <div>
        <p className="text-xs text-boss-text-muted">{label}</p>
        {href ? (
          <a href={href} className="text-boss-text hover:text-boss-primary">
            {value}
          </a>
        ) : (
          <p className="text-boss-text">{value}</p>
        )}
      </div>
    </div>
  );
}

function ImageGrid({ images, emptyMessage }: { images: string[]; emptyMessage: string }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-boss-border bg-boss-surface/30 px-6 py-10 text-center">
        <ImageIcon size={24} className="mb-2 text-boss-text-muted" />
        <p className="text-sm text-boss-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((url, idx) => (
        <a
          key={`${url}-${idx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square overflow-hidden rounded-lg border border-boss-border bg-boss-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`AS 이미지 ${idx + 1}`} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
