'use client';

// 사장님 커뮤니티 게시글 목록 — B2B 데이터 그리드
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
} from '@/components/boss/ui';
import {
  RefreshCw,
  Inbox,
  PenSquare,
  User as UserIcon,
  ShieldOff,
  MessageCircle,
  Eye,
} from 'lucide-react';

const PAGE_SIZE = 20;

type CategoryCode = 'ALL' | 'FREE' | 'JOB' | 'ANON';
type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

const CATEGORY_TABS: { key: CategoryCode; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'FREE', label: '자유' },
  { key: 'JOB', label: '구인 / 구직' },
  { key: 'ANON', label: '익명' },
];

function pickList(payload: BbsListResponse | BbsData[] | undefined): BbsData[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
}

function categoryMeta(item: BbsData): { label: string; tone: BadgeTone } {
  const code = item.typeDtCd;
  const label =
    item.typeDtNm ??
    (code === 'FREE' ? '자유' : code === 'JOB' ? '구인/구직' : code === 'ANON' ? '익명' : '게시글');
  const tone: BadgeTone = code === 'JOB' ? 'amber' : code === 'ANON' ? 'violet' : 'sky';
  return { label, tone };
}

function authorName(item: BbsData): string {
  if (item.anonyYn === 'Y') return '익명';
  return item.nickNm ?? item.userNm ?? '사용자';
}

function relativeTime(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function BossCommunityListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BbsData[]>([]);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<CategoryCode>('ALL');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const loadingRef = useRef(false);

  const dedupe = (list: BbsData[]): BbsData[] =>
    Array.from(new Map(list.map((i) => [i.boardId, i])).values());

  const load = useCallback(
    async (targetPage: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await bossCommunityApi.list({
          pageNum: targetPage,
          pageSize: PAGE_SIZE,
          typeDtCd: category === 'ALL' ? undefined : category,
          sortDesc: 'crtDtm',
        });
        if (res.success !== false && res.data) {
          const list = dedupe(pickList(res.data));
          setItems(list);
          setHasMore(list.length >= PAGE_SIZE);
        } else {
          setError(res.message || '게시글을 불러오지 못했습니다.');
        }
      } catch {
        setError('네트워크 오류로 게시글을 불러오지 못했습니다.');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [category],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.subject, authorName(it)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="사장님 커뮤니티"
        description="도배 사장님들과 정보를 공유하는 커뮤니티입니다."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/boss/community/my"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
            >
              <UserIcon size={13} /> 내 글
            </Link>
            <Link
              href="/boss/community/blocks"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
            >
              <ShieldOff size={13} /> 차단 관리
            </Link>
          </div>
        }
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·작성자 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load(page)}
          disabled={loading}
          className={loading ? '[&>svg]:animate-spin' : ''}
        >
          새로고침
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={PenSquare}
          className="ml-auto"
          onClick={() => router.push('/boss/community/new')}
        >
          글쓰기
        </Button>
      </Toolbar>

      <ListTabs
        tabs={CATEGORY_TABS}
        active={category}
        onChange={(next) => {
          setCategory(next);
          setPage(1);
        }}
      />

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
          title="게시글이 없습니다"
          description="검색어를 확인하거나 첫 게시글을 작성하세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>제목</th>
              <th className="whitespace-nowrap">작성자</th>
              <th className="text-center whitespace-nowrap">댓글 / 조회</th>
              <th className="whitespace-nowrap">작성일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const cat = categoryMeta(item);
              return (
                <tr
                  key={item.boardId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/community/${item.boardId}`)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge tone={cat.tone}>{cat.label}</Badge>
                      <span className="line-clamp-1 font-medium text-boss-text">
                        {item.subject ?? '(제목 없음)'}
                      </span>
                      {typeof item.replyCnt === 'number' && item.replyCnt > 0 ? (
                        <span className="text-xs text-boss-primary">[{item.replyCnt}]</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {authorName(item)}
                  </td>
                  <td className="whitespace-nowrap text-center text-xs text-boss-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={11} /> {item.replyCnt ?? 0}
                    </span>
                    <span className="mx-1.5 text-boss-border-strong">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} /> {item.viewCnt ?? 0}
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
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering ? (
        <Pagination
          page={page}
          totalPages={hasMore ? page + 1 : page}
          onChange={setPage}
          disabled={loading}
        />
      ) : (
        <div className="flex justify-end border-t border-boss-border pt-3">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            현재 페이지 내 필터
          </span>
        </div>
      )}
    </div>
  );
}
