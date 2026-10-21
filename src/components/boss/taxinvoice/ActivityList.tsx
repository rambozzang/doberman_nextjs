'use client';

// 세금계산서 개인 알림 — 발급 · 국세청 전송 · 취소 결과, 권한 심사 결과, 인증서 만료 같은 "내 일" 알림
//
//   행: 안 읽음 표시(왼쪽 3px 선 + 굵은 제목) · 제목 · 내용 · 시각 · 열기(그 문서 또는 발급 서비스 등록) · 읽음
//   열기를 누르면 읽음으로 표시하고 이동한다(표시 결과를 기다리지 않는다). 같은 알림 읽음 요청은 한 번만 보낸다.
//   RecentActivity — 등록 화면의 최근 5건, TaxActivityEntry — 알림 센터 위의 진입 카드(안 읽은 건수).

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BellRing } from 'lucide-react';
import { bossTaxInvoiceApi } from '@/lib/api/boss/taxinvoice';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { activityHref, activityTitle, activityTone, formatOpsDateTime } from '@/lib/boss/taxInvoiceOps';
import type { TaxInvoiceActivity } from '@/types/boss-taxinvoice';
import { ButtonLink, Panel, Skeleton, Tag } from '@/components/boss/ui';
import { Note } from './RegistrationParts';

/** 읽음 표시 — 알림마다 한 번만 보낸다. 서버가 돌려준 알림(readAt 포함)으로 바꾼다. 계정이 바뀌었으면 보내지도 넣지도 않는다 */
export function useActivityReader(scope: string, onRead: (a: TaxInvoiceActivity) => void) {
  const inFlight = useRef(new Set<number>());
  const [reading, setReading] = useState<ReadonlySet<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const onReadRef = useRef(onRead);
  useEffect(() => {
    onReadRef.current = onRead;
  });

  const markRead = useCallback(async (a: TaxInvoiceActivity) => {
    if (a.readAt || inFlight.current.has(a.id) || !isCurrentScope(scope)) return;
    inFlight.current.add(a.id);
    setReading(new Set(inFlight.current));
    setError(null);
    try {
      const r = await bossTaxInvoiceApi.markActivityRead(a.id);
      if (!isCurrentScope(scope)) return;
      if (r.ok) onReadRef.current({ ...r.data, readAt: r.data.readAt ?? new Date().toISOString() });
      else setError(r.failure === 'not-deployed' ? '읽음 표시는 아직 준비 중입니다.' : `읽음으로 표시하지 못했습니다. ${r.message}`);
    } finally {
      inFlight.current.delete(a.id);
      setReading(new Set(inFlight.current));
    }
  }, [scope]);

  return { reading, error, markRead };
}

const TONE_DOT = {
  ok: 'bg-boss-success',
  warn: 'bg-boss-warning',
  bad: 'bg-boss-error',
  neutral: 'bg-boss-text-ghost',
  info: 'bg-boss-info',
} as const;

export function ActivityRows({
  items,
  reading,
  onRead,
  compact = false,
}: {
  items: TaxInvoiceActivity[];
  reading: ReadonlySet<number>;
  onRead: (a: TaxInvoiceActivity) => void;
  compact?: boolean;
}) {
  return (
    <ul className="flex flex-col">
      {items.map((a) => {
        const unread = !a.readAt;
        const href = activityHref(a);
        const busy = reading.has(a.id);
        return (
          <li
            key={a.id}
            className={`relative border-b border-boss-border-row py-3 pl-4 pr-1 last:border-b-0 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:content-[""] ${
              unread ? 'before:bg-boss-primary' : 'before:bg-transparent'
            }`}
          >
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1 basis-[220px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className={`h-2 w-2 shrink-0 ${TONE_DOT[activityTone(a.eventType)]}`} />
                  <span className={`min-w-0 break-keep text-[13.5px] text-boss-text ${unread ? 'font-semibold' : ''}`}>{activityTitle(a)}</span>
                  {unread && <Tag tone="info">안 읽음</Tag>}
                </div>
                {a.message && (
                  <p className={`mt-1 break-keep text-[12.5px] leading-relaxed text-boss-text-secondary ${compact ? 'line-clamp-2' : ''}`}>{a.message}</p>
                )}
                <p className="mt-1 font-boss-head text-[12px] tabular-nums text-boss-text-secondary">{formatOpsDateTime(a.createdAt) ?? '시각 확인 전'}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Link
                  href={href}
                  onClick={() => {
                    if (unread) onRead(a);
                  }}
                  className="boss-btn boss-btn-sm boss-btn-secondary"
                >
                  {a.invoiceId != null ? '문서 보기' : '등록 보기'}
                </Link>
                {unread && (
                  <button type="button" className="boss-btn boss-btn-sm boss-btn-ghost" disabled={busy} onClick={() => onRead(a)}>
                    {busy ? '표시 중…' : '읽음'}
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** 등록 화면 — 최근 알림 5건과 전체 보기 */
export function RecentActivity({ refreshKey, scope }: { refreshKey: number; scope: string }) {
  const [items, setItems] = useState<TaxInvoiceActivity[] | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [failure, setFailure] = useState<{ notDeployed: boolean; message: string } | null>(null);
  const seq = useRef(0);
  const { reading, error, markRead } = useActivityReader(scope, (a) => {
    setItems((list) => list?.map((x) => (x.id === a.id ? a : x)) ?? list);
    setUnread((n) => (n == null ? n : Math.max(0, n - 1)));
  });

  useEffect(() => {
    const my = ++seq.current;
    void bossTaxInvoiceApi.activity(0, 5).then((r) => {
      if (my !== seq.current || !isCurrentScope(scope)) return;
      if (r.ok) {
        setItems(r.data.items);
        setUnread(r.data.unreadCount);
        setFailure(null);
      } else {
        if (r.failure === 'forbidden') setItems(null);
        setFailure({ notDeployed: r.failure === 'not-deployed', message: r.message });
      }
    });
    return () => {
      seq.current += 1;
    };
  }, [refreshKey, scope]);

  return (
    <Panel
      kicker="내 알림"
      title="발급 · 등록 알림"
      right={
        <ButtonLink href="/boss/tax-invoice/activity" variant="ghost" size="sm">
          전체 보기{unread ? ` · 안 읽음 ${unread}` : ''}
        </ButtonLink>
      }
    >
      {failure && !items ? (
        <Note tone={failure.notDeployed ? 'info' : 'warn'}>
          {failure.notDeployed ? '알림 모아 보기를 준비하고 있습니다.' : `${failure.message} 위의 다시 확인을 눌러 주세요.`}
        </Note>
      ) : items == null ? (
        <Skeleton className="h-24" />
      ) : items.length === 0 ? (
        <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">
          아직 받은 알림이 없습니다. 권한 심사 결과 · 발급 결과 · 인증서 만료 안내가 생기면 여기와 앱에서 알려 드립니다.
        </p>
      ) : (
        <>
          {failure && <Note tone="warn">{failure.message} 아래는 마지막으로 받은 알림입니다.</Note>}
          <ActivityRows items={items} reading={reading} onRead={(a) => void markRead(a)} compact />
        </>
      )}
      {error && <p role="status" className="mt-2 text-[12px] text-boss-pill-warn-fg">{error}</p>}
    </Panel>
  );
}

/** 알림 센터 위 — 세금계산서 · 현금영수증 발급 알림은 따로 모아 본다(안 읽은 건수를 알면 함께). 이름은 목록 단추 · 화면 제목과 같은 '발급 알림' */
export function TaxActivityEntry({ scope }: { scope: string }) {
  const [unread, setUnread] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    void bossTaxInvoiceApi.activity(0, 1, true).then((r) => {
      if (!alive || !isCurrentScope(scope)) return;
      if (r.ok) setUnread(r.data.unreadCount ?? r.data.totalElements);
      // 아직 없는 기능이면 진입을 감춘다 — 들어가도 볼 것이 없다
      else if (r.failure === 'not-deployed') setHidden(true);
    });
    return () => {
      alive = false;
    };
  }, [scope]);

  if (hidden) return null;
  return (
    <section aria-label="발급 알림" className="boss-card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <BellRing aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-boss-primary" />
      <p className="min-w-0 flex-1 basis-[220px] break-keep text-[13px] leading-relaxed text-boss-text">
        <span className="font-semibold">세금계산서 · 현금영수증 발급 알림</span>
        <span className="text-boss-text-secondary"> — 발급 결과 · 권한 심사 · 인증서 만료 안내는 따로 모아 봅니다.</span>
      </p>
      {unread != null && unread > 0 && <Tag tone="info">안 읽음 {unread}</Tag>}
      <ButtonLink href="/boss/tax-invoice/activity" variant="secondary" size="sm">
        발급 알림 보기
      </ButtonLink>
    </section>
  );
}
