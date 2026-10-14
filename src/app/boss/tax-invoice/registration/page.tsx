'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, ButtonLink, Panel, Skeleton, Tag } from '@/components/boss/ui';
import PopbillLinkForm from '@/components/boss/taxinvoice/PopbillLinkForm';
import SupplierRegistrationForm, { type SubmitFeedback } from '@/components/boss/taxinvoice/SupplierRegistrationForm';
import { Note, RegistrationProgress, SupplierSummary } from '@/components/boss/taxinvoice/RegistrationParts';
import SupportScope from '@/components/boss/taxinvoice/SupportScope';
import { bossTaxInvoiceApi, type RegistrationCall } from '@/lib/api/boss/taxinvoice';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { EMPTY_SUPPLIER, daysUntil, normalizeSupplier, registrationSteps, supplierFormValue, supplierFromCompany } from '@/lib/boss/taxInvoiceRegistration';
import { REGISTRATION_STAGE_LABEL, type ElectronicRegistrationStatus, type TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

export default function TaxInvoiceRegistrationPage() {
  const [status, setStatus] = useState<ElectronicRegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'submit' | 'link' | 'certificate' | null>(null);
  const [supplier, setSupplier] = useState<TaxInvoiceSupplier>({ ...EMPTY_SUPPLIER });
  const [editing, setEditing] = useState(false);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  // 다시 확인할 때마다 문서별 준비 상태(현금영수증 설정)도 다시 읽는다
  const [checkedAt, setCheckedAt] = useState(0);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const dirty = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setNotice(null);
    try {
      const result = await bossTaxInvoiceApi.registrationStatus();
      if (!mounted.current) return;
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setStatus(result.status);
      setLoadError(null);
      setNeedsRefresh(false);
      setCheckedAt((n) => n + 1);
      if (!dirty.current && ['NOT_REGISTERED', 'PENDING_VERIFICATION'].includes(result.status.stage)) {
        let seed = result.status.supplier;
        if (!seed) {
          const companyId = BossAuthManager.getUserInfo()?.companyId;
          if (companyId) {
            const company = await bossCompanyApi.get(companyId);
            if (company.success && company.data) seed = supplierFromCompany(company.data);
          }
        }
        if (mounted.current && !dirty.current && seed) {
          setSupplier(supplierFormValue(seed));
          setPrefillNote(result.status.submittedAt ? '신청한 정보를 불러왔습니다.' : '회사 정보로 채웠습니다. 사업자등록증과 같은지 확인해 주세요.');
        }
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => {
      mounted.current = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const finishRequest = (result: RegistrationCall, action: '신청' | '연동') => {
    if (result.ok) {
      setStatus(result.status);
      setLoadError(null);
      setFeedback(null);
      setNeedsRefresh(false);
      setEditing(false);
      dirty.current = false;
      if (result.status.supplier) setSupplier(supplierFormValue(result.status.supplier));
      setNotice(action === '신청' ? '신청을 저장했습니다. 운영팀의 사업자 권한 확인 후 서비스 연동을 진행할 수 있습니다.' : '연동 요청 후 현재 상태를 확인했습니다. 다음 단계를 진행해 주세요.');
    } else {
      const uncertain = action === '연동' || result.failure === 'network' || result.failure === 'unconfirmed';
      setNeedsRefresh(uncertain);
      setFeedback({ tone: uncertain ? 'warn' : 'bad', text: uncertain ? `${result.message} ${action} 결과를 확인하지 못했습니다. 다시 확인을 눌러 현재 상태를 조회한 뒤 진행해 주세요.` : `${result.message} 신청 완료로 처리되지 않았습니다. 입력 내용은 유지했습니다.` });
    }
  };

  const submit = async (value: TaxInvoiceSupplier) => {
    if (inFlight.current || needsRefresh || loadError || !status || !['NOT_REGISTERED', 'PENDING_VERIFICATION'].includes(status.stage)) return;
    inFlight.current = true;
    setBusy('submit');
    setNotice(null);
    setFeedback(null);
    try {
      const result = await bossTaxInvoiceApi.submitRegistration({ supplier: normalizeSupplier(value), consent: true });
      if (mounted.current) finishRequest(result, '신청');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  };

  const link = async (memberId: string, password: string) => {
    if (inFlight.current || needsRefresh || loadError || status?.stage !== 'VERIFIED' || !status.serviceConfigured || status.memberLinked !== false) return;
    inFlight.current = true;
    setBusy('link');
    setNotice(null);
    setFeedback(null);
    try {
      const result = await bossTaxInvoiceApi.linkMember({ memberId, password, consent: true });
      if (mounted.current) finishRequest(result, '연동');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  };

  const openCertificate = async () => {
    if (inFlight.current || loadError || !status?.serviceConfigured || status.memberLinked !== true) return;
    inFlight.current = true;
    setBusy('certificate');
    setFeedback(null);
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    try {
      const result = await bossTaxInvoiceApi.certificateUrl();
      const raw = result.success && result.data?.url ? result.data.url : null;
      const url = raw ? new URL(raw) : null;
      if (!url || url.protocol !== 'https:') throw new Error('certificate-url');
      if (popup) popup.location.href = url.href;
      if (mounted.current) {
        setCertificateUrl(url.href);
        setNotice(popup ? '팝빌 등록 페이지를 열었습니다. 등록을 마치고 돌아오면 상태를 다시 확인합니다.' : '아래 인증서 등록 페이지 열기 링크를 눌러 진행해 주세요. 등록 후 다시 확인을 눌러 주세요.');
      }
    } catch {
      popup?.close();
      if (mounted.current) setFeedback({ tone: 'bad', text: '인증서 등록 주소를 받지 못했습니다. 다시 확인 후 시도해 주세요.' });
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  };

  const disabled = loading || busy !== null || needsRefresh || loadError !== null;
  const pending = status?.stage === 'PENDING_VERIFICATION';
  const canEdit = status?.stage === 'NOT_REGISTERED' || (pending && editing);
  const ready = status?.stage === 'READY' && status.memberLinked === true && status.serviceConfigured;
  const expiryDays = daysUntil(status?.certificateExpiresAt);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">계산서 목록</ButtonLink>
          <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading || busy !== null} onClick={() => void refresh()}>{loading ? '확인 중…' : '다시 확인'}</Button>
        </div>
      </div>
      {!ELECTRONIC_TAX_INVOICE_OPEN && <Note>전자세금계산서 · 현금영수증 발급은 곧 정식 오픈합니다. 등록 준비가 끝나도 실제 발급은 정식 오픈 후 이용할 수 있습니다.</Note>}
      {loadError && <Note tone="warn" live>{loadError} {status ? '아래는 마지막으로 확인한 상태입니다. 다시 확인 후 진행해 주세요.' : '현재 신청·연동은 진행할 수 없습니다. 다시 확인해 주세요.'}</Note>}
      {notice && <Note tone="ok" live>{notice}</Note>}
      {loading && !status ? <Skeleton className="h-64" /> : !status ? (
        <Panel title="등록 상태 확인 필요"><p className="text-[13px] leading-relaxed text-boss-text-secondary">회사 정보는 내정보의 회사 정보에서 먼저 등록할 수 있습니다. 발급 서비스의 최신 상태가 확인되면 신청서를 표시합니다.</p><div className="mt-4"><ButtonLink href="/boss/me/company" variant="secondary">회사 정보 확인</ButtonLink></div></Panel>
      ) : (
        <>
          <RegistrationProgress steps={registrationSteps(status)} />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-5">
              {status.stage === 'NEED_COMPANY' ? (
                <Panel title="회사 정보를 먼저 등록해 주세요"><p className="mb-4 text-[13px] leading-relaxed text-boss-text-secondary">발급 서비스를 신청하려면 내정보에서 회사 정보를 먼저 등록해야 합니다.</p><ButtonLink href="/boss/me/company">회사 정보 등록</ButtonLink></Panel>
              ) : canEdit ? (
                <SupplierRegistrationForm value={supplier} onChange={(v) => { dirty.current = true; setSupplier(v); }} mode={pending ? 'edit' : 'new'} prefillNote={prefillNote} serviceConfigured={status.serviceConfigured} submitting={disabled} feedback={feedback} onSubmit={(v) => void submit(v)} onCancel={pending ? () => setEditing(false) : undefined} />
              ) : (
                <Panel title={pending ? '사업자 권한 확인 중' : '확인된 사업자 정보'}>
                  {status.supplier && <SupplierSummary supplier={status.supplier} />}
                  {status.submittedAt && <p className="mt-3 text-[12px] text-boss-text-muted">신청 시각: {status.submittedAt.replace('T', ' ').slice(0, 16)}</p>}
                  {pending ? <div className="mt-4 flex flex-col gap-3"><Note>운영팀이 사업자 발급 권한을 확인하고 있습니다. 확인이 끝나면 서비스 연동 단계가 열립니다.</Note><Button variant="secondary" disabled={disabled} onClick={() => { setEditing(true); setFeedback(null); }}>신청 내용 수정</Button></div> : <p className="mt-3 text-[12px] leading-relaxed text-boss-text-muted">권한 확인된 정보는 여기서 변경할 수 없습니다. 변경이 필요하면 운영팀에 요청해 주세요.</p>}
                </Panel>
              )}
              {status.stage === 'VERIFIED' && status.serviceConfigured && status.memberLinked === false && !needsRefresh && !loadError && (
                <PopbillLinkForm supplier={status.supplier} submitting={loading || busy !== null} feedback={feedback} onSubmit={(id, pw) => void link(id, pw)} />
              )}
              {(status.stage === 'NEEDS_CERTIFICATE' || status.stage === 'READY') && (
                <Panel title="공동인증서 등록">
                  <p className="mb-3 text-[13px] leading-relaxed text-boss-text-secondary">사업자 공동인증서는 팝빌 등록 페이지에서 등록합니다. 인증서 파일과 인증서 비밀번호는 도배르만에 저장하지 않습니다.</p>
                  {status.certificateExpiresAt && <p className="mb-3 text-[13px] text-boss-text">인증서 만료일: <b>{status.certificateExpiresAt}</b>{expiryDays !== null && expiryDays < 30 ? ' · 갱신 날짜를 확인해 주세요.' : ''}</p>}
                  <Button disabled={disabled || status.memberLinked !== true || !status.serviceConfigured} onClick={() => void openCertificate()}>{busy === 'certificate' ? '등록 페이지 준비 중…' : ready ? '공동인증서 갱신·관리' : '공동인증서 등록'}</Button>
                  {certificateUrl && <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-[13px] font-semibold text-boss-primary underline">인증서 등록 페이지 열기 (새 창)</a>}
                </Panel>
              )}
              {feedback && (!canEdit && !(status.stage === 'VERIFIED' && status.memberLinked === false && !needsRefresh && !loadError)) && <Note tone={feedback.tone} live>{feedback.text}</Note>}
            </div>
            <div className="flex flex-col gap-5">
            <Panel title="현재 등록 상태">
              <div className="mb-3 flex flex-wrap gap-2"><Tag tone={ready ? 'ok' : 'warn'}>{REGISTRATION_STAGE_LABEL[status.stage]}</Tag>{status.isTest && <Tag tone="warn">테스트 환경</Tag>}</div>
              {ready ? <Note tone="ok">{ELECTRONIC_TAX_INVOICE_OPEN ? '발급 준비가 완료되었습니다.' : '등록 준비 완료 · 발급은 정식 오픈 후 이용'}</Note> : <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">{status.reason || '다음 등록 단계를 진행해 주세요.'}</p>}
              {!status.serviceConfigured && <p className="mt-3 text-[12px] leading-relaxed text-boss-text-muted">발급 서비스의 연동 설정을 준비 중입니다. 권한 확인 신청은 저장할 수 있습니다.</p>}
              {status.stage === 'VERIFIED' && status.memberLinked === null && status.serviceConfigured && <Note tone="warn">팝빌 연동 여부를 확인하지 못했습니다. 다시 확인 후 진행해 주세요.</Note>}
            </Panel>
            <SupportScope stage={status.stage} refreshKey={checkedAt} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
