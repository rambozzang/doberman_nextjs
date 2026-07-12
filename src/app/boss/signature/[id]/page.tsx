'use client';

// 사장님 고객 서명 상세 페이지
// Flutter: lib/app/signature/signature_detail_page.dart 와 대응
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Trash2,
  Calendar,
  CheckCircle2,
  Phone,
  FileText,
  Hash,
  PenLine,
  User,
  StickyNote,
  ArrowUpRight,
} from 'lucide-react';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/boss/ui';

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
    if (!confirm('이 고객 서명 기록을 영구적으로 삭제하시겠습니까?')) return;
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
    ? { tone: 'emerald' as const, label: '확인완료' }
    : { tone: 'amber' as const, label: '미확인' };

  const hasImage =
    !!item?.signatureImagePath &&
    (item.signatureImagePath.startsWith('http') || item.signatureImagePath.startsWith('data:'));

  return (
    <div className="space-y-5">
      <PageHeader
        title="고객 서명 상세"
        breadcrumbs={[{ label: '고객 서명', href: '/boss/signature' }, { label: '상세' }]}
        actions={
          item ? (
            <>
              {item.orderId ? (
                <Link href="/boss/orders">
                  <Button variant="secondary" icon={ArrowUpRight}>
                    주문 이동
                  </Button>
                </Link>
              ) : null}
              <Button
                variant="danger"
                icon={Trash2}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중…' : '삭제'}
              </Button>
            </>
          ) : undefined
        }
      />

      {error && item === null && !loading && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="boss-empty">불러오는 중...</div>
      ) : item ? (
        <>
          {/* 개요 카드 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                {item.id && <span className="text-xs text-boss-text-muted">#{item.id}</span>}
              </div>
              <h2 className="text-lg font-semibold text-boss-text">
                {item.customerName || '이름 없음'}
              </h2>
              <p className="mt-1 text-sm text-boss-text-muted">
                서명일: {formatDate(item.createdDt)}
              </p>
            </div>
            {item.customerPhone && (
              <div className="text-center text-sm">
                <p className="text-xs text-boss-text-muted">연락처</p>
                <p className="font-semibold text-boss-text">{formatPhone(item.customerPhone)}</p>
              </div>
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* 서명 정보 */}
            <Section title="서명 정보" icon={User}>
              <Info label="고객명" value={item.customerName} icon={User} />
              <Info label="연락처" value={formatPhone(item.customerPhone) || undefined} icon={Phone} />
              <Info label="등록일" value={formatDate(item.createdDt)} icon={Calendar} />
              <Info
                label="확인일"
                value={item.confirmedAt ? formatDate(item.confirmedAt) : undefined}
                icon={CheckCircle2}
              />
              <Info
                label="시공기록"
                value={item.recordId ? `#${item.recordId}` : undefined}
                icon={FileText}
              />
              <Info label="주문" value={item.orderId ? `#${item.orderId}` : undefined} icon={Hash} />
              {item.memo && (
                <div className="border-t border-boss-border pt-3">
                  <div className="flex items-start gap-2.5 text-sm">
                    <StickyNote size={14} className="mt-0.5 text-boss-text-muted" />
                    <div>
                      <p className="text-xs text-boss-text-muted">메모</p>
                      <p className="whitespace-pre-line text-boss-text">{item.memo}</p>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* 서명 이미지 */}
            <div className="lg:col-span-2">
              <Section title="서명 이미지" icon={PenLine}>
                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-boss-border bg-boss-elevated/30 p-6">
                  {hasImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signatureImagePath}
                      alt={item.customerName ?? 'signature'}
                      className="max-h-72 max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-boss-text-muted">
                      <PenLine size={64} />
                      <span className="text-xs">서명 이미지가 없습니다</span>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={PenLine}
          title="정보를 찾을 수 없습니다"
          description={error ?? '요청하신 서명 정보가 존재하지 않습니다.'}
          action={
            <Link href="/boss/signature">
              <Button variant="secondary" size="sm">
                목록으로
              </Button>
            </Link>
          }
        />
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
}: {
  label: string;
  value?: string | number | null;
  icon: React.ElementType;
}) {
  if (value === undefined || value === null || value === '') return null;
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
