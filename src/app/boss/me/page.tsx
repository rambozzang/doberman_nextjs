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
  PageHeader,
  Card,
  Button,
  RowList,
  RowItem,
  RowThumb,
  RowChevron,
  Skeleton,
} from '@/components/boss/ui';
import {
  User,
  Mail,
  Phone,
  Building2,
  LogOut,
  UserX,
  Edit3,
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
      <PageHeader
        title="내 정보"
        actions={
          <Link href="/boss/me/edit">
            <Button variant="secondary" size="sm" icon={Edit3}>
              수정
            </Button>
          </Link>
        }
      />

      {/* 프로필 */}
      <Card>
        <div className="flex items-center gap-4">
          <RowThumb
            src={user?.profilePath}
            alt="프로필"
            icon={User}
            className="h-14 w-14"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-boss-text">{user?.name || '이름 없음'}</p>
            <p className="text-sm text-boss-text-muted">@{user?.userId || '-'}</p>
            {user?.nickNm && (
              <p className="mt-0.5 text-xs text-boss-text-muted">{user.nickNm}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-boss-border pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Mail size={14} className="shrink-0 text-boss-text-muted" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">이메일</p>
              <p className="truncate text-sm text-boss-text">{user?.email || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-boss-text-muted" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">휴대폰</p>
              <p className="truncate text-sm text-boss-text">{user?.phone || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bell size={14} className="shrink-0 text-boss-text-muted" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-boss-text-muted">알림 시간</p>
              <p className="truncate text-sm text-boss-text">{user?.alramTime || '-'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 빠른 메뉴 */}
      <RowList>
        <RowItem
          href="/boss/me/company"
          leading={<RowThumb icon={Building2} />}
          title="회사 정보"
          subtitle="로고/도장/지역"
          actions={<RowChevron />}
        />
        <RowItem
          href="/boss/settings"
          leading={<RowThumb icon={ShieldCheck} />}
          title="설정"
          subtitle="알림/보안"
          actions={<RowChevron />}
        />
      </RowList>

      {/* 계정 관리 */}
      <RowList>
        <RowItem
          onClick={handleLogout}
          leading={<RowThumb icon={LogOut} />}
          title="로그아웃"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={actionLoading}
            >
              로그아웃
            </Button>
          }
        />
        <RowItem
          onClick={handleWithdraw}
          leading={<RowThumb icon={UserX} />}
          title="회원 탈퇴"
          subtitle="재가입 불가, 데이터 영구 삭제"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWithdraw}
              disabled={actionLoading}
              className="text-boss-error hover:bg-boss-error/10"
            >
              탈퇴
            </Button>
          }
        />
      </RowList>
    </div>
  );
}
