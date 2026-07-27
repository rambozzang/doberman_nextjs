// 전국 도배업체 지도(/map) 타입

// 지도 마커 (목록 응답에는 소개글 같은 큰 필드가 없다)
export interface VendorMarker {
  vendorId: number;
  name: string;
  lat: number;
  lng: number;
  phone?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  memberYn: string;
  adTier: number;
}

// 지도 영역 조회 응답. total > markers.length 면 상한에 걸려 일부만 내려온 것
export interface VendorMapResponse {
  total: number;
  markers: VendorMarker[];
}

// 시군구 단위 집계 (지도를 넓게 축소했을 때 버블로 표시)
export interface VendorCluster {
  sido?: string | null;
  sigungu?: string | null;
  cnt: number;
  lat: number;
  lng: number;
}

// 수집/등록된 실제 SNS 링크. 없으면 검색 딥링크로 대체한다.
export interface VendorLink {
  platform: string;
  url: string;
  title?: string | null;
  source: string;
  verified: boolean;
}

// 좌측 상세 패널
export interface VendorDetail {
  vendorId: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  lat: number;
  lng: number;
  bizCategory?: string | null;
  intro?: string | null;
  homepage?: string | null;
  memberYn: string;
  adTier: number;
  companyId?: number | null;
  links?: VendorLink[];
}

// ── 이야기(커뮤니티) ──────────────────────────────────────────
export interface VendorStory {
  storyId: number;
  vendorId?: number | null;
  title: string;
  contents: string;
  writerName: string;
  mine: boolean;
  commentCnt: number;
  likeCnt: number;
  viewCnt: number;
  crtDtm?: string | null;
}

export interface VendorStoryComment {
  commentId: number;
  contents: string;
  writerName: string;
  mine: boolean;
  crtDtm?: string | null;
}

export interface VendorStoryListResponse {
  total: number;
  page: number;
  stories: VendorStory[];
}

export interface VendorStoryDetail {
  story: VendorStory;
  comments: VendorStoryComment[];
}

// ── 광고 ─────────────────────────────────────────────────────
export interface VendorAd {
  adId: number;
  vendorId: number;
  vendorName: string;
  tier: number;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  landingUrl?: string | null;
  phone?: string | null;
  sigungu?: string | null;
}

export interface VendorAdClickResponse {
  adId: number;
  landingUrl?: string | null;
  vendorId: number;
}

export interface VendorMapRequest {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  keyword?: string;
  limit?: number;
}

// 지역 기준 조회 — 지도 SDK 가 없을 때 bbox 대신 쓴다
export interface VendorRegionRequest {
  sido?: string;
  sigungu?: string;
  keyword?: string;
  limit?: number;
}

// 지도 경계 (네이버 지도 getBounds 결과를 옮겨담는 용도)
export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}
