'use client';

// 사장님 고객 서명 목록 페이지
// Flutter: lib/app/signature/signature_list_page.dart 와 대응
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Inbox,
  Phone,
  Calendar,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';

// 날짜 포맷터
function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

// 휴대폰 마스킹 (가운데 4자리)
function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return phone;
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  return phone;
}

export default function BossSignatureListPage() {
  const [items, setItems] = useState<BossSignatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCustId = () => {
    const userInfo = BossAuthManager.getUserInfo();
    return userInfo?.userId ?? '';
  };

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
        // 최신순 정렬
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

  const handleDelete = async (e: React.MouseEvent, id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    const custId = getCustId();
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
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <PenLine size={22} className="text-boss-error" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">고객 서명</h1>
            <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-xs font-semibold text-boss-text-secondary">
              {items.length.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-boss-text-muted">시공 완료 후 받은 고객 서명을 관리하세요.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="고객명·연락처·메모 검색"
              className="h-9 w-56 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/signature/capture"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-error px-3 text-sm font-semibold text-boss-text shadow-boss-md shadow-rose-500/20 hover:bg-rose-400"
          >
            <Plus size={14} /> 서명 받기
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 콘텐츠 */}
      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-boss-border bg-boss-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">서명 내역이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">우측 상단의 ‘서명 받기’로 새 서명을 받아보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/boss/signature/${item.id}`}
              className="group flex items-stretch gap-4 rounded-2xl border border-boss-border bg-boss-surface p-3 transition-all hover:-translate-y-0.5 hover:border-boss-error/20 hover:shadow-boss-lg hover:shadow-rose-500/5"
            >
              {/* 썸네일 */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-boss-border bg-boss-surface">
                {item.signatureImagePath && item.signatureImagePath.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.signatureImagePath}
                    alt={item.customerName ?? 'signature'}
                    className="h-full w-full object-contain"
                  />
                ) : item.signatureImagePath && item.signatureImagePath.startsWith('data:') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.signatureImagePath}
                    alt={item.customerName ?? 'signature'}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <PenLine size={26} className="text-boss-text-muted" />
                )}
              </div>

              {/* 내용 */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-boss-text">
                    {item.customerName ?? '이름 없음'}
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] text-boss-text-muted">
                    <Calendar size={10} />
                    {formatDate(item.confirmedAt ?? item.createdDt)}
                  </span>
                </div>
                {item.memo ? (
                  <p className="mt-1 line-clamp-2 text-xs text-boss-text-muted">{item.memo}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  {item.customerPhone ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                      <Phone size={10} /> {maskPhone(item.customerPhone)}
                    </span>
                  ) : null}
                  {item.orderId ? (
                    <span className="inline-flex items-center rounded-md border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                      #{item.orderId}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-boss-text-muted hover:bg-boss-error/10 hover:text-boss-error disabled:opacity-50"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-boss-text-muted transition-colors group-hover:text-boss-error">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
