// 사장님 커뮤니티(BBS) 전용 타입 정의
// Flutter `lib/repo/bbs/data/*.dart` 의 BbsData / CreateData / UpdateData / SearchData /
// BbsSingoData / BBsBlockData / BbsFileData 와 1:1 매칭한다.

// 게시판 첨부파일 (Flutter BbsFileData)
export interface BbsFileData {
  id?: number;
  boardId?: number;
  num?: number;
  fileType?: string;
  fileNm?: string;
  fileKey?: string;
  filePath?: string;
  crtDtm?: string;
}

// 게시글/댓글 공통 모델 (Flutter BbsData)
export interface BbsData {
  subject?: string;
  contents?: string;
  profilePath?: string;
  replyCnt?: number;
  typeDtCd?: string;
  typeDtNm?: string;
  filePath?: string;
  crtCustId?: string;
  depthNo?: string;
  sortNo?: string;
  parentId?: string | number;
  rootId?: string | number;
  userNm?: string;
  nickNm?: string;
  typeCd?: string;
  boardId?: number;
  fileKey?: string;
  crtDtm?: string;
  anonyYn?: string;
  likeYn?: string;
  viewCnt?: number;
  likeCnt?: number;
  fileCnt?: number;
  delYn?: string;
  fileList?: BbsFileData[];
}

// 게시글 생성 요청 (Flutter CreateData)
export interface BbsCreateRequest {
  typeCd: string;
  typeDtCd: string;
  depthNo: string;
  boardId: string;
  parentId: number;
  subject: string;
  contents: string;
  fileListData: BbsFileData[];
}

// 게시글 수정 요청 (Flutter UpdateData)
export interface BbsUpdateRequest {
  typeCd?: string;
  typeDtCd?: string;
  depthNo?: string;
  boardId?: string;
  parentId?: number;
  subject?: string;
  contents?: string;
  fileListData?: BbsFileData[];
}

// 검색 / 페이징 요청 (Flutter SearchData)
export interface BbsSearchParams {
  pageNum?: number;
  pageSize?: number;
  typeCd?: string;
  typeDtCd?: string;
  depthNo?: string;
  searchWord?: string;
  boardId?: number;
  custId?: string;
  searchCustId?: string;
  rootId?: string;
  parentId?: string;
  sortDesc?: string;
}

// 신고 요청 (Flutter BbsSingoData)
export interface BbsSingoRequest {
  boardId?: string;
  reasonCd?: string;
  userId?: string;
  reason?: string;
}

// 차단 사용자 (Flutter BBsBlockData)
export interface BbsBlockData {
  custId?: string;
  denyCustId?: string;
  crtDtm?: string;
  name?: string;
  nickNm?: string;
}

// 댓글 작성/수정용 페이로드 — Flutter `comment_repo.saveComment(BbsData)` 와 동일
// CommentRepo 가 BbsData 를 직접 보내므로 별도 타입을 만들지 않고 BbsData 를 재사용한다.
export type CommentCreateRequest = BbsData;

// 게시글 목록 응답이 배열만 오는 경우와 페이징 래핑이 오는 경우 모두 수용
export interface BbsListResponse<T = BbsData> {
  list?: T[];
  content?: T[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pageNum?: number;
  pageSize?: number;
}
