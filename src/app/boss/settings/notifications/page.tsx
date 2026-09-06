'use client';

// 푸시 알림(기기별) 설정 — Industry 패턴
//
//   패널 안 토글 행(제목 13.5px 600 + 설명 12.5px + 우측 Toggle) 세 줄
//   → 수신 시각 행(boss-input type=time) → 하단 액션 패널(취소 secondary / 저장 primary 우측)
//   화면 제목은 헤더(PAGE_META)가 그린다.
//
//   PUSH · 마케팅 수신 여부는 기기(OS · 브라우저) 설정이 정한다 — 여기서는 켜져 있음을 보여 주되
//   토글을 잠근다. 눌러도 아무 일도 안 일어나는 토글보다 잠긴 토글이 덜 속인다.
//
// Flutter 원본: lib/app/setting/noti_page.dart

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, ButtonLink, ContentCard, Panel, Skeleton, Toggle } from '@/components/boss/ui';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';

function parseAlarmTime(value?: string): string {
  if (!value) return '09:00';
  // "0900-2200" 형식 처리
  const rangeMatch = value.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
  if (rangeMatch) {
    return `${rangeMatch[1]}:${rangeMatch[2]}`;
  }
  // "HH:MM" 형식
  const timeMatch = value.match(/^(\d{2}):(\d{2})$/);
  if (timeMatch) return value;
  // "HHMM" 형식
  const compactMatch = value.match(/^(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}:${compactMatch[2]}`;
  }
  return '09:00';
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

// 토글 행 — 제목 13.5px 600 + 설명 12.5px + 우측 Toggle
function ToggleRow({
  label,
  description,
  enabled,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-boss-border-row px-[15px] py-[14px] last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-boss-text">{label}</p>
        <p className="mt-[3px] text-[12.5px] leading-[1.55] text-boss-text-secondary">{description}</p>
      </div>
      <Toggle checked={enabled} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}

export default function BossNotificationsSettingPage() {
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [jobAlarmEnabled, setJobAlarmEnabled] = useState(true);
  const [pushEnabled] = useState(true);
  const [marketingEnabled] = useState(true);
  const [user, setUser] = useState<BossUserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const userInfo = BossAuthManager.getUserInfo();
        const userId = userInfo?.userId;
        if (!userId) {
          if (alive) {
            toast('로그인 정보를 찾을 수 없습니다. 기본값으로 설정합니다.', { icon: 'ℹ️' });
          }
          return;
        }
        const res = await bossUserApi.get(userId);
        if (!alive) return;
        if (res.success && res.data) {
          setUser(res.data);
          setAlarmTime(parseAlarmTime(res.data.alramTime));
          setJobAlarmEnabled(res.data.jobAlarmYn !== 'N');
        } else {
          toast.error(res.message || '알림 설정을 불러오지 못했습니다.');
        }
      } catch {
        if (!alive) return;
        toast.error('네트워크 오류로 알림 설정을 불러오지 못했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async () => {
    if (!isValidTime(alarmTime)) {
      toast.error('알림 시간은 HH:MM 형식으로 입력해주세요.');
      return;
    }
    if (!user?.userId) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const payload: BossUserInfo = {
        ...user,
        alramTime: alarmTime.replace(':', ''),
        jobAlarmYn: jobAlarmEnabled ? 'Y' : 'N',
      };
      const res = await bossUserApi.update(payload);
      if (res.success !== false) {
        const updated = res.data;
        if (updated) {
          setUser(updated);
          BossAuthManager.setUserInfo(updated);
        }
        toast.success('알림 설정이 저장되었습니다.');
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
      <Panel kicker="이 기기" title={pushEnabled ? '푸시 알림이 켜져 있습니다' : '푸시 알림이 꺼져 있습니다'}>
        <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
          신규 견적 · 댓글 · 공지 같은 소식을 이 기기로 받습니다. PUSH · 마케팅 수신 자체는 브라우저 ·
          OS 알림 설정이 정하므로 여기서는 바꿀 수 없습니다.
        </p>
      </Panel>

      <ContentCard>
        <ToggleRow
          label="구인 / 구직 지역 알림"
          description="내 회사 지역과 일치하는 구인 · 구직 글이 올라오면 알려줍니다."
          enabled={jobAlarmEnabled}
          onChange={setJobAlarmEnabled}
        />
        <ToggleRow
          label="PUSH 알림"
          description="신규 글 · 좋아요 · 댓글 등 활동 알림. 기기 설정에서 바꿉니다."
          enabled={pushEnabled}
          onChange={() => {}}
          disabled
        />
        <ToggleRow
          label="마케팅 알림"
          description="프로모션 · 이벤트 · 혜택 안내. 기기 설정에서 바꿉니다."
          enabled={marketingEnabled}
          onChange={() => {}}
          disabled
        />
      </ContentCard>

      <ContentCard>
        <div className="flex flex-wrap items-center gap-3.5 px-[15px] py-[14px]">
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-boss-text">수신 시각</p>
            <p className="mt-[3px] text-[12.5px] leading-[1.55] text-boss-text-secondary">
              정한 시각에 맞춰 알림을 받습니다. 저장 형식은 HHMM 입니다.
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-[120px]" />
          ) : (
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              aria-label="알림 수신 시각"
              className="boss-input w-auto min-w-[120px] font-boss-head tabular-nums"
            />
          )}
        </div>
      </ContentCard>

      {/* 하단 액션 패널 */}
      <div className="boss-card flex flex-wrap items-center justify-end gap-2 px-5 py-3.5">
        <ButtonLink href="/boss/settings" variant="secondary">
          취소
        </ButtonLink>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}
