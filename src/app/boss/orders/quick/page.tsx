'use client';

// 사장님 주문 등록 (고객/주문서 생성)
// Flutter 의 고객 생성 로직과 동일: POST /customers
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBossAuth } from '@/hooks/useBossAuth';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { PageHeader, Card, Button } from '@/components/boss/ui';
import { ArrowLeft, Save, User, Phone, Mail, Calendar, MapPin, FileText, Lock } from 'lucide-react';
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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="주문 등록"
        description="신규 고객/주문서를 등록합니다."
        actions={
          <Link href="/boss/orders">
            <Button variant="ghost" icon={ArrowLeft}>
              목록
            </Button>
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
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
            <Field label="상태 코드" icon={FileText}>
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
            </Field>
            <Field label="견적일" icon={Calendar}>
              <input
                type="datetime-local"
                value={form.estimateDate}
                onChange={(e) => set('estimateDate', e.target.value)}
                className="boss-input"
              />
            </Field>
            <Field label="시공일" icon={Calendar}>
              <input
                type="datetime-local"
                value={form.workDate}
                onChange={(e) => set('workDate', e.target.value)}
                className="boss-input"
              />
            </Field>
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

          <Field label="메모" icon={FileText}>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              rows={4}
              placeholder="추가 요청사항이나 메모를 입력하세요."
              className="boss-input"
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/boss/orders">
              <Button type="button" variant="secondary">
                취소
              </Button>
            </Link>
            <Button type="submit" variant="primary" icon={Save} disabled={saving}>
              {saving ? '등록 중...' : '주문 등록'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
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
