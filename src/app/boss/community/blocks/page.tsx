'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldOff, UserX, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsBlockData } from '@/types/boss-community';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

export default function BossCommunityBlocksPage() {
  const [items, setItems] = useState<BbsBlockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.nickNm, it.name, it.denyCustId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="차단 관리"
        description="차단한 사용자를 관리하고 해제합니다."
        breadcrumbs={[{ label: '커뮤니티', href: '/boss/community' }, { label: '차단 관리' }]}
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="닉네임·사용자 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => load()}
          disabled={loading}
        >
          새로고침
        </Button>
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
          icon={ShieldOff}
          title="차단한 사용자가 없습니다"
          description="커뮤니티에서 사용자를 차단하면 여기에 표시됩니다."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>닉네임/사용자</th>
              <th className="whitespace-nowrap">차단일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.denyCustId ?? item.custId}>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-boss-elevated text-boss-text-muted">
                      <UserX size={13} />
                    </span>
                    <span className="font-medium text-boss-text">
                      {item.nickNm ?? item.name ?? item.denyCustId ?? '-'}
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap text-xs text-boss-text-muted">
                  {formatDate(item.crtDtm)}
                </td>
                <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onUnblock(item.denyCustId)}
                    disabled={unblocking === item.denyCustId}
                  >
                    차단 해제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
