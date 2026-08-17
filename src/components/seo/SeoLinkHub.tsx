import Link from 'next/link';
import { REGION_DATA } from '@/lib/ai/data/regions';
import { getRegionUrlLabel, getSidoPath } from '@/lib/seo/dobaeLanding';

/**
 * 푸터 링크 허브.
 *
 * sitemap 에는 올라가 있는데 사이트 안 어디에서도 링크되지 않는 페이지가
 * 36개 있었다(키워드 랜딩, 평형·벽지별 페이지, 게시판 등). 내부 링크가
 * 없다는 건 Google 에게 "이 페이지는 사이트 안에서도 중요하지 않다"는
 * 신호이므로, 모든 페이지 하단에서 한 번씩 연결한다.
 */

const GROUPS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: '도배 정보',
    links: [
      { label: '도배 견적', href: '/도배-견적' },
      { label: '도배 가격', href: '/도배-가격' },
      { label: '도배 시공', href: '/도배-시공' },
      { label: '도배 업체', href: '/도배-업체' },
      { label: '도배 방법', href: '/도배-방법' },
      { label: '도배 종류', href: '/도배-종류' },
      { label: '아파트 도배', href: '/아파트-도배' },
      { label: '저렴한 도배', href: '/저렴한-도배' },
    ],
  },
  {
    title: '평형별 도배 비용',
    links: [
      { label: '24평', href: '/24평-도배비용' },
      { label: '30평', href: '/30평-도배비용' },
      { label: '32평', href: '/32평-도배비용' },
      { label: '34평', href: '/34평-도배비용' },
      { label: '40평', href: '/40평-도배비용' },
      { label: '24평 견적', href: '/24평-도배-견적' },
      { label: '32평 견적', href: '/32평-도배-견적' },
    ],
  },
  {
    title: '벽지·건물별',
    links: [
      { label: '합지벽지', href: '/합지벽지-견적' },
      { label: '실크벽지', href: '/실크벽지-견적' },
      { label: '천연벽지', href: '/천연벽지-견적' },
      { label: '수입벽지', href: '/수입벽지-견적' },
      { label: '빌라', href: '/빌라-도배-견적' },
      { label: '오피스텔', href: '/오피스텔-도배-견적' },
      { label: '단독주택', href: '/단독주택-도배-견적' },
      { label: '상가', href: '/상가-도배-견적' },
      { label: '사무실', href: '/사무실-도배-견적' },
    ],
  },
  {
    title: '시도별 도배 견적',
    links: [
      { label: '서울', href: '/서울-도배-견적' },
      { label: '경기', href: '/경기-도배-견적' },
      { label: '인천', href: '/인천-도배-견적' },
      { label: '부산', href: '/부산-도배-견적' },
      { label: '대구', href: '/대구-도배-견적' },
      { label: '대전', href: '/대전-도배-견적' },
      { label: '광주', href: '/광주-도배-견적' },
    ],
  },
  {
    title: '서비스',
    links: [
      { label: '무료 견적 요청', href: '/quote-request' },
      { label: 'AI 견적', href: '/quote-request-ai' },
      { label: '견적 계산기', href: '/quote-calculator' },
      { label: '견적 목록', href: '/quote-request/list' },
      { label: '시공 체크리스트', href: '/checklist' },
      { label: '커뮤니티', href: '/board' },
      { label: '자주 묻는 질문', href: '/faq' },
      { label: '고객지원', href: '/customer-support' },
    ],
  },
];

/** 상세 동네 페이지 — 상위 시군구 링크만으로는 도달할 수 없어 따로 건다. */
const SUBAREA_LINKS = [
  { label: '분당구 도배', href: '/경기/성남시/분당구/도배' },
  { label: '일산 도배', href: '/경기/고양시/일산/도배' },
];

export default function SeoLinkHub() {
  return (
    <nav
      aria-label="사이트 전체 링크"
      className="border-t border-slate-700/50 py-6 text-sm"
    >
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 font-semibold text-slate-200">{group.title}</h3>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 transition-colors hover:text-blue-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-700/40 pt-4">
        <h3 className="mb-2 font-semibold text-slate-200">
          <Link href="/regional-guide" className="hover:text-blue-400">지역별 도배 비용</Link>
        </h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {REGION_DATA.map((region) => (
            <Link
              key={region.id}
              href={getSidoPath(region.id)}
              className="text-slate-400 transition-colors hover:text-blue-400"
            >
              {getRegionUrlLabel(region.id)} 도배
            </Link>
          ))}
          {SUBAREA_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-400 transition-colors hover:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
