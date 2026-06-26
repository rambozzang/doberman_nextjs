'use client';

// 사장님 이벤트 → 커피 쿠폰 이벤트
import { Coffee, Calendar, Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '@/components/boss/ui';
import toast from 'react-hot-toast';

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
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="커피 쿠폰 이벤트"
        description="도베르만과 함께하는 달콤한 커피 쿠폰 이벤트에 참여해보세요."
        breadcrumbs={[
          { label: '이벤트', href: '/boss/events' },
          { label: '커피 쿠폰 이벤트' },
        ]}
      />

      <div className="rounded-2xl border border-boss-warning/20 bg-gradient-to-br from-amber-500/10 to-slate-900/40 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-boss-warning/20 p-3 text-boss-warning">
            <Coffee size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <Badge tone="amber">진행 중인 이벤트</Badge>
            <h2 className="mt-2 text-lg font-bold text-boss-text">도베른 사장님, 커피 한 잔 드려요!</h2>
            <p className="mt-1 text-sm text-boss-text-secondary">
              이벤트에 참여하신 모든 사장님께 추첨을 통해 스타벅스 아메리칸노 쿠폰을 드립니다.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-boss-text-muted">
              <Calendar size={12} />
              참여 기간: 2024.01.01 ~ 2024.12.31
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-boss-primary" />
          <h2 className="text-sm font-bold text-boss-text">참여 방법</h2>
        </div>
        <ol className="mt-3 space-y-2.5">
          {HOW_TO.map((text, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-boss-text-secondary">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-boss-primary/20 text-[10px] font-bold text-boss-primary">
                {idx + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-boss-warning" />
          <h2 className="text-sm font-bold text-boss-text">유의사항</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {NOTICES.map((text, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-boss-text-muted">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-boss-text-muted" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-center pt-2">
        <Button size="md" icon={Coffee} onClick={handleJoin}>
          이벤트 참여하기
        </Button>
      </div>
    </div>
  );
}
