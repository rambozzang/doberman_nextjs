'use client';

// 화면 다시 읽기 — 서버의 자동 상태 확인 결과를 화면에 반영한다.
//
//   정해진 간격(POLL_DELAYS_MS)으로 정해진 횟수만 읽고 멈춘다(무한 반복 없음).
//   화면이 가려져 있으면(다른 탭 · 앱 전환) 읽지 않고, 다시 보이면(복귀) 한 번 읽고 처음부터 다시 센다.
//   읽기만 한다 — 서버에 저장된 값을 다시 받을 뿐, 팝빌 조회 · 발급 · 취소 요청은 보내지 않는다.
//   읽는 중이면 겹쳐 부르지 않는다. 대화상자(발급 · 취소 · 심사 등)가 열려 있으면 그 차례는 건너뛴다 — 확인 중인 문서가 바뀌지 않게.

import { useEffect, useRef } from 'react';
import { POLL_DELAYS_MS, pollDelay } from './taxInvoiceOps';

export interface BoundedRefreshOptions {
  /** false 면 아무것도 하지 않는다(결과가 정해진 문서 · 오픈 전 등) */
  enabled: boolean;
  /** 다시 읽기. 실패해도 다음 차례는 그대로 간다 */
  run: () => Promise<unknown> | void;
  delays?: readonly number[];
  /** 화면으로 돌아왔을 때 바로 한 번 읽는다(기본 true). 화면이 따로 복귀 처리를 하면 false */
  refreshOnResume?: boolean;
  /** 복귀로 읽은 뒤 이 시간 안의 복귀는 무시한다 */
  resumeGapMs?: number;
}

const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
const dialogOpen = () => typeof document !== 'undefined' && document.querySelector('[aria-modal="true"]') != null;

export function useBoundedRefresh({ enabled, run, delays = POLL_DELAYS_MS, refreshOnResume = true, resumeGapMs = 5_000 }: BoundedRefreshOptions) {
  const runRef = useRef(run);
  const delaysRef = useRef(delays);
  useEffect(() => {
    runRef.current = run;
    delaysRef.current = delays;
  });

  useEffect(() => {
    if (!enabled) return;
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let busy = false;
    let lastRun = 0;
    let stopped = false;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const tick = async () => {
      if (stopped || busy || dialogOpen()) return;
      busy = true;
      lastRun = Date.now();
      try {
        await runRef.current();
      } catch {
        // 읽기 실패는 화면이 따로 알린다 — 여기서는 다음 차례만 지킨다
      } finally {
        busy = false;
      }
    };

    const schedule = () => {
      clear();
      if (stopped || !visible()) return;
      const wait = pollDelay(index, delaysRef.current);
      if (wait == null) return;
      timer = setTimeout(async () => {
        timer = null;
        index += 1;
        if (!visible()) return;
        await tick();
        schedule();
      }, wait);
    };

    const onResume = async () => {
      if (stopped || !visible()) return;
      index = 0;
      if (refreshOnResume && Date.now() - lastRun >= resumeGapMs) await tick();
      schedule();
    };
    const onVisibility = () => {
      if (visible()) void onResume();
      else clear();
    };
    const onFocus = () => void onResume();

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    return () => {
      stopped = true;
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
    };
  }, [enabled, refreshOnResume, resumeGapMs]);
}
