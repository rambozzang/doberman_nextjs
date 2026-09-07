import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 호스트별 처리
 *   · boss.doberman.kr → /boss 화면 (사장님 전용 주소)
 *   · doberman.kr      → www.doberman.kr 301 (아래 설명)
 *
 * 도메인 정규화 — non-www → www 301.
 *
 * doberman.kr 과 www.doberman.kr 이 둘 다 200 을 반환해 같은 콘텐츠가 두
 * 호스트로 크롤링되고 있었다. canonical 이 www 를 가리키고 있었으므로
 * 301 방향도 www 로 맞춘다.
 *
 * nginx 에서 처리해도 되지만, 여기 두면 배포 단위가 앱과 같아져
 * canonical 과 리디렉션 방향이 어긋날 일이 없다.
 */
/** 사장님 전용 호스트 — boss.doberman.kr 로 들어오면 /boss 아래 화면을 보여 준다 */
const BOSS_HOSTS = new Set(['boss.doberman.kr']);

/** 사장님 호스트에서 그대로 통과시킬 경로 — 사장님 화면 · API 프록시 · 정적 파일 */
function passesOnBossHost(pathname: string): boolean {
  return (
    pathname === '/boss' ||
    pathname.startsWith('/boss/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/fonts/') ||
    /\.[a-z0-9]{2,12}$/i.test(pathname) // logo.png · manifest.webmanifest 등 파일
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  if (!host) return NextResponse.next();

  // 포트가 붙은 로컬 개발 환경은 건드리지 않는다.
  const hostname = host.split(':')[0];

  // boss.doberman.kr → www.doberman.kr/boss 와 같은 화면.
  //   boss.doberman.kr/            → /boss            (주소를 바꿔 준다)
  //   boss.doberman.kr/customers   → /boss/customers
  //   boss.doberman.kr/boss/...    → 그대로
  // rewrite 가 아니라 redirect 인 이유: 화면(SiteChrome)이 브라우저 주소로 /boss 여부를 판단해
  // 소비자 사이트 헤더 · 푸터를 붙일지 정한다. 안에서만 바꾸면 주소가 / 라서 헤더 · 푸터가 붙는다.
  if (BOSS_HOSTS.has(hostname)) {
    const url = request.nextUrl.clone();
    if (passesOnBossHost(url.pathname)) return NextResponse.next();
    url.pathname = url.pathname === '/' ? '/boss' : `/boss${url.pathname}`;
    return NextResponse.redirect(url, 307);
  }

  if (hostname !== 'doberman.kr') return NextResponse.next();

  const url = request.nextUrl.clone();
  url.host = 'www.doberman.kr';
  url.protocol = 'https';
  url.port = '';

  return NextResponse.redirect(url, 301);
}

export const config = {
  // 정적 자산과 이미지 최적화 요청은 리디렉션 대상이 아니다.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
