'use client';

// 사장님 도움말 → 마케팅 수신 동의 안내
import { Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/boss/ui';
import toast from 'react-hot-toast';

const BENEFITS = [
  '인테리어 견적 및 시공 프로모션 정보를 가장 먼저 받아보실 수 있습니다.',
  '회원 전용 쿠폰, 적립금, 이벤트 초대 등 다양한 혜택을 안내해 드립니다.',
  '서비스 업데이트 및 신규 기능 출시 소식을 빠르게 전달드립니다.',
];

const WITHDRAW_METHODS = [
  '앱 내 설정 → 알림 설정에서 마케팅 수신을 끌 수 있습니다.',
  '수신된 마케팅 메시지 하단의 "수신 거부" 링크를 클릭하시면 즉시 해지됩니다.',
  '고객센터로 연락 주시면 신속하게 동의 철회를 도와드립니다.',
];

export default function BossHelpMarketingPage() {
  const handleOptIn = () => {
    toast.success('마케팅 수신 동의가 완료되었습니다.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="마케팅 수신 동의"
        description="마케팅 정보 수신에 대한 안내 및 동의 철회 방법을 확인하세요."
        breadcrumbs={[
          { label: '도움말', href: '/boss/help' },
          { label: '마케팅 수신 동의' },
        ]}
      />

      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <Mail size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-white">마케팅 수신 동의 안내</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              도베르만은 사장님께 더 나은 서비스와 혜택을 제공하기 위해 마케팅 정보를 전송하고 있습니다.
              동의하시면 프로모션, 이벤트, 서비스 안내 등의 정보를 PUSH, 문자, 이메일로 받아보실 수 있습니다.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              마케팅 수신 동의는 선택사항이며, 동의하지 않으셔도 도베르만의 기본 서비스를 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-white">동의 시 받을 수 있는 혜택</h2>
        <ul className="mt-3 space-y-2">
          {BENEFITS.map((text, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-white">수신 동의 철회 방법</h2>
        <p className="mt-1 text-xs text-slate-400">
          언제든지 아래 방법 중 하나로 마케팅 수신 동의를 철회할 수 있습니다.
        </p>
        <ul className="mt-3 space-y-2">
          {WITHDRAW_METHODS.map((text, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-white">고객센터 안내</h2>
        <p className="mt-1 text-xs text-slate-400">
          마케팅 수신 동의와 관련하여 궁금한 점이 있으시면 아래로 문의해 주세요.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href="tel:1600-0000"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Phone size={14} className="text-emerald-300" />
            1600-0000
          </a>
          <Button onClick={handleOptIn}>마케팅 수신 동의하기</Button>
        </div>
      </Card>
    </div>
  );
}
