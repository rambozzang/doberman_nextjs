'use client';

// 신고 · 문의 처리 대화상자(공용) — 내용 확인 → (결정) → 사유 · 운영 메모(필수) → 확인 체크 → 요청 1회
//
//   서버는 미처리(OPEN)인 것만 처리한다(expectedStatus: OPEN). 이미 처리됐으면 409 → 목록을 다시 읽어 최신 모습으로 바꾸고 다시 보내지 않는다.
//   응답을 못 받았으면 자동으로 다시 보내지 않는다 — "결과 확인"으로 목록을 다시 읽어 처리됐는지 본다.
//   목록에서 빠졌으면(조건에 안 맞게 바뀜) 처리 완료 목록에서 확인하라고 말하고 잠근다.
//   계정이 바뀌면 응답을 넣지 않고, 보내기 직전에도 다시 대조한다. 실패해도 적은 사유는 그대로 둔다.

import { useRef, useState, type ReactNode } from 'react';
import type { AdminCall } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { REASON_MAX, reasonBlocker } from '@/lib/boss/platformAdmin';
import type { CaseStatus } from '@/types/boss-platform-admin';
import { AlertBanner, Button, CheckLine, RadioOption, TextareaField } from '@/components/boss/ui';
import OpsDialog from '@/components/boss/taxinvoice/OpsDialog';
import { Blockers, Note } from './AdminParts';
import { usePlatformAdmin } from './PlatformAdminShell';

type Message = { tone: 'bad' | 'warn' | 'info'; text: string };

export type CaseDecision<D extends string> = { key: D; label: string; note: string; danger?: boolean };

export default function CaseResolveDialog<T extends { id: number; status: CaseStatus | null }, D extends string>({
  title,
  row: initial,
  details,
  decisions,
  reasonLabel,
  reasonPlaceholder,
  reasonHint,
  confirmText,
  sendLabel,
  submit,
  reload,
  onClose,
  onDone,
}: {
  title: string;
  row: T;
  details: (row: T) => ReactNode;
  /** 고를 결정(신고: 기각 · 글 숨김). 없으면 결정 없이 처리 완료 */
  decisions?: CaseDecision<D>[];
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonHint: string;
  confirmText: (row: T, decision: D | null) => string;
  sendLabel: (decision: D | null) => string;
  submit: (row: T, decision: D | null, reason: string) => Promise<AdminCall<T>>;
  /** 목록을 다시 읽어 같은 건의 최신 모습을 돌려준다. 목록에서 빠졌으면 'gone', 못 읽었으면 null */
  reload: () => Promise<T | 'gone' | null>;
  onClose: () => void;
  /** 처리됨 — confirmed 는 결과를 다시 읽어 확인했다는 뜻 */
  onDone: (row: T, confirmed: boolean) => void;
}) {
  const { scope, onForbidden } = usePlatformAdmin();
  const [row, setRow] = useState(initial);
  const [decision, setDecision] = useState<D | null>(null);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  // 결과를 모르면 "결과 확인" 전까지, 목록에서 빠졌으면 끝까지 보내지 않는다
  const [unknown, setUnknown] = useState(false);
  const [locked, setLocked] = useState(false);
  const inFlight = useRef(false);

  const open = row.status === 'OPEN';
  const picked = decisions?.find((d) => d.key === decision) ?? null;
  const reasonProblem = reasonBlocker(reason, reasonLabel);
  const blockers = [
    ...(row.status == null ? ['처리 상태를 확인하지 못했습니다. 목록을 새로 불러와 주세요.'] : []),
    ...(decisions && !decision ? ['처리 방법을 고르세요.'] : []),
    ...(reasonProblem ? [reasonProblem] : []),
    ...(confirmed ? [] : ['확인 항목에 체크하세요.']),
  ];
  const canSend = open && !busy && !unknown && !locked && blockers.length === 0;

  const refresh = async (why: 'stale' | 'unknown') => {
    const fresh = await reload();
    if (!isCurrentScope(scope)) return;
    setConfirmed(false);
    if (fresh === 'gone') {
      setLocked(true);
      setUnknown(false);
      setMessage({ tone: 'warn', text: '이 건이 지금 목록에서 빠졌습니다. 처리됐을 수 있으니 "처리 완료" 목록에서 확인하세요. 다시 보내지 않았습니다.' });
      return;
    }
    if (!fresh) {
      setMessage({ tone: 'warn', text: '최신 상태를 불러오지 못했습니다. 잠시 뒤 "결과 확인"을 다시 눌러 주세요. 다시 보내지 않았습니다.' });
      setUnknown(true);
      return;
    }
    setRow(fresh);
    setUnknown(false);
    if (fresh.status !== 'OPEN') {
      if (why === 'unknown') {
        onDone(fresh, true);
        return;
      }
      setLocked(true);
      setMessage({ tone: 'warn', text: '이미 처리된 건입니다. 아래 처리 내용을 확인하세요. 다시 보내지 않았습니다.' });
      return;
    }
    setMessage({
      tone: 'warn',
      text:
        why === 'stale'
          ? '그사이 내용이 바뀌었습니다. 최신 내용으로 바꿨으니 다시 확인하고 체크한 뒤 보내 주세요.'
          : '다시 읽어 보니 아직 미처리로 보여 반영이 확인되지 않았습니다. 처음 요청이 처리 중일 수 있으니 잠시 뒤 다시 확인하세요. 다시 보내도 이미 처리된 뒤라면 서버가 거절하므로 두 번 처리되지 않습니다.',
    });
  };

  const send = async () => {
    setAttempted(true);
    if (!canSend || inFlight.current) return;
    if (!isCurrentScope(scope)) {
      setLocked(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const r = await submit(row, decision, reason.trim());
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        onDone(r.data, false);
        return;
      }
      if (r.failure === 'forbidden') {
        onForbidden();
        return;
      }
      if (r.failure === 'stale') {
        await refresh('stale');
        return;
      }
      if (r.failure === 'network' || r.failure === 'unconfirmed') {
        setUnknown(true);
        setMessage({ tone: 'warn', text: '결과를 받지 못했습니다. 처리됐을 수 있어 다시 보내지 않았습니다. "결과 확인"으로 지금 상태를 확인하세요.' });
        return;
      }
      if (r.failure === 'not-found') {
        setLocked(true);
        setMessage({ tone: 'bad', text: `${r.message} 목록을 새로고침해 주세요.` });
        return;
      }
      setMessage({ tone: 'bad', text: r.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const check = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await refresh('unknown');
    } finally {
      setBusy(false);
    }
  };

  const danger = !!picked?.danger;

  return (
    <OpsDialog
      title={title}
      subtitle={open ? '내용을 확인한 뒤 처리합니다. 처리는 한 번만 보내고 사유와 함께 감사 이력에 남습니다.' : '처리된 건입니다. 이 화면에서 결과를 바꾸지 않습니다.'}
      busy={busy}
      danger={danger}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            닫기
          </Button>
          {unknown && (
            <Button variant="secondary" onClick={() => void check()} disabled={busy}>
              결과 확인
            </Button>
          )}
          {open && (
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => void send()} disabled={!canSend} aria-busy={busy || undefined}>
              {busy ? '처리 중…' : sendLabel(decision)}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
        {details(row)}
        {open && (
          <div className="flex flex-col gap-3 border-t border-boss-border pt-4">
            {decisions && (
              <>
                <div role="radiogroup" aria-label="처리 방법" className="grid gap-2 sm:grid-cols-2">
                  {decisions.map((d) => (
                    <RadioOption
                      key={d.key}
                      checked={decision === d.key}
                      onChange={() => {
                        setDecision(d.key);
                        setConfirmed(false);
                      }}
                      label={d.label}
                    />
                  ))}
                </div>
                {picked && <Note tone={picked.danger ? 'warn' : 'info'}>{picked.note}</Note>}
              </>
            )}
            <TextareaField
              id="case-resolve-reason"
              label={`${reasonLabel} (감사 이력에 남음)`}
              required
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              hint={reasonHint}
            />
            <div className="border border-boss-border bg-boss-inset px-4 py-3">
              <CheckLine checked={confirmed} onChange={setConfirmed} disabled={busy}>
                {confirmText(row, decision)}
              </CheckLine>
            </div>
            <Blockers items={blockers} attempted={attempted} busy={busy} />
          </div>
        )}
      </div>
    </OpsDialog>
  );
}
