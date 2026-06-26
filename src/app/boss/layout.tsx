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
  return (
    <div className="min-h-screen bg-boss-bg text-boss-text">
      <BossAuthGuard>
        <BossChrome>{children}</BossChrome>
      </BossAuthGuard>
    </div>
  );
}
