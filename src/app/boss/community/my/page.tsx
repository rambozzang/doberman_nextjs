'use client';

// 내 글 — Industry 패턴 (agent.opentohome.com)
//
// 필터 줄(검색 + 우측 전체 n건 · 새로고침 · 글쓰기)
// → 표(제목 · 게시판 · 댓글 · 조회 · 작성일 · 수정) — 행 전체가 상세로 가는 링크
// 화면 제목과 «← 커뮤니티» 는 셸 헤더가 그린다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  StatusPill,
  EmptyState,
  AlertBanner,
  ContentCard,
  RowSkeleton,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 100;

function pickList(payload: BbsListResponse | BbsData[] | undefined): BbsData[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
}

type Filters = { keyword: string };
type Data = { items: BbsData[] };

export default function BossCommunityMyPage() {
  const router = useRouter();
  // 글을 보고 돌아왔으면 목록과 검색어를 그대로 되살린다 (쓰거나 고치거나 지웠으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.communityMy), []);
  const [items, setItems] = useState<BbsData[]>(restored?.data.items ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(restored?.filters.keyword ?? '');
  const [loaded, setLoaded] = useState(restored != null);

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
        pageNum: 0,
        pageSize: PAGE_SIZE,
        searchCustId: userId,
        sortDesc: 'crtDtm',
      });
      if (res.success !== false && res.data) {
        setItems(pickList(res.data));
        setLoaded(true);
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
    if (restored) return; // 되살렸으면 다시 부르지 않는다
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSaveListSnapshot<Filters, Data>(LIST_KEYS.communityMy, { keyword }, { items }, loaded);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.subject, it.contents, it.typeDtNm]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목 · 내용 · 게시판"
          className="w-56"
          hint={false}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : isFiltering ? `${filtered.length}건 · 전체 ${items.length}건` : `전체 ${items.length}건`}
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
            새로고침
          </Button>
          <ButtonLink href="/boss/community/new" variant="primary" size="sm">
            글쓰기
          </ButtonLink>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load()}>
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
          <RowSkeleton rows={6} />
        </ContentCard>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="내 글을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          />
        ) : isFiltering ? (
          <EmptyState
            title={`'${keyword.trim()}' 에 맞는 글이 없습니다`}
            description="제목 · 내용 · 게시판 이름으로 검색합니다. 검색어를 바꿔 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="아직 작성한 글이 없습니다"
            description="질문이나 현장 이야기를 올리면 다른 사장님들의 답을 받을 수 있습니다."
            action={
              <ButtonLink href="/boss/community/new" variant="primary" size="sm">
                첫 글 쓰기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>작성일</th>
              <th>제목</th>
              <th>게시판</th>
              <th className="num">댓글</th>
              <th className="num">조회</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const href = `/boss/community/${item.boardId}`;
              return (
                <tr key={item.boardId} className="cursor-pointer" onClick={() => router.push(href)}>
                  <td>
                    <ListDateCell at={item.crtDtm} id={item.boardId} />
                  </td>
                  <td className="wrap max-w-[520px]">
                    <Link
                      href={href}
                      className="line-clamp-1 min-w-0 font-semibold !text-boss-text hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.subject ?? '(제목 없음)'}
                    </Link>
                  </td>
                  <td>
                    {item.typeDtNm ? (
                      <StatusPill tone={item.typeDtCd === 'JOB' ? 'warn' : item.typeDtCd === 'ANON' ? 'neutral' : 'info'}>
                        {item.typeDtNm}
                      </StatusPill>
                    ) : (
                      <span className="text-boss-text-muted">-</span>
                    )}
                  </td>
                  <td className="num text-boss-text-secondary">{item.replyCnt ?? 0}</td>
                  <td className="num text-boss-text-secondary">{item.viewCnt ?? 0}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <ButtonLink href={`${href}/edit`} variant="ghost" size="sm">
                      수정
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
