'use client';

// 사장님 앱 프레임 — Industry 패턴 (agent.opentohome.com 의 AgentShell)
//
//   lg↑ : grid 236px 레일 + 본문. 레일은 sticky 100dvh, 본문은 페이지 스크롤.
//   lg↓ : 네이비 상단 바(레일이 접힘) + 본문 + 하단 탭.
//   본문 폭은 PAGE_META.width — full 1560 / wide 860 / narrow 620. 패딩 20px 28px 56px.
//
// 라이트 전용. 테마 프로바이더는 없다.
// 토큰 CSS(boss-b2b.css)는 globals.css 가 @import 한다 — 유틸리티보다 앞에 와야 해서 여기서 import 하지 않는다.

import { usePathname } from 'next/navigation';
import BossHeader from './BossHeader';
import BossSidebar from './BossSidebar';
import BossMobileTabs from './BossMobileTabs';
import { BossSearchProvider } from './BossSearchContext';
import { BossPortalProvider } from './BossPortalContext';
import { getPageMeta } from './nav';

// 인증 화면(로그인/회원가입/아이디·비밀번호 찾기 등)에서는
// 레일/헤더를 렌더링하지 않는다. 전체 화면 단독 레이아웃 사용.
const AUTH_PATHS = [
  '/boss/login',
  '/boss/signup',
  '/boss/find-id',
  '/boss/find-password',
  '/boss/phone-auth',
  '/boss/agree',
  '/boss/permission',
];

// 인쇄용 화면도 화면에서는 레일 · 헤더를 그대로 둔다.
// 예전에는 셸 없이 단독으로 띄웠는데, 사장님이 견적서를 열면 메뉴가 통째로 사라져
// 어디로 돌아가야 할지 알 수 없었다. 인쇄할 때만 CSS(@media print)로 셸을 숨긴다.

const WIDTH: Record<'narrow' | 'wide' | 'full', string> = {
  narrow: 'max-w-[620px]',
  wide: 'max-w-[860px]',
  full: 'max-w-[1560px]',
};

export default function BossChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuth) {
    return <main className="boss-page">{children}</main>;
  }

  const width = getPageMeta(pathname).width ?? 'full';

  return (
    <BossPortalProvider>
      <BossSearchProvider>
        <div className="boss-page boss-shell min-h-dvh lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
          <BossSidebar />

          <main className="boss-shell-main flex min-w-0 flex-col pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
            <BossHeader />
            <div className={`w-full ${WIDTH[width]} px-5 pb-14 pt-5 sm:px-7`}>{children}</div>
          </main>

          <BossMobileTabs />
        </div>
      </BossSearchProvider>
    </BossPortalProvider>
  );
}
