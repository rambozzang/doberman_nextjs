// 사장님 알림(Notifications) 전용 타입 정의
// Flutter 참조:
//   - lib/app/setting/noti_page.dart, noti_view_page.dart  (BBS NOTI 타입을 사용한 알림 목록/상세)
//   - lib/app/alert/ad_page.dart, update_page.dart, company_registration_page.dart
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용하며
// 하위 카테고리(typeDtCd) 로 광고(AD) / 공지(NOTI) / 업데이트(UPDATE) 를 구분한다.

// 알림 카테고리 코드 (typeDtCd)
export type BossNotificationCategory = 'ALL' | 'NOTI' | 'AD' | 'UPDATE';

// 카테고리 메타 (UI 라벨)
export interface BossNotificationCategoryMeta {
  code: BossNotificationCategory;
  label: string;
}

// 알림 단건 (Flutter BbsData 와 동일 필드를 사용한다)
export interface BossNotificationItem {
  boardId?: number;
  typeCd?: string;       // 항상 'NOTI'
  typeDtCd?: string;     // 'NOTI' | 'AD' | 'UPDATE'
  typeDtNm?: string;     // 카테고리 표시명
  subject?: string;
  contents?: string;
  crtDtm?: string;
  crtCustId?: string;
  userNm?: string;
  nickNm?: string;
  viewCnt?: number;
  likeCnt?: number;
  replyCnt?: number;
  fileCnt?: number;
  filePath?: string;
  fileKey?: string;
  delYn?: string;
  // 클라이언트 측 읽음 처리(LocalStorage 기반) 결과를 합쳐 내려보낼 때 사용
  readYn?: 'Y' | 'N';
}

// 목록 검색 파라미터 (Flutter SearchData 와 동일 필드)
export interface BossNotificationListParams {
  pageNum?: number;
  pageSize?: number;
  typeCd?: string;       // 'NOTI'
  typeDtCd?: string;     // 카테고리 코드
  depthNo?: string;      // '0'
  searchWord?: string;
  searchCustId?: string;
  sortDesc?: string;
}

// 페이징 응답
export interface BossNotificationListResponse {
  list?: BossNotificationItem[];
  content?: BossNotificationItem[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pageNum?: number;
  pageSize?: number;
  isLast?: boolean;
}
