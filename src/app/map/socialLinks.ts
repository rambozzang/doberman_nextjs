// 업체별 SNS/플랫폼 링크 생성
//
// 6개 플랫폼을 스크래핑하면 각 사 약관 위반이자 차단 위험이 크고, 상호명만으로
// 계정을 자동 매칭하면 동명 업체 오탐이 심하다. 그래서 1차는 "검색 딥링크"로
// 사용자가 직접 확인하게 하고, 업체가 claim 으로 등록한 실제 URL 이 있으면
// 그것을 우선 노출한다(3단계).
//
// 주의: 아래 검색 URL 패턴 중 daangn/soomgo 는 실제 동작 확인이 필요하다.
// 각 사가 경로를 바꾸면 이 파일 한 곳만 고치면 된다.

export interface SocialPlatform {
  key: string;
  label: string;
  color: string;
  /** 업체명(+지역)으로 검색 URL 생성 */
  searchUrl: (query: string) => string;
  /** 실제 확인된 패턴인지 — false 면 UI 에서 '검색' 임을 더 분명히 표시 */
  verified: boolean;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "instagram",
    label: "인스타그램",
    color: "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600",
    searchUrl: (q) => `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`,
    verified: true,
  },
  {
    key: "tiktok",
    label: "틱톡",
    color: "bg-slate-900",
    searchUrl: (q) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}`,
    verified: true,
  },
  {
    key: "youtube",
    label: "유튜브",
    color: "bg-red-600",
    searchUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    verified: true,
  },
  {
    key: "daangn",
    label: "당근",
    color: "bg-orange-500",
    searchUrl: (q) => `https://www.daangn.com/search/${encodeURIComponent(q)}`,
    verified: false,
  },
  {
    key: "soomgo",
    label: "숨고",
    color: "bg-teal-600",
    searchUrl: (q) => `https://soomgo.com/search?q=${encodeURIComponent(q)}`,
    verified: false,
  },
  {
    key: "kmong",
    label: "크몽",
    color: "bg-yellow-500",
    searchUrl: (q) => `https://kmong.com/search?type=gigs&keyword=${encodeURIComponent(q)}`,
    verified: false,
  },
];

/** 검색 정확도를 위해 업체명에 지역을 붙인다. 도배 키워드는 업종 한정용. */
export function buildSearchQuery(name: string, sigungu?: string | null): string {
  return [name, sigungu, "도배"].filter(Boolean).join(" ");
}
