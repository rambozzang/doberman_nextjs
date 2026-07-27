// 사장님 지도 광고 관리 타입

export interface BossAd {
  adId: number;
  tier: number;
  regionSido?: string | null;
  regionSigungu?: string | null;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  landingUrl?: string | null;
  startDt: string;
  endDt: string;
  status: string;
  impCnt: number;
  clickCnt: number;
  /** 게시 기간 안이고 STATUS='Y' 인 상태 */
  serving: boolean;
}

export interface BossAdListResponse {
  /** 내 업체가 지도에 등록되지 않았으면 null */
  vendorId: number | null;
  vendorName: string | null;
  ads: BossAd[];
}

export interface BossAdCreateRequest {
  tier: number;
  /** 비우면 전국 노출 */
  regionSido?: string;
  regionSigungu?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  landingUrl?: string;
  /** yyyy-MM-dd */
  startDt: string;
  endDt: string;
}
