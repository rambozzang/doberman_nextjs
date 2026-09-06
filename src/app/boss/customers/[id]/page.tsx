'use client';

// 고객 상세 — Industry 패턴 (좌 본문 패널 + 우 요약 패널 2열)
// 별도 상세 API 가 없어 목록에서 조회한 뒤 관련 기능(견적서 / 체크리스트 / 시공 / AS) 링크를 제공한다.
// 화면 제목 · "← 고객" 링크는 셸 헤더가 그린다.

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bossOrdersApi } from '@/lib/api/boss/orders';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { customerStatus } from '@/lib/boss/customerStatus';
import toast from 'react-hot-toast';
import type { BossOrderItem } from '@/types/boss';
import {
  Panel,
  Button,
  ButtonLink,
  Tag,
  Skeleton,
  EmptyState,
  DescRow,
  AlertBanner,
  RowItem,
  RowThumb,
  RowChevron,
  ConfirmDialog,
} from '@/components/boss/ui';
import { FileSignature, ListChecks, Hammer, Wrench, Trash2 } from 'lucide-react';


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

export default function BossOrderDetailPage() {
  const router = useRouter();
  // Next 16 에서 페이지의 params 는 Promise 라 직접 읽으면 undefined 가 된다 — useParams 를 쓴다
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [item, setItem] = useState<BossOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 수금완료 처리 — 앱 "수금완료 처리하시겠습니까?" 와 같은 흐름. 완료되면 앱에서도 수정이 잠긴다.
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const handleMarkPaid = async () => {
    if (!item?.id || markingPaid) return;
    setMarkingPaid(true);
    try {
      const res = await bossCustomersApi.updateStatus(item.id, '10');
      if (res.success !== false) {
        toast.success('수금완료로 표시했습니다.');
        setConfirmPaid(false);
        setItem({ ...item, statusCd: '10' });
      } else {
        toast.error(res.message || res.error || '상태를 바꾸지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 상태를 바꾸지 못했습니다.');
    } finally {
      setMarkingPaid(false);
    }
  };

  // 삭제 — 되돌릴 수 없으므로 ConfirmDialog 를 거친다
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!item?.id || deleting) return;
    setDeleting(true);
    try {
      const res = await bossCustomersApi.remove(item.id);
      if (res.success !== false) {
        toast.success('고객을 삭제했습니다.');
        setConfirmDelete(false);
        router.replace('/boss/customers');
      } else {
        toast.error(res.message || res.error || '삭제하지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

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
          setError('고객을 찾을 수 없습니다.');
        }
      } else {
        setError(res.message || '고객을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 고객을 불러오지 못했습니다.');
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
          title="고객을 열지 못했습니다"
          description="삭제됐거나 최근 200건 밖의 고객일 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => load()}>
                다시 시도
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.replace('/boss/customers')}>
                목록으로
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const status = customerStatus(item.statusCd, item.workDate);
  const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ───── 좌: 본문 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker={`고객 #${item.id}`} title={item.name || '고객명 미지정'}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Tag tone={status.tone}>{status.label}</Tag>
            {item.isExistChecklist === 'Y' && <Tag tone="info">체크리스트 있음</Tag>}
          </div>

          <h4 className="boss-mono-label mb-2">고객 정보</h4>
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
            <DescRow label="상태" value={<Tag tone={status.tone}>{status.label}</Tag>} />
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

          {item.statusCd !== '10' && item.statusCd !== '30' && (
            <Button variant="primary" onClick={() => setConfirmPaid(true)} className="mt-4 w-full">
              수금완료 처리
            </Button>
          )}
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className={`boss-btn boss-btn-md boss-btn-secondary w-full ${item.statusCd !== '10' && item.statusCd !== '30' ? 'mt-2' : 'mt-4'}`}
            >
              고객에게 전화
            </a>
          )}
          <ButtonLink
            href={`/boss/estimate?customerId=${item.id}`}
            variant="secondary"
            className="mt-2 w-full"
          >
            고객 견적서 작성
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmDelete(true)}
            className="mt-2 w-full !text-boss-error"
          >
            고객 삭제
          </Button>
        </Panel>

        <Panel kicker="안내" title="업무 흐름">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            대기 → 확정 → 진행 → 완료 순서로 상태가 바뀝니다. 시공이 끝나면 영수증을 발행하고 수금을
            기록해야 매출 분석에 잡힙니다.
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmPaid}
        title="수금완료 처리하시겠습니까?"
        description="수금완료로 바꾸면 매출 분석에 잡히고, 앱에서는 견적 내용을 더 수정할 수 없습니다."
        confirmLabel="수금완료"
        tone="primary"
        loading={markingPaid}
        onCancel={() => setConfirmPaid(false)}
        onConfirm={() => void handleMarkPaid()}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="이 고객을 삭제할까요?"
        description={`'${item.name || '고객명 미지정'}' 고객과 연결된 견적서 · 체크리스트 · 시공 기록은 그대로 남지만, 고객 목록에서는 사라지며 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
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
