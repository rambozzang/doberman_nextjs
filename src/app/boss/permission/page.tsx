'use client';

// 권한 안내 — Industry 패턴 (AuthFrame wide 620px)
// Flutter 원본: lib/app/login/permission_page.dart
// 모바일 권한 대신 브라우저 Permission API (Notification, Camera, Geolocation) 안내.
//
// 패널 한 장에 권한 세 줄(아이콘 · 이름 · 상태 태그 · 설명 · 요청 버튼), 아래 액션 패널.
// 권한 조회·요청 로직은 그대로다.

import { useCallback, useEffect, useState } from 'react';
import { Bell, Camera, MapPin, Check } from 'lucide-react';
import { Button, ButtonLink, StatusPill, type StatusTone } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

type PermStatus = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking';

interface PermItem {
  key: 'notification' | 'camera' | 'location';
  title: string;
  description: string;
  icon: typeof Bell;
}

const PERM_LIST: PermItem[] = [
  {
    key: 'notification',
    title: '알림',
    description: '새 견적 요청, 일정 알림을 실시간으로 받습니다.',
    icon: Bell,
  },
  {
    key: 'camera',
    title: '카메라',
    description: '현장 사진을 찍어 견적서와 포트폴리오에 바로 붙입니다.',
    icon: Camera,
  },
  {
    key: 'location',
    title: '위치 정보',
    description: '현장 인근 견적 요청을 먼저 보여주고 거리를 안내합니다.',
    icon: MapPin,
  },
];

const STATUS_META: Record<PermStatus, { label: string; tone: StatusTone }> = {
  granted: { label: '허용됨', tone: 'ok' },
  denied: { label: '거부됨', tone: 'bad' },
  prompt: { label: '미설정', tone: 'warn' },
  unsupported: { label: '지원 안 함', tone: 'neutral' },
  checking: { label: '확인 중…', tone: 'neutral' },
};

export default function BossPermissionPage() {
  const [statuses, setStatuses] = useState<Record<PermItem['key'], PermStatus>>({
    notification: 'checking',
    camera: 'checking',
    location: 'checking',
  });

  const checkAll = useCallback(async () => {
    setStatuses({ notification: 'checking', camera: 'checking', location: 'checking' });

    // Notification
    const noti: PermStatus =
      typeof window !== 'undefined' && 'Notification' in window
        ? (Notification.permission as PermStatus)
        : 'unsupported';

    // Camera / Location 은 Permissions API 로 조회 (지원 시)
    let cam: PermStatus = 'unsupported';
    let loc: PermStatus = 'unsupported';

    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const camRes = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        cam = camRes.state as PermStatus;
      } catch {
        cam = 'unsupported';
      }
      try {
        const locRes = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        loc = locRes.state as PermStatus;
      } catch {
        loc = 'unsupported';
      }
    }

    setStatuses({ notification: noti, camera: cam, location: loc });
  }, []);

  // 마운트 시 현재 권한 상태 조회
  useEffect(() => {
    void checkAll();
  }, [checkAll]);

  async function requestPermission(key: PermItem['key']) {
    if (typeof window === 'undefined') return;

    if (key === 'notification') {
      if (!('Notification' in window)) return;
      try {
        const res = await Notification.requestPermission();
        setStatuses((prev) => ({ ...prev, notification: res as PermStatus }));
      } catch {
        // ignore
      }
      return;
    }

    if (key === 'camera') {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setStatuses((prev) => ({ ...prev, camera: 'granted' }));
      } catch {
        setStatuses((prev) => ({ ...prev, camera: 'denied' }));
      }
      return;
    }

    if (key === 'location') {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        () => setStatuses((prev) => ({ ...prev, location: 'granted' })),
        () => setStatuses((prev) => ({ ...prev, location: 'denied' })),
      );
    }
  }

  const grantedCount = PERM_LIST.filter((p) => statuses[p.key] === 'granted').length;
  const hasDenied = PERM_LIST.some((p) => statuses[p.key] === 'denied');

  return (
    <AuthFrame
      title="앱 사용을 위한 권한"
      description="모든 기능을 쓰려면 아래 권한이 필요합니다. 브라우저 설정에서 언제든 바꿀 수 있습니다"
      width="wide"
      footer={
        hasDenied ? (
          <>
            거부된 권한은 브라우저 주소창 왼쪽 자물쇠(사이트 정보)에서 다시 허용할 수 있습니다.
          </>
        ) : undefined
      }
    >
      <div className="boss-card-content">
        <div className="boss-card-head">
          <h2 className="boss-section-title">권한 상태</h2>
          <div className="min-w-0 flex-1" />
          <span className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-text-muted">
            허용 {grantedCount} / {PERM_LIST.length}
          </span>
        </div>

        {PERM_LIST.map(({ key, title, description, icon: Icon }) => {
          const s = statuses[key];
          const meta = STATUS_META[s];
          const granted = s === 'granted';
          return (
            <div
              key={key}
              className="flex items-start gap-3.5 border-b border-boss-border-row px-5 py-4 last:border-b-0"
            >
              <span className="grid h-9 w-9 flex-none place-items-center border border-boss-border bg-boss-bg text-boss-text-dim">
                <Icon size={16} strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-boss-text">{title}</p>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
                  {description}
                </p>
              </div>
              <Button
                variant={granted ? 'secondary' : 'primary'}
                size="sm"
                icon={granted ? Check : undefined}
                disabled={granted || s === 'unsupported' || s === 'checking'}
                onClick={() => void requestPermission(key)}
                className="shrink-0"
              >
                {granted ? '허용됨' : '허용하기'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* 하단 액션 패널 */}
      <div className="boss-card mt-4 flex flex-wrap items-center gap-2.5 px-4 py-3.5">
        <Button variant="secondary" onClick={() => void checkAll()}>
          상태 새로고침
        </Button>
        <span className="text-[12.5px] text-boss-text-secondary">
          허용하지 않아도 이용할 수 있습니다. 필요할 때 다시 요청합니다.
        </span>
        <ButtonLink href="/boss" variant="primary" className="ml-auto">
          대시보드로
        </ButtonLink>
      </div>
    </AuthFrame>
  );
}
