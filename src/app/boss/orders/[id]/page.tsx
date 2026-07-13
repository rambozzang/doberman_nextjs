'use client';

// 주문 상세 페이지
// 별도 상세 API가 없어 목록에서 조회 후 관련 기능(견적서/체크리스트/시공/AS) 링크 제공
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem } from '@/types/boss';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  RowList,
  RowItem,
  RowThumb,
  RowChevron,
} from '@/components/boss/ui';
import {
  Phone,
  MapPin,
  Calendar,
  CalendarClock,
  Clock,
  Wallet,
  FileSignature,
  ListChecks,
  Hammer,
  Wrench,
  User,
  Mail,
  FileText,
  Home,
  Images,
  StickyNote,
  LayoutGrid,
} from 'lucide-react';

function orderStatus(code?: string) {
  const c = (code ?? '').toUpperCase();
  if (c.includes('NEW') || c.includes('대기')) return { label: '대기', tone: 'default' as const };
  if (c.includes('CONFIRM') || c.includes('확정')) return { label: '확정', tone: 'emerald' as const };
  if (c.includes('PROGRESS') || c.includes('진행')) return { label: '진행', tone: 'sky' as const };
  if (c.includes('DONE') || c.includes('완료')) return { label: '완료', tone: 'violet' as const };
  if (c.includes('CANCEL') || c.includes('취소')) return { label: '취소', tone: 'rose' as const };
  return { label: code || '신규', tone: 'default' as const };
}

function formatMoney(n?: number) {
  if (!n) return '-';
  return '₩' + n.toLocaleString('ko-KR');
}

function formatDate(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 시공 기간: 종료일이 있고 시작일과 다르면 "시작 ~ 종료", 아니면 시작일만
function formatWorkPeriod(start?: string | null, end?: string | null) {
  if (end && end !== start) {
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  }
  return formatDate(start);
}

export default function BossOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params?.id);
  const [item, setItem] = useState<BossOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossOrdersApi.list({ page: 0, size: 200 });
      if (res.success && res.data) {
        const found = (res.data.content ?? []).find((o) => o.id === id);
        if (found) {
          setItem(found);
        } else {
          setError('주문을 찾을 수 없습니다.');
        }
      } else {
        setError(res.message || '주문을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 주문을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="주문 상세"
          breadcrumbs={[{ label: '주문 관리', href: '/boss/orders' }, { label: '상세' }]}
        />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="주문 상세"
          breadcrumbs={[{ label: '주문 관리', href: '/boss/orders' }, { label: '상세' }]}
        />
        <EmptyState
          icon={FileText}
          title={error || '주문을 찾을 수 없습니다'}
          action={
            <Button variant="secondary" size="sm" onClick={() => router.replace('/boss/orders')}>
              목록으로
            </Button>
          }
        />
      </div>
    );
  }

  const status = orderStatus(item.statusCd);
  const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');

  return (
    <div className="space-y-5">
      <PageHeader
        title="주문 상세"
        description="주문 정보와 관련 작업을 관리합니다."
        breadcrumbs={[{ label: '주문 관리', href: '/boss/orders' }, { label: '상세' }]}
        actions={
          item.phone ? (
            <a href={`tel:${item.phone}`}>
              <Button variant="secondary" size="sm" icon={Phone}>
                전화
              </Button>
            </a>
          ) : undefined
        }
      />

      {/* 개요 카드 */}
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {item.isExistChecklist === 'Y' && (
              <Badge tone="amber">
                <ListChecks size={10} /> 체크리스트
              </Badge>
            )}
            <span className="text-xs text-boss-text-muted">#{item.id}</span>
          </div>
          <h2 className="truncate text-lg font-semibold text-boss-text">
            {item.name || '고객명 미지정'}
          </h2>
          <p className="mt-1 truncate text-sm text-boss-text-muted">{fullAddr || '주소 미등록'}</p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="text-center">
            <p className="text-xs text-boss-text-muted">총 금액</p>
            <p className="font-semibold text-boss-primary">{formatMoney(item.totalAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-boss-text-muted">시공 기간</p>
            <p className="font-semibold text-boss-text">
              {formatWorkPeriod(item.workDate, item.workEndDate)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 고객 정보 */}
        <Section title="고객 정보" icon={User}>
          <Info label="고객명" value={item.name} icon={User} />
          <Info label="연락처" value={item.phone} icon={Phone} />
          <Info label="이메일" value={item.email} icon={Mail} />
        </Section>

        {/* 주문 정보 */}
        <Section title="주문 정보" icon={FileText}>
          <Info
            label="총 금액"
            value={item.totalAmount ? formatMoney(item.totalAmount) : undefined}
            icon={Wallet}
            highlight
          />
          <Info
            label="시공 기간"
            value={item.workDate ? formatWorkPeriod(item.workDate, item.workEndDate) : undefined}
            icon={Calendar}
          />
          <Info
            label="견적일"
            value={item.estimateDate ? formatDate(item.estimateDate) : undefined}
            icon={CalendarClock}
          />
          <Info label="우편번호" value={item.post} icon={Home} />
          <Info label="주소" value={fullAddr || undefined} icon={MapPin} />
          <Info
            label="첨부 이미지"
            value={item.imageCount ? `${item.imageCount}장` : undefined}
            icon={Images}
          />
          <Info label="등록일" value={item.createdDt ? formatDate(item.createdDt) : undefined} icon={Clock} />
          <Info label="수정일" value={item.updatedDt ? formatDate(item.updatedDt) : undefined} icon={Clock} />
        </Section>

        {/* 메모 */}
        <Section title="메모" icon={StickyNote}>
          {item.memo ? (
            <p className="whitespace-pre-wrap rounded-lg border border-boss-border bg-boss-bg p-3 text-sm text-boss-text-secondary">
              {item.memo}
            </p>
          ) : (
            <p className="text-sm text-boss-text-muted">등록된 메모가 없습니다.</p>
          )}
        </Section>
      </div>

      {/* 관련 작업 바로가기 */}
      <Section title="관련 작업 바로가기" icon={LayoutGrid}>
        <RowList>
          <RowItem
            href={`/boss/estimate?orderId=${item.id}`}
            leading={<RowThumb icon={FileSignature} />}
            title="견적서"
            subtitle="견적서 작성 및 출력"
            actions={<RowChevron />}
          />
          <RowItem
            href={`/boss/checklist/new?orderId=${item.id}`}
            leading={<RowThumb icon={ListChecks} />}
            title="체크리스트"
            subtitle="현장 실측 체크리스트"
            actions={<RowChevron />}
          />
          <RowItem
            href={`/boss/construction/new?orderId=${item.id}`}
            leading={<RowThumb icon={Hammer} />}
            title="시공 기록"
            subtitle="시공 전/중/후 사진 등록"
            actions={<RowChevron />}
          />
          <RowItem
            href={`/boss/as/new?orderId=${item.id}`}
            leading={<RowThumb icon={Wrench} />}
            title="AS 요청"
            subtitle="하자 보수 요청"
            actions={<RowChevron />}
          />
        </RowList>
      </Section>
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
  highlight,
}: {
  label: string;
  value?: string | number | null;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="mt-0.5 text-boss-text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-boss-text-muted">{label}</p>
        <p className={highlight ? 'font-semibold text-boss-primary' : 'text-boss-text'}>{value}</p>
      </div>
    </div>
  );
}
