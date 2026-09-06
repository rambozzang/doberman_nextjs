'use client';

// 내 정보 — Industry 패턴 (참조 agent/profile : 좌 계정 패널 + 우 읽기 표)
//
//   lg↑ grid 280px + minmax(0,1fr)
//   좌: 계정 패널 — 사각 아바타 타일(네이비 이니셜) + 이름 19px + 아이디 → 빠른 메뉴 행
//   우: "내 정보" 패널(DescRow dl, 헤더의 «수정» ghost) → "계정 종료" 패널(로그아웃 · 탈퇴)
//   화면 제목은 헤더(PAGE_META)가 그린다. 탈퇴는 되돌릴 수 없어 ConfirmDialog 를 거친다.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';
import {
  Button,
  ConfirmDialog,
  DescRow,
  Panel,
  RowList,
  RowItem,
  RowThumb,
  RowChevron,
  Skeleton,
} from '@/components/boss/ui';
import { Building2, ShieldCheck, Bell, CreditCard } from 'lucide-react';

export default function BossMyInfoPage() {
  const router = useRouter();
  const [user, setUser] = useState<BossUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

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
      setWithdrawOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]" aria-busy>
        <div className="boss-card p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12" />
            <div className="flex-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1.5 h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="boss-card p-5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>
      </div>
    );
  }

  const initial = (user?.name || user?.userId || '·').slice(0, 1);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* 좌: 계정 */}
      <div className="flex flex-col gap-4">
        <section className="boss-card flex flex-col gap-3.5 p-5">
          <div className="flex items-center gap-3">
            {user?.profilePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePath}
                alt="프로필"
                className="h-12 w-12 shrink-0 border border-boss-border object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center bg-boss-rail font-boss-head text-[17px] font-bold text-boss-surface"
              >
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-boss-head text-[19px] font-semibold leading-tight tracking-[0.01em] text-boss-text">
                {user?.name || '이름 없음'}
              </p>
              <p className="mt-0.5 text-[12px] text-boss-text-secondary">
                {user?.nickNm ? `${user.nickNm} · ` : ''}사장님
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-boss-border pt-3">
            <p className="boss-mono-label">계정</p>
            <p className="break-all font-boss-head text-[14px] text-boss-text">{user?.userId || '-'}</p>
          </div>

          <p className="text-[12px] leading-relaxed text-boss-text-secondary">
            아이디는 바꿀 수 없습니다. 비밀번호 변경은 로그인 화면의 «비밀번호 찾기» 로 진행합니다.
          </p>
        </section>

        <RowList>
          <RowItem
            href="/boss/me/company"
            leading={<RowThumb icon={Building2} />}
            title="회사 정보"
            subtitle="로고 · 도장 · 활동 지역"
            actions={<RowChevron />}
          />
          <RowItem
            href="/boss/billing"
            leading={<RowThumb icon={CreditCard} />}
            title="구독 · 결제"
            subtitle="현재 플랜 · 결제 내역"
            actions={<RowChevron />}
          />
          <RowItem
            href="/boss/settings"
            leading={<RowThumb icon={ShieldCheck} />}
            title="설정"
            subtitle="알림 · 약관"
            actions={<RowChevron />}
          />
        </RowList>
      </div>

      {/* 우: 내 정보 + 계정 종료 */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel
          kicker="프로필"
          title="내 정보"
          right={
            <Link href="/boss/me/edit" className="boss-btn boss-btn-sm boss-btn-ghost">
              수정
            </Link>
          }
        >
          <dl>
            <DescRow label="이름" value={user?.name || '-'} />
            <DescRow label="닉네임" value={user?.nickNm || '-'} />
            <DescRow label="이메일" value={user?.email || '-'} />
            <DescRow
              label="휴대폰"
              value={<span className="font-boss-head font-semibold">{user?.phone || '-'}</span>}
            />
            <DescRow
              label={
                <span className="inline-flex items-center gap-1">
                  <Bell size={12} strokeWidth={1.75} /> 알림 시간
                </span>
              }
              value={<span className="font-boss-head font-semibold">{user?.alramTime || '-'}</span>}
            />
          </dl>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            이름 · 닉네임 · 연락처 · 이메일은 «수정» 에서 바꿉니다. 알림 시간은 설정 → 알림에서 바꿉니다.
          </p>
        </Panel>

        <section className="boss-card border-l-[3px] border-l-boss-error p-5">
          <p className="boss-kicker !text-boss-error">주의</p>
          <h3 className="boss-section-title">계정 종료</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
            탈퇴하면 견적 · 주문 · 시공 기록이 모두 삭제되고 복구할 수 없습니다. 1년간 같은 정보로 다시
            가입할 수 없습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleLogout} disabled={actionLoading}>
              로그아웃
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              disabled={actionLoading}
            >
              회원 탈퇴
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        title="정말 탈퇴하시겠습니까?"
        description="모든 데이터가 삭제되며 복구할 수 없습니다. 1년간 재가입이 불가합니다."
        confirmLabel="탈퇴"
        loading={actionLoading}
        onCancel={() => setWithdrawOpen(false)}
        onConfirm={() => void handleWithdraw()}
      />
    </div>
  );
}
