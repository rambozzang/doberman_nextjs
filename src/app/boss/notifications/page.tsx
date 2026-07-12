'use client';

// 사장님 알림(Notifications) 목록 페이지
// Flutter 참조:
//   - lib/app/setting/noti_page.dart : BBS list 를 typeCd='NOTI' 로 호출
//   - lib/repo/bbs/bbs_repo.dart : list / detail / delete / viewCount
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용하며
// 하위 카테고리(typeDtCd) 로 공지(NOTI)/광고(AD)/업데이트(UPDATE) 를 구분한다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, RefreshCw, CheckCheck, Trash2, Inbox, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  bossNotificationsApi,
  bossNotificationsReadStore,
} from '@/lib/api/boss/notifications';
import type {
  BossNotificationCategory,
  BossNotificationCategoryMeta,
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';
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

type BadgeTone = 'default' | 'emerald' | 'amber' | 'sky';

const PAGE_SIZE = 20;

const CATEGORIES: BossNotificationCategoryMeta[] = [
  { code: 'ALL', label: '전체' },
  { code: 'NOTI', label: '공지' },
  { code: 'AD', label: '광고' },
  { code: 'UPDATE', label: '업데이트' },
];

function categoryBadge(item: BossNotificationItem): { label: string; tone: BadgeTone } {
  switch (item.typeDtCd) {
    case 'AD':
      return { label: item.typeDtNm ?? '광고', tone: 'amber' };
    case 'UPDATE':
      return { label: item.typeDtNm ?? '업데이트', tone: 'sky' };
    default:
      return { label: item.typeDtNm ?? '공지', tone: 'emerald' };
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

export default function BossNotificationsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<BossNotificationCategory>('ALL');
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [readVersion, setReadVersion] = useState(0);

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
    void load(page, category);
  }, [load, page, category]);

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

  const removeItem = async (item: BossNotificationItem) => {
    if (item.boardId == null) return;
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) return;
    try {
      const res = await bossNotificationsApi.remove(item.boardId);
      if (res.success !== false) {
        toast.success('알림이 삭제되었습니다.');
        setItems((prev) => prev.filter((x) => x.boardId !== item.boardId));
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했습니다.');
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="알림"
        description="공지·광고·업데이트 등 받은 모든 알림을 확인하세요."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCheck}
              onClick={markAllRead}
              disabled={items.length === 0}
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
        }
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·내용 검색"
          className="w-full max-w-xs"
        />
        {unreadCount > 0 && (
          <Badge tone="emerald">
            <Bell size={10} /> {unreadCount}개 안 읽음
          </Badge>
        )}
      </Toolbar>

      <ListTabs
        tabs={CATEGORIES.map((c) => ({ key: c.code, label: c.label }))}
        active={category}
        onChange={onChangeCategory}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 알림이 없습니다"
          description="새로운 공지·광고·업데이트가 오면 여기에 표시됩니다."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">유형</th>
              <th>제목</th>
              <th>내용</th>
              <th className="text-center whitespace-nowrap">조회</th>
              <th className="whitespace-nowrap">등록일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = categoryBadge(item);
              void readVersion;
              const isRead = bossNotificationsReadStore.isRead(item.boardId);
              const summary = stripHtml(item.contents);
              return (
                <tr
                  key={item.boardId ?? Math.random()}
                  className="cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <td className="whitespace-nowrap">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          isRead
                            ? 'text-boss-text-secondary'
                            : 'font-medium text-boss-text'
                        }
                      >
                        {item.subject ?? '(제목 없음)'}
                      </span>
                      {!isRead && <Badge tone="emerald">NEW</Badge>}
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <span className="line-clamp-1 text-boss-text-muted">
                      {summary || '-'}
                    </span>
                  </td>
                  <td className="text-center text-boss-text-secondary">
                    {item.viewCnt ?? 0}
                  </td>
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">
                    {relativeTime(item.crtDtm)}
                  </td>
                  <td
                    className="whitespace-nowrap text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeItem(item)}
                      className="text-boss-text-muted hover:text-boss-error"
                    >
                      삭제
                    </Button>
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
      ) : isFiltering ? (
        <div className="flex justify-end border-t border-boss-border pt-3">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            현재 페이지 내 필터
          </span>
        </div>
      ) : null}
    </div>
  );
}
