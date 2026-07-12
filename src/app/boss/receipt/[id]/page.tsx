'use client';

// 사장님 영수증 상세 페이지
// Flutter receipt_detail_page.dart 포팅 — 컴팩트 B2B 레이아웃
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Trash2,
  RefreshCw,
  Save,
  FileText,
  Package,
  Image as ImageIcon,
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
  DataTable,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

function fmtWon(n?: number): string {
  if (n == null) return '0';
  return n.toLocaleString('ko-KR');
}

function won(n?: number): string {
  return `₩${fmtWon(n)}`;
}

function formatDate(s?: string): string {
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const BREADCRUMBS = [{ label: '영수증 관리', href: '/boss/receipt' }, { label: '상세' }];

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

  // ── 로딩 ──────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="영수증 상세" breadcrumbs={BREADCRUMBS} />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── 에러 / 없음 ───────────────────────────
  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="영수증 상세" breadcrumbs={BREADCRUMBS} />
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

  const supplyAmount = data.totalAmount - (data.taxAmount ?? 0);
  const items = data.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="영수증 상세"
        breadcrumbs={BREADCRUMBS}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
              새로고침
            </Button>
            {!editing ? (
              <Button variant="primary" size="sm" icon={Save} onClick={() => setEditing(true)}>
                수정
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={saving}>
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

      {editing ? (
        // ── 편집 폼 ─────────────────────────────
        <Card>
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
              <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* 개요 카드 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="emerald">{categoryLabel(data.category)}</Badge>
                {data.paymentMethod && <Badge tone="sky">{paymentLabel(data.paymentMethod)}</Badge>}
                {data.id != null && <span className="text-xs text-boss-text-muted">#{data.id}</span>}
              </div>
              <h2 className="text-lg font-semibold text-boss-text">
                {data.vendorName || '거래처 미상'}
              </h2>
              <p className="mt-1 text-sm text-boss-text-muted">거래일 {formatDate(data.txDate)}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-boss-text-muted">총 금액</p>
              <p className="font-mono text-2xl font-semibold tabular-nums text-boss-primary">
                {won(data.totalAmount)}
              </p>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* 정보 + 품목 */}
            <div className={`space-y-4 ${data.imageUrl ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {/* 영수증 정보 */}
              <Section title="영수증 정보" icon={FileText}>
                <div className="divide-y divide-boss-border">
                  <Info label="사업자번호" value={data.bizNo} />
                  <Info label="거래일" value={formatDate(data.txDate)} />
                  <Info label="공급가액" value={won(supplyAmount)} />
                  <Info
                    label="부가세"
                    value={data.taxAmount != null ? won(data.taxAmount) : '-'}
                  />
                  <Info label="총 금액" value={won(data.totalAmount)} strong />
                  <Info
                    label="결제수단"
                    value={
                      data.paymentMethod ? (
                        <Badge tone="sky">{paymentLabel(data.paymentMethod)}</Badge>
                      ) : undefined
                    }
                  />
                </div>
                {data.memo && (
                  <div className="mt-3 border-t border-boss-border pt-3">
                    <p className="mb-1 text-xs text-boss-text-muted">메모</p>
                    <p className="whitespace-pre-wrap text-sm text-boss-text-secondary">
                      {data.memo}
                    </p>
                  </div>
                )}
              </Section>

              {/* 품목 */}
              <Section title={`품목${items.length > 0 ? ` (${items.length})` : ''}`} icon={Package}>
                {items.length === 0 ? (
                  <EmptyState icon={Package} title="등록된 품목이 없습니다" />
                ) : (
                  <DataTable>
                    <thead>
                      <tr>
                        <th>품명</th>
                        <th className="text-right">수량</th>
                        <th className="text-right">단가</th>
                        <th className="text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td className="font-medium">{item.name ?? '-'}</td>
                          <td className="text-right text-boss-text-secondary">{item.qty ?? '-'}</td>
                          <td className="text-right text-boss-text-secondary">
                            {item.unitPrice != null ? won(item.unitPrice) : '-'}
                          </td>
                          <td className="text-right font-medium">
                            {item.amount != null ? won(item.amount) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                )}
              </Section>
            </div>

            {/* 영수증 이미지 */}
            {data.imageUrl && (
              <div className="space-y-4">
                <Section title="영수증 이미지" icon={ImageIcon}>
                  <div className="overflow-hidden rounded-lg border border-boss-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.imageUrl}
                      alt={data.vendorName ?? '영수증'}
                      className="w-full object-contain"
                    />
                  </div>
                </Section>
              </div>
            )}
          </div>
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
  children: ReactNode;
}) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-boss-text">
        <Icon size={15} className="text-boss-primary" />
        {title}
      </h3>
      {children}
    </Card>
  );
}

function Info({
  label,
  value,
  strong,
}: {
  label: string;
  value?: ReactNode;
  strong?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-boss-text-muted">{label}</span>
      <span
        className={`text-right ${strong ? 'font-semibold text-boss-primary' : 'font-medium text-boss-text'}`}
      >
        {value}
      </span>
    </div>
  );
}
