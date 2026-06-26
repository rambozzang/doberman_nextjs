'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossCompanyData } from '@/types/boss';
import { PageHeader, Card, Button } from '@/components/boss/ui';
import {
  Building2,
  User,
  Hash,
  Phone,
  Mail,
  MapPin,
  FileText,
  Globe,
  Loader2,
  Save,
} from 'lucide-react';

export default function BossOnboardingCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [bizno, setBizno] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [post, setPost] = useState('');
  const [region, setRegion] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [type, setType] = useState('');
  const [kind, setKind] = useState('');
  const [url, setUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [bigo, setBigo] = useState('');

  useEffect(() => {
    const cached = BossAuthManager.getUserInfo();
    if (!cached?.userId) {
      toast.error('로그인이 필요합니다.');
      router.replace('/boss/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('회사명을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload: BossCompanyData = {
        name: name.trim(),
        owner: owner.trim(),
        bizno: bizno.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        post: post.trim(),
        region: region.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        type: type.trim(),
        kind: kind.trim(),
        url: url.trim(),
        intro: intro.trim(),
        bigo: bigo.trim(),
      };

      const res = await bossCompanyApi.create(payload);
      if (res.success && res.data) {
        const cached = BossAuthManager.getUserInfo();
        if (cached && res.data.id) {
          BossAuthManager.setUserInfo({ ...cached, companyId: res.data.id });
        }

        toast.success('사업자 정보가 등록되었습니다.');
        router.replace('/boss');
      } else {
        toast.error(res.message || res.error || '등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss company create error', err);
      toast.error('등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-boss-bg">
        <Loader2 className="h-6 w-6 animate-spin text-boss-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-boss-bg">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader
          title="사업자 정보 등록"
          description="견적 답변을 위해 사업자 정보를 등록해주세요."
        />

        <Card className="rounded-2xl border-boss-border bg-boss-surface p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <CompanyField label="회사명" icon={Building2} required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="(주)도배륜"
                />
              </CompanyField>
              <CompanyField label="대표자명" icon={User}>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className={inputClass}
                  placeholder="홍길동"
                />
              </CompanyField>
              <CompanyField label="사업자등록번호" icon={Hash}>
                <input
                  type="text"
                  value={bizno}
                  onChange={(e) => setBizno(e.target.value)}
                  className={inputClass}
                  placeholder="123-45-67890"
                />
              </CompanyField>
              <CompanyField label="대표 전화" icon={Phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="02-1234-5678"
                />
              </CompanyField>
              <CompanyField label="팩스" icon={Phone}>
                <input
                  type="tel"
                  value={fax}
                  onChange={(e) => setFax(e.target.value)}
                  className={inputClass}
                  placeholder="02-1234-5679"
                />
              </CompanyField>
              <CompanyField label="이메일" icon={Mail}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="company@example.com"
                />
              </CompanyField>
              <CompanyField label="우편번호" icon={MapPin}>
                <input
                  type="text"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className={inputClass}
                  placeholder="12345"
                />
              </CompanyField>
              <CompanyField label="활동 지역" icon={MapPin}>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                  placeholder="서울 강남구"
                />
              </CompanyField>
              <CompanyField label="업태" icon={FileText}>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                  placeholder="서비스업"
                />
              </CompanyField>
              <CompanyField label="종목" icon={FileText}>
                <input
                  type="text"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className={inputClass}
                  placeholder="도배"
                />
              </CompanyField>
            </div>

            <CompanyField label="주소" icon={MapPin}>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className={inputClass}
                placeholder="기본 주소"
              />
            </CompanyField>
            <CompanyField label="상세 주소" icon={MapPin}>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className={inputClass}
                placeholder="상세 주소"
              />
            </CompanyField>
            <CompanyField label="홈페이지" icon={Globe}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </CompanyField>
            <CompanyField label="회사 소개">
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="회사를 소개해주세요"
              />
            </CompanyField>
            <CompanyField label="비고">
              <textarea
                value={bigo}
                onChange={(e) => setBigo(e.target.value)}
                rows={2}
                className={textareaClass}
                placeholder="추가 메모"
              />
            </CompanyField>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={saving ? Loader2 : Save}
              className="w-full"
              disabled={saving}
            >
              {saving ? '등록 중...' : '사업자 정보 등록'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10';

const textareaClass =
  'w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10';

type IconType = React.ComponentType<{ size?: number; className?: string }>;

function CompanyField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon?: IconType;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-boss-text-muted">
        {label}
        {required && <span className="ml-0.5 text-boss-error">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="pointer-events-none absolute left-3.5 top-3 text-boss-text-muted" />
        )}
        {children}
      </div>
    </div>
  );
}
