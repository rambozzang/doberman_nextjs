// 전국 도배업체 지도(/map) 타입

// 지도 마커 (목록 응답에는 소개글 같은 큰 필드가 없다)
export interface VendorMarker {
  vendorId: number;
  name: string;
  lat: number;
  lng: number;
  phone?: string | null;
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
}

export interface VendorMapRequest {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
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
