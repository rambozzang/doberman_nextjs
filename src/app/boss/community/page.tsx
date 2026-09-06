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
                : `${page} 페이지 · ${items.length}건`}
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
              <th>제목</th>
              <th>작성자</th>
              <th className="num">댓글</th>
              <th className="num">좋아요</th>
              <th className="num">조회</th>
              <th>날짜</th>
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
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {relativeTime(item.crtDtm)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && (
        <Pagination
          page={page}
          totalPages={hasMore ? page + 1 : page}
          onChange={setPage}
          disabled={loading}
        />
      )}
    </div>
  );
}
