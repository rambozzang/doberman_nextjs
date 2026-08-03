'use client';

// 사장님 앱 프레임 — onGo 리디자인 시안
// 바깥 배경 #101120 / 앱 컨테이너 #181a27 / 최대폭 1560px
// 데스크톱은 "좌측 고정 레일 + 우측 본문" 2열, 높이는 100vh 풀 화면.
// 본문 패딩은 시안 기준 20px 22px 40px.
//
// 다크 전용이므로 테마 프로바이더는 없다.

import { usePathname } from 'next/navigation';
import '@/styles/boss-b2b.css';
import BossHeader from './BossHeader';
import BossSidebar from './BossSidebar';
import BossMobileTabs from './BossMobileTabs';
import { BossSearchProvider } from './BossSearchContext';

// 인증 화면(로그인/회원가입/아이디·비밀번호 찾기 등)에서는
// 헤더/사이드바를 렌더링하지 않는다. 전체 화면 단독 레이아웃 사용.
const AUTH_PATHS = [
  '/boss/login',
  '/boss/signup',
  '/boss/find-id',
  '/boss/find-password',
  '/boss/phone-auth',
  '/boss/agree',
  '/boss/permission',
];

// 인쇄용 화면은 크롬 없이 단독 렌더링한다
const isPrintPath = (p: string) => p.endsWith('/print') || p.endsWith('/receipt');

export default function BossChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuth || isPrintPath(pathname)) {
    return <main className="boss-page">{children}</main>;
  }

  return (
    <BossSearchProvider>
      <div className="boss-page flex h-screen justify-center overflow-hidden">
        <div className="flex h-full w-full max-w-[1560px] overflow-hidden bg-boss-shell xl:border-x xl:border-boss-border">
          <BossSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <BossHeader />
            <main className="boss-scroll flex-1 overflow-y-auto px-4 pb-10 pt-5 md:px-[22px]">
              {children}
            </main>
            {/* 모바일 하단 탭 — 시안 모바일 규칙 (데스크톱에서는 숨김) */}
            <BossMobileTabs />
          </div>
        </div>
      </div>
    </BossSearchProvider>
  );
}
