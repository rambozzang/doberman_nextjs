'use client';

// 인증 화면(로그인 · 가입 · 찾기 · 약관 · 권한) 공용 조각 — Industry 패턴
//
// 레일이 없는 화면에서도 레일의 워드마크와 같은 조판을 써서
// 로그인 전후 화면이 이어져 보이게 한다(참조 login/page.tsx 의 header).

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** 네이비 워드마크 블록 — 레일 상단과 같은 조판 */
export function AuthWordmark() {
  return (
    <header className="mb-6 flex items-center gap-3 bg-boss-rail px-5 py-4 text-boss-rail-text">
      {/* 로고 — 레일(BossSidebar Wordmark)과 같은 모양 */}
      <Link href="/boss/login" className="shrink-0" aria-label="도배르만 사장님 센터">
        <Image
          src="/logo.png"
          alt=""
          width={40}
          height={40}
          priority
          className="rounded-[8px] ring-1 ring-white/15"
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-[3px]">
        <Link href="/boss/login" className="flex items-center gap-2 !text-boss-rail-text">
          <span className="font-boss-head text-[21px] font-bold leading-none tracking-[0.04em]">도배르만</span>
          <span
            aria-hidden
            className="inline-block -translate-y-[5px] -rotate-[10deg] rounded-[3px] bg-[#F5B301] px-[5px] py-[2px] font-boss-head text-[9px] font-extrabold leading-none tracking-[0.14em] text-[#1B1B1B] shadow-[0_1px_0_rgba(0,0,0,0.35)]"
          >
            BETA
          </span>
        </Link>
        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.09em] text-boss-rail-text/55">
          사장님 전용 · doberman.kr/boss
        </span>
      </div>
    </header>
  );
}

/**
 * 인증 화면 프레임 — 가운데 열(기본 380px) + 워드마크 + 제목 + 설명 + 본문.
 * 가입처럼 긴 폼은 width="wide"(620px).
 */
export function AuthFrame({
  title,
  description,
  width = 'narrow',
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  width?: 'narrow' | 'wide';
  children: ReactNode;
  /** 폼 아래 안내문 */
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className={`w-full ${width === 'wide' ? 'max-w-[620px]' : 'max-w-[380px]'}`}>
        <AuthWordmark />
        <h1 className="font-boss-head text-[26px] font-semibold leading-tight tracking-[-0.015em] text-boss-text">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">{description}</p>
        )}
        <div className="mt-4">{children}</div>
        {footer && (
          <div className="mt-4 text-center text-[12px] leading-relaxed text-boss-text-secondary">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
