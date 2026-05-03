// 사장님 첫 사용 온보딩 가이드
// Flutter 원본: lib/app/login/ (signup_page 흐름) + lib/app/setting/main_page (메뉴 안내)
// 단계별 카드로 도베르만 첫 사용을 돕는 정적 가이드.
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Building2,
  ClipboardList,
  Calendar,
  Wallet,
  Users,
  CheckCircle2,
} from 'lucide-react';

type Step = {
  no: number;
  title: string;
  description: string;
  icon: typeof UserPlus;
  href?: string;
};

const STEPS: Step[] = [
  {
    no: 1,
    title: '회원가입 및 본인 인증',
    description: '휴대폰 인증으로 사장님 계정을 안전하게 만들어주세요.',
    icon: UserPlus,
    href: '/boss/signup',
  },
  {
    no: 2,
    title: '회사 정보 등록',
    description: '사업자등록번호, 회사명, 로고를 등록해 견적서 브랜딩을 완성하세요.',
    icon: Building2,
    href: '/boss/onboarding/company',
  },
  {
    no: 3,
    title: '첫 견적서 작성',
    description: '템플릿을 활용해 5분 안에 견적서를 만들어 고객에게 공유해보세요.',
    icon: ClipboardList,
    href: '/boss/estimate',
  },
  {
    no: 4,
    title: '현장 일정 관리',
    description: '캘린더에 시공 일정을 등록하고 알림을 받아보세요.',
    icon: Calendar,
    href: '/boss/calendar',
  },
  {
    no: 5,
    title: '결제 / 정산 설정',
    description: '계약금, 중도금, 잔금 단계별 정산을 손쉽게 관리하세요.',
    icon: Wallet,
    href: '/boss/billing',
  },
  {
    no: 6,
    title: '고객 관리 시작',
    description: '고객 정보와 상담 이력을 한 곳에서 관리해 재방문을 늘리세요.',
    icon: Users,
    href: '/boss/community',
  },
];

export default function BossOnboardingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <h1 className="text-xl font-bold text-white">시작 가이드</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <CheckCircle2 size={14} /> WELCOME
        </div>
        <h2 className="mt-2 text-lg font-bold text-white">
          도베르만에 오신 것을 환영합니다!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          아래 6단계만 따라하시면 견적, 일정, 결제, 고객 관리를 한 번에 시작하실 수 있어요.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map(({ no, title, description, icon: Icon, href }) => (
          <li key={no}>
            <Link
              href={href ?? '#'}
              className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">
                {no}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Icon size={16} className="text-emerald-300" />
                  {title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
              <ArrowRight
                size={16}
                className="mt-1 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
              />
            </Link>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
        <p className="text-xs text-slate-400">
          이미 가이드를 완료하셨나요? 도움말에서 더 많은 팁을 확인하세요.
        </p>
        <Link
          href="/boss/help"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
        >
          도움말로 이동 <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
