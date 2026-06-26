'use client';

// 사장님 커뮤니티 게시글 목록
// Flutter `bbs_list_page.dart` 를 Next.js 로 포팅한 화면이다.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  MessageCircle,
  Heart,
  Eye,
  Search,
  RefreshCw,
  PenSquare,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = async (targetPage: number, searchWord: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossCommunityApi.list({
        pageNum: targetPage,
        pageSize: PAGE_SIZE,
        searchWord: searchWord || undefined,
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
  };

  useEffect(() => {
    load(page, keyword);
  }, [page, keyword]);

  const onSearch = () => {
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const onRefresh = () => {
    load(page, keyword).catch(() => toast.error('새로고침 실패'));
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-boss-text">사장님 커뮤니티</h1>
          <p className="mt-1 text-sm text-boss-text-muted">
            다른 도배 사장님들과 정보를 나누는 공간입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch();
              }}
              placeholder="제목·내용 검색"
              className="h-9 w-56 rounded-lg border border-boss-border bg-boss-surface pl-9 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="h-9 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
          >
            검색
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <Link
            href="/boss/community/my"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
          >
            <UserIcon size={14} /> 내 글
          </Link>
          <Link
            href="/boss/community/blocks"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
          >
            <ShieldOff size={14} /> 차단 관리
          </Link>
          <Link
            href="/boss/community/new"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-boss-text hover:bg-boss-primary-hover"
          >
            <PenSquare size={14} /> 글쓰기
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 본문 */}
      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-boss-border bg-boss-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">표시할 게시글이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">첫 글을 작성해보세요.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          {items.map((item) => (
            <li key={item.boardId}>
              <Link
                href={`/boss/community/${item.boardId}`}
                className="block p-4 transition-colors hover:bg-boss-elevated/40"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-boss-text-muted">
                  {item.typeDtNm && (
                    <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-[10px] text-boss-text-secondary">
                      {item.typeDtNm}
                    </span>
                  )}
                  <span>{item.anonyYn === 'Y' ? '익명' : item.nickNm ?? item.userNm ?? '사용자'}</span>
                  <span>·</span>
                  <span>{relativeTime(item.crtDtm)}</span>
                </div>
                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-boss-text">
                  {item.subject ?? '(제목 없음)'}
                </h3>
                <p className="mb-2 line-clamp-2 text-xs text-boss-text-muted">
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
      )}

      {/* 페이지네이션 */}
      <nav className="flex items-center justify-between border-t border-boss-border pt-4">
        <p className="text-xs text-boss-text-muted">페이지 {page}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-8 items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 text-xs text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-40"
          >
            <ChevronLeft size={12} /> 이전
          </button>
          <button
            type="button"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-8 items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 text-xs text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-40"
          >
            다음 <ChevronRight size={12} />
          </button>
        </div>
      </nav>
    </div>
  );
}
