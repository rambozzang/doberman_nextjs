'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBossAuth } from '@/hooks/useBossAuth';
import { consultationApi, type CustomerDraft } from '@/lib/consultation';
import { markListDirty, LIST_KEYS } from '@/lib/boss/listCache';
import { AlertBanner, Button, ButtonLink, Field, Panel, TextareaField } from '@/components/boss/ui';
import toast from 'react-hot-toast';
const inputDate = (v?: string) => v && /^\d{12}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(8, 10)}:${v.slice(10, 12)}` : '';
const apiDate = (v: string) => v.replace(/[-T:]/g, '') || undefined;
export default function SourceCustomerForm({sourceRequestId}: {sourceRequestId: number}) {
  const {bossAuth} = useBossAuth();
  return <SourceCustomerFormState key={`${sourceRequestId}:${bossAuth.userId}`} sourceRequestId={sourceRequestId} />;
}

function SourceCustomerFormState({sourceRequestId}: {sourceRequestId: number}) {
  const {
    bossAuth
  } = useBossAuth();
  const expertId = bossAuth.userInfo?.userId;
  const router = useRouter();
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    estimateDate: '',
    workDate: '',
    memo: ''
  });
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const set = (key: keyof typeof form, value: string) => setForm(previous => ({
    ...previous,
    [key]: value
  }));
  const load = useCallback(async () => {
    if (!expertId) return;
    setLoading(true);
    setError('');
    try {
      const result = await consultationApi('APP', sourceRequestId, expertId).draft();
      setDraft(result);
      const amount = result.quoteAmount == null ? '' : `채택 견적금액: ${result.quoteAmount.toLocaleString('ko-KR')}원`;
      setForm({
        name: result.name ?? '',
        phone: result.phone ?? '',
        email: result.email ?? '',
        address1: result.address1 ?? '',
        address2: result.address2 ?? '',
        estimateDate: inputDate(result.estimateDate),
        workDate: '',
        memo: [result.memo, amount].filter(Boolean).join('\n')
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '고객 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [expertId, sourceRequestId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || !expertId || !draft || draft.customerId || loading || error) return;
    if (!form.name.trim()) {
      setSaveError('고객 이름을 입력해 주세요.');
      return;
    }
    lock.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const result = await consultationApi('APP', sourceRequestId, expertId).saveCustomer({
        ...form,
        name: form.name.trim(),
        workDate: apiDate(form.workDate),
        estimateDate: apiDate(form.estimateDate)
      });
      markListDirty(LIST_KEYS.customers);
      toast.success(result.alreadyLinked ? '이미 연결된 고객 정보를 열었습니다.' : '견적과 고객 정보가 연결되었습니다.');
      router.push(`/boss/customers/${result.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장 결과를 확인한 후 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  if (draft?.customerId) return <Panel title="이미 등록된 고객입니다"><p className="mb-4 text-[13px] text-boss-text-secondary">이 견적에 연결된 고객이 있습니다. 기존 고객 정보에서 일정·견적서·세금계산서를 이어서 관리하세요.</p><ButtonLink href={`/boss/customers/${draft.customerId}`} variant="primary">연결된 고객 보기</ButtonLink></Panel>;
  return <form onSubmit={save} className="space-y-4">
    <Panel title="채택 견적으로 고객 등록">
      <p className="mb-4 text-[13px] leading-relaxed text-boss-text-secondary">견적 #{sourceRequestId}의 고객 정보를 불러왔습니다. 내용을 확인해 저장하면 고객 관리와 연결됩니다. 작업 희망일은 확정 일정으로 자동 등록하지 않습니다.</p>
      {loading && <p role="status">고객 정보를 불러오는 중…</p>}
      {error && <AlertBanner tone="bad">{error}<button type="button" className="ml-3 underline" disabled={saving} onClick={() => void load()}>정보 다시 확인</button></AlertBanner>}
      {saveError && <AlertBanner tone="bad">{saveError} 다시 저장해도 같은 견적의 고객이 중복 등록되지 않습니다.</AlertBanner>}
      <fieldset disabled={loading || saving || !draft} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="conversion-name" label="고객 이름" value={form.name} required onChange={e => set('name', e.target.value)} />
        <Field id="conversion-phone" label="휴대폰" value={form.phone} type="tel" onChange={e => set('phone', e.target.value)} />
        <Field id="conversion-email" label="이메일" value={form.email} type="email" onChange={e => set('email', e.target.value)} />
        <Field id="conversion-estimate-date" label="방문 견적 일시" type="datetime-local" value={form.estimateDate} onChange={e => set('estimateDate', e.target.value)} />
        <Field id="conversion-address1" label="주소" value={form.address1} onChange={e => set('address1', e.target.value)} />
        <Field id="conversion-address2" label="상세 주소" value={form.address2} onChange={e => set('address2', e.target.value)} />
        <div><Field id="conversion-work-date" label="확정된 작업 일시 (선택)" type="datetime-local" value={form.workDate} onChange={e => set('workDate', e.target.value)} />{draft?.workDate && <p className="mt-1 text-[12px] text-boss-text-muted">요청한 작업 희망일: {inputDate(draft.workDate).replace('T', ' ') || draft.workDate} · 협의 후 입력하세요.</p>}</div>
        <div className="sm:col-span-2"><TextareaField id="conversion-memo" label="고객 메모 · 견적 내용" rows={6} value={form.memo} onChange={e => set('memo', e.target.value)} /></div>
      </fieldset>
    </Panel>
    <div className="flex flex-wrap justify-end gap-2"><Link href={`/boss/requests/${sourceRequestId}`} className="boss-btn boss-btn-md boss-btn-secondary">견적으로 돌아가기</Link><Button type="submit" variant="primary" disabled={loading || saving || !draft || !!error}>{saving ? '연결 중…' : '확인하고 고객 등록'}</Button></div>
  </form>;
}
