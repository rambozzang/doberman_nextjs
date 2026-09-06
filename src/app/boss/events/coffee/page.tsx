'use client';

// 커피 쿠폰 이벤트 — Industry 패턴 (agent.opentohome.com)
//
// 구조: 2열 lg:grid-cols-[minmax(0,1fr)_320px]
//   좌 — 네이비 띠(참조 대시보드 Hero) → 패널 «참여 방법»(번호 칸) → 패널 «유의사항»
//   우 — 요약 패널(DescRow: 상태 · 기간 · 발표 · 지급) + 참여 버튼
// 화면 제목과 «← 이벤트» 는 셸 헤더가 그린다.

import { Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel, DescRow, Button, StatusPill } from '@/components/boss/ui';

const HOW_TO = [
  '이벤트 기간 내 도베르만 앱에 로그인합니다.',
  '메인 화면의 이벤트 배너 또는 [이벤트] 메뉴에 접속합니다.',
  '하단의 "이벤트 참여하기" 버튼을 눌러 참여를 완료합니다.',
  '당첨자에게는 등록된 휴대폰 번호로 커피 쿠폰을 발송해 드립니다.',
];

const NOTICES = [
  '이벤트 기간: 2024.01.01 ~ 2024.12.31',
  '당첨자 발표: 매주 월요일 개별 문자 안내',
  '중복 참여 가능, 단 쿠폰은 계정당 1회 지급됩니다.',
  '부정한 방법으로 참여 시 당첨이 취소될 수 있습니다.',
];

export default function BossEventsCoffeePage() {
  const handleJoin = () => {
    toast.success('이벤트 참여가 접수되었습니다.');
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ───── 좌 ───── */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* 네이비 띠 — 참조 대시보드 Hero */}
        <section className="flex flex-wrap items-end justify-between gap-x-7 gap-y-4 bg-boss-rail px-6 py-[22px] text-boss-surface">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center border border-boss-surface/20 text-boss-surface">
              <Coffee size={22} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-boss-surface/60">
                진행 중 · 2024.01.01 ~ 2024.12.31
              </p>
              <h2 className="mt-1 font-boss-head text-[26px] font-semibold leading-[1.1] sm:text-[30px]">
                도배 사장님, 커피 한 잔 드려요
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-boss-surface/80">
                참여하신 모든 사장님께 추첨을 통해 스타벅스 아메리카노 쿠폰을 드립니다.
              </p>
            </div>
          </div>
        </section>

        <Panel kicker="HOW TO" title="참여 방법">
          <ol className="flex flex-col">
            {HOW_TO.map((text, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 border-b border-boss-border-row py-2.5 text-[13.5px] leading-relaxed text-boss-text last:border-b-0"
              >
                <span className="mt-[2px] flex h-5 w-5 flex-none items-center justify-center bg-boss-pill-info font-boss-head text-[11px] font-semibold text-boss-pill-info-fg">
                  {idx + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel kicker="NOTICE" title="유의사항">
          <ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-boss-text-secondary">
            {NOTICES.map((text, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-[9px] h-[3px] w-[3px] flex-none bg-boss-text-muted" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ───── 우 ───── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel kicker="이벤트" title="커피 쿠폰">
          <dl>
            <DescRow label="상태" value={<StatusPill tone="ok">진행 중</StatusPill>} />
            <DescRow
              label="기간"
              value={<span className="font-boss-head tabular-nums">2024.01.01 ~ 12.31</span>}
            />
            <DescRow label="발표" value="매주 월요일" />
            <DescRow label="지급" value="문자 쿠폰 · 계정당 1회" />
          </dl>
          <Button variant="primary" icon={Coffee} onClick={handleJoin} className="mt-4 w-full">
            이벤트 참여하기
          </Button>
          <p className="mt-2 text-[12px] leading-relaxed text-boss-text-secondary">
            참여하면 등록된 휴대폰 번호로 당첨 여부를 안내합니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}
