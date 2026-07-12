'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';
import { RefreshCw, Eye, MessageCircle, Inbox } from 'lucide-react';

const PAGE_SIZE = 100;

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
  const router = useRouter();
  const [items, setItems] = useState<BbsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = BossAuthManager.getUserInfo();
      const userId = me?.userId ?? '';
      if (!userId) {
        setError('로그인이 필요합니다.');
        setItems([]);
        return;
      }
      const res = await bossCommunityApi.list({
        pageNum: 1,
        pageSize: PAGE_SIZE,
        searchCustId: userId,
        sortDesc: 'crtDtm',
      });
      if (res.success !== false && res.data) {
        setItems(pickList(res.data));
      } else {
        setError(res.message || '내 글을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 내 글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.subject, it.contents, it.typeDtNm]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="내가 쓴 글"
        description="내가 작성한 커뮤니티 게시글을 관리합니다."
        breadcrumbs={[{ label: '커뮤니티', href: '/boss/community' }, { label: '내 글' }]}
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·내용·유형 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
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
          icon={Inbox}
          title={keyword.trim() ? '검색 결과가 없습니다' : '아직 작성한 글이 없습니다'}
          description={
            keyword.trim()
              ? '검색어를 변경해보세요.'
              : '커뮤니티에서 첫 글을 작성해보세요.'
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>제목</th>
              <th className="text-center whitespace-nowrap">댓글/조회</th>
              <th className="whitespace-nowrap">작성일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.boardId}
                className="cursor-pointer"
                onClick={() => router.push(`/boss/community/${item.boardId}`)}
              >
                <td>
                  <div className="flex items-center gap-2">
                    {item.typeDtNm ? <Badge tone="default">{item.typeDtNm}</Badge> : null}
                    <span className="font-medium text-boss-text">
                      {item.subject ?? '(제목 없음)'}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap text-center text-boss-text-secondary">
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle size={11} /> {item.replyCnt ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Eye size={11} /> {item.viewCnt ?? 0}
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap text-xs text-boss-text-muted">
                  {relativeTime(item.crtDtm)}
                </td>
                <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/boss/community/${item.boardId}`)}
                  >
                    보기
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
