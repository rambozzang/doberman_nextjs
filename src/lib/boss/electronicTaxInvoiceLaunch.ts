'use client';

// 전자세금계산서 발급 정식 오픈 여부 — 앱과 같은 이름의 공용 값.
//
// 2026-10-18 부터 서버(GET /taxinvoices/electronic/launch)가 정한다. 예전에는 빌드 환경값으로 고정해서
// 팝빌 키를 받아 서버를 열어도 웹을 다시 빌드해야 했다. 이제 서버 설정만 켜면 웹도 열린다.
// 확인 전 · 확인 실패는 닫힘이다. 서버의 발급 준비 검사도 별도로 통과해야 한다.
//
// 점검용 강제: 빌드 때 NEXT_PUBLIC_ELECTRONIC_TAX_INVOICE_OPEN=true|false 를 주면 서버를 묻지 않는다.

import { useEffect, useState } from 'react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';

const forced = process.env.NEXT_PUBLIC_ELECTRONIC_TAX_INVOICE_OPEN;
const isForced = forced === 'true' || forced === 'false';

// 같은 탭 안의 화면들이 한 값을 나눠 쓴다. 30초 안에 다시 열면 묻지 않는다.
const RECHECK_MS = 30_000;
let current = forced === 'true';
let checkedAt = 0;
let inflight: Promise<boolean> | null = null;
const listeners = new Set<(open: boolean) => void>();

/** 서버에 다시 묻는다. 실패하면 마지막 값을 그대로 둔다(처음이면 닫힘). */
export function refreshElectronicTaxInvoiceLaunch(force = false): Promise<boolean> {
  if (isForced) return Promise.resolve(current);
  if (!force && checkedAt > 0 && Date.now() - checkedAt < RECHECK_MS) return Promise.resolve(current);
  inflight ??= bossTaxInvoiceApi
    .launch()
    .then((res) => {
      if (res.ok) {
        checkedAt = Date.now();
        if (current !== res.data.taxOpen) {
          current = res.data.taxOpen;
          listeners.forEach((l) => l(current));
        }
      }
      return current;
    })
    .catch(() => current)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** 정식 오픈 여부. 처음에는 마지막으로 알던 값(없으면 닫힘)을 주고, 서버 확인이 끝나면 다시 그린다. */
export function useElectronicTaxInvoiceOpen(): boolean {
  const [open, setOpen] = useState(current);
  useEffect(() => {
    listeners.add(setOpen);
    setOpen(current);
    void refreshElectronicTaxInvoiceLaunch();
    return () => {
      listeners.delete(setOpen);
    };
  }, []);
  return open;
}
