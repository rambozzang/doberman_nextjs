'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';
import {
  User,
  Mail,
  Phone,
  Building2,
  LogOut,
  UserX,
  Settings,
  Edit3,
  ChevronRight,
  Bell,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function BossMyInfoPage() {
  const router = useRouter();
  const [user, setUser] = useState<BossUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUser = useCallback(async () => {
    const cached = BossAuthManager.getUserInfo();
    if (!cached?.userId) {
      toast.error('로그인이 필요합니다.');
      router.replace('/boss/login');
      return;
    }
    setLoading(true);
    try {
      const res = await bossUserApi.get(cached.userId);
      if (res.success && res.data) {
        setUser(res.data);
        BossAuthManager.setUserInfo(res.data);
      } else {
        toast.error(res.message || res.error || '내 정보를 불러오지 못했습니다.');
        setUser(cached);
      }
    } catch (err) {
      console.error('boss me load error', err);
      toast.error('내 정보 조회 중 오류가 발생했습니다.');
      setUser(cached);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    BossAuthManager.removeToken();
    toast.success('로그아웃되었습니다.');
    router.replace('/boss/login');
  };

  const handleWithdraw = async () => {
    if (!user?.userId) return;
    if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    setActionLoading(true);
    try {
      const res = await bossAuthApi.withdraw(user.userId);
      if (res.success) {
        BossAuthManager.removeToken();
        toast.success('탈퇴가 완료되었습니다.');
        router.replace('/boss/login');
      } else {
        toast.error(res.message || res.error || '탈퇴 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss withdraw error', err);
      toast.error('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-boss-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-boss-text">내 정보</h1>
        <Link
          href="/boss/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-boss-border bg-boss-elevated text-boss-text-secondary hover:border-boss-primary/30 hover:text-boss-primary"
        >
          <Settings size={16} />
        </Link>
      </div>

      {/* 프로필 카드 */}
      <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-boss-surface/20 ring-2 ring-white/40">
              {user?.profilePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profilePath}
                  alt="프로필"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <User size={28} className="text-boss-text" />
              )}
            </div>
            <div className="flex-1 text-boss-text">
              <p className="text-xl font-bold">{user?.name || '이름 없음'}</p>
              <p className="text-sm text-blue-100">@{user?.userId || '-'}</p>
              {user?.nickNm && <p className="mt-0.5 text-xs text-blue-100">{user.nickNm}</p>}
            </div>
            <Link
              href="/boss/me/edit"
              className="flex h-9 items-center gap-1 rounded-lg bg-boss-surface/20 px-3 text-xs font-semibold text-boss-text hover:bg-boss-surface/30"
            >
              <Edit3 size={13} />
              수정
            </Link>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          <div className="flex items-center gap-3 px-6 py-4">
            <Mail size={16} className="text-boss-text-muted" />
            <div className="flex-1">
              <p className="text-[11px] text-boss-text-muted">이메일</p>
              <p className="text-sm font-medium text-boss-text">{user?.email || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Phone size={16} className="text-boss-text-muted" />
            <div className="flex-1">
              <p className="text-[11px] text-boss-text-muted">휴대폰</p>
              <p className="text-sm font-medium text-boss-text">{user?.phone || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Bell size={16} className="text-boss-text-muted" />
            <div className="flex-1">
              <p className="text-[11px] text-boss-text-muted">알림 시간</p>
              <p className="text-sm font-medium text-boss-text">{user?.alramTime || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/boss/me/company"
          className="flex items-center justify-between rounded-2xl border border-boss-border bg-boss-surface p-4 hover:border-boss-primary/30 hover:bg-boss-elevated/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-boss-primary/10 text-boss-primary">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-boss-text">회사 정보</p>
              <p className="text-[11px] text-boss-text-muted">로고/도장/지역</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-boss-text-muted" />
        </Link>

        <Link
          href="/boss/settings"
          className="flex items-center justify-between rounded-2xl border border-boss-border bg-boss-surface p-4 hover:border-blue-500/50 hover:bg-boss-elevated/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-boss-text">설정</p>
              <p className="text-[11px] text-boss-text-muted">알림/보안</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-boss-text-muted" />
        </Link>
      </div>

      {/* 계정 관리 */}
      <div className="overflow-hidden rounded-2xl border border-boss-border bg-boss-surface">
        <button
          type="button"
          onClick={handleLogout}
          disabled={actionLoading}
          className="flex w-full items-center justify-between border-b border-boss-border px-6 py-4 text-left hover:bg-boss-elevated/40 disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-boss-elevated text-boss-text-muted">
              <LogOut size={15} />
            </div>
            <span className="text-sm font-medium text-boss-text">로그아웃</span>
          </div>
          <ChevronRight size={16} className="text-boss-text-muted" />
        </button>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={actionLoading}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-rose-950/30 disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-boss-error/10 text-boss-error">
              <UserX size={15} />
            </div>
            <span className="text-sm font-medium text-boss-error">회원 탈퇴</span>
          </div>
          <ChevronRight size={16} className="text-rose-700" />
        </button>
      </div>
    </div>
  );
}
