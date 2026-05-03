'use client';

// 사장님 알림(시간) 설정
// Flutter 원본: lib/app/setting/alram_setting_page.dart
// 백엔드 API: bossUserApi.setAlarmTime (PUT /user/alramTime)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellOff, BellRing, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

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
      const raw = localStorage.getItem('boss_user');
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
            const raw = localStorage.getItem('boss_user');
            if (raw) {
              const u = JSON.parse(raw);
              u.alramTime = alramTime;
              localStorage.setItem('boss_user', JSON.stringify(u));
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
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 설정
        </Link>
        <h1 className="text-xl font-bold text-white">알림 설정</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
            }`}
          >
            {enabled ? <BellRing size={20} /> : <BellOff size={20} />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              {enabled ? '알림이 켜져있습니다.' : '알림이 꺼져있습니다.'}
            </div>
            <div className="text-xs text-slate-400">
              브라우저 알림 권한 및 알림 수신 시간을 설정할 수 있습니다.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              enabled
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {enabled ? '끄기' : '켜기'}
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <h2 className="text-sm font-semibold text-white">알림 수신 시간</h2>
          <p className="mt-1 text-xs text-slate-400">
            아래 시간 동안에만 알림을 수신합니다. 형식: HHmm-HHmm
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">시작 시간</label>
            <div className="flex gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
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
                className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">종료 시간</label>
            <div className="flex gap-2">
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
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
                className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-2 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
          현재 설정:
          <span className="ml-2 font-mono text-emerald-300">
            {startHour}
            {startMin} - {endHour}
            {endMin}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
