'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Megaphone,
  Sparkles,
  RefreshCw,
  Inbox,
  Trash2,
  X,
  CheckCheck,
  Eye,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
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
  RowList,
  RowItem,
  RowThumb,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
} from '@/components/boss/ui';

const PAGE_SIZE = 20;

const CATEGORIES: BossNotificationCategoryMeta[] = [
  { code: 'ALL', label: '전체' },
  { code: 'NOTI', label: '공지' },
  { code: 'AD', label: '광고' },
  { code: 'UPDATE', label: '업데이트' },
];

function categoryIcon(code?: string): { Icon: LucideIcon; tone: 'default' | 'emerald' | 'amber' | 'sky' } {
  switch (code) {
    case 'AD':
      return { Icon: Megaphone, tone: 'amber' };
    case 'UPDATE':
      return { Icon: Sparkles, tone: 'sky' };
    default:
      return { Icon: BellRing, tone: 'emerald' };
  }
}

function pickList(
  payload: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
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

export default function BossNotificationsPage() {
  const [category, setCategory] = useState<BossNotificationCategory>('ALL');
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [readVersion, setReadVersion] = useState(0);

  const [selected, setSelected] = useState<BossNotificationItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, searchWord: string, cat: BossNotificationCategory) => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossNotificationsApi.list({
          pageNum: targetPage,
          pageSize: PAGE_SIZE,
          searchWord: searchWord || undefined,
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
    load(page, keyword, category);
  }, [page, keyword, category, load]);

  const onSearch = () => {
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const onChangeCategory = (cat: BossNotificationCategory) => {
    if (cat === category) return;
    setCategory(cat);
    setPage(0);
  };

  const openDetail = async (item: BossNotificationItem) => {
    setSelected(item);
    setDetailError(null);
    setDetailLoading(true);
    if (item.boardId != null) {
      bossNotificationsReadStore.markRead(item.boardId);
      setReadVersion((v) => v + 1);
      bossNotificationsApi.markRead(item.boardId).catch(() => {});
    }
    try {
      if (item.boardId == null) {
        setSelected(item);
        return;
      }
      const res = await bossNotificationsApi.detail(item.boardId);
      if (res.success !== false && res.data) {
        setSelected(res.data);
      } else {
        setDetailError(res.message || '상세 정보를 불러오지 못했습니다.');
      }
    } catch {
      setDetailError('네트워크 오류로 상세를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetailError(null);
  };

  const removeItem = async (item: BossNotificationItem) => {
    if (item.boardId == null) return;
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) return;
    try {
      const res = await bossNotificationsApi.remove(item.boardId);
      if (res.success !== false) {
        toast.success('알림이 삭제되었습니다.');
        setItems((prev) => prev.filter((x) => x.boardId !== item.boardId));
        if (selected?.boardId === item.boardId) closeDetail();
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

  const unreadCount = useMemo(() => {
    void readVersion;
    return items.reduce(
      (acc, it) => (bossNotificationsReadStore.isRead(it.boardId) ? acc : acc + 1),
      0,
    );
  }, [items, readVersion]);

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
              onClick={() => load(page, keyword, category)}
              disabled={loading}
            >
              새로고침
            </Button>
          </div>
        }
      />

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="제목·내용 검색"
          className="w-full max-w-xs"
        />
        <Button onClick={onSearch} disabled={loading}>
          검색
        </Button>
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
        <div className="space-y-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 알림이 없습니다"
          description="새로운 공지·광고·업데이트가 오면 여기에 표시됩니다."
        />
      ) : (
        <RowList>
          {items.map((item) => {
            const { Icon, tone } = categoryIcon(item.typeDtCd);
            const isRead = bossNotificationsReadStore.isRead(item.boardId);
            void readVersion;
            const tags = (
              <>
                <Badge tone={tone}>
                  {item.typeDtNm ?? CATEGORIES.find((c) => c.code === item.typeDtCd)?.label ?? '알림'}
                </Badge>
                {!isRead && <Badge tone="emerald">NEW</Badge>}
              </>
            );
            return (
              <RowItem
                key={item.boardId ?? Math.random()}
                onClick={() => openDetail(item)}
                leading={<RowThumb icon={Icon} />}
                title={item.subject ?? '(제목 없음)'}
                subtitle={item.contents ?? undefined}
                tags={tags}
                meta={
                  <div className="flex flex-col items-end gap-1">
                    <span>{relativeTime(item.crtDtm)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} /> {item.viewCnt ?? 0}
                    </span>
                  </div>
                }
                actions={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void removeItem(item);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted transition-colors hover:bg-boss-error/10 hover:text-boss-error"
                    aria-label="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                }
              />
            );
          })}
        </RowList>
      )}

      {(hasMore || page > 0) && (
        <Pagination
          page={pageNum}
          totalPages={hasMore ? pageNum + 1 : pageNum}
          onChange={(p) => setPage(p - 1)}
          disabled={loading}
        />
      )}

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeDetail}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-boss-border p-5">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2 text-xs text-boss-text-muted">
                  <Badge tone="default">
                    {selected.typeDtNm ?? CATEGORIES.find((c) => c.code === selected.typeDtCd)?.label ?? '알림'}
                  </Badge>
                  <span>{relativeTime(selected.crtDtm)}</span>
                </div>
                <h2 className="line-clamp-2 text-lg font-semibold text-boss-text">
                  {selected.subject ?? '(제목 없음)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : detailError ? (
                <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{detailError}</span>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-boss-text">
                  {selected.contents ?? '내용이 없습니다.'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-boss-border p-4">
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={() => removeItem(selected)}
                className="text-boss-error hover:bg-boss-error/10"
              >
                삭제
              </Button>
              <Button variant="primary" size="sm" onClick={closeDetail}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
