'use client';

// 알림 설정(수신 시간) — Industry 패턴
//
//   패널 안 토글 행(제목 13.5px 600 + 설명 12.5px + 우측 Toggle) → 시간대 행(시작 · 종료 select)
//   → 하단 액션 패널(저장 primary 우측). 화면 제목은 헤더(PAGE_META)가 그린다.
//
// Flutter 원본: lib/app/setting/alram_setting_page.dart
// 백엔드 API: bossUserApi.setAlarmTime (PUT /user/alramTime)

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { Button, ButtonLink, ContentCard, Toggle } from '@/components/boss/ui';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

const timeSelect = 'boss-input w-auto min-w-[68px] cursor-pointer';

export default function BossAlarmSettingPage() {
  const [enabled, setEnabled] = useState(true);
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('22');
  const [endMin, setEndMin] = useState('00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 저장된 사용자 정보가 있으면 초기값 설정
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('boss_user_info');
      if (!raw) return;
      const u = JSON.parse(raw) as { alramTime?: string };
      if (!u?.alramTime) return;
      // 형식 예: "0900-2200"
      const m = u.alramTime.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
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

  const handleSave = async () => {
    if (!enabled) {
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
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('boss_user_info');
            if (raw) {
              const u = JSON.parse(raw);
              u.alramTime = alramTime;
              localStorage.setItem('boss_user_info', JSON.stringify(u));
            }
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
  };

  return (
    <div className="flex flex-col gap-4">
      <ContentCard>
        {/* 토글 행 */}
        <div className="flex items-center gap-3.5 border-b border-boss-border-row px-[15px] py-[14px]">
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-boss-text">
              {enabled ? '알림이 켜져 있습니다' : '알림이 꺼져 있습니다'}
            </p>
            <p className="mt-[3px] text-[12.5px] leading-[1.55] text-boss-text-secondary">
              견적 요청 · 채팅 · AS 접수 알림을 정한 시간대에만 받습니다. 꺼 두면 시간을 저장할 수 없습니다.
            </p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} label="알림 수신" />
        </div>

        {/* 시간대 행 */}
        <div className="flex flex-wrap items-center gap-3.5 px-[15px] py-[14px]">
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-boss-text">수신 시간대</p>
            <p className="mt-[3px] text-[12.5px] leading-[1.55] text-boss-text-secondary">
              이 시간 밖에 발생한 알림은 다음 시작 시각에 모아서 보냅니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              disabled={!enabled}
              aria-label="시작 시"
              className={timeSelect}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </select>
            <select
              value={startMin}
              onChange={(e) => setStartMin(e.target.value)}
              disabled={!enabled}
              aria-label="시작 분"
              className={timeSelect}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
            <span className="px-1 font-boss-head text-[12px] text-boss-text-muted">—</span>
            <select
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              disabled={!enabled}
              aria-label="종료 시"
              className={timeSelect}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </select>
            <select
              value={endMin}
              onChange={(e) => setEndMin(e.target.value)}
              disabled={!enabled}
              aria-label="종료 분"
              className={timeSelect}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </div>
        </div>
      </ContentCard>

      {/* 하단 액션 패널 */}
      <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-[12.5px] text-boss-text-secondary">
          현재 설정{' '}
          <span className="font-boss-head text-[13.5px] font-semibold tabular-nums text-boss-text">
            {startHour}:{startMin} – {endHour}:{endMin}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <ButtonLink href="/boss/settings" variant="secondary">
            취소
          </ButtonLink>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
