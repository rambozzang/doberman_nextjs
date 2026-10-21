'use client';

// 발급 서비스 등록 · 운영 준비
//
// 왼쪽: 진행 단계(회사 → 권한 신청 · 심사 → 팝빌 연동 → 공동인증서 → 세금계산서 발급 준비) · 지금 단계의 할 일 · 최근 알림
// 오른쪽: 현재 등록 상태 · 운영 상태(인증서 만료 · 발급 비용 정책 · 자동 상태 확인 · 안내) · 문서별 준비 상태
// 반려되면 사유를 보이고 정보를 고쳐 다시 신청하게 한다(다시 신청하면 서버가 심사 대기로 되돌린다).
// 심사 대기 중에는 보이는 동안 정해진 횟수만 다시 읽어 결과를 반영한다(입력 · 요청 중에는 멈춘다).
// 계정이 바뀌면(공용 PC) 화면을 새로 그리고, 앞 계정 요청의 응답은 넣지 않는다.
// 시작 전 준비 안내는 화면을 옮기면 작성 중인 신청서가 사라지므로 같은 본문을 대화상자로 띄운다(조회 성패 · 로딩과 상관없이 열린다).
// 정식 오픈 안내('곧 열립니다')는 맨 위 띠 한 곳에서만 한다 — 세금계산서 · 현금영수증을 따로 보고(taxOpen · cashOpen),
// 한쪽만 열렸으면 닫힌 쪽만 "곧 열립니다"로 남긴다(2026-10-21). 진행 단계 · 인증서는 세금계산서 기준이다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { Button, ButtonLink, Panel, Skeleton, Tag } from '@/components/boss/ui';
import { RecentActivity } from '@/components/boss/taxinvoice/ActivityList';
import OperationsPanel from '@/components/boss/taxinvoice/OperationsPanel';
import OpsDialog from '@/components/boss/taxinvoice/OpsDialog';
import PopbillLinkForm from '@/components/boss/taxinvoice/PopbillLinkForm';
import PreparationGuide from '@/components/boss/taxinvoice/PreparationGuide';
import SupplierRegistrationForm, { type SubmitFeedback } from '@/components/boss/taxinvoice/SupplierRegistrationForm';
import { Note, RegistrationProgress, SupplierSummary } from '@/components/boss/taxinvoice/RegistrationParts';
import SupportScope from '@/components/boss/taxinvoice/SupportScope';
import { bossTaxInvoiceApi, type RegistrationCall } from '@/lib/api/boss/taxinvoice';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { useElectronicTaxInvoiceLaunch } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { formatOpsDateTime } from '@/lib/boss/taxInvoiceOps';
import { TAX_SUBSCRIPTION_CASH_ONLY, TAX_SUBSCRIPTION_PRICE } from '@/lib/boss/taxInvoiceSubscription';
import { EMPTY_SUPPLIER, daysUntil, effectiveStage, normalizeSupplier, registrationSteps, supplierFormValue, supplierFromCompany } from '@/lib/boss/taxInvoiceRegistration';
import { useBoundedRefresh } from '@/lib/boss/useBoundedRefresh';
import { REGISTRATION_STAGE_LABEL, type ElectronicRegistrationStatus, type RegistrationStage, type TaxInvoiceSupplier } from '@/types/boss-taxinvoice';

/** 신청서를 쓰거나 고칠 수 있는 단계 */
const EDITABLE_STAGES: RegistrationStage[] = ['NOT_REGISTERED', 'PENDING_VERIFICATION', 'REJECTED'];

export default function TaxInvoiceRegistrationPage() {
  const scope = useBossScope();
  // 로그인 확인 전 · 로그아웃 · 계정 바뀌는 중에는 사업자 정보를 그리지 않는다
  if (!scope) return <Skeleton className="h-64" />;
  return <RegistrationScreen key={scope} scope={scope} />;
}

/** 맨 위 띠 — 닫힌 문서 종류만 말한다. 둘 다 열렸으면 띄우지 않는다 */
function launchBanner(taxOpen: boolean, cashOpen: boolean): string | null {
  if (taxOpen && cashOpen) return null;
  if (!taxOpen && !cashOpen) {
    return '전자세금계산서 · 현금영수증 발급은 곧 정식 오픈합니다. 등록은 미리 해 둘 수 있고, 실제 발급은 오픈 후 열립니다.';
  }
  return taxOpen
    ? '현금영수증 발급은 곧 열립니다. 전자세금계산서는 등록을 마치면 바로 발급할 수 있어요.'
    : '전자세금계산서 발급은 곧 열립니다. 현금영수증은 등록을 마치면 바로 발급할 수 있어요.';
}

function RegistrationScreen({ scope }: { scope: string }) {
  // 정식 오픈 여부는 서버가 정한다(2026-10-18). 현금영수증은 따로 연다(2026-10-21) — 진행 단계 · 준비 완료는 세금계산서 기준
  const { taxOpen, cashOpen } = useElectronicTaxInvoiceLaunch();
  const issuanceOpen = taxOpen;
  const banner = launchBanner(taxOpen, cashOpen);
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
  const [guideOpen, setGuideOpen] = useState(false);
  const closeGuide = useCallback(() => setGuideOpen(false), []);
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
      if (!mounted.current || !isCurrentScope(scope)) return;
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setStatus(result.status);
      setLoadError(null);
      setNeedsRefresh(false);
      setCheckedAt((n) => n + 1);
      const stage = effectiveStage(result.status);
      if (!dirty.current && EDITABLE_STAGES.includes(stage)) {
        let seed = result.status.supplier;
        if (!seed) {
          const companyId = BossAuthManager.getUserInfo()?.companyId;
          if (companyId) {
            const company = await bossCompanyApi.get(companyId);
            if (company.success && company.data) seed = supplierFromCompany(company.data);
          }
        }
        if (mounted.current && isCurrentScope(scope) && !dirty.current && seed) {
          setSupplier(supplierFormValue(seed));
          setPrefillNote(
            stage === 'REJECTED'
              ? '반려된 신청 내용을 불러왔습니다. 반려 사유를 확인해 고친 뒤 다시 신청해 주세요.'
              : result.status.submittedAt
                ? '신청한 정보를 불러왔습니다.'
                : '회사 정보로 채웠습니다. 사업자등록증과 같은지 확인해 주세요.',
          );
        }
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [scope]);

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
    // 그사이 계정이 바뀌었으면 앞 계정의 결과를 넣지 않는다(화면은 곧 새로 그려진다)
    if (!isCurrentScope(scope)) return;
    if (result.ok) {
      setStatus(result.status);
      setLoadError(null);
      setFeedback(null);
      setNeedsRefresh(false);
      setEditing(false);
      dirty.current = false;
      if (result.status.supplier) setSupplier(supplierFormValue(result.status.supplier));
      setNotice(action === '신청' ? '신청을 저장했습니다. 운영팀의 사업자 권한 확인 후 서비스 연동을 진행할 수 있습니다. 결과는 알림으로도 알려 드립니다.' : '연동 요청 후 현재 상태를 확인했습니다. 다음 단계를 진행해 주세요.');
    } else {
      const uncertain = action === '연동' || result.failure === 'network' || result.failure === 'unconfirmed';
      setNeedsRefresh(uncertain);
      setFeedback({ tone: uncertain ? 'warn' : 'bad', text: uncertain ? `${result.message} ${action} 결과를 확인하지 못했습니다. 다시 확인을 눌러 현재 상태를 조회한 뒤 진행해 주세요.` : `${result.message} 신청 완료로 처리되지 않았습니다. 입력 내용은 유지했습니다.` });
    }
  };

  const submit = async (value: TaxInvoiceSupplier) => {
    if (inFlight.current || needsRefresh || loadError || !status || !EDITABLE_STAGES.includes(effectiveStage(status))) return;
    if (!isCurrentScope(scope)) return;
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
    if (!isCurrentScope(scope)) return;
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
    if (!isCurrentScope(scope)) return;
    inFlight.current = true;
    setBusy('certificate');
    setFeedback(null);
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    try {
      const result = await bossTaxInvoiceApi.certificateUrl();
      if (!isCurrentScope(scope)) throw new Error('scope');
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
  const stage = status ? effectiveStage(status) : null;
  const pending = stage === 'PENDING_VERIFICATION';
  const rejected = stage === 'REJECTED';
  const canEdit = stage === 'NOT_REGISTERED' || ((pending || rejected) && editing);
  const ready = status?.stage === 'READY' && status.memberLinked === true && status.serviceConfigured;
  const expiryDays = daysUntil(status?.certificateExpiresAt);

  // 심사 결과 기다리는 동안만 — 보이는 동안 정해진 횟수 다시 읽기. 복귀 시 다시 읽기는 위의 focus 처리가 맡는다
  useBoundedRefresh({ enabled: pending && !editing && busy === null && !needsRefresh, run: refresh, refreshOnResume: false });

  return (
    <div className="boss-touch boss-tax flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/boss/tax-invoice" variant="secondary" size="sm">계산서 목록</ButtonLink>
          <Button variant="secondary" size="sm" icon={RefreshCw} disabled={loading || busy !== null} onClick={() => void refresh()}>{loading ? '확인 중…' : '다시 확인'}</Button>
        </div>
        <Button variant="ghost" size="sm" icon={BookOpen} onClick={() => setGuideOpen(true)}>시작 전 준비 안내</Button>
      </div>
      {guideOpen && (
        <OpsDialog title="시작 전 준비 안내" wide onClose={closeGuide} footer={<Button variant="primary" onClick={closeGuide}>준비됐어요, 등록하기</Button>}>
          <PreparationGuide />
        </OpsDialog>
      )}
      {banner && <Note>{banner}</Note>}
      {loadError && <Note tone="warn" live>{loadError} {status ? '아래는 마지막으로 확인한 상태입니다. 다시 확인 후 진행해 주세요.' : '현재 신청·연동은 진행할 수 없습니다. 다시 확인해 주세요.'}</Note>}
      {notice && <Note tone="ok" live>{notice}</Note>}
      {loading && !status ? <Skeleton className="h-64" /> : !status ? (
        <Panel title="등록 상태 확인 필요"><p className="text-[13px] leading-relaxed text-boss-text-secondary">회사 정보는 내정보의 회사 정보에서 먼저 등록할 수 있습니다. 발급 서비스의 최신 상태가 확인되면 신청서를 표시합니다.</p><div className="mt-4"><ButtonLink href="/boss/me/company" variant="secondary">회사 정보 확인</ButtonLink></div></Panel>
      ) : (
        <>
          <RegistrationProgress steps={registrationSteps(status, issuanceOpen)} />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-5">
              {status.stage === 'NEED_COMPANY' ? (
                <Panel title="회사 정보를 먼저 등록해 주세요"><p className="mb-4 text-[13px] leading-relaxed text-boss-text-secondary">발급 서비스를 신청하려면 내정보에서 회사 정보를 먼저 등록해야 합니다.</p><ButtonLink href="/boss/me/company">회사 정보 등록</ButtonLink></Panel>
              ) : canEdit ? (
                <SupplierRegistrationForm value={supplier} onChange={(v) => { dirty.current = true; setSupplier(v); }} mode={rejected ? 'reapply' : pending ? 'edit' : 'new'} prefillNote={prefillNote} serviceConfigured={status.serviceConfigured} submitting={disabled} feedback={feedback} onSubmit={(v) => void submit(v)} onCancel={pending || rejected ? () => setEditing(false) : undefined} />
              ) : rejected ? (
                <Panel title="신청이 반려되었습니다">
                  <div className="flex flex-col gap-3">
                    <Note tone="bad">
                      <b>반려 사유</b>
                      <span className="mt-1 block whitespace-pre-wrap">{status.reviewReason?.trim() || '사유가 함께 오지 않았습니다. 운영팀에 문의해 주세요.'}</span>
                    </Note>
                    {status.reviewedAt && <p className="text-[12px] text-boss-text-secondary">처리 시각: {formatOpsDateTime(status.reviewedAt) ?? '-'}</p>}
                    {status.supplier && <SupplierSummary supplier={status.supplier} />}
                    <p className="break-keep text-[12.5px] leading-relaxed text-boss-text-secondary">사유에 맞게 사업자 정보를 고쳐 다시 신청하면 운영팀이 다시 확인합니다.</p>
                    <div>
                      <Button variant="primary" disabled={disabled} onClick={() => { setEditing(true); setFeedback(null); }}>정보 고쳐 다시 신청</Button>
                    </div>
                  </div>
                </Panel>
              ) : (
                <Panel title={pending ? '사업자 권한 확인 중' : '확인된 사업자 정보'}>
                  {status.supplier && <SupplierSummary supplier={status.supplier} />}
                  {status.submittedAt && <p className="mt-3 text-[12px] text-boss-text-secondary">신청 시각: {status.submittedAt.replace('T', ' ').slice(0, 16)}</p>}
                  {pending ? <div className="mt-4 flex flex-col gap-3"><Note>운영팀이 사업자 발급 권한을 확인하고 있습니다. 확인이 끝나면 서비스 연동 단계가 열립니다.</Note><Button variant="secondary" disabled={disabled} onClick={() => { setEditing(true); setFeedback(null); }}>신청 내용 수정</Button></div> : <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">권한 확인된 정보는 여기서 변경할 수 없습니다. 변경이 필요하면 운영팀에 요청해 주세요.</p>}
                </Panel>
              )}
              {status.stage === 'VERIFIED' && status.serviceConfigured && status.memberLinked === false && !needsRefresh && !loadError && (
                <PopbillLinkForm supplier={status.supplier} submitting={loading || busy !== null} feedback={feedback} onSubmit={(id, pw) => void link(id, pw)} />
              )}
              {(status.stage === 'NEEDS_CERTIFICATE' || status.stage === 'READY') && (
                <Panel title="공동인증서 등록">
                  <p className="mb-3 text-[13px] leading-relaxed text-boss-text-secondary">사업자 공동인증서는 팝빌 등록 페이지에서 등록합니다. 인증서 파일과 인증서 비밀번호는 도배르만에 저장하지 않습니다.</p>
                  {/* 무료 1개월은 가입일이 아니라 인증서를 등록한 날부터(2026-10-17 사장님 결정) — 등록하는 이 칸에서 먼저 알린다 */}
                  <div className="mb-3">
                    {status.stage === 'NEEDS_CERTIFICATE' ? (
                      <Note tone="ok">
                        <b>공동인증서를 등록한 날부터 1개월 무료</b>로 전자 발급할 수 있습니다. 이후에는 {TAX_SUBSCRIPTION_PRICE} 앱 구독이 필요합니다.
                        <span className="mt-1 block">{TAX_SUBSCRIPTION_CASH_ONLY}</span>
                      </Note>
                    ) : (
                      <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
                        무료 기간 · 구독 상태는 <a href="#subscription" className="font-semibold text-boss-primary underline">구독 · 요금</a>에서 확인하세요.
                      </p>
                    )}
                  </div>
                  {status.certificateExpiresAt && <p className="mb-3 text-[13px] text-boss-text">인증서 만료일: <b>{status.certificateExpiresAt}</b>{expiryDays !== null && expiryDays < 30 ? ' · 갱신 날짜를 확인해 주세요.' : ''}</p>}
                  <Button disabled={disabled || status.memberLinked !== true || !status.serviceConfigured} onClick={() => void openCertificate()}>{busy === 'certificate' ? '등록 페이지 준비 중…' : ready ? '공동인증서 갱신·관리' : '공동인증서 등록'}</Button>
                  {certificateUrl && <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-[13px] font-semibold text-boss-primary underline">인증서 등록 페이지 열기 (새 창)</a>}
                </Panel>
              )}
              {feedback && (!canEdit && !(status.stage === 'VERIFIED' && status.memberLinked === false && !needsRefresh && !loadError)) && <Note tone={feedback.tone} live>{feedback.text}</Note>}
              <RecentActivity refreshKey={checkedAt} scope={scope} />
            </div>
            <div className="flex flex-col gap-5">
            <Panel title="현재 등록 상태">
              {/* 시험 환경 표시는 주황 표 대신 작은 회색 글자로(2026-10-21 — '효력 없음'이 걱정을 불렀다) */}
              <div className="mb-3 flex flex-wrap items-center gap-2"><Tag tone={ready ? 'ok' : rejected ? 'bad' : 'warn'}>{stage ? REGISTRATION_STAGE_LABEL[stage] : ''}</Tag>{status.isTest && <span className="text-[12px] text-boss-text-secondary">시험 환경</span>}</div>
              {ready ? <Note tone="ok">{issuanceOpen ? '발급 준비가 완료되었습니다.' : '등록 준비 완료 · 발급은 정식 오픈 후 이용'}</Note> : <p className="break-keep text-[13px] leading-relaxed text-boss-text-secondary">{status.reason || '다음 등록 단계를 진행해 주세요.'}</p>}
              {status.stage === 'VERIFIED' && status.memberLinked === null && status.serviceConfigured && <Note tone="warn">팝빌 연동 여부를 확인하지 못했습니다. 다시 확인 후 진행해 주세요.</Note>}
              {status.reviewStatus === 'APPROVED' && status.reviewedAt && <p className="mt-3 text-[12px] text-boss-text-secondary">권한 승인: {formatOpsDateTime(status.reviewedAt) ?? '-'}</p>}
            </Panel>
            <OperationsPanel refreshKey={checkedAt} scope={scope} stage={stage} />
            <SupportScope stage={status.stage} refreshKey={checkedAt} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
