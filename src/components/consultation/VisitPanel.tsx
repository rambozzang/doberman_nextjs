'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { consultationApi, validateVisitSlots, visitLabel, visitSlotTime, type Consultation, type ConsultationRole } from '@/lib/consultation';

/** 서버에 저장된 약속을 대화와 함께 표시한다. 메시지 전달 여부와 약속 저장 성공은 구분한다. */
interface VisitPanelProps { requestId: number; expertId: string; role: ConsultationRole }

export default function VisitPanel(props: VisitPanelProps) {
  return <VisitPanelState key={`${props.role}:${props.requestId}:${props.expertId}`} {...props} />;
}

function VisitPanelState({
  requestId,
  expertId,
  role
}: {
  requestId: number;
  expertId: string;
  role: ConsultationRole;
}) {
  const api = useMemo(() => consultationApi(role, requestId, expertId), [role, requestId, expertId]);
  const [state, setState] = useState<Consultation | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [slots, setSlots] = useState(['']);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState('');
  const [canceling, setCanceling] = useState(false);
  const alive = useRef(true);
  const lock = useRef(false);
  const readVersion = useRef(0);
  const contextVersion = useRef(0);
  const invalidateContext = useCallback(() => {
    readVersion.current++;
    contextVersion.current++;
  }, []);
  const boss = role === 'APP';
  const active = state?.visits.find(v => v.status !== 'CANCELED');
  const button = boss ? 'boss-btn boss-btn-sm boss-btn-secondary' : 'min-h-10 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-50';
  const primary = boss ? 'boss-btn boss-btn-sm boss-btn-primary' : `${button} bg-blue-600 border-blue-500 text-white`;
  const input = boss ? 'boss-input' : 'w-full min-h-10 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white';
  const load = useCallback(async () => {
    const version = ++readVersion.current;
    try {
      const data = await api.get();
      if (alive.current && version === readVersion.current) {
        setState(data);
        setError('');
      }
    } catch (e) {
      if (alive.current && version === readVersion.current) setError(e instanceof Error ? e.message : '약속을 불러오지 못했습니다.');
    }
  }, [api]);
  useEffect(() => {
    alive.current = true;
    void load();
    const refresh = () => {
      if (document.visibilityState === 'visible' && !lock.current) void load();
    };
    const timer = setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => {
      alive.current = false;
      invalidateContext();
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [load, invalidateContext]);
  async function mutate(action: () => Promise<unknown>) {
    if (lock.current) return;
    const context = contextVersion.current;
    readVersion.current++; // 저장 전에 시작된 GET이 저장 결과를 덮지 못하게 한다.
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      if (!alive.current || context !== contextVersion.current) return;
      await load();
      if (alive.current && context === contextVersion.current) {
        setSelected('');
        setCanceling(false);
        setSlots(['']);
        setNote('');
      }
    } catch (e) {
      if (alive.current && context === contextVersion.current) {
        // 응답이 끊겼어도 서버에는 저장됐을 수 있으므로 실제 상태를 다시 읽는다.
        await load();
        if (alive.current && context === contextVersion.current) setError(`${e instanceof Error ? e.message : '연결을 확인해 주세요.'} 아래 약속 상태를 확인한 뒤 다시 시도해 주세요.`);
      }
    } finally {
      if (alive.current && context === contextVersion.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  function propose() {
    const values = slots.filter(Boolean);
    const invalid = validateVisitSlots(values);
    if (invalid) {
      setError(invalid);
      return;
    }
    void mutate(() => api.propose(values, note.trim() || undefined));
  }
  return <section aria-label="방문 약속" className={boss ? 'flex-none border-b border-boss-border bg-boss-surface px-[18px] py-3 text-[13px] text-boss-text' : 'flex-none border-b border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100'}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="min-h-9 text-left font-semibold">
        방문 약속 · {active?.status === 'CONFIRMED' ? visitLabel(active.selectedSlot ?? active.slots[0]) : active ? boss ? '고객의 시간 선택 대기' : '방문 시간을 선택해 주세요' : '함께 시간 정하기'} {expanded ? '⌃' : '⌄'}
      </button>
      {boss && <Link className={button} href={`/boss/requests/${requestId}`}>견적·고객 정보</Link>}
    </div>
    {error && <div role="alert" className="mt-2 flex flex-wrap items-center gap-2"><span>{error}</span><button type="button" className={button} disabled={busy} onClick={() => void load()}>새로고침</button></div>}
    {expanded && <div className="mt-3 max-h-[35dvh] space-y-3 overflow-y-auto">
      {!state && !error && <p role="status">방문 약속을 불러오는 중…</p>}
      {active ? <>
        {active.note && <p className="whitespace-pre-wrap break-words">{active.note}</p>}
        {active.status === 'PROPOSED' ? <>
          <p>{boss ? '고객이 시간을 선택하면 사장님 일정에도 등록됩니다.' : '가능한 시간을 선택하고 방문을 확정해 주세요.'} (한국 시간)</p>
          <div className="flex flex-wrap gap-2">{active.slots.map(slot => <button type="button" key={slot} className={selected === slot ? primary : button} disabled={busy || boss || visitSlotTime(slot) <= Date.now()} aria-pressed={selected === slot} onClick={() => setSelected(slot)}>{visitLabel(slot)}{visitSlotTime(slot) <= Date.now() ? ' · 지난 시간' : ''}</button>)}</div>
          {!boss && <button type="button" className={primary} disabled={!selected || busy || !active.slots.includes(selected) || visitSlotTime(selected) <= Date.now()} onClick={() => void mutate(() => api.confirm(active.id, selected))}>{busy ? '처리 중…' : '선택한 시간으로 방문 확정'}</button>}
        </> : <p>방문이 확정되었습니다. 사장님 일정에 함께 등록되어 있어요.</p>}
        {canceling ? <div className="flex flex-wrap items-center gap-2"><span>이 방문 약속을 취소할까요?</span><button type="button" className={primary} disabled={busy} onClick={() => void mutate(() => api.cancel(active.id))}>약속 취소하기</button><button type="button" className={button} disabled={busy} onClick={() => setCanceling(false)}>유지하기</button></div> : <button type="button" className={button} disabled={busy} onClick={() => setCanceling(true)}>약속 취소</button>}
      </> : state && (boss ? <>
        <p>1년 안의 방문 가능한 시간을 최대 3개 제안하세요. 고객이 선택하면 약속이 확정됩니다. (한국 시간)</p>
        {slots.map((slot, i) => <label key={i} className="block">가능한 시간 {i + 1}<input type="datetime-local" value={slot} className={input} disabled={busy} onChange={e => setSlots(previous => previous.map((v, j) => j === i ? e.target.value : v))} /></label>)}
        <div className="flex gap-2">{slots.length < 3 && <button type="button" disabled={busy} className={button} onClick={() => setSlots([...slots, ''])}>시간 추가</button>}{slots.length > 1 && <button type="button" disabled={busy} className={button} onClick={() => setSlots(slots.slice(0, -1))}>마지막 시간 삭제</button>}</div>
        <label className="block">방문 안내 (선택)<textarea maxLength={500} className={input} value={note} disabled={busy} onChange={e => setNote(e.target.value)} /></label>
        <button type="button" className={primary} disabled={busy} onClick={propose}>{busy ? '저장 중…' : '가능한 시간 제안'}</button>
      </> : <p>방문을 원하시면 아래 대화로 말씀해 주세요. 사장님이 가능한 시간을 제안하면 여기서 선택할 수 있어요.</p>)}
      {state?.visits.filter(v => v.status === 'CANCELED').slice(0, 2).map(visit => <p key={visit.id} className="opacity-70">취소된 방문 · {visitLabel(visit.selectedSlot ?? visit.slots[0])}</p>)}
    </div>}
  </section>;
}
