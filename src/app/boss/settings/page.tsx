'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  ShieldCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BossAuthManager } from '@/lib/bossAuth';
import { PageHeader } from '@/components/boss/ui';

type SettingItem = {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
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
          icon: Bell,
          title: '공지사항',
          subtitle: '서비스 공지사항을 확인합니다.',
        },
        {
          href: '/boss/settings/faq',
          icon: HelpCircle,
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
          icon: Bell,
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
          icon: FileText,
          title: '서비스 이용약관',
          subtitle: '회사 서비스 이용약관',
        },
        {
          href: '/boss/settings/privacy',
          icon: ShieldCheck,
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
          icon: LogOut,
          title: '로그아웃',
          subtitle: '로그아웃 합니다.',
          danger: true,
        },
        {
          onClick: handleLeave,
          icon: UserX,
          title: '탈퇴하기',
          subtitle: '재가입 불가, 데이터 영구 삭제.',
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="설정" description="알림, 약관, 계정을 관리합니다." />

      {groups.map((group) => (
        <section key={group.title} className="space-y-1.5">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-boss-text-muted">
            {group.title}
          </h2>
          <div className="overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss">
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              const inner = (
                <div
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-boss-elevated/40 ${
                    idx > 0 ? 'border-t border-boss-border/70' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      item.danger
                        ? 'bg-boss-error/10 text-boss-error'
                        : 'bg-boss-elevated text-boss-text-muted'
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        item.danger ? 'text-boss-error' : 'text-boss-text'
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="truncate text-xs text-boss-text-muted">{item.subtitle}</p>
                    )}
                  </div>
                  <ChevronRight size={15} className="shrink-0 text-boss-text-muted" />
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

      <div className="rounded-lg border border-boss-border bg-boss-surface px-4 py-3 text-[11px] text-boss-text-muted">
        <div>코드랩타이거(CodeLabTiger)</div>
        <div>사업자등록번호 : 770-50-01045</div>
        <div className="mt-2 text-right text-boss-text-secondary">Copyright 2024 TIGER Group · All rights reserved</div>
      </div>
    </div>
  );
}
