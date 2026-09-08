'use client';

// 사장님 커뮤니티 게시글 목록 — Industry 패턴 (agent.opentohome.com)
//
// 구조
//   필터 줄(게시판 Seg + 제목·작성자 검색 + 우측 n건 · 새로고침 · 내 글 · 차단 관리)
//   → 표(제목 · 작성자 · 댓글 · 조회 · 날짜) — 행 전체가 상세로 가는 링크
//   → 페이지네이션
//
// 화면 제목과 «글쓰기» 버튼은 셸 헤더(PAGE_META)가 그린다.
// 검색은 현재 페이지 안에서만 거른다(API 검색이 아니다) — 그 사실을 우측에 적는다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  SearchInput,
  Button,
  ButtonLink,
  ListTabs,
  DataTable,
  StatusPill,
  EmptyState,
  AlertBanner,
  Pagination,
  RowSkeleton,
  ContentCard,
  type StatusTone,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;

type CategoryCode = 'ALL' | 'FREE' | 'JOB' | 'ANON';

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

function categoryMeta(item: BbsData): { label: string; tone: StatusTone } {
  const code = item.typeDtCd;
  const label =
    item.typeDtNm ??
    (code === 'FREE' ? '자유' : code === 'JOB' ? '구인/구직' : code === 'ANON' ? '익명' : '게시글');
  const tone: StatusTone = code === 'JOB' ? 'warn' : code === 'ANON' ? 'neutral' : 'info';
  return { label, tone };
}

type Filters = { page: number; category: CategoryCode; keyword: string };
type Data = { items: BbsData[]; totalCount: number; totalPages: number };

function authorName(item: BbsData): string {
  if (item.anonyYn === 'Y') return '익명';
  return item.nickNm ?? item.userNm ?? '사용자';
}

export default function BossCommunityListPage() {
  const router = useRouter();
  // 글을 보고 돌아왔으면 보던 게시판 · 검색어 · 쪽과 목록을 그대로 되살린다
  // (글을 쓰거나 고치거나 지웠으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.community), []);
  const [items, setItems] = useState<BbsData[]>(restored?.data.items ?? []);
  const [page, setPage] = useState(restored?.filters.page ?? 1);
  const [category, setCategory] = useState<CategoryCode>(restored?.filters.category ?? 'ALL');
  const [keyword, setKeyword] = useState(restored?.filters.keyword ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(restored?.data.totalCount ?? 0);
  const [totalPages, setTotalPages] = useState(restored?.data.totalPages ?? 1);
  const [loaded, setLoaded] = useState(restored != null);
  const loadingRef = useRef(false);
  // 되살린 첫 렌더에서는 다시 부르지 않는다
  const skipFirstLoad = useRef(restored != null);

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
          // 서버 페이지는 0 부터 센다 — 1 을 보내면 최신 한 쪽이 통째로 빠진다
          pageNum: targetPage - 1,
          pageSize: PAGE_SIZE,
          typeDtCd: category === 'ALL' ? undefined : category,
          sortDesc: 'crtDtm',
        });
        if (res.success !== false && res.data) {
          const list = dedupe(pickList(res.data));
          const p = Array.isArray(res.data)
            ? { totalCount: list.length, totalPages: 1 }
            : {
                totalCount: (res.data as { totalCount?: number }).totalCount ?? list.length,
                totalPages: Math.max(1, (res.data as { totalPages?: number }).totalPages ?? 1),
              };
          setItems(list);
          setTotalCount(p.totalCount);
          setTotalPages(p.totalPages);
          setLoaded(true);
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
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
    void load(page);
  }, [load, page]);

  // 나갈 때를 위해 지금 조회조건 · 목록을 남겨 둔다
  useSaveListSnapshot<Filters, Data>(
    LIST_KEYS.community,
    { page, category, keyword },
    { items, totalCount, totalPages },
    loaded
  );

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
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={CATEGORY_TABS}
          active={category}
          onChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목 · 작성자"
          className="w-56"
          hint={false}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
            aria-live="polite"
          >
            {loading
              ? '불러오는 중…'
              : isFiltering
                ? `${filtered.length}건 · 이 페이지 안에서 검색`
                : `전체 ${totalCount.toLocaleString('ko-KR')}건`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => void load(page)}
            disabled={loading}
          >
            새로고침
          </Button>
          <ButtonLink href="/boss/community/my" variant="secondary" size="sm">
            내 글
          </ButtonLink>
          <ButtonLink href="/boss/community/blocks" variant="secondary" size="sm">
            차단 관리
          </ButtonLink>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load(page)}>
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
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="게시글을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => void load(page)}>
                다시 시도
              </Button>
            }
          />
        ) : isFiltering ? (
          <EmptyState
            title={`'${keyword.trim()}' 에 맞는 글이 이 페이지에 없습니다`}
            description="검색은 현재 페이지 안에서만 됩니다. 검색어를 바꾸거나 다른 페이지를 확인해 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={category === 'ALL' ? '아직 게시글이 없습니다' : '이 게시판에 글이 없습니다'}
            description="첫 글을 올리면 다른 사장님들이 답을 달 수 있습니다."
            action={
              <ButtonLink href="/boss/community/new" variant="primary" size="sm">
                글쓰기
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
            {filtered.map((item) => {
              const cat = categoryMeta(item);
              const href = `/boss/community/${item.boardId}`;
              return (
                <tr
                  key={item.boardId}
                  className="cursor-pointer"
                  onClick={() => router.push(href)}
                >
                  <td>
                    <ListDateCell at={item.crtDtm} id={item.boardId} />
                  </td>
                  <td className="wrap max-w-[520px]">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={cat.tone}>{cat.label}</StatusPill>
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

      {!isFiltering && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          disabled={loading}
        />
      )}
    </div>
  );
}
