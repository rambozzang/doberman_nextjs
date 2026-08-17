import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 도메인 정규화 — non-www → www 301.
 *
 * doberman.kr 과 www.doberman.kr 이 둘 다 200 을 반환해 같은 콘텐츠가 두
 * 호스트로 크롤링되고 있었다. canonical 이 www 를 가리키고 있었으므로
 * 301 방향도 www 로 맞춘다.
 *
 * nginx 에서 처리해도 되지만, 여기 두면 배포 단위가 앱과 같아져
 * canonical 과 리디렉션 방향이 어긋날 일이 없다.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  if (!host) return NextResponse.next();

  // 포트가 붙은 로컬 개발 환경은 건드리지 않는다.
  const hostname = host.split(':')[0];
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
