'use client';

// 주문 상세 — Industry 패턴 (좌 본문 패널 + 우 요약 패널 2열)
// 별도 상세 API 가 없어 목록에서 조회한 뒤 관련 기능(견적서 / 체크리스트 / 시공 / AS) 링크를 제공한다.
// 화면 제목 · "← 주문 관리" 링크는 셸 헤더가 그린다.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import type { BossOrderItem } from '@/types/boss';
import {
  Panel,
  Button,
  ButtonLink,
  Badge,
  Tag,
  Skeleton,
  EmptyState,
  DescRow,
  AlertBanner,
  RowItem,
  RowThumb,
  RowChevron,
} from '@/components/boss/ui';
import { FileSignature, ListChecks, Hammer, Wrench } from 'lucide-react';

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
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}
        <EmptyState
          title="주문을 열지 못했습니다"
          description="삭제됐거나 최근 200건 밖의 주문일 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => load()}>
                다시 시도
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.replace('/boss/orders')}>
                목록으로
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const status = orderStatus(item.statusCd);
  const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ───── 좌: 본문 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker={`주문 #${item.id}`} title={item.name || '고객명 미지정'}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {item.isExistChecklist === 'Y' && <Tag tone="info">체크리스트 있음</Tag>}
          </div>

          <h4 className="boss-mono-label mb-2">주문 정보</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
            <Fact label="총 금액" value={item.totalAmount ? formatMoney(item.totalAmount) : undefined} num />
            <Fact
              label="시공 기간"
              value={item.workDate ? formatWorkPeriod(item.workDate, item.workEndDate) : undefined}
              num
            />
            <Fact label="견적일" value={item.estimateDate ? formatDate(item.estimateDate) : undefined} num />
            <Fact label="주소" value={fullAddr || undefined} wide />
            <Fact label="우편번호" value={item.post} num />
            <Fact label="첨부 이미지" value={item.imageCount ? `${item.imageCount}장` : undefined} num />
            <Fact label="등록일" value={item.createdDt ? formatDate(item.createdDt) : undefined} num />
            <Fact label="수정일" value={item.updatedDt ? formatDate(item.updatedDt) : undefined} num />
          </div>

          <h4 className="boss-mono-label mb-2 mt-5 border-t border-boss-border-row pt-4">메모</h4>
          {item.memo ? (
            <p className="whitespace-pre-wrap border border-boss-border bg-boss-inset px-3.5 py-3 text-[13.5px] leading-relaxed text-boss-text-soft">
              {item.memo}
            </p>
          ) : (
            <p className="text-[13px] text-boss-text-secondary">등록된 메모가 없습니다.</p>
          )}
        </Panel>

        <Panel kicker="이어서" title="관련 작업" bodyClassName="-mx-5 -mb-5 border-t border-boss-border">
          <div className="divide-y divide-boss-border-row">
            <RowItem
              href={`/boss/estimate?orderId=${item.id}`}
              leading={<RowThumb icon={FileSignature} />}
              title="견적서"
              subtitle="견적서 작성 · 출력 · 영수증"
              actions={<RowChevron />}
            />
            <RowItem
              href={`/boss/checklist/new?orderId=${item.id}`}
              leading={<RowThumb icon={ListChecks} />}
              title="체크리스트"
              subtitle="현장 실측 · 시공 전후 점검"
              actions={<RowChevron />}
            />
            <RowItem
              href={`/boss/construction/new?orderId=${item.id}`}
              leading={<RowThumb icon={Hammer} />}
              title="시공 기록"
              subtitle="시공 전 · 중 · 후 사진 등록"
              actions={<RowChevron />}
            />
            <RowItem
              href={`/boss/as/new?orderId=${item.id}`}
              leading={<RowThumb icon={Wrench} />}
              title="AS 요청"
              subtitle="하자 보수 접수"
              actions={<RowChevron />}
            />
          </div>
        </Panel>
      </div>

      {/* ───── 우: 요약 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="요약" title="고객 · 금액">
          <p className="font-boss-head text-[32px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-boss-text">
            {formatMoney(item.totalAmount)}
          </p>
          <p className="mt-1 text-[12px] text-boss-text-secondary">총 금액</p>

          <dl className="mt-3">
            <DescRow label="상태" value={<Badge tone={status.tone}>{status.label}</Badge>} />
            <DescRow label="고객" value={item.name || '—'} />
            <DescRow
              label="연락처"
              value={
                item.phone ? (
                  <a href={`tel:${item.phone}`} className="font-boss-head tabular-nums">
                    {item.phone}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <DescRow
              label="이메일"
              value={item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : '—'}
            />
            <DescRow
              label="시공"
              value={
                <span className="font-boss-head tabular-nums">
                  {item.workDate ? formatWorkPeriod(item.workDate, item.workEndDate) : '미정'}
                </span>
              }
            />
          </dl>

          {item.phone && (
            <a href={`tel:${item.phone}`} className="boss-btn boss-btn-md boss-btn-primary mt-4 w-full">
              고객에게 전화
            </a>
          )}
          <ButtonLink
            href={`/boss/estimate?orderId=${item.id}`}
            variant="secondary"
            className="mt-2 w-full"
          >
            견적서 작성
          </ButtonLink>
        </Panel>

        <Panel kicker="안내" title="주문 흐름">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            대기 → 확정 → 진행 → 완료 순서로 상태가 바뀝니다. 시공이 끝나면 영수증을 발행하고 수금을
            기록해야 매출 분석에 잡힙니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/** 라벨(10px 대문자) + 값. 값이 없으면 그리지 않는다. */
function Fact({
  label,
  value,
  num = false,
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  num?: boolean;
  wide?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
      <p className="boss-mono-label">{label}</p>
      <p
        className={`mt-0.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-boss-text ${
          num ? 'font-boss-head tabular-nums' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
