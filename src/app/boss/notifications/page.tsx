'use client';

// 사장님 알림(Notifications) 페이지
// Flutter 참조:
//   - lib/app/setting/noti_page.dart      : 알림 목록 (BBS NOTI 타입)
//   - lib/app/setting/noti_view_page.dart : 알림 상세
//   - lib/app/alert/ad_page.dart          : 광고 카테고리 디자인
//   - lib/app/alert/update_page.dart      : 업데이트 카테고리 디자인
//   - lib/app/alert/company_registration_page.dart : 광고 카테고리 보조
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용하며
// 카테고리(typeDtCd) 로 공지(NOTI) / 광고(AD) / 업데이트(UPDATE) 를 구분한다.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Megaphone,
  Sparkles,
  RefreshCw,
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  CheckCheck,
  Eye,
  AlertCircle,
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

const PAGE_SIZE = 20;

const CATEGORIES: BossNotificationCategoryMeta[] = [
  { code: 'ALL', label: '전체' },
  { code: 'NOTI', label: '공지' },
  { code: 'AD', label: '광고' },
  { code: 'UPDATE', label: '업데이트' },
];

// 카테고리별 아이콘/색상
function categoryStyle(code?: string) {
  switch (code) {
    case 'AD':
      return {
        Icon: Megaphone,
        badge: 'bg-boss-warning/10 text-boss-warning border-amber-500/30',
        accent: 'text-boss-warning',
      };
    case 'UPDATE':
      return {
        Icon: Sparkles,
        badge: 'bg-boss-info/10 text-boss-info border-boss-info/30',
        accent: 'text-boss-info',
      };
    case 'NOTI':
    default:
      return {
        Icon: BellRing,
        badge: 'bg-boss-primary/10 text-boss-primary border-boss-primary/30',
        accent: 'text-boss-primary',
      };
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
  const [page, setPage] = useState(0); // Flutter 와 동일하게 0-base
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [readVersion, setReadVersion] = useState(0); // 로컬 읽음 변경 시 리렌더 트리거

  // 상세 모달
  const [selected, setSelected] = useState<BossNotificationItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(
    async (
      targetPage: number,
      searchWord: string,
      cat: BossNotificationCategory,
    ) => {
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

  const onRefresh = () => {
    load(page, keyword, category).catch(() => toast.error('새로고침 실패'));
  };

  const onChangeCategory = (cat: BossNotificationCategory) => {
    if (cat === category) return;
    setCategory(cat);
    setPage(0);
  };

  // 알림 선택(상세) — 서버 조회수 증가 + 로컬 읽음 처리
  const openDetail = async (item: BossNotificationItem) => {
    setSelected(item);
    setDetailError(null);
    setDetailLoading(true);
    if (item.boardId != null) {
      bossNotificationsReadStore.markRead(item.boardId);
      setReadVersion((v) => v + 1);
      // 조회수 증가는 실패해도 사용자 흐름에 영향 없음
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

  // 알림 삭제
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

  // 모두 읽음 처리(로컬)
  const markAllRead = () => {
    items.forEach((it) => bossNotificationsReadStore.markRead(it.boardId));
    setReadVersion((v) => v + 1);
    toast.success('모두 읽음으로 표시했습니다.');
  };

  const unreadCount = useMemo(() => {
    // readVersion 으로 강제 재계산
    void readVersion;
    return items.reduce(
      (acc, it) => (bossNotificationsReadStore.isRead(it.boardId) ? acc : acc + 1),
      0,
    );
  }, [items, readVersion]);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-boss-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">알림</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-boss-primary/15 px-2 py-0.5 text-xs font-semibold text-boss-primary">
                {unreadCount} 새 알림
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-boss-text-muted">
            공지·광고·업데이트 등 받은 모든 알림을 확인하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted"
            />
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
          <button
            type="button"
            onClick={markAllRead}
            disabled={items.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-boss-text hover:bg-boss-primary-hover disabled:opacity-40"
          >
            <CheckCheck size={14} /> 모두 읽음
          </button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onChangeCategory(c.code)}
              className={
                'h-9 rounded-full border px-4 text-xs font-semibold transition-colors ' +
                (active
                  ? 'border-boss-primary/20 bg-boss-primary/15 text-boss-primary'
                  : 'border-boss-border bg-boss-surface text-boss-text-muted hover:border-boss-border hover:text-boss-text')
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 본문 */}
      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-boss-border bg-boss-surface"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">표시할 알림이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">
            새로운 공지·광고·업데이트가 오면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-boss-border bg-boss-surface/30">
          {items.map((item) => {
            const { Icon, badge, accent } = categoryStyle(item.typeDtCd);
            const isRead = bossNotificationsReadStore.isRead(item.boardId);
            // readVersion 의존을 위해 참조
            void readVersion;
            return (
              <li key={item.boardId ?? Math.random()}>
                <div className="group flex items-start gap-3 p-4 transition-colors hover:bg-boss-elevated/40">
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div
                      className={
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ' +
                        badge
                      }
                    >
                      <Icon size={18} className={accent} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-boss-text-muted">
                        <span
                          className={
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' +
                            badge
                          }
                        >
                          {item.typeDtNm ??
                            CATEGORIES.find((c) => c.code === item.typeDtCd)?.label ??
                            '알림'}
                        </span>
                        {!isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-boss-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-boss-primary" /> NEW
                          </span>
                        )}
                        <span>{relativeTime(item.crtDtm)}</span>
                      </div>
                      <h3
                        className={
                          'mb-1 line-clamp-1 text-base font-semibold ' +
                          (isRead ? 'text-boss-text-secondary' : 'text-boss-text')
                        }
                      >
                        {item.subject ?? '(제목 없음)'}
                      </h3>
                      <p className="line-clamp-2 text-xs text-boss-text-muted">
                        {item.contents ?? ''}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-boss-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={11} /> {item.viewCnt ?? 0}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    title="삭제"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-text-muted opacity-0 transition-opacity hover:border-boss-error/30 hover:text-boss-error group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 페이지네이션 */}
      <nav className="flex items-center justify-between border-t border-boss-border pt-4">
        <p className="text-xs text-boss-text-muted">페이지 {page + 1}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
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

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeDetail}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-boss-border bg-boss-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 border-b border-boss-border p-5">
              <div className="flex min-w-0 items-start gap-3">
                {(() => {
                  const { Icon, badge, accent } = categoryStyle(selected.typeDtCd);
                  return (
                    <div
                      className={
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ' +
                        badge
                      }
                    >
                      <Icon size={20} className={accent} />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-boss-text-muted">
                    <span
                      className={
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' +
                        categoryStyle(selected.typeDtCd).badge
                      }
                    >
                      {selected.typeDtNm ??
                        CATEGORIES.find((c) => c.code === selected.typeDtCd)?.label ??
                        '알림'}
                    </span>
                    <span>{relativeTime(selected.crtDtm)}</span>
                  </div>
                  <h2 className="line-clamp-2 text-lg font-bold text-boss-text">
                    {selected.subject ?? '(제목 없음)'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-text-muted hover:border-boss-border hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            {/* 본문 */}
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {detailLoading ? (
                <div className="space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-boss-elevated" />
                  <div className="h-4 w-full animate-pulse rounded bg-boss-elevated" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-boss-elevated" />
                </div>
              ) : detailError ? (
                <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{detailError}</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-boss-text">
                  {selected.contents ?? '내용이 없습니다.'}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2 border-t border-boss-border bg-boss-bg/80 p-4">
              <button
                type="button"
                onClick={() => removeItem(selected)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-error/30 bg-boss-error/10 px-3 text-sm text-boss-error hover:bg-boss-error/10"
              >
                <Trash2 size={14} /> 삭제
              </button>
              <button
                type="button"
                onClick={closeDetail}
                className="h-9 rounded-lg bg-boss-primary px-4 text-sm font-semibold text-boss-text hover:bg-boss-primary-hover"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
