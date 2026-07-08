'use client';

// 사장님 설정 → 알림 설정
// Flutter 원본: lib/app/setting/noti_page.dart
import { useEffect, useState } from 'react';
import { Bell, BellOff, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Button } from '@/components/boss/ui';
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

  const ToggleRow = ({
    label,
    description,
    enabled,
    onChange,
  }: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <div className="text-sm font-semibold text-boss-text">{label}</div>
        <div className="text-xs text-boss-text-muted">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? 'bg-boss-primary' : 'bg-boss-elevated'
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-boss-surface transition ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="알림 설정"
        description="PUSH 및 마케팅 알림, 알림 수신 시간을 관리합니다."
        breadcrumbs={[
          { label: '설정', href: '/boss/settings' },
          { label: '알림 설정' },
        ]}
      />

      <Card>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              pushEnabled ? 'bg-boss-primary/20 text-boss-primary' : 'bg-boss-elevated/40 text-boss-text-muted'
            }`}
          >
            {pushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-boss-text">
              {pushEnabled ? 'PUSH 알림이 켜져있습니다.' : 'PUSH 알림이 꺼져있습니다.'}
            </div>
            <div className="text-xs text-boss-text-muted">
              신규 견적, 댓글, 공지사항 등 중요한 소식을 PUSH로 받아보세요.
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <ToggleRow
          label="구인 / 구직 지역 알림"
          description="내 회사 지역과 일치하는 구인/구직 글이 올라오면 PUSH로 알려줍니다."
          enabled={jobAlarmEnabled}
          onChange={setJobAlarmEnabled}
        />
        <div className="border-t border-boss-border/70" />
        <ToggleRow
          label="PUSH 알림"
          description="신규글, 좋아요, 댓글 등 활동 알림을 수신합니다. (기기 설정에서 변경)"
          enabled={pushEnabled}
          onChange={() => {}}
        />
        <div className="border-t border-boss-border/70" />
        <ToggleRow
          label="마케팅 알림"
          description="프로모션, 이벤트, 혜택 정보를 수신합니다. (기기 설정에서 변경)"
          enabled={marketingEnabled}
          onChange={() => {}}
        />
        <p className="text-xs text-boss-text-muted">
          PUSH/마케팅 수신 여부는 웹 브라우저/OS 기기 설정에서 변경할 수 있습니다.
        </p>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-boss-text">알림 수신 시간</h2>
          <p className="mt-1 text-xs text-boss-text-muted">
            설정한 시간에 맞춰 알림을 수신합니다. HH:MM 형식으로 입력해주세요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-boss-text-muted">
            <Loader2 size={16} className="animate-spin" />
            알림 설정을 불러오는 중...
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="h-10 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
            />
            <span className="text-sm text-boss-text-muted">에 알림 수신</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button icon={Save} onClick={handleSave} disabled={saving || loading}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
