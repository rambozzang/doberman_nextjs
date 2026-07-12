'use client';

// 주문 상세 페이지
// 별도 API가 없어 목록에서 조회 후 관련 기능(견적서/체크리스트/시공/AS) 링크 제공
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Wallet,
  FileSignature,
  ListChecks,
  Hammer,
  Wrench,
  User,
  FileText,
  Home,
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

function fmtDate(s?: string) {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
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
      <div className="space-y-4">
        <PageHeader title="주문 상세" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      <PageHeader
        title={`#${item.id} ${item.name ?? ''}`}
        description="주문 정보와 관련 작업을 관리합니다."
        breadcrumbs={[{ label: '주문 관리', href: '/boss/orders' }, { label: `#${item.id}` }]}
        actions={
          <div className="flex items-center gap-2">
            {item.phone && (
              <a href={`tel:${item.phone}`}>
                <Button variant="secondary" size="sm" icon={Phone}>
                  전화
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 주문 정보 */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {item.isExistChecklist === 'Y' && (
              <Badge tone="amber">
                <ListChecks size={10} /> 체크리스트 있음
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={User} label="고객명" value={item.name ?? '-'} />
            <InfoRow icon={Phone} label="전화" value={item.phone ?? '-'} />
            <InfoRow
              icon={Calendar}
              label="작업일"
              value={fmtDate(item.workDate) || fmtDate(item.estimateDate)}
            />
            <InfoRow
              icon={Wallet}
              label="총 금액"
              value={formatMoney(item.totalAmount)}
              highlight
            />
            <InfoRow icon={Home} label="우편번호" value={item.post ?? '-'} />
            <InfoRow icon={MapPin} label="주소" value={fullAddr || '-'} />
          </div>

          {item.memo && (
            <div className="mt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
                메모
              </p>
              <p className="rounded-lg border border-boss-border bg-boss-bg p-3 text-sm text-boss-text-secondary">
                {item.memo}
              </p>
            </div>
          )}
        </Card>

        {/* 관련 작업 바로가기 */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
              관련 작업
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-boss-border bg-boss-bg p-3">
      <Icon size={14} className="shrink-0 text-boss-text-muted" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">{label}</p>
        <p className={`truncate text-sm ${highlight ? 'font-semibold text-boss-primary' : 'text-boss-text'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
