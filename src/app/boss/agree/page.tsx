'use client';

// 약관 동의 (회원가입 전 단계) — Industry 패턴 (AuthFrame 380px 열)
// Flutter 원본: lib/app/login/agree_page.dart
//
// 패널 안에 "전체 동의" 한 줄 → 항목별 CheckLine(필수/선택 태그 + 약관 보기 링크).
// 필수 항목이 모두 켜져야 계속 버튼이 열린다. 동의 상태 처리는 그대로다.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, CheckLine, Tag } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

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

  const requiredTotal = AGREEMENTS.filter((a) => a.required).length;
  const requiredDone = AGREEMENTS.filter((a) => a.required && checked[a.id]).length;

  return (
    <AuthFrame
      title="약관 동의"
      description="가입에 필요한 약관입니다. 필수 항목에 동의하면 다음으로 넘어갑니다"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link
            href="/boss/login"
            className="font-semibold !text-boss-primary underline underline-offset-2"
          >
            로그인
          </Link>
        </>
      }
    >
      <div className="boss-card p-6">
        {/* 전체 동의 — 굵게, 아래 구분선 */}
        <div className="flex items-center justify-between gap-3 border-b border-boss-border pb-4">
          <CheckLine checked={allChecked} onChange={toggleAll}>
            <span className="font-bold">전체 동의</span>
          </CheckLine>
          <span className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
            필수 {requiredDone} / {requiredTotal}
          </span>
        </div>

        <ul>
          {AGREEMENTS.map((a) => {
            const isOn = !!checked[a.id];
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-boss-border-row py-3 last:border-b-0"
              >
                <CheckLine checked={isOn} onChange={() => toggle(a.id)}>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Tag tone={a.required ? 'info' : 'neutral'}>{a.required ? '필수' : '선택'}</Tag>
                    {a.title}
                  </span>
                </CheckLine>
                {/* 약관 보기는 label 밖에 둔다 — 안에 두면 링크를 눌러도 체크가 같이 바뀐다 */}
                {a.href && (
                  <Link
                    href={a.href}
                    className="shrink-0 text-[12px] font-semibold text-boss-primary underline underline-offset-2"
                  >
                    보기
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <Button
          variant="primary"
          onClick={submit}
          disabled={!requiredChecked}
          className="mt-5 w-full py-3"
        >
          동의하고 계속하기
        </Button>
        {!requiredChecked && (
          <p className="mt-2 text-center text-[12px] text-boss-text-secondary">
            필수 항목 {requiredTotal - requiredDone}개에 더 동의해야 합니다.
          </p>
        )}
      </div>
    </AuthFrame>
  );
}
