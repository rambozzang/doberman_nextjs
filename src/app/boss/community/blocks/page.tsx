'use client';

// 사장님 커뮤니티 차단 사용자 관리
// Flutter `bbs_block_list_page.dart` 를 Next.js 로 포팅.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldOff, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsBlockData } from '@/types/boss-community';

export default function BossCommunityBlocksPage() {
  const [items, setItems] = useState<BbsBlockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossCommunityApi.blockedUsers();
      if (res.success !== false && res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || '차단 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 차단 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUnblock = async (custId?: string) => {
    if (!custId) return;
    if (!confirm('차단을 해제하시겠습니까?')) return;
    setUnblocking(custId);
    try {
      const res = await bossCommunityApi.blockCancel(custId);
      if (res.success !== false) {
        toast.success('차단이 해제되었습니다.');
        setItems((prev) => prev.filter((it) => it.denyCustId !== custId));
      } else {
        toast.error(res.message || '차단 해제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/community"
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 목록으로
        </Link>
        <h1 className="text-xl font-bold text-boss-text">차단 관리</h1>
        <div className="w-20" />
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-boss-border bg-boss-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <ShieldOff size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">차단한 사용자가 없습니다</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          {items.map((item) => (
            <li key={item.denyCustId} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-boss-text">
                  {item.nickNm ?? item.name ?? item.denyCustId}
                </p>
                <p className="text-xs text-boss-text-muted">
                  차단일 {item.crtDtm ? new Date(item.crtDtm).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <button
                type="button"
                disabled={unblocking === item.denyCustId}
                onClick={() => onUnblock(item.denyCustId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 py-1.5 text-xs text-boss-text-secondary hover:border-rose-700 hover:text-boss-error disabled:opacity-50"
              >
                <UserX size={12} /> 차단 해제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
