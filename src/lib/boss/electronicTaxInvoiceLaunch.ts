'use client';

// 전자 발급 정식 오픈 여부 — 앱과 같은 이름의 공용 값.
//
// 2026-10-18 부터 서버(GET /taxinvoices/electronic/launch)가 정한다. 예전에는 빌드 환경값으로 고정해서
// 팝빌 키를 받아 서버를 열어도 웹을 다시 빌드해야 했다. 이제 서버 설정만 켜면 웹도 열린다.
// 확인 전 · 확인 실패는 닫힘이다. 서버의 발급 준비 검사도 별도로 통과해야 한다.
//
// 세금계산서와 현금영수증은 따로 연다(2026-10-21). 현금영수증은 정액제라 나중에 열기로 해서,
// 문서 종류를 가리지 않고 taxOpen 만 보면 "현금영수증도 지금 쓸 수 있다"고 잘못 안내하게 된다.
//
// 점검용 강제: 빌드 때 NEXT_PUBLIC_ELECTRONIC_TAX_INVOICE_OPEN=true|false 를 주면 서버를 묻지 않는다.

import { useEffect, useState } from 'react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';

export interface ElectronicLaunchState {
  /** 전자세금계산서 발급이 열렸는지 */
  taxOpen: boolean;
  /** 현금영수증 발급이 열렸는지 */
  cashOpen: boolean;
}

const forced = process.env.NEXT_PUBLIC_ELECTRONIC_TAX_INVOICE_OPEN;
const isForced = forced === 'true' || forced === 'false';

// 같은 탭 안의 화면들이 한 값을 나눠 쓴다. 30초 안에 다시 열면 묻지 않는다.
const RECHECK_MS = 30_000;
// 점검용 강제는 두 종류를 함께 연다(서버를 묻지 않으므로 종류를 구분할 근거가 없다).
let current: ElectronicLaunchState = { taxOpen: forced === 'true', cashOpen: forced === 'true' };
let checkedAt = 0;
let inflight: Promise<ElectronicLaunchState> | null = null;
const listeners = new Set<(v: ElectronicLaunchState) => void>();

/** 서버에 다시 묻는다. 실패하면 마지막 값을 그대로 둔다(처음이면 닫힘). */
export function refreshElectronicTaxInvoiceLaunch(force = false): Promise<ElectronicLaunchState> {
  if (isForced) return Promise.resolve(current);
  if (!force && checkedAt > 0 && Date.now() - checkedAt < RECHECK_MS) return Promise.resolve(current);
  inflight ??= bossTaxInvoiceApi
    .launch()
    .then((res) => {
      if (res.ok) {
        checkedAt = Date.now();
        const next = { taxOpen: res.data.taxOpen, cashOpen: res.data.cashOpen };
        if (current.taxOpen !== next.taxOpen || current.cashOpen !== next.cashOpen) {
          current = next;
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

/** 문서 종류별 오픈 여부. 처음에는 마지막으로 알던 값(없으면 닫힘)을 주고, 서버 확인이 끝나면 다시 그린다. */
export function useElectronicTaxInvoiceLaunch(): ElectronicLaunchState {
  const [launch, setLaunch] = useState(current);
  useEffect(() => {
    listeners.add(setLaunch);
    setLaunch(current);
    void refreshElectronicTaxInvoiceLaunch();
    return () => {
      listeners.delete(setLaunch);
    };
  }, []);
  return launch;
}

/** 전자세금계산서 오픈 여부 — 문서 종류를 가리지 않는 안내·화면에서 쓴다. */
export function useElectronicTaxInvoiceOpen(): boolean {
  return useElectronicTaxInvoiceLaunch().taxOpen;
}

/** 이 문서를 지금 전자로 발급할 수 있는지 — 현금영수증은 따로 연다. */
export function useIssuanceOpenFor(docType: string | null | undefined): boolean {
  const launch = useElectronicTaxInvoiceLaunch();
  return docType === 'CASH' ? launch.cashOpen : launch.taxOpen;
}
