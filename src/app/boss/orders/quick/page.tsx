'use client';

// 사장님 주문 등록 (고객/주문서 생성)
// Flutter 의 고객 생성 로직과 동일: POST /customers
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBossAuth } from '@/hooks/useBossAuth';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { Button, ContentCard, CardHead, AlertBanner, StatusPill } from '@/components/boss/ui';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';
import { Save, User, Phone, Mail, Calendar, MapPin, FileText, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

function toYyyyMMddHHmm(v: string): string {
  if (!v) return '';
  return v.replace(/[-T:]/g, '');
}

export default function BossOrderQuickPage() {
  const router = useRouter();
  const { bossAuth } = useBossAuth();
  const userInfo = bossAuth.userInfo;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    estimateDate: '',
    workDate: '',
    workEndDate: '',
    post: '',
    address1: '',
    address2: '',
    commonPw: '',
    housePw: '',
    memo: '',
    statusCd: '00',
  });

  const set = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('고객명을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        estimateDate: toYyyyMMddHHmm(form.estimateDate),
        workDate: toYyyyMMddHHmm(form.workDate),
        workEndDate: toYyyyMMddHHmm(form.workEndDate),
        companyId: userInfo?.companyId ?? undefined,
      };
      const res = await bossCustomersApi.create(payload);
      if (res.success) {
        toast.success('주문이 등록되었습니다.');
        router.push('/boss/orders');
      } else {
        toast.error(res.message || '주문 등록에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 주문 등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 규칙 경고는 발행 시점이 아니라 입력 시점에 뜬다 (시안 컴포저 원칙)
  const warnings: string[] = [];
  if (form.workDate && form.workEndDate && form.workEndDate < form.workDate) {
    warnings.push('시공 종료일이 시작일보다 빠릅니다.');
  }
  if (form.name.trim() && !form.phone.trim()) {
    warnings.push('연락처가 없으면 고객에게 일정 알림을 보낼 수 없습니다.');
  }
  if (form.workDate && !form.address1.trim()) {
    warnings.push('시공일이 잡혔는데 주소가 비어 있습니다.');
  }

  const canSubmit = form.name.trim().length > 0 && !saving;
  // ⌘↵ 로 바로 등록 (시안 KEYBOARD 원칙)
  useSubmitHotkey(() => {
    if (canSubmit) void handleSubmit(new Event('submit') as unknown as React.FormEvent);
  }, canSubmit);

  const statusLabel =
    { '00': '대기', '01': '진행', '02': '완료', '03': '취소' }[form.statusCd] ?? '대기';

  return (
    // 시안 컴포저: grid minmax(0,1fr) 372px, 높이 100%
    <form
      onSubmit={handleSubmit}
      className="boss-bleed grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_372px]"
    >
      {/* ───── 좌: 입력 (스크롤 영역) ───── */}
      <div className="boss-scroll overflow-y-auto border-boss-border px-5 pb-32 pt-[18px] lg:border-r">
        <div className="flex flex-col gap-[18px]">
          <ContentCard>
            <CardHead title="고객" meta="필수" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-2.5 p-4">
              <Field label="고객명 *" icon={User}>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="홍길동"
                  className="boss-input"
                  required
                />
              </Field>
              <Field label="연락처" icon={Phone}>
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="boss-input"
                />
              </Field>
              <Field label="이메일" icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="customer@example.com"
                  className="boss-input"
                />
              </Field>
            </div>
          </ContentCard>

          <ContentCard>
            <CardHead title="일정" meta="견적 · 시공" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-2.5 p-4">
              <Field label="견적일" icon={Calendar}>
                <input
                  type="datetime-local"
                  value={form.estimateDate}
                  onChange={(e) => set('estimateDate', e.target.value)}
                  className="boss-input"
                />
              </Field>
              <Field label="시공 시작일" icon={Calendar}>
                <input
                  type="datetime-local"
                  value={form.workDate}
                  onChange={(e) => set('workDate', e.target.value)}
                  className="boss-input"
                />
              </Field>
              <Field label="시공 종료일" icon={Calendar}>
                <input
                  type="datetime-local"
                  value={form.workEndDate}
                  onChange={(e) => set('workEndDate', e.target.value)}
                  className="boss-input"
                />
              </Field>
            </div>
          </ContentCard>

          <ContentCard>
            <CardHead title="현장" meta="주소 · 출입" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-2.5 p-4">
              <Field label="우편번호" icon={MapPin}>
                <input
                  value={form.post}
                  onChange={(e) => set('post', e.target.value)}
                  placeholder="12345"
                  className="boss-input"
                />
              </Field>
              <Field label="주소" icon={MapPin}>
                <input
                  value={form.address1}
                  onChange={(e) => set('address1', e.target.value)}
                  placeholder="도로명 주소"
                  className="boss-input"
                />
              </Field>
              <Field label="상세 주소" icon={MapPin}>
                <input
                  value={form.address2}
                  onChange={(e) => set('address2', e.target.value)}
                  placeholder="상세 주소"
                  className="boss-input"
                />
              </Field>
              <Field label="공동현관 비밀번호" icon={Lock}>
                <input
                  value={form.commonPw}
                  onChange={(e) => set('commonPw', e.target.value)}
                  placeholder="****"
                  className="boss-input"
                />
              </Field>
              <Field label="현관 비밀번호" icon={Lock}>
                <input
                  value={form.housePw}
                  onChange={(e) => set('housePw', e.target.value)}
                  placeholder="****"
                  className="boss-input"
                />
              </Field>
            </div>
          </ContentCard>

          <ContentCard>
            <CardHead title="메모" />
            <div className="p-4">
              <textarea
                value={form.memo}
                onChange={(e) => set('memo', e.target.value)}
                placeholder="추가 요청사항이나 메모를 입력하세요."
                className="boss-input"
              />
            </div>
          </ContentCard>

          {/* 입력 시점 규칙 경고 */}
          {warnings.map((w) => (
            <AlertBanner key={w} tone="warn">
              {w}
            </AlertBanner>
          ))}
        </div>
      </div>

      {/* ───── 우: 372px 요약 패널 ───── */}
      <div className="boss-scroll overflow-y-auto bg-boss-inset px-[18px] pb-10 pt-[18px]">
        <p className="mb-[11px] text-[12px] font-bold text-boss-text">요약</p>

        <ContentCard>
          <div className="flex flex-col gap-2.5 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-boss-text-muted">고객</span>
              <span className="truncate text-[12.5px] font-semibold text-boss-text">
                {form.name.trim() || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-boss-text-muted">연락처</span>
              <span className="font-boss-mono text-[12px] text-boss-text-dim">
                {form.phone.trim() || '—'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="flex-none text-[11px] text-boss-text-muted">주소</span>
              <span className="text-right text-[12px] text-boss-text-dim">
                {[form.address1, form.address2].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-boss-border-row pt-2.5">
              <span className="text-[11px] text-boss-text-muted">시공</span>
              <span className="font-boss-mono text-[11.5px] text-boss-text-dim">
                {form.workDate ? form.workDate.replace('T', ' ') : '미정'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-boss-text-muted">상태</span>
              <StatusPill tone={form.statusCd === '03' ? 'bad' : form.statusCd === '02' ? 'ok' : 'neutral'}>
                {statusLabel}
              </StatusPill>
            </div>
          </div>
        </ContentCard>

        <div className="mt-4">
          <label className="boss-label">상태</label>
          <select
            value={form.statusCd}
            onChange={(e) => set('statusCd', e.target.value)}
            className="boss-input"
          >
            <option value="00">대기</option>
            <option value="01">진행</option>
            <option value="02">완료</option>
            <option value="03">취소</option>
          </select>
        </div>

        {/* 하단 액션 — 시안: 취소 flex 1 + 등록 flex 1.4 accent */}
        <div className="mt-3.5 flex gap-2">
          <Link
            href="/boss/orders"
            className="boss-btn boss-btn-md boss-btn-outline flex-1 justify-center"
          >
            취소
          </Link>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={!canSubmit}
            className="flex-[1.4] justify-center"
          >
            {saving ? '등록 중…' : '주문 등록'}
          </Button>
        </div>
        <p className="mt-2.5 text-center font-boss-mono text-[11px] text-boss-text-muted">
          ⌘↵ 로 바로 등록
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="boss-label flex items-center gap-1.5">
        <Icon size={11} />
        {label}
      </span>
      {children}
    </label>
  );
}
