import type { Metadata } from 'next';
import BossChrome from '@/components/boss/layout/BossChrome';
import BossAuthGuard from '@/components/boss/BossAuthGuard';

// 사장님 영역은 검색엔진 노출하지 않음
export const metadata: Metadata = {
  title: {
    default: '사장님 | 도배르만',
    template: '%s | 도배르만 사장님',
  },
  robots: { index: false, follow: false },
};

export default function BossLayout({ children }: { children: React.ReactNode }) {
  // 프레임 높이/배경은 BossChrome이 직접 관리한다
  return (
    <>
      {/* 서체는 /boss 안에서만 로드한다.
       * boss-b2b.css 는 전역 번들에 들어가므로 거기서 @import 하면
       * /boss 밖 페이지도 이 폰트를 내려받게 된다.
       *
       * 본문 Pretendard(한글) · 숫자/제목 Barlow Condensed (Industry 패턴의 font-dc).
       * next/font 는 빌드 서버가 Google 에 닿아야 해서 쓰지 않는다. */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <BossAuthGuard>
        <BossChrome>{children}</BossChrome>
      </BossAuthGuard>
    </>
  );
}
