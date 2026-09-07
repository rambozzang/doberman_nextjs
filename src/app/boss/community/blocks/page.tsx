'use client';

// 차단 관리 — Industry 패턴 (agent.opentohome.com)
//
// 필터 줄(검색 + 우측 전체 n건 · 새로고침) → 표(사용자 · 아이디 · 차단일 · 해제)
// 차단 해제는 ConfirmDialog 를 거친다. 화면 제목은 셸 헤더가 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsBlockData } from '@/types/boss-community';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  AlertBanner,
  ConfirmDialog,
  ContentCard,
  RowSkeleton,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';

export default function BossCommunityBlocksPage() {
  const [items, setItems] = useState<BbsBlockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  // 해제 확인창에 올라간 사용자
  const [target, setTarget] = useState<BbsBlockData | null>(null);

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
      setTarget(null);
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

  const isFiltering = keyword.trim().length > 0;
  const nameOf = (it: BbsBlockData) => it.nickNm ?? it.name ?? it.denyCustId ?? '-';

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="닉네임 · 아이디"
          className="w-56"
          hint={false}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : isFiltering ? `${filtered.length}건 · 전체 ${items.length}건` : `전체 ${items.length}건`}
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load()} disabled={loading}>
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* ───── 표 ───── */}
      {loading && items.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={4} />
        </ContentCard>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="차단 목록을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          />
        ) : isFiltering ? (
          <EmptyState
            title={`'${keyword.trim()}' 에 맞는 사용자가 없습니다`}
            description="닉네임이나 아이디 일부로 다시 검색해 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="차단한 사용자가 없습니다"
            description="게시글이나 댓글에서 사용자를 차단하면 여기에 모입니다. 차단한 사용자의 글은 목록에서 보이지 않습니다."
            action={
              <ButtonLink href="/boss/community" variant="secondary" size="sm">
                커뮤니티로
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>차단일</th>
              <th>사용자</th>
              <th>아이디</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.denyCustId ?? item.custId}>
                <td>
                  <ListDateCell at={item.crtDtm} showNew={false} />
                </td>
                <td className="font-semibold">{nameOf(item)}</td>
                <td className="font-boss-head text-[12.5px] text-boss-text-secondary">
                  {item.denyCustId ?? '-'}
                </td>
                <td className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTarget(item)}
                    disabled={unblocking === item.denyCustId}
                  >
                    {unblocking === item.denyCustId ? '해제 중…' : '차단 해제'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <ConfirmDialog
        open={target !== null}
        tone="primary"
        title={target ? `${nameOf(target)} 님의 차단을 해제할까요?` : ''}
        description="해제하면 이 사용자의 글과 댓글이 다시 보입니다. 필요하면 언제든 다시 차단할 수 있습니다."
        confirmLabel="차단 해제"
        loading={target !== null && unblocking === target.denyCustId}
        onConfirm={() => void onUnblock(target?.denyCustId)}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
