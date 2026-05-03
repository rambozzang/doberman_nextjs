'use client';

import { usePathname } from 'next/navigation';
import BossHeader from './BossHeader';
import BossSidebar from './BossSidebar';

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

export default function BossChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAuth = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuth) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <BossHeader />
      <div className="flex">
        <BossSidebar />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}
