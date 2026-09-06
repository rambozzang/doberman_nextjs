'use client';

// 고객 서명 상세 — Industry 패턴
//   좌: 서명 이미지(흰 종이 위) + 메모 / 우: DescRow 요약 + 주문 이동 · 목록 · 삭제.
//   화면 제목과 ← 고객 서명 링크는 셸 헤더가 그린다. 삭제는 ConfirmDialog.
// Flutter: lib/app/signature/signature_detail_page.dart 와 대응 — 단건 API 가 없어 목록에서 id 로 찾는다.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Trash2, PenLine, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';
import {
  Panel,
  Button,
  ButtonLink,
  StatusPill,
  EmptyState,
  AlertBanner,
  DescRow,
  Skeleton,
  ConfirmDialog,
} from '@/components/boss/ui';

// 날짜 포맷터(년 월 일)
function formatDate(input?: string | null): string {
  if (!input) return '미확인';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '미확인';
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(
    d.getDate(),
  ).padStart(2, '0')}일`;
}

// 휴대폰 포맷터
function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function BossSignatureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [item, setItem] = useState<BossSignatureItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 단일 조회 API 가 없으므로 사용자별 목록에서 찾음 (Flutter 와 동일 패턴)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userInfo = BossAuthManager.getUserInfo();
      const custId = userInfo?.userId ?? '';
      if (!custId) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      try {
        const res = await bossSignatureApi.list(custId);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          const found = res.data.find((it) => String(it.id) === String(id)) ?? null;
          setItem(found);
          if (!found) setError('정보를 찾을 수 없습니다.');
        } else {
          setError(res.message || '서명 정보를 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!item?.id) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossSignatureApi.remove(item.id, custId);
      if (res.success) {
        toast.success('삭제되었습니다.');
        router.push('/boss/signature');
      } else {
        toast.error(res.message || '오류가 발생했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const badge = item?.confirmedAt
    ? { tone: 'ok' as const, label: '확인 완료' }
    : { tone: 'warn' as const, label: '미확인' };

  const hasImage =
    !!item?.signatureImagePath &&
    (item.signatureImagePath.startsWith('http') || item.signatureImagePath.startsWith('data:'));

  const phoneText = formatPhone(item?.customerPhone);
  const phoneDigits = item?.customerPhone?.replace(/[^0-9+]/g, '') ?? '';

  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-28" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col gap-4">
        {error && <AlertBanner tone="bad">{error}</AlertBanner>}
        <EmptyState
          icon={PenLine}
          title="서명 기록을 열 수 없습니다"
          description="삭제됐거나 주소가 잘못됐을 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/signature" variant="primary" size="sm" icon={ArrowLeft}>
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── 좌: 서명 이미지 · 메모 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel
          title={item.customerName || '이름 없음'}
          kicker="SIGNATURE"
          right={<StatusPill tone={badge.tone}>{badge.label}</StatusPill>}
        >
          {/* 서명은 캔버스 저장본(흰 배경 PNG)이라 종이처럼 흰 면 위에 올린다 */}
          <div className="flex min-h-[280px] items-center justify-center border border-boss-border bg-white p-6">
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.signatureImagePath}
                alt={`${item.customerName ?? '고객'} 서명`}
                className="max-h-72 max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-boss-text-muted">
                <PenLine size={40} strokeWidth={1.25} />
                <span className="text-[12.5px]">저장된 서명 이미지가 없습니다</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-[12px] text-boss-text-secondary">
            서명일{' '}
            <span className="font-boss-head tabular-nums text-boss-text">{formatDate(item.createdDt)}</span>
            {item.confirmedAt && (
              <>
                {' '}
                · 확인{' '}
                <span className="font-boss-head tabular-nums text-boss-text">
                  {formatDate(item.confirmedAt)}
                </span>
              </>
            )}
          </p>
        </Panel>

        <Panel title="메모" kicker="NOTE">
          {item.memo ? (
            <p className="whitespace-pre-line text-[13.5px] leading-[1.7] text-boss-text">{item.memo}</p>
          ) : (
            <p className="text-[13px] text-boss-text-secondary">
              남긴 메모가 없습니다. 서명을 받을 때 현장 · 시공 내용을 메모해 두면 나중에 찾기 쉽습니다.
            </p>
          )}
        </Panel>
      </div>

      {/* ── 우: 요약 · 작업 ── */}
      <div className="flex flex-col gap-4">
        <Panel title="요약" kicker="RECORD">
          <dl>
            <DescRow
              label="번호"
              value={<span className="font-boss-head tabular-nums">#{item.id}</span>}
            />
            <DescRow label="고객명" value={item.customerName || '이름 없음'} />
            <DescRow
              label="연락처"
              value={
                phoneDigits ? (
                  <a href={`tel:${phoneDigits}`} className="font-boss-head tabular-nums">
                    {phoneText}
                  </a>
                ) : (
                  <span className="font-normal text-boss-text-muted">—</span>
                )
              }
            />
            <DescRow label="상태" value={<StatusPill tone={badge.tone}>{badge.label}</StatusPill>} />
            <DescRow
              label="등록일"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.createdDt)}</span>}
            />
            <DescRow
              label="확인일"
              value={
                item.confirmedAt ? (
                  <span className="font-boss-head tabular-nums">{formatDate(item.confirmedAt)}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">미확인</span>
                )
              }
            />
            <DescRow
              label="시공 기록"
              value={
                item.recordId ? (
                  <Link href={`/boss/construction/${item.recordId}`} className="font-boss-head tabular-nums">
                    #{item.recordId}
                  </Link>
                ) : (
                  <span className="font-normal text-boss-text-muted">연결 없음</span>
                )
              }
            />
            <DescRow
              label="주문"
              value={
                item.orderId ? (
                  <span className="font-boss-head tabular-nums text-boss-primary">#{item.orderId}</span>
                ) : (
                  <span className="font-normal text-boss-text-muted">연결 없음</span>
                )
              }
            />
          </dl>
        </Panel>

        <Panel title="작업" kicker="ACTIONS">
          <div className="flex flex-col gap-2">
            {item.orderId ? (
              <ButtonLink href="/boss/orders" variant="primary" icon={ArrowUpRight} className="w-full">
                주문 관리로 이동
              </ButtonLink>
            ) : null}
            <ButtonLink href="/boss/signature" variant="secondary" icon={ArrowLeft} className="w-full">
              목록으로
            </ButtonLink>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="w-full !text-boss-text-muted hover:!text-boss-error"
            >
              {deleting ? '삭제 중…' : '삭제'}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            서명은 고객 확인의 근거입니다. 삭제하면 복구할 수 없습니다.
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="이 서명 기록을 삭제할까요?"
        description="고객 서명 기록을 영구적으로 삭제합니다. 복구할 수 없습니다."
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
