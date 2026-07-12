'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PenLine,
  Plus,
  RefreshCw,
  Inbox,
  Phone,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  RowThumb,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return phone;
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  return phone;
}

function statusBadge(item: BossSignatureItem): { label: string; tone: BadgeTone } {
  if (item.confirmedAt || item.signatureImagePath) {
    return { label: '서명완료', tone: 'emerald' };
  }
  return { label: '미완료', tone: 'amber' };
}

export default function BossSignatureListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossSignatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossSignatureApi.list(custId);
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a, b) => {
          const ad = new Date(a.createdDt ?? 0).getTime();
          const bd = new Date(b.createdDt ?? 0).getTime();
          return bd - ad;
        });
        setItems(sorted);
      } else if (res.success && res.data == null) {
        setItems([]);
      } else {
        setError(res.message || '서명 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.customerName, it.customerPhone, it.memo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('이 서명 기록을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      const res = await bossSignatureApi.remove(id, custId);
      if (res.success) {
        toast.success('삭제되었습니다.');
        setItems((prev) => prev.filter((it) => it.id !== id));
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="고객 서명"
        description="시공 완료 후 받은 고객 서명을 관리하세요."
        actions={
          <Link href="/boss/signature/capture">
            <Button variant="primary" size="sm" icon={Plus}>
              서명 받기
            </Button>
          </Link>
        }
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="고객명·연락처·메모 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={load}
          disabled={loading}
        >
          새로고침
        </Button>
        <div className="ml-auto">
          <Badge tone="default">{items.length.toLocaleString()}건</Badge>
        </div>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="서명 내역이 없습니다"
          description="'서명 받기'로 새 서명을 받아보세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>고객</th>
              <th>상태</th>
              <th className="whitespace-nowrap">연락처</th>
              <th>관련 정보</th>
              <th className="whitespace-nowrap">서명일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = statusBadge(item);
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/signature/${item.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-2.5">
                      <RowThumb
                        src={item.signatureImagePath}
                        alt={item.customerName ?? 'signature'}
                        icon={PenLine}
                        className="h-9 w-9"
                      />
                      <div className="min-w-0">
                        <span className="block font-medium text-boss-text">
                          {item.customerName ?? '이름 없음'}
                        </span>
                        {item.memo ? (
                          <span className="block max-w-[16rem] truncate text-xs text-boss-text-muted">
                            {item.memo}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {item.customerPhone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} className="text-boss-text-muted" />
                        {maskPhone(item.customerPhone)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-boss-text-secondary">
                    <div className="flex flex-wrap items-center gap-1">
                      {item.orderId ? (
                        <Badge tone="violet">주문 #{item.orderId}</Badge>
                      ) : null}
                      {item.recordId ? (
                        <Badge tone="sky">기록 #{item.recordId}</Badge>
                      ) : null}
                      {!item.orderId && !item.recordId ? (
                        <span className="text-boss-text-muted">-</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">
                    {formatDate(item.confirmedAt ?? item.createdDt)}
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted transition-colors hover:bg-boss-error/10 hover:text-boss-error disabled:opacity-50"
                      aria-label="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
