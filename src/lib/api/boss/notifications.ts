// 사장님 알림(Notifications) API
// Flutter 참조:
//   - lib/app/setting/noti_page.dart : BBS list 를 typeCd='NOTI' 로 호출하여 알림 목록을 조회
//   - lib/app/setting/noti_view_page.dart : BBS detail 호출
//   - lib/repo/bbs/bbs_repo.dart : list / detail / delete / viewCount
//
// 알림 데이터는 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용한다.
import BossApiClient from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';
import type {
  BossNotificationItem,
  BossNotificationListParams,
  BossNotificationListResponse,
} from '@/types/boss-notifications';

// SearchData.toMap() 처럼 null/undefined/빈 문자열은 제외하고 query 로 직렬화
function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const bossNotificationsApi = {
  // 알림 목록 — Flutter NotiPage.getData → GET /bbs/list (typeCd='NOTI')
  list: (
    params: BossNotificationListParams,
  ): Promise<ApiResponse<BossNotificationListResponse | BossNotificationItem[]>> => {
    const merged: BossNotificationListParams = {
      typeCd: 'NOTI',
      depthNo: '0',
      pageNum: 0,
      pageSize: 20,
      ...params,
    };
    return BossApiClient.getPrivate<BossNotificationListResponse | BossNotificationItem[]>(
      `/bbs/list${toQuery(merged as Record<string, unknown>)}`,
    );
  },

  // 알림 상세 — Flutter NotiViewPage.getData → GET /bbs/{boardId}
  detail: (boardId: number | string): Promise<ApiResponse<BossNotificationItem>> =>
    BossApiClient.getPrivate<BossNotificationItem>(`/bbs/${boardId}`),

  // 알림 삭제 — Flutter BbsRepo.delete → DELETE /bbs/delete/{boardId}
  remove: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.deletePrivate<unknown>(`/bbs/delete/${boardId}`),

  // 읽음 처리(조회수 증가) — Flutter BbsRepo.viewCount → POST /bbs/viewCount/{boardId}
  // 백엔드에 별도 read API 가 없어 조회수 증가로 읽음을 표시한다.
  markRead: (boardId: number | string): Promise<ApiResponse<unknown>> =>
    BossApiClient.postPrivate<unknown>(`/bbs/viewCount/${boardId}`),
};

// LocalStorage 기반 클라이언트 측 읽음 상태 관리
// 백엔드에 사용자별 read 플래그가 없으므로 로컬에 저장한다.
const READ_KEY = 'boss:notifications:read';

export const bossNotificationsReadStore = {
  getReadIds(): Set<number> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(READ_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as number[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  },
  isRead(boardId?: number): boolean {
    if (boardId == null) return false;
    return this.getReadIds().has(boardId);
  },
  markRead(boardId?: number) {
    if (boardId == null || typeof window === 'undefined') return;
    const ids = this.getReadIds();
    ids.add(boardId);
    window.localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  },
  unmark(boardId?: number) {
    if (boardId == null || typeof window === 'undefined') return;
    const ids = this.getReadIds();
    ids.delete(boardId);
    window.localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(READ_KEY);
  },
};
