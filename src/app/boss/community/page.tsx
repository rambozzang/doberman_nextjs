'use client';

// 사장님 커뮤니티 게시글 목록
// Flutter `bbs_list_page.dart` 를 Next.js 로 포팅한 화면이다.
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
  ListTabs,
} from '@/components/boss/ui';
import {
  MessageCircle,
  Heart,
  Eye,
  RefreshCw,
  PenSquare,
  Inbox,
  ShieldOff,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

type CategoryCode = 'ALL' | 'FREE' | 'JOB' | 'ANON';

const CATEGORY_TABS: { key: CategoryCode; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'FREE', label: '자유' },
  { key: 'JOB', label: '구인 / 구직' },
  { key: 'ANON', label: '익명' },
];

// 응답이 배열일 수도, list/content 페이징 객체일 수도 있어 흡수한다.
function pickList(payload: BbsListResponse | BbsData[] | undefined): BbsData[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
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
  const [items, setItems] = useState<BbsData[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<CategoryCode>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (targetPage: number, searchWord: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossCommunityApi.list({
        pageNum: targetPage,
        pageSize: PAGE_SIZE,
        searchWord: searchWord || undefined,
        typeDtCd: category === 'ALL' ? undefined : category,
        sortDesc: 'crtDtm',
      });
      if (res.success !== false && res.data) {
        const list = pickList(res.data);
        setItems(list);
        setHasMore(list.length >= PAGE_SIZE);
      } else {
        setError(res.message || '게시글을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load(page, keyword);
  }, [load, page, keyword, category]);

  const onCategoryChange = (next: CategoryCode) => {
    setCategory(next);
    setPage(1);
  };

  const onSearch = () => {
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const onRefresh = () => {
    load(page, keyword).catch(() => toast.error('새로고침 실패'));
  };

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
            <Link
              href="/boss/community/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-medium text-boss-primary-foreground transition-colors hover:bg-boss-primary-hover"
            >
              <PenSquare size={13} /> 글쓰기
            </Link>
          </div>
        }
      />

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="제목·내용 검색"
          className="w-56"
        />
        <Button onClick={onSearch} disabled={loading}>
          검색
        </Button>
        <Button
          icon={RefreshCw}
          onClick={onRefresh}
          disabled={loading}
          className={loading ? '[&>svg]:animate-spin' : ''}
        >
          새로고침
        </Button>
      </Toolbar>

      <ListTabs tabs={CATEGORY_TABS} active={category} onChange={onCategoryChange} />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="rounded-lg border border-boss-border bg-boss-surface p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-boss-border bg-boss-surface/30 px-6 py-12">
          <EmptyState
            icon={Inbox}
            title="게시글이 없습니다"
            description="검색어를 확인하거나 첫 게시글을 작성하세요."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-boss-border bg-boss-surface">
          <ul className="divide-y divide-boss-border">
            {items.map((item) => (
              <li key={item.boardId}>
                <Link
                  href={`/boss/community/${item.boardId}`}
                  className="block p-3 transition-colors hover:bg-boss-elevated/50"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-boss-text-muted">
                    {item.typeDtNm && (
                      <Badge tone="default">{item.typeDtNm}</Badge>
                    )}
                    <span>{item.anonyYn === 'Y' ? '익명' : item.nickNm ?? item.userNm ?? '사용자'}</span>
                    <span>·</span>
                    <span>{relativeTime(item.crtDtm)}</span>
                  </div>
                  <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-boss-text">
                    {item.subject ?? '(제목 없음)'}
                  </h3>
                  <p className="mb-2 line-clamp-1 text-xs text-boss-text-secondary">
                    {item.contents ?? ''}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-boss-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} /> {item.viewCnt ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart size={11} /> {item.likeCnt ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={11} /> {item.replyCnt ?? 0}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={hasMore ? page + 1 : page}
        onChange={setPage}
        disabled={loading}
      />
    </div>
  );
}
