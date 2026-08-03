'use client';

// 사장님 설정 — onGo 리디자인 시안 `설정` 화면
//
// 레이아웃: grid 194px minmax(0,1fr), 좌측 서브 내비 + 우측 본문(최대 880px)
// 본문: 제목 15px/700 + 설명 12px → 토글 리스트 카드 → 하단 3카드(minmax 270px)
//
// 알림 토글/시간은 실제 API(PUT /user/alramTime)와 연결돼 있다.
// 저장은 ⌘↵ 로도 가능 (시안 KEYBOARD 원칙).

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';
import { BossAuthManager } from '@/lib/bossAuth';
import { bossUserApi } from '@/lib/api/boss/user';
import {
  ContentCard,
  CardHead,
  Card,
  Button,
  Toggle,
  SubNav,
  ConfirmDialog,
} from '@/components/boss/ui';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

const NAV = [
  { key: 'account', label: '계정' },
  { key: 'alarm', label: '알림' },
  { key: 'terms', label: '약관 · 정책' },
  { key: 'support', label: '고객센터' },
];

// 시안 설정 본문 헤더
function Head({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-boss-text">{title}</h2>
      <p className="mt-[5px] text-[12px] leading-[1.6] text-boss-text-secondary">{description}</p>
    </div>
  );
}

// 시안 토글 행 — padding 14px 15px / gap 14px / 제목 12.5px/600 + 설명 11.5px
function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-boss-border-row px-[15px] py-[14px] last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-boss-text">{title}</p>
        <p className="mt-[3px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

// 시안 링크 행
function LinkRow({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 border-b border-boss-border-row px-[15px] py-[14px] transition-colors duration-[120ms] ease-out last:border-b-0 hover:bg-boss-elevated"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold !text-boss-text">{title}</p>
        <p className="mt-[3px] text-[11.5px] leading-[1.55] !text-boss-text-secondary">
          {description}
        </p>
      </div>
      <ChevronRight size={14} className="flex-none text-boss-text-ghost" />
    </Link>
  );
}

export default function BossSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('alarm');

  // ── 알림 설정 (PUT /user/alramTime) ──
  const [alarmOn, setAlarmOn] = useState(true);
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('22');
  const [endMin, setEndMin] = useState('00');
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('boss_user_info');
      if (!raw) return;
      const u = JSON.parse(raw) as { alramTime?: string };
      const m = u?.alramTime?.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
      if (m) {
        setStartHour(m[1]);
        setStartMin(m[2]);
        setEndHour(m[3]);
        setEndMin(m[4]);
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleSaveAlarm = useCallback(async () => {
    if (!alarmOn) {
      toast('알림을 켠 상태에서 시간을 저장할 수 있습니다.', { icon: 'ℹ️' });
      return;
    }
    const start = `${startHour}${startMin}`;
    const end = `${endHour}${endMin}`;
    if (start >= end) {
      toast.error('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }
    const alramTime = `${start}-${end}`;
    setSaving(true);
    try {
      const res = await bossUserApi.setAlarmTime(alramTime);
      if (res.success !== false) {
        toast.success('알림 시간이 저장되었습니다.');
        try {
          const raw = localStorage.getItem('boss_user_info');
          if (raw) {
            const u = JSON.parse(raw);
            u.alramTime = alramTime;
            localStorage.setItem('boss_user_info', JSON.stringify(u));
          }
        } catch {
          /* noop */
        }
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [alarmOn, startHour, startMin, endHour, endMin]);

  // ⌘↵ 로 저장 (알림 탭에서만)
  useSubmitHotkey(handleSaveAlarm, tab === 'alarm');

  const handleLogout = () => {
    try {
      BossAuthManager.removeToken();
      toast.success('로그아웃되었습니다.');
      router.push('/boss/login');
    } catch {
      toast.error('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const timeSelect = useMemo(
    () => 'boss-input w-auto min-w-[68px] cursor-pointer',
    []
  );

  return (
    <div className="boss-bleed grid grid-cols-1 md:grid-cols-[194px_minmax(0,1fr)]">
      {/* 좌측 서브 내비 — 시안 194px / padding 15px 12px */}
      <div className="border-b border-boss-border px-3 py-[15px] md:border-b-0 md:border-r">
        <SubNav label="Settings" items={NAV} value={tab} onChange={setTab} />
      </div>

      {/* 본문 — 최대 880px */}
      <div className="boss-scroll flex max-w-[880px] flex-col gap-4 overflow-y-auto px-4 pb-12 pt-5 md:px-[22px]">
        {tab === 'account' && (
          <>
            <Head
              title="계정"
              description="사업자 정보와 프로필은 앱·웹 어디서 바꿔도 동일하게 반영됩니다."
            />
            <ContentCard>
              <LinkRow href="/boss/me" title="내 정보" description="이름 · 연락처 · 프로필" />
              <LinkRow
                href="/boss/me/company"
                title="회사 정보"
                description="상호 · 사업자등록번호 · 시공 가능 지역"
              />
              <LinkRow
                href="/boss/billing"
                title="구독 · 결제"
                description="현재 플랜과 결제 수단을 확인합니다"
              />
            </ContentCard>
          </>
        )}

        {tab === 'alarm' && (
          <>
            <Head
              title="알림"
              description="놓치면 손해인 알림만 오도록, 수신 시간대를 먼저 정합니다. 지정한 시간 밖에는 푸시를 보내지 않습니다."
            />

            <ContentCard>
              <ToggleRow
                title="푸시 알림 수신"
                description="견적 요청 · 채팅 · AS 접수 알림을 받습니다."
                checked={alarmOn}
                onChange={setAlarmOn}
              />
              <div className="flex flex-wrap items-center gap-3.5 border-b border-boss-border-row px-[15px] py-[14px] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-boss-text">수신 시간대</p>
                  <p className="mt-[3px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
                    이 시간 밖에 발생한 알림은 다음 시작 시각에 모아서 보냅니다.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    disabled={!alarmOn}
                    aria-label="시작 시"
                    className={timeSelect}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={startMin}
                    onChange={(e) => setStartMin(e.target.value)}
                    disabled={!alarmOn}
                    aria-label="시작 분"
                    className={timeSelect}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <span className="px-1 font-boss-mono text-[11px] text-boss-text-muted">—</span>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    disabled={!alarmOn}
                    aria-label="종료 시"
                    className={timeSelect}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={endMin}
                    onChange={(e) => setEndMin(e.target.value)}
                    disabled={!alarmOn}
                    aria-label="종료 분"
                    className={timeSelect}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ContentCard>

            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={() => void handleSaveAlarm()} disabled={saving}>
                {saving ? '저장 중…' : '알림 설정 저장'}
              </Button>
              <span className="font-boss-mono text-[10.5px] text-boss-text-muted">
                ⌘↵ 로 저장
              </span>
            </div>

            <ContentCard>
              <LinkRow
                href="/boss/settings/notifications"
                title="기기별 푸시 설정"
                description="로그인한 기기에서 어떤 알림을 받을지 선택합니다"
              />
              <LinkRow
                href="/boss/notifications"
                title="공지사항"
                description="서비스 공지와 업데이트 내역"
              />
            </ContentCard>
          </>
        )}

        {tab === 'terms' && (
          <>
            <Head
              title="약관 · 정책"
              description="서비스 이용약관과 개인정보 처리방침입니다."
            />
            <ContentCard>
              <LinkRow
                href="/boss/settings/terms"
                title="서비스 이용약관"
                description="도배르만 사장님 서비스 이용약관"
              />
              <LinkRow
                href="/boss/settings/privacy"
                title="개인정보 처리방침"
                description="개인정보 수집 · 이용 · 보관 정책"
              />
            </ContentCard>
          </>
        )}

        {tab === 'support' && (
          <>
            <Head title="고객센터" description="문제가 생겼을 때 가장 빠른 경로입니다." />
            <ContentCard>
              <LinkRow
                href="/boss/settings/faq"
                title="자주 묻는 질문"
                description="견적 · 정산 · 알림 관련 FAQ"
              />
              <LinkRow href="/boss/help" title="사용 가이드" description="화면별 사용법 안내" />
            </ContentCard>
          </>
        )}

        {/* ───── 하단 3카드 — 시안 minmax(270px, 1fr) ───── */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-3">
          <Card>
            <p className="text-[13px] font-bold text-boss-text">요금제</p>
            <p className="mt-[5px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
              현재 플랜과 다음 결제일을 확인합니다.
            </p>
            <div className="mt-[11px]">
              <Link
                href="/boss/billing/plans"
                className="text-[12px] font-semibold !text-boss-primary"
              >
                플랜 보기 →
              </Link>
            </div>
          </Card>

          <Card>
            <p className="text-[13px] font-bold text-boss-text">사업자 정보</p>
            <p className="mt-[5px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
              코드랩타이거(CodeLabTiger)
            </p>
            <p className="mt-[11px] font-boss-mono text-[11px] text-boss-text-muted">
              770-50-01045
            </p>
          </Card>

          <div className="boss-card px-[15px] py-[13px]">
            <p className="text-[13px] font-bold text-boss-text">위험 구역</p>
            <p className="mt-[5px] text-[11.5px] leading-[1.55] text-boss-text-secondary">
              탈퇴하면 1년간 재가입할 수 없고 데이터는 복구되지 않습니다.
            </p>
            <div className="mt-[11px] flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
              <Button variant="danger" size="sm" onClick={() => setLeaveOpen(true)}>
                탈퇴하기
              </Button>
            </div>
          </div>
        </div>

        <p className="pt-2 text-right text-[10.5px] text-boss-text-faint">
          Copyright 2024 TIGER Group · All rights reserved
        </p>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        title="정말 탈퇴하시겠습니까?"
        description="1년간 재가입이 불가하며, 견적·주문·시공 기록이 모두 삭제되어 복구할 수 없습니다."
        confirmLabel="탈퇴 문의"
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          toast('탈퇴는 고객센터로 문의해주세요.', { icon: 'ℹ️' });
        }}
      />
    </div>
  );
}
