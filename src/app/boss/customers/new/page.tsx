'use client';

// 고객 등록 (고객 등록) — Industry 패턴의 긴 폼 (참조 매물 등록)
// Flutter 의 고객 생성 로직과 동일: POST /customers
//
// 조판: 좌 폼 패널(섹션 제목 + 2열 grid) + 하단 액션 패널 / 우 280px 요약 · 입력 확인 패널.
// nav.ts 가 이 화면 폭을 wide(860px) 로 두므로 전체폭 bleed 컴포저 대신 폼 조판을 쓴다.
// 화면 제목 · "← 고객" 링크는 셸 헤더가 그린다.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBossAuth } from '@/hooks/useBossAuth';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import {
  Button,
  Panel,
  Field,
  SelectField,
  TextareaField,
  DescRow,
  Tag,
} from '@/components/boss/ui';
import PostcodeField from '@/components/boss/PostcodeField';
import { CUSTOMER_STATUS_OPTIONS, customerStatus } from '@/lib/boss/customerStatus';
import { useSubmitHotkey } from '@/components/boss/layout/BossSearchContext';
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
        toast.success('고객이 등록되었습니다.');
        router.push('/boss/customers');
      } else {
        toast.error(res.message || '고객 등록에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 고객 등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 규칙 경고는 발행 시점이 아니라 입력 시점에 뜬다
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
  // ⌘↵ 로 바로 등록 (KEYBOARD 원칙)
  useSubmitHotkey(() => {
    if (canSubmit) void handleSubmit(new Event('submit') as unknown as React.FormEvent);
  }, canSubmit);

  // 앱과 같은 코드: 00 진행중 · 10 수금완료 · 20 보류 · 30 취소
  const statusView = customerStatus(form.statusCd);
  const statusLabel = statusView.label;
  const statusTone = statusView.tone;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      {/* ───── 좌: 폼 ───── */}
      <div className="flex flex-col gap-4">
        <Panel>
          <h3 className="boss-section-title mb-3">고객</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              id="name"
              label="고객명"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="홍길동"
              autoFocus
              maxLength={100}
            />
            <Field
              id="phone"
              label="연락처"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="010-0000-0000"
              maxLength={20}
            />
            <Field
              id="email"
              label="이메일"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="customer@example.com"
              className="md:col-span-2"
              maxLength={100}
            />
          </div>

          <h3 className="boss-section-title mb-3 mt-6 border-t border-boss-border-row pt-5">일정</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              id="estimateDate"
              label="견적일"
              type="datetime-local"
              value={form.estimateDate}
              onChange={(e) => set('estimateDate', e.target.value)}
              className="md:col-span-2"
            />
            <Field
              id="workDate"
              label="시공 시작일"
              type="datetime-local"
              value={form.workDate}
              onChange={(e) => set('workDate', e.target.value)}
            />
            <Field
              id="workEndDate"
              label="시공 종료일"
              type="datetime-local"
              value={form.workEndDate}
              onChange={(e) => set('workEndDate', e.target.value)}
              hint="하루 시공이면 비워 두어도 됩니다."
            />
          </div>

          <h3 className="boss-section-title mb-3 mt-6 border-t border-boss-border-row pt-5">현장</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* 우편번호 창(카카오)에서 고르면 우편번호 · 주소가 채워진다 — 앱과 같다 */}
            <PostcodeField
              id="post"
              value={form.post}
              onChange={(v) => set('post', v)}
              onSelect={({ zonecode, address }) => {
                setForm((p) => ({ ...p, post: zonecode, address1: address }));
              }}
              detailInputId="address2"
            />
            <Field
              id="address1"
              label="주소"
              value={form.address1}
              onChange={(e) => set('address1', e.target.value)}
              placeholder="도로명 주소"
              maxLength={200}
            />
            <Field
              id="address2"
              label="상세 주소"
              value={form.address2}
              onChange={(e) => set('address2', e.target.value)}
              placeholder="동 · 호수"
              className="md:col-span-2"
              maxLength={200}
            />
            <Field
              id="commonPw"
              label="공동현관 비밀번호"
              value={form.commonPw}
              onChange={(e) => set('commonPw', e.target.value)}
              placeholder="****"
              maxLength={50}
            />
            <Field
              id="housePw"
              label="현관 비밀번호"
              value={form.housePw}
              onChange={(e) => set('housePw', e.target.value)}
              placeholder="****"
              maxLength={50}
            />
          </div>

          <h3 className="boss-section-title mb-3 mt-6 border-t border-boss-border-row pt-5">메모 · 상태</h3>
          <div className="grid grid-cols-1 gap-3">
            <TextareaField
              id="memo"
              label="메모"
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="추가 요청사항이나 메모를 입력하세요."
              rows={4}
              maxLength={2000}
            />
            <SelectField
              id="statusCd"
              label="상태"
              value={form.statusCd}
              onChange={(e) => set('statusCd', e.target.value)}
              className="md:max-w-[240px]"
              hint="현장에서 바로 등록할 때는 「진행중」으로 두고, 시공 후 고객 상세에서 수금완료로 바꿉니다."
            >
              {CUSTOMER_STATUS_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </div>
        </Panel>

        {/* 하단 액션 패널 — 취소 secondary / 등록 primary 우측 */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <p className="text-[12.5px] text-boss-text-secondary">
            {warnings.length > 0
              ? `확인할 항목 ${warnings.length}개 · 등록은 가능합니다`
              : '등록하면 고객 목록에 올라갑니다'}
            <span className="ml-2 font-boss-head text-[11px] text-boss-text-muted">⌘↵ 로 바로 등록</span>
          </p>
          <div className="flex items-center gap-2">
            <Link href="/boss/customers" className="boss-btn boss-btn-md boss-btn-secondary">
              취소
            </Link>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              {saving ? '등록 중…' : '고객 등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* ───── 우: 요약 · 입력 확인 ───── */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-[112px]">
        <Panel kicker="요약" title={form.name.trim() || '새 고객'}>
          <dl>
            <DescRow
              label="연락처"
              value={<span className="font-boss-head tabular-nums">{form.phone.trim() || '—'}</span>}
            />
            <DescRow
              label="주소"
              value={[form.address1, form.address2].filter(Boolean).join(' ') || '—'}
            />
            <DescRow
              label="견적"
              value={
                <span className="font-boss-head tabular-nums">
                  {form.estimateDate ? form.estimateDate.replace('T', ' ') : '미정'}
                </span>
              }
            />
            <DescRow
              label="시공"
              value={
                <span className="font-boss-head tabular-nums">
                  {form.workDate ? form.workDate.replace('T', ' ') : '미정'}
                </span>
              }
            />
            <DescRow label="상태" value={<Tag tone={statusTone}>{statusLabel}</Tag>} />
          </dl>
        </Panel>

        <Panel kicker="입력 확인" title={warnings.length > 0 ? `${warnings.length}개 확인` : '문제 없음'}>
          {warnings.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
              {warnings.map((w) => (
                <li key={w} className="text-boss-warning">
                  · {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              고객명만 있으면 등록됩니다. 연락처 · 주소 · 시공일은 나중에 채워도 됩니다.
            </p>
          )}
        </Panel>

        <Panel kicker="안내" title="등록 뒤에는">
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            고객 상세에서 견적서 · 체크리스트 · 시공 기록 · AS 를 이 고객에 이어서 남깁니다. 시공일을
            넣으면 일정 화면에도 바로 표시됩니다.
          </p>
        </Panel>
      </div>
    </form>
  );
}
