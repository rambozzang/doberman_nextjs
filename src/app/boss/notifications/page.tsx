'use client';

// 사장님 알림 목록 — Industry 패턴 (agent.opentohome.com)
// Flutter 참조:
//   - lib/app/setting/noti_page.dart : BBS list 를 typeCd='NOTI' 로 호출
//   - lib/repo/bbs/bbs_repo.dart : list / detail / delete / viewCount
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용하며
// 하위 카테고리(typeDtCd) 로 공지(NOTI)/광고(AD)/업데이트(UPDATE) 를 구분한다.
//
//   필터 줄 : ListTabs(카테고리) + 검색 + 우측 "안 읽음 n" · "전체 n건" · 모두 읽음 · 새로고침
//   표      : 유형 Tag · 제목 · 내용 · 조회 · 시간 · 삭제. 읽지 않은 행은 좌측 3px accent + 제목 굵게
//   첫 조회 실패(AlertBanner + 다시 시도)와 0건(검색/카테고리 안내)을 구분한다. 삭제는 ConfirmDialog.
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCheck, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  bossNotificationsApi,
  bossNotificationsReadStore,
} from '@/lib/api/boss/notifications';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import type {
  BossNotificationCategory,
  BossNotificationCategoryMeta,
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';
import {
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Tag,
  EmptyState,
  Pagination,
  RowSkeleton,
  ContentCard,
  RowActions,
  ConfirmDialog,
  AlertBanner,
  type StatusTone,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';

const PAGE_SIZE = 20;

const CATEGORIES: BossNotificationCategoryMeta[] = [
  { code: 'ALL', label: '전체' },
  { code: 'NOTI', label: '공지' },
  { code: 'AD', label: '광고' },
  { code: 'UPDATE', label: '업데이트' },
];

function categoryTag(item: BossNotificationItem): { label: string; tone: StatusTone } {
  switch (item.typeDtCd) {
    case 'AD':
      return { label: item.typeDtNm ?? '광고', tone: 'warn' };
    case 'UPDATE':
      return { label: item.typeDtNm ?? '업데이트', tone: 'info' };
    default:
      return { label: item.typeDtNm ?? '공지', tone: 'ok' };
  }
}

function pickList(
  payload: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
}

function stripHtml(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Filters = { category: BossNotificationCategory; page: number; keyword: string };
type Data = { items: BossNotificationItem[]; hasMore: boolean };

export default function BossNotificationsPage() {
  const router = useRouter();
  // 알림을 보고 돌아왔으면 보던 탭 · 쪽과 목록을 그대로 되살린다 (지웠으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.notifications), []);
  const [category, setCategory] = useState<BossNotificationCategory>(restored?.filters.category ?? 'ALL');
  const [items, setItems] = useState<BossNotificationItem[]>(restored?.data.items ?? []);
  const [page, setPage] = useState(restored?.filters.page ?? 0);
  const [keyword, setKeyword] = useState(restored?.filters.keyword ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(restored?.data.hasMore ?? false);
  const [loaded, setLoaded] = useState(restored != null);
  const skipFirstLoad = useRef(restored != null);
  const [readVersion, setReadVersion] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<BossNotificationItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (targetPage: number, cat: BossNotificationCategory) => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossNotificationsApi.list({
          pageNum: targetPage,
          pageSize: PAGE_SIZE,
          typeDtCd: cat === 'ALL' ? undefined : cat,
          sortDesc: 'crtDtm',
        });
        if (res.success !== false && res.data) {
          const list = pickList(res.data);
          setItems(list);
          setHasMore(list.length >= PAGE_SIZE);
          setLoaded(true);
        } else {
          setError(res.message || '알림을 불러오지 못했습니다.');
          setItems([]);
          setHasMore(false);
        }
      } catch {
        setError('네트워크 오류로 알림을 불러오지 못했습니다.');
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
    void load(page, category);
  }, [load, page, category]);

  useSaveListSnapshot<Filters, Data>(
    LIST_KEYS.notifications,
    { category, page, keyword },
    { items, hasMore },
    loaded
  );

  const onChangeCategory = (cat: BossNotificationCategory) => {
    if (cat === category) return;
    setCategory(cat);
    setPage(0);
  };

  const openDetail = (item: BossNotificationItem) => {
    if (item.boardId == null) return;
    bossNotificationsReadStore.markRead(item.boardId);
    setReadVersion((v) => v + 1);
    router.push(`/boss/notifications/${item.boardId}`);
  };

  // 알림 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (target?.boardId == null) return;
    setDeleting(true);
    try {
      const res = await bossNotificationsApi.remove(target.boardId);
      if (res.success !== false) {
        toast.success('알림이 삭제되었습니다.');
        setItems((prev) => prev.filter((x) => x.boardId !== target.boardId));
        setPendingDelete(null);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const markAllRead = () => {
    items.forEach((it) => bossNotificationsReadStore.markRead(it.boardId));
    setReadVersion((v) => v + 1);
    toast.success('모두 읽음으로 표시했습니다.');
  };

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return items;
    return items.filter((it) =>
      [it.subject, stripHtml(it.contents)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const unreadCount = useMemo(() => {
    void readVersion;
    return items.reduce(
      (acc, it) => (bossNotificationsReadStore.isRead(it.boardId) ? acc : acc + 1),
      0,
    );
  }, [items, readVersion]);

  const isFiltering = keyword.trim().length > 0;
  const pageNum = page + 1;
  const categoryLabel = CATEGORIES.find((c) => c.code === category)?.label ?? '전체';

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={CATEGORIES.map((c) => ({ key: c.code, label: c.label }))}
          active={category}
          onChange={onChangeCategory}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목 · 내용 검색"
          className="w-full sm:w-[240px]"
          hint={false}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {unreadCount > 0 && <Tag tone="info">안 읽음 {unreadCount}</Tag>}
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : `전체 ${filtered.length}건`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            onClick={markAllRead}
            disabled={items.length === 0 || unreadCount === 0}
          >
            모두 읽음
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => load(page, category)}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load(page, category)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={6} />
        </ContentCard>
      ) : filtered.length === 0 ? (
        error ? null : (
          <EmptyState
            icon={Inbox}
            title={
              isFiltering
                ? `"${keyword.trim()}" 에 맞는 알림이 없습니다`
                : category === 'ALL'
                  ? '받은 알림이 없습니다'
                  : `${categoryLabel} 알림이 없습니다`
            }
            description={
              isFiltering
                ? '검색은 현재 페이지 안에서만 찾습니다. 검색어를 지우거나 다른 페이지를 확인하세요.'
                : category === 'ALL'
                  ? '공지 · 광고 · 업데이트가 오면 여기에 쌓입니다.'
                  : "다른 카테고리에 있을 수 있습니다. '전체'로 바꿔 보세요."
            }
            action={
              isFiltering ? (
                <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                  검색어 지우기
                </Button>
              ) : category !== 'ALL' ? (
                <Button variant="secondary" size="sm" onClick={() => onChangeCategory('ALL')}>
                  전체 보기
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>받은 시각</th>
              <th>유형</th>
              <th>제목</th>
              <th>내용</th>
              <th className="num">조회</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const tag = categoryTag(item);
              void readVersion;
              const isRead = bossNotificationsReadStore.isRead(item.boardId);
              const summary = stripHtml(item.contents);
              return (
                <tr
                  key={item.boardId ?? Math.random()}
                  className="cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <td
                    className={`border-l-[3px] ${
                      isRead ? 'border-l-transparent' : 'border-l-boss-primary'
                    }`}
                  >
                    <ListDateCell at={item.crtDtm} id={item.boardId} />
                  </td>
                  <td>
                    <Tag tone={tag.tone}>{tag.label}</Tag>
                  </td>
                  <td className="wrap max-w-[360px]">
                    <span
                      className={`line-clamp-1 ${
                        isRead ? 'text-boss-text-secondary' : 'font-semibold text-boss-text'
                      }`}
                    >
                      {!isRead && <span className="sr-only">읽지 않음 · </span>}
                      {item.subject ?? '(제목 없음)'}
                    </span>
                  </td>
                  <td className="wrap max-w-[320px]">
                    <span className="line-clamp-1 text-[12.5px] text-boss-text-muted">
                      {summary || '—'}
                    </span>
                  </td>
                  <td className="num text-boss-text-secondary">{item.viewCnt ?? 0}</td>
                  <td className="text-right">
                    <RowActions
                      onDelete={() => setPendingDelete(item)}
                      deleting={deleting && pendingDelete?.boardId === item.boardId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {!isFiltering && (hasMore || page > 0) ? (
        <Pagination
          page={pageNum}
          totalPages={hasMore ? pageNum + 1 : pageNum}
          onChange={(p) => setPage(p - 1)}
          disabled={loading}
        />
      ) : isFiltering && filtered.length > 0 ? (
        <p className="text-right text-[12px] text-boss-text-muted">
          검색은 현재 페이지({pageNum}페이지) 안에서만 찾습니다.
        </p>
      ) : null}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="알림을 삭제할까요?"
        description={`'${pendingDelete?.subject ?? '선택한 알림'}' — 삭제한 알림은 되돌릴 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
