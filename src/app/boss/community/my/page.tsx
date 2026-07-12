'use client';

import { useEffect, useState } from 'react';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  PageHeader,
  RowList,
  RowItem,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';
import { Eye, Heart, MessageCircle, Inbox } from 'lucide-react';

const PAGE_SIZE = 20;

function pickList(payload: BbsListResponse | BbsData[] | undefined): BbsData[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
}

function relativeTime(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

export default function BossCommunityMyPage() {
  const [items, setItems] = useState<BbsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = BossAuthManager.getUserInfo();
        const userId = me?.userId ?? '';
        if (!userId) {
          if (!cancelled) setError('로그인이 필요합니다.');
          return;
        }
        const res = await bossCommunityApi.list({
          pageNum: 1,
          pageSize: PAGE_SIZE,
          searchCustId: userId,
          sortDesc: 'crtDtm',
        });
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setItems(pickList(res.data));
        } else {
          setError(res.message || '내 글을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 내 글을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="내가 쓴 글"
        description="내가 작성한 커뮤니티 게시글을 관리합니다."
        breadcrumbs={[{ label: '커뮤니티', href: '/boss/community' }, { label: '내 글' }]}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="아직 작성한 글이 없습니다"
          description="커뮤니티에서 첫 글을 작성해보세요."
        />
      ) : (
        <RowList>
          {items.map((item) => (
            <RowItem
              key={item.boardId}
              href={`/boss/community/${item.boardId}`}
              title={item.subject ?? '(제목 없음)'}
              subtitle={item.contents ?? undefined}
              tags={
                item.typeDtNm ? <Badge tone="default">{item.typeDtNm}</Badge> : undefined
              }
              meta={
                <div className="flex flex-col items-end gap-1">
                  <span>{relativeTime(item.crtDtm)}</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5">
                      <Eye size={10} /> {item.viewCnt ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Heart size={10} /> {item.likeCnt ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle size={10} /> {item.replyCnt ?? 0}
                    </span>
                  </div>
                </div>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
