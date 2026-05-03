'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestListItem } from '@/types/boss';
import BossPageHeader from '@/components/boss/BossPageHeader';

export default function BossMyRequestsPage() {
  const [items, setItems] = useState<BossRequestListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await bossRequestsApi.myList({ page: 1, size: 50 });
        if (cancelled) return;
        if (res.success && res.data) {
          setItems(res.data.content ?? []);
        } else {
          setError(res.message || '목록 조회 실패');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <BossPageHeader title="내가 답변한 견적" description="제출한 견적 답변과 진행 상황을 확인하세요." backHref="/boss/requests" />
      {error && <div className="rounded border border-rose-700 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>}
      {loading ? (
        <div className="rounded border border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-400">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded border border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-400">아직 답변한 견적이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/boss/requests/${item.id}`}
                className="block rounded-lg border border-slate-700 bg-slate-800/60 p-4 hover:border-emerald-500/60"
              >
                <div className="text-sm font-semibold text-white">
                  {item.buildingType ?? '견적'} · {item.region ?? ''}
                </div>
                <div className="mt-1 text-xs text-slate-400">{item.preferredDate ?? ''}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
