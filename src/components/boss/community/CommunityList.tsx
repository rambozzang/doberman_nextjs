'use client';

// 사장님 커뮤니티 게시글 목록 (공용) — Industry 패턴
// - /boss/community/jobs (구인/구직 전용 메뉴) 가 fixedCategory="JOB" 으로 쓴다.
// - fixedCategory 가 없으면 게시판 Seg(전체/자유/구인구직/익명)를 함께 그린다.
//
// 필터 줄(Seg + 검색 + 검색 버튼 + 우측 n건 · 새로고침 · actions)
// → 표(제목 · 작성자 · 댓글 · 조회 · 날짜) → 페이지네이션
// 검색은 API 검색(searchWord)이다.

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bossCommunityApi } from '@/lib/api/boss/community';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  SearchInput,
  Button,
  ButtonLink,
  StatusPill,
  EmptyState,
  AlertBanner,
  Pagination,
  RowSkeleton,
  ContentCard,
  DataTable,
  ListTabs,
  type StatusTone,
} from '@/components/boss/ui';
import { RefreshCw } from 'lucide-react';
import ListDateCell from '@/components/boss/ListDateCell';

const PAGE_SIZE = 20;

export type CategoryCode = 'ALL' | 'FREE' | 'JOB' | 'ANON';

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

/** 서버가 준 전체 건수 · 전체 페이지 — 없으면 이번 쪽 길이로 대신한다 */
function pickPaging(
  payload: BbsListResponse | BbsData[] | undefined,
  fallbackLen: number
): { totalCount: number; totalPages: number } {
  if (!payload || Array.isArray(payload)) return { totalCount: fallbackLen, totalPages: 1 };
  const p = payload as { totalCount?: number; totalPages?: number };
  return {
    totalCount: p.totalCount ?? fallbackLen,
    totalPages: Math.max(1, p.totalPages ?? 1),
  };
}

function categoryTone(code?: string): StatusTone {
  return code === 'JOB' ? 'warn' : code === 'ANON' ? 'neutral' : 'info';
}

function authorName(item: BbsData): string {
  if (item.anonyYn === 'Y') return '익명';
  return item.nickNm ?? item.userNm ?? '사용자';
}

export function CommunityList({
  fixedCategory,
  actions,
}: {
  fixedCategory?: Exclude<CategoryCode, 'ALL'>;
  /** 필터 줄 우측 끝 버튼 (예: 구인/구직 등록) */
  actions?: ReactNode;
}) {
  const router = useRouter();
  const [items, setItems] = useState<BbsData[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<CategoryCode>(fixedCategory ?? 'ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const loadingRef = useRef(false);

  const dedupe = (list: BbsData[]): BbsData[] =>
    Array.from(new Map(list.map((i) => [i.boardId, i])).values());

  const load = useCallback(
    async (targetPage: number, searchWord: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await bossCommunityApi.list({
          // 서버 페이지는 0 부터 센다(PageRequest.of) — 1 을 보내면 최신 한 쪽이 통째로 빠진다
          pageNum: targetPage - 1,
          pageSize: PAGE_SIZE,
          searchWord: searchWord || undefined,
          typeDtCd: category === 'ALL' ? undefined : category,
          sortDesc: 'crtDtm',
        });
        if (res.success !== false && res.data) {
          const list = dedupe(pickList(res.data));
          const paging = pickPaging(res.data, list.length);
          setItems(list);
          setTotalCount(paging.totalCount);
          setTotalPages(paging.totalPages);
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
    load(page, keyword);
  }, [load, page, keyword]);

  const onSearch = () => {
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const onRefresh = () => {
    void load(page, keyword);
  };

  const clearSearch = () => {
    setSearchInput('');
    setPage(1);
    setKeyword('');
  };

  const isJob = category === 'JOB';
  const newHref = isJob ? '/boss/community/new?type=JOB' : '/boss/community/new';

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <form
        className="flex flex-wrap items-center gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        {!fixedCategory && (
          <ListTabs
            tabs={CATEGORY_TABS}
            active={category}
            onChange={(next) => {
              setCategory(next);
              setPage(1);
            }}
          />
        )}
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="제목 · 내용"
          className="w-56"
          hint={false}
        />
        <Button type="submit" variant="secondary" disabled={loading}>
          검색
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading
              ? '불러오는 중…'
              : keyword
                ? `'${keyword}' ${totalCount.toLocaleString('ko-KR')}건`
                : `전체 ${totalCount.toLocaleString('ko-KR')}건`}
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRefresh} disabled={loading}>
            새로고침
          </Button>
          {actions}
        </div>
      </form>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={onRefresh}>
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
          <RowSkeleton rows={8} />
        </ContentCard>
      ) : items.length === 0 ? (
        error ? (
          <EmptyState
            title="게시글을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            action={
              <Button variant="secondary" size="sm" onClick={onRefresh}>
                다시 시도
              </Button>
            }
          />
        ) : keyword ? (
          <EmptyState
            title={`'${keyword}' 에 맞는 글이 없습니다`}
            description="제목과 내용에서 찾습니다. 검색어를 짧게 바꿔 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                검색 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={isJob ? '아직 올라온 구인 · 구직 글이 없습니다' : '아직 게시글이 없습니다'}
            description={
              isJob
                ? '인력이 필요하거나 일자리를 찾는다면 첫 글을 올려 보세요. 다른 사장님이 연락 요청을 보낼 수 있습니다.'
                : '첫 글을 올리면 다른 사장님들이 답을 달 수 있습니다.'
            }
            action={
              <ButtonLink href={newHref} variant="primary" size="sm">
                {isJob ? '구인 / 구직 등록' : '글쓰기'}
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>등록일</th>
              <th>제목</th>
              <th>작성자</th>
              <th className="num">댓글</th>
              <th className="num">좋아요</th>
              <th className="num">조회</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const href = `/boss/community/${item.boardId}`;
              return (
                <tr key={item.boardId} className="cursor-pointer" onClick={() => router.push(href)}>
                  <td>
                    <ListDateCell at={item.crtDtm} id={item.boardId} />
                  </td>
                  <td className="wrap max-w-[520px]">
                    <div className="flex items-center gap-2">
                      {item.typeDtNm && !fixedCategory && (
                        <StatusPill tone={categoryTone(item.typeDtCd)}>{item.typeDtNm}</StatusPill>
                      )}
                      <Link
                        href={href}
                        className="line-clamp-1 min-w-0 font-semibold !text-boss-text hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.subject ?? '(제목 없음)'}
                      </Link>
                    </div>
                  </td>
                  <td className="text-boss-text-secondary">{authorName(item)}</td>
                  <td className="num text-boss-text-secondary">{item.replyCnt ?? 0}</td>
                  <td className="num text-boss-text-secondary">{item.likeCnt ?? 0}</td>
                  <td className="num text-boss-text-secondary">{item.viewCnt ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
    </div>
  );
}
