'use client';

// 마케팅 정보 수신 안내 — Industry 패턴
//
//   안내 패널 → 혜택 · 철회 방법 패널(사각 점 목록) → 고객센터 패널(전화 secondary + 동의 primary 우측)
//   화면 제목은 헤더(PAGE_META)가 그린다.

import { Button, Panel } from '@/components/boss/ui';
import toast from 'react-hot-toast';

const BENEFITS = [
  '인테리어 견적 및 시공 프로모션 정보를 가장 먼저 받아보실 수 있습니다.',
  '회원 전용 쿠폰, 적립금, 이벤트 초대 등 다양한 혜택을 안내해 드립니다.',
  '서비스 업데이트 및 신규 기능 출시 소식을 빠르게 전달드립니다.',
];

const WITHDRAW_METHODS = [
  '설정 → 푸시 알림에서 마케팅 수신을 끌 수 있습니다.',
  '수신된 마케팅 메시지 하단의 "수신 거부" 링크를 누르면 즉시 해지됩니다.',
  '고객센터로 연락 주시면 동의 철회를 도와드립니다.',
];

function DotList({ items, tone = 'accent' }: { items: string[]; tone?: 'accent' | 'warn' }) {
  const dot = tone === 'warn' ? 'bg-boss-warning' : 'bg-boss-primary';
  return (
    <ul className="space-y-2">
      {items.map((text, idx) => (
        <li key={idx} className="flex items-start gap-2 text-[13.5px] leading-[1.6] text-boss-text-soft">
          <span className={`mt-[9px] h-1 w-1 flex-none ${dot}`} aria-hidden />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BossHelpMarketingPage() {
  const handleOptIn = () => {
    toast.success('마케팅 수신 동의가 완료되었습니다.');
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel kicker="안내" title="마케팅 정보 수신이란">
        <p className="text-[13.5px] leading-[1.75] text-boss-text-soft">
          도배르만은 사장님께 더 나은 서비스와 혜택을 제공하기 위해 마케팅 정보를 보냅니다. 동의하면
          프로모션 · 이벤트 · 서비스 안내를 PUSH · 문자 · 이메일로 받습니다.
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
          마케팅 수신 동의는 선택 사항입니다. 동의하지 않아도 기본 서비스는 그대로 이용할 수 있습니다.
        </p>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel kicker="혜택" title="동의하면 받는 것">
          <DotList items={BENEFITS} />
        </Panel>
        <Panel kicker="철회" title="동의를 되돌리려면">
          <DotList items={WITHDRAW_METHODS} tone="warn" />
        </Panel>
      </div>

      <section className="boss-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="boss-kicker">고객센터</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
            마케팅 수신과 관련해 궁금한 점은 전화 또는 앱 안 1:1 문의로 알려주세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="tel:1600-0000" className="boss-btn boss-btn-md boss-btn-secondary font-boss-head tabular-nums">
            1600-0000
          </a>
          <Button variant="primary" onClick={handleOptIn}>
            마케팅 수신 동의
          </Button>
        </div>
      </section>
    </div>
  );
}
