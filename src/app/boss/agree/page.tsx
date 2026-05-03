'use client';

// 사장님 약관 동의 페이지 (회원가입 전 단계)
// Flutter 원본: lib/app/login/agree_page.dart
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckSquare, Square, ChevronRight } from 'lucide-react';

interface AgreementItem {
  id: string;
  title: string;
  required: boolean;
  href?: string;
}

const AGREEMENTS: AgreementItem[] = [
  {
    id: 'service',
    title: '서비스 이용약관 동의',
    required: true,
    href: '/boss/help/terms',
  },
  {
    id: 'privacy',
    title: '개인정보 수집 및 이용 동의',
    required: true,
    href: '/boss/help/privacy',
  },
  {
    id: 'location',
    title: '위치정보 이용 동의',
    required: true,
  },
  {
    id: 'age',
    title: '만 14세 이상입니다',
    required: true,
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신 동의',
    required: false,
  },
];

export default function BossAgreePage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => AGREEMENTS.every((a) => checked[a.id]),
    [checked],
  );
  const requiredChecked = useMemo(
    () => AGREEMENTS.filter((a) => a.required).every((a) => checked[a.id]),
    [checked],
  );

  function toggleAll() {
    const next = !allChecked;
    const map: Record<string, boolean> = {};
    AGREEMENTS.forEach((a) => (map[a.id] = next));
    setChecked(map);
  }

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function submit() {
    if (!requiredChecked) return;
    router.push('/boss/signup');
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 로그인
        </Link>
        <h1 className="text-xl font-bold text-white">약관 동의</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-5">
        <h2 className="text-base font-bold text-white">도베르만 서비스 가입</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          서비스 시작 및 가입을 위해 먼저 가입 및 정보 제공에 동의해 주세요.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <button
          type="button"
          onClick={toggleAll}
          className="flex w-full items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left hover:bg-emerald-500/15"
        >
          {allChecked ? (
            <CheckSquare size={20} className="text-emerald-300" />
          ) : (
            <Square size={20} className="text-slate-400" />
          )}
          <span className="text-sm font-bold text-white">전체 동의</span>
        </button>

        <div className="divide-y divide-slate-800/70">
          {AGREEMENTS.map((a) => {
            const isOn = !!checked[a.id];
            return (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="shrink-0"
                  aria-label={a.title}
                >
                  {isOn ? (
                    <CheckSquare size={18} className="text-emerald-300" />
                  ) : (
                    <Square size={18} className="text-slate-500" />
                  )}
                </button>
                <div className="min-w-0 flex-1 text-sm text-slate-200">
                  <span
                    className={
                      a.required ? 'text-emerald-300 font-semibold' : 'text-slate-400 font-semibold'
                    }
                  >
                    ({a.required ? '필수' : '선택'})
                  </span>{' '}
                  {a.title}
                </div>
                {a.href && (
                  <Link
                    href={a.href}
                    className="inline-flex items-center gap-0.5 text-xs text-slate-400 hover:text-emerald-300"
                  >
                    보기 <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!requiredChecked}
        className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        동의하고 계속하기
      </button>
    </div>
  );
}
