'use client';

// 사장님 설정 메인 허브
// Flutter 원본: lib/app/setting/setting_page.dart
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BossAuthManager } from '@/lib/bossAuth';

type SettingItem = {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
};

type SettingGroup = {
  title: string;
  items: SettingItem[];
};

export default function BossSettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    if (
      !confirm(
        '로그아웃 하시겠습니까?\n\n2중로그인, 다중기기 사용불가합니다.\n해당사용자는 즉시 사용이 중지됩니다.',
      )
    ) {
      return;
    }
    try {
      BossAuthManager.removeToken();
      toast.success('로그아웃되었습니다.');
      router.push('/boss/login');
    } catch {
      toast.error('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const handleLeave = () => {
    if (
      !confirm(
        '정말 탈퇴하시겠습니까?\n\n1년간 재가입 불가합니다.\n데이터는 모두 삭제되어 복구 불가능합니다.',
      )
    ) {
      return;
    }
    toast('탈퇴 기능은 고객센터로 문의해주세요.', { icon: 'ℹ️' });
  };

  const groups: SettingGroup[] = [
    {
      title: '문의',
      items: [
        {
          href: '/boss/notifications',
          icon: <Bell size={18} />,
          iconBg: 'bg-sky-500/20 text-sky-300',
          title: '공지사항',
          subtitle: '서비스 공지사항을 확인합니다.',
        },
        {
          href: '/boss/settings/faq',
          icon: <HelpCircle size={18} />,
          iconBg: 'bg-violet-500/20 text-violet-300',
          title: 'FAQ',
          subtitle: '자주 묻는 질문을 확인합니다.',
        },
      ],
    },
    {
      title: '알림 설정',
      items: [
        {
          href: '/boss/settings/alarm',
          icon: <Bell size={18} />,
          iconBg: 'bg-emerald-500/20 text-emerald-300',
          title: '알림(PUSH) 설정',
          subtitle: '신규글 등록, 좋아요, 댓글 알림을 수신합니다.',
        },
      ],
    },
    {
      title: '개인정보 동의 및 약관',
      items: [
        {
          href: '/boss/settings/terms',
          icon: <FileText size={18} />,
          iconBg: 'bg-rose-500/20 text-rose-300',
          title: '서비스 이용약관',
          subtitle: '회사 서비스 이용약관',
        },
        {
          href: '/boss/settings/privacy',
          icon: <ShieldCheck size={18} />,
          iconBg: 'bg-amber-500/20 text-amber-300',
          title: '개인정보 처리방침',
          subtitle: '회사 개인정보 처리방침',
        },
      ],
    },
    {
      title: '계정',
      items: [
        {
          onClick: handleLogout,
          icon: <LogOut size={18} />,
          iconBg: 'bg-orange-500/20 text-orange-300',
          title: '로그아웃',
          subtitle: '로그아웃 합니다.',
          danger: true,
        },
        {
          onClick: handleLeave,
          icon: <UserX size={18} />,
          iconBg: 'bg-red-500/20 text-red-300',
          title: '탈퇴하기',
          subtitle: '재가입 불가, 데이터 영구삭제.',
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <h1 className="text-xl font-bold text-white">설정</h1>
        <div className="w-10" />
      </div>

      {groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <h2 className="px-1 text-sm font-bold text-slate-300">{group.title}</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            {group.items.map((item, idx) => {
              const inner = (
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-800/40 ${
                    idx > 0 ? 'border-t border-slate-800/70' : ''
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-semibold ${
                        item.danger ? 'text-rose-300' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="truncate text-xs text-slate-400">{item.subtitle}</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-500" />
                </div>
              );

              if (item.href) {
                return (
                  <Link key={item.title} href={item.href} className="block">
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className="block w-full text-left"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-400">
        <div>코드랩타이거(CodeLabTiger)</div>
        <div>사업자등록번호 : 770-50-01045</div>
        <div className="mt-3 text-right text-slate-300">Copyright 2024 TIGER Group</div>
        <div className="text-right text-slate-300">All rights reserved</div>
      </div>
    </div>
  );
}
