'use client';

// 사장님 권한 안내 페이지
// Flutter 원본: lib/app/login/permission_page.dart
// 모바일 권한 대신 브라우저 Permission API (Notification, Camera, Geolocation) 안내.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

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
    title: '알림 권한',
    description: '신규 견적 요청, 일정 알림 등을 실시간으로 받기 위해 필요합니다.',
    icon: Bell,
  },
  {
    key: 'camera',
    title: '카메라 접근 권한',
    description: '현장 사진을 촬영해 견적서와 포트폴리오에 첨부하기 위해 필요합니다.',
    icon: Camera,
  },
  {
    key: 'location',
    title: '위치 정보 권한',
    description: '현장 인근 견적 요청을 우선 노출하고 거리 정보를 안내하기 위해 사용됩니다.',
    icon: MapPin,
  },
];

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

  function statusLabel(s: PermStatus): { label: string; tone: string } {
    switch (s) {
      case 'granted':
        return { label: '허용됨', tone: 'text-boss-primary bg-boss-primary/15 border-boss-primary/30' };
      case 'denied':
        return { label: '거부됨', tone: 'text-red-300 bg-red-500/15 border-red-500/30' };
      case 'prompt':
        return { label: '미설정', tone: 'text-boss-warning bg-amber-500/15 border-amber-500/30' };
      case 'unsupported':
        return { label: '지원안함', tone: 'text-boss-text-muted bg-boss-elevated/30 border-boss-border' };
      default:
        return { label: '확인중', tone: 'text-boss-text-muted bg-boss-elevated/30 border-boss-border' };
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss"
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <h1 className="text-xl font-bold text-boss-text">앱 사용을 위한 권한</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-boss-primary/20 bg-gradient-to-br from-boss-primary/10 to-slate-900/40 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-boss-primary" />
          <div className="text-sm leading-relaxed text-boss-text-secondary">
            도베르만의 모든 기능을 원활히 사용하려면 아래 권한을 허용해 주세요. 권한은 브라우저
            설정에서 언제든지 변경할 수 있습니다.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PERM_LIST.map(({ key, title, description, icon: Icon }) => {
          const s = statuses[key];
          const meta = statusLabel(s);
          const granted = s === 'granted';
          return (
            <div
              key={key}
              className="rounded-2xl border border-boss-border bg-boss-surface p-5"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-boss-primary/15 p-2 text-boss-primary">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-boss-text">{title}</div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}
                    >
                      {s === 'checking' ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" /> {meta.label}
                        </span>
                      ) : (
                        meta.label
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-boss-text-muted">{description}</p>
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={granted || s === 'unsupported' || s === 'checking'}
                      onClick={() => void requestPermission(key)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-boss-primary/20 bg-boss-primary/10 px-3 py-1.5 text-xs font-semibold text-boss-primary hover:bg-boss-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {granted ? (
                        <>
                          <CheckCircle2 size={12} /> 허용됨
                        </>
                      ) : (
                        '권한 요청'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void checkAll()}
        className="w-full rounded-xl border border-boss-border bg-boss-elevated/50 py-3 text-sm font-semibold text-boss-text hover:bg-boss-elevated"
      >
        권한 상태 새로고침
      </button>
    </div>
  );
}
