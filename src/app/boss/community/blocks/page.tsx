'use client';

import { useEffect, useState } from 'react';
import { ShieldOff, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsBlockData } from '@/types/boss-community';
import {
  PageHeader,
  RowList,
  RowItem,
  RowThumb,
  Button,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

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
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="차단 관리"
        description="차단한 사용자를 관리하고 해제합니다."
        breadcrumbs={[{ label: '커뮤니티', href: '/boss/community' }, { label: '차단 관리' }]}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title="차단한 사용자가 없습니다"
          description="커뮤니티에서 사용자를 차단하면 여기에 표시됩니다."
        />
      ) : (
        <RowList>
          {items.map((item) => (
            <RowItem
              key={item.denyCustId}
              leading={<RowThumb icon={UserX} />}
              title={item.nickNm ?? item.name ?? item.denyCustId}
              subtitle={`차단일 ${item.crtDtm ? new Date(item.crtDtm).toLocaleDateString('ko-KR') : '-'}`}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUnblock(item.denyCustId)}
                  disabled={unblocking === item.denyCustId}
                >
                  차단 해제
                </Button>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
