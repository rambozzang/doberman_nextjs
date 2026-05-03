// 사장님 도움말 허브
// Flutter 참조: lib/app/setting/ (faq, service, privecy 등 setting 메뉴 모음)
// FAQ, 약관, 개인정보, 1:1 문의 등으로 이동하는 카드 허브.
import Link from 'next/link';
import {
  HelpCircle,
  FileText,
  ShieldCheck,
  MessageCircleQuestion,
  BookOpen,
  Phone,
  ArrowLeft,
} from 'lucide-react';

type HelpLink = {
  href: string;
  title: string;
  description: string;
  icon: typeof HelpCircle;
};

const HELP_LINKS: HelpLink[] = [
  {
    href: '/boss/settings/faq',
    title: '자주 묻는 질문',
    description: '사용자들이 가장 많이 묻는 질문을 모아두었습니다.',
    icon: MessageCircleQuestion,
  },
  {
    href: '/boss/onboarding',
    title: '사용 가이드',
    description: '도베르만을 처음 사용하는 사장님을 위한 단계별 안내.',
    icon: BookOpen,
  },
  {
    href: '/boss/help/terms',
    title: '서비스 이용약관',
    description: '서비스를 이용하기 위한 약관을 확인하세요.',
    icon: FileText,
  },
  {
    href: '/boss/help/privacy',
    title: '개인정보 처리방침',
    description: '개인정보가 어떻게 수집되고 이용되는지 안내합니다.',
    icon: ShieldCheck,
  },
];

export default function BossHelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <h1 className="text-xl font-bold text-white">도움말</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <HelpCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-white">무엇을 도와드릴까요?</h2>
            <p className="mt-1 text-sm text-slate-300">
              사용 방법, 결제, 계정 관련 문의 등 궁금하신 내용을 카테고리에서 찾아보세요.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {HELP_LINKS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900/60"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-800/80 p-2 text-emerald-300 transition group-hover:bg-emerald-500/20">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">{title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Phone size={16} className="text-emerald-300" />
              고객센터 안내
            </div>
            <p className="mt-1 text-xs text-slate-400">
              평일 09:00 ~ 18:00 (주말, 공휴일 휴무)
            </p>
          </div>
          <a
            href="tel:1600-0000"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            1600-0000
          </a>
        </div>
      </div>
    </div>
  );
}
