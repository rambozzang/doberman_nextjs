'use client';

// 우편번호 찾기 — 앱(kpostal)과 같은 카카오(다음) 우편번호 서비스를 웹에서 띄운다
//
// 사장님이 주소를 손으로 치지 않게 한다: "주소 찾기" → 우편번호 창에서 고르면
// 우편번호 · 도로명 주소가 채워지고, 상세 주소 칸으로 커서가 간다.
//
// 스크립트(https://t1.daumcdn.net/…/postcode.v2.js)는 키가 필요 없고, 처음 누를 때만 내려받는다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Field } from '@/components/boss/ui';

const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/** 우편번호 창이 돌려주는 값 중 쓰는 것만 */
type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J';
  bname?: string;
  buildingName?: string;
  apartment?: 'Y' | 'N';
};

type DaumPostcode = {
  embed: (el: HTMLElement, opts?: { autoClose?: boolean }) => void;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: DaumPostcodeData) => void;
        width?: string;
        height?: string;
      }) => DaumPostcode;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('postcode script failed'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export type PickedAddress = {
  /** 우편번호 5자리 */
  zonecode: string;
  /** 도로명 주소 + (동, 건물명) — 앱 kpostal 과 같은 구성 */
  address: string;
};

/** 다음 우편번호 서비스 안내 예제와 같은 규칙으로 한 줄 주소를 만든다 */
function composeAddress(d: DaumPostcodeData): string {
  const base = d.userSelectedType === 'R' ? d.roadAddress : d.jibunAddress;
  if (d.userSelectedType !== 'R') return base;
  const extra: string[] = [];
  if (d.bname && /[동로가]$/.test(d.bname)) extra.push(d.bname);
  if (d.buildingName) extra.push(d.buildingName);
  return extra.length ? `${base} (${extra.join(', ')})` : base;
}

/** 우편번호 창 — 화면 위에 띄워 고르게 한다 */
export function PostcodeDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (picked: PickedAddress) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    loadScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.daum?.Postcode) return;
        hostRef.current.innerHTML = '';
        new window.daum.Postcode({
          width: '100%',
          height: '100%',
          oncomplete: (data) => {
            onSelect({ zonecode: data.zonecode, address: composeAddress(data) });
            onClose();
          },
        }).embed(hostRef.current, { autoClose: false });
      })
      .catch(() => {
        if (!cancelled) setError('우편번호 창을 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, onClose, onSelect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="우편번호 찾기"
        className="flex h-[88dvh] w-full max-w-[560px] flex-col border border-boss-border bg-boss-surface sm:h-[600px]"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-4 py-3">
          <div>
            <p className="text-[15px] font-semibold text-boss-text">우편번호 찾기</p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">도로명 · 지번 · 건물명으로 찾아 고르세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 bg-white">
          <div ref={hostRef} className="h-full w-full" />
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white px-6 text-center text-[13px] text-boss-error">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * 우편번호 칸 + "주소 찾기" 버튼.
 * 골라진 주소는 onSelect 로 넘기고, detailInputId 가 있으면 상세 주소 칸에 커서를 둔다.
 */
export default function PostcodeField({
  id,
  label = '우편번호',
  value,
  onChange,
  onSelect,
  detailInputId,
  className = '',
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (picked: PickedAddress) => void;
  detailInputId?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const select = useCallback(
    (picked: PickedAddress) => {
      onSelect(picked);
      if (detailInputId) {
        // 창이 닫힌 뒤 상세 주소 칸으로
        setTimeout(() => document.getElementById(detailInputId)?.focus(), 50);
      }
    },
    [onSelect, detailInputId]
  );

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <Field
          id={id}
          label={label}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
          placeholder="12345"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="secondary" icon={Search} onClick={() => setOpen(true)} className="shrink-0">
          주소 찾기
        </Button>
      </div>
      <PostcodeDialog open={open} onClose={close} onSelect={select} />
    </div>
  );
}
