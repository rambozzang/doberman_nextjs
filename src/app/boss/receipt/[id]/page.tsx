'use client';

// 사장님 영수증 상세 페이지
// Flutter receipt_detail_page.dart 포팅
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Trash2,
  RefreshCw,
  Save,
  Building2,
  Calendar,
  Wallet,
  CreditCard,
  Tag,
  FileText,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { bossReceiptApi } from '@/lib/api/boss/receipt';
import type { ReceiptData, ReceiptSaveRequest } from '@/types/boss-receipt';
import {
  RECEIPT_CATEGORIES,
  categoryLabel,
  paymentLabel,
  type ReceiptCategoryCode,
} from '@/types/boss-receipt';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

function fmtWon(n?: number): string {
  if (n == null) return '0';
  return n.toLocaleString('ko-KR');
}

function fmtDate(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BossReceiptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params?.id);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 편집 필드
  const [vendorName, setVendorName] = useState('');
  const [txDate, setTxDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [category, setCategory] = useState<ReceiptCategoryCode>('ETC');
  const [memo, setMemo] = useState('');

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossReceiptApi.detail(id);
      if (res.success !== false && res.data) {
        const d = res.data;
        setData(d);
        setVendorName(d.vendorName ?? '');
        setTxDate(d.txDate ?? '');
        setTotalAmount(String(d.totalAmount ?? 0));
        setTaxAmount(String(d.taxAmount ?? ''));
        setPaymentMethod(d.paymentMethod ?? '');
        setCategory((d.category as ReceiptCategoryCode) ?? 'ETC');
        setMemo(d.memo ?? '');
      } else {
        setError(res.message || '영수증을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 영수증을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const payload: ReceiptSaveRequest = {
        id: data.id,
        vendorName: vendorName.trim() || undefined,
        txDate: txDate || undefined,
        totalAmount: Number(totalAmount.replace(/[^\d]/g, '')) || 0,
        taxAmount: taxAmount ? Number(taxAmount.replace(/[^\d]/g, '')) : undefined,
        paymentMethod: paymentMethod || undefined,
        category,
        imageUrl: data.imageUrl,
        memo: memo.trim() || undefined,
        items: data.items ?? [],
      };
      const res = await bossReceiptApi.save(payload);
      if (res.success !== false) {
        toast.success('수정되었습니다.');
        setEditing(false);
        await load();
      } else {
        toast.error(res.message || '수정에 실패했습니다.');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.id) return;
    if (!confirm('이 영수증을 삭제하시겠습니까?')) return;
    try {
      const res = await bossReceiptApi.remove(data.id);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        router.replace('/boss/receipt');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="영수증 상세" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="영수증 상세"
          breadcrumbs={[{ label: '영수증', href: '/boss/receipt' }, { label: '상세' }]}
        />
        <EmptyState
          icon={ReceiptIcon}
          title={error || '영수증을 찾을 수 없습니다'}
          action={
            <Button variant="secondary" size="sm" onClick={() => router.replace('/boss/receipt')}>
              목록으로
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="영수증 상세"
        breadcrumbs={[{ label: '영수증', href: '/boss/receipt' }, { label: '상세' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={load}
              disabled={loading}
            >
              새로고침
            </Button>
            {!editing ? (
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                onClick={() => setEditing(true)}
              >
                수정
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={handleDelete}
              className="text-boss-error hover:bg-boss-error/10"
            >
              삭제
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 영수증 이미지 */}
        {data.imageUrl && (
          <Card className="lg:col-span-1">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
              영수증 이미지
            </p>
            <div className="overflow-hidden rounded-lg border border-boss-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt={data.vendorName ?? '영수증'}
                className="w-full object-contain"
              />
            </div>
          </Card>
        )}

        {/* 정보 */}
        <Card className={data.imageUrl ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge tone="emerald">{categoryLabel(data.category)}</Badge>
                {data.paymentMethod && (
                  <Badge tone="sky">{paymentLabel(data.paymentMethod)}</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow icon={Building2} label="상호명" value={data.vendorName ?? '-'} />
                <InfoRow icon={Calendar} label="거래일" value={fmtDate(data.txDate)} />
                <InfoRow
                  icon={Wallet}
                  label="총 금액"
                  value={`${fmtWon(data.totalAmount)}원`}
                  highlight
                />
                <InfoRow
                  icon={ReceiptIcon}
                  label="부가세"
                  value={data.taxAmount != null ? `${fmtWon(data.taxAmount)}원` : '-'}
                />
              </div>

              {data.items && data.items.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
                    품목 내역
                  </p>
                  <div className="overflow-hidden rounded-lg border border-boss-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-boss-elevated text-boss-text-muted">
                        <tr>
                          <th className="px-3 py-2 font-medium">품목</th>
                          <th className="px-3 py-2 text-right font-medium">수량</th>
                          <th className="px-3 py-2 text-right font-medium">단가</th>
                          <th className="px-3 py-2 text-right font-medium">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item, i) => (
                          <tr key={i} className="border-t border-boss-border">
                            <td className="px-3 py-2 text-boss-text">{item.name ?? '-'}</td>
                            <td className="px-3 py-2 text-right text-boss-text-secondary">{item.qty ?? '-'}</td>
                            <td className="px-3 py-2 text-right text-boss-text-secondary">
                              {item.unitPrice != null ? fmtWon(item.unitPrice) : '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-boss-text">
                              {item.amount != null ? fmtWon(item.amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.memo && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
                    메모
                  </p>
                  <p className="rounded-lg border border-boss-border bg-boss-bg p-3 text-sm text-boss-text-secondary">
                    {data.memo}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="boss-label">상호명</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="boss-input"
                  placeholder="예: 홍길동 벽지매트"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="boss-label">거래일</label>
                  <input
                    type="date"
                    value={txDate ? txDate.substring(0, 10) : ''}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="boss-input"
                  />
                </div>
                <div>
                  <label className="boss-label">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReceiptCategoryCode)}
                    className="boss-input"
                  >
                    {RECEIPT_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="boss-label">총 금액</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d]/g, ''))}
                    className="boss-input text-right font-semibold text-boss-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="boss-label">부가세</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value.replace(/[^\d]/g, ''))}
                    className="boss-input text-right"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="boss-label">결제 수단</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="boss-input"
                >
                  <option value="">선택 안함</option>
                  <option value="CARD">카드</option>
                  <option value="CASH">현금</option>
                </select>
              </div>
              <div>
                <label className="boss-label">메모</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="boss-input min-h-[80px] resize-y"
                  placeholder="추가 메모"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-boss-border pt-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </Card>
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
        <p className={`text-sm ${highlight ? 'font-semibold text-boss-primary' : 'text-boss-text'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
