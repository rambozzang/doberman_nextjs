'use client';

import { FormEvent, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossCompanyData } from '@/types/boss';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Save,
  Loader2,
  Hash,
  Stamp,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';

export default function BossMyCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [companyId, setCompanyId] = useState<number | undefined>(undefined);

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [bizno, setBizno] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [post, setPost] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [type, setType] = useState('');
  const [kind, setKind] = useState('');
  const [region, setRegion] = useState('');
  const [intro, setIntro] = useState('');
  const [url, setUrl] = useState('');
  const [bigo, setBigo] = useState('');
  const [logo, setLogo] = useState('');
  const [stamp, setStamp] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const stampInputRef = useRef<HTMLInputElement | null>(null);

  const fillFromData = (data: BossCompanyData) => {
    setCompanyId(data.id);
    setName(data.name || '');
    setOwner(data.owner || '');
    setBizno(data.bizno || '');
    setPhone(data.phone || '');
    setFax(data.fax || '');
    setEmail(data.email || '');
    setPost(data.post || '');
    setAddress1(data.address1 || '');
    setAddress2(data.address2 || '');
    setType(data.type || '');
    setKind(data.kind || '');
    setRegion(data.region || '');
    setIntro(data.intro || '');
    setUrl(data.url || '');
    setBigo(data.bigo || '');
    setLogo(data.logo || '');
    setStamp(data.stamp || '');
  };

  const loadCompany = useCallback(async () => {
    const cached = BossAuthManager.getUserInfo();
    if (!cached?.userId) {
      toast.error('로그인이 필요합니다.');
      router.replace('/boss/login');
      return;
    }
    if (!cached.companyId) {
      setIsEdit(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await bossCompanyApi.get(cached.companyId);
      if (res.success && res.data) {
        fillFromData(res.data);
        setIsEdit(true);
      } else {
        // 회사 없음 → 신규 등록 모드
        setIsEdit(false);
      }
    } catch (err) {
      console.error('boss company load error', err);
      toast.error('회사 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('회사명을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload: BossCompanyData = {
        id: companyId,
        name: name.trim(),
        owner: owner.trim(),
        bizno: bizno.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        post: post.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        type: type.trim(),
        kind: kind.trim(),
        region: region.trim(),
        intro: intro.trim(),
        url: url.trim(),
        bigo: bigo.trim(),
        logo,
        stamp,
      };

      // 생성 또는 수정
      const res = companyId
        ? await bossCompanyApi.update(companyId, payload)
        : await bossCompanyApi.create(payload);
      if (res.success && res.data) {
        fillFromData(res.data);
        setIsEdit(true);

        // 사용자 정보에 companyId 동기화
        const cached = BossAuthManager.getUserInfo();
        if (cached && res.data.id) {
          BossAuthManager.setUserInfo({ ...cached, companyId: res.data.id });
        }

        // 기존 회사가 있던 경우 region 업데이트도 호출
        if (companyId && region.trim()) {
          await bossCompanyApi.updateRegion(companyId, region.trim());
        }

        toast.success(isEdit ? '수정되었습니다.' : '등록되었습니다.');
      } else {
        toast.error(res.message || res.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss company save error', err);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!companyId || !logo) return;
    if (!confirm('로고를 삭제하시겠습니까?')) return;
    try {
      const res = await bossCompanyApi.deleteLogoPath(companyId);
      if (res.success) {
        setLogo('');
        toast.success('로고가 삭제되었습니다.');
      } else {
        toast.error(res.message || res.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('delete logo error', err);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteStamp = async () => {
    if (!companyId || !stamp) return;
    if (!confirm('도장을 삭제하시겠습니까?')) return;
    try {
      const res = await bossCompanyApi.deleteStampPath(companyId);
      if (res.success) {
        setStamp('');
        toast.success('도장이 삭제되었습니다.');
      } else {
        toast.error(res.message || res.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('delete stamp error', err);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoFile = async (file: File | undefined) => {
    if (!file || !companyId) return;
    try {
      const dataUrl = await readFile(file);
      const res = await bossCompanyApi.updateLogoPath(companyId, dataUrl);
      if (res.success) {
        setLogo(dataUrl);
        toast.success('회사 로고가 변경되었습니다.');
      } else {
        toast.error(res.message || res.error || '로고 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('update logo error', err);
      toast.error('로고 변경 중 오류가 발생했습니다.');
    }
  };

  const handleStampFile = async (file: File | undefined) => {
    if (!file || !companyId) return;
    try {
      const dataUrl = await readFile(file);
      const res = await bossCompanyApi.updateStampPath(companyId, dataUrl);
      if (res.success) {
        setStamp(dataUrl);
        toast.success('도장 이미지가 변경되었습니다.');
      } else {
        toast.error(res.message || res.error || '도장 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('update stamp error', err);
      toast.error('도장 변경 중 오류가 발생했습니다.');
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
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/boss/me"
            className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-primary"
          >
            <ArrowLeft size={15} /> 뒤로
          </Link>
          <h1 className="text-xl font-bold text-boss-text">{isEdit ? '회사 정보 수정' : '회사 등록'}</h1>
          <div className="w-12" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-boss-surface p-6 shadow-boss ring-1 ring-boss-border"
        >
          {/* 로고 / 도장 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-boss-text-muted">회사 로고</label>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-boss-border bg-boss-bg text-boss-text-muted transition-colors hover:border-slate-500 hover:text-boss-text-secondary"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="logo" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon size={24} />
                    <p className="mt-1 text-[11px]">로고 없음</p>
                  </div>
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
              />
              {logo && isEdit && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="mt-2 w-full rounded-lg border border-boss-error/20 bg-boss-error/10 py-1.5 text-[11px] font-medium text-boss-error hover:bg-boss-error/20"
                >
                  로고 삭제
                </button>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-boss-text-muted">회사 도장</label>
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-boss-border bg-boss-bg text-boss-text-muted transition-colors hover:border-slate-500 hover:text-boss-text-secondary"
              >
                {stamp ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stamp} alt="stamp" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Stamp size={24} />
                    <p className="mt-1 text-[11px]">도장 없음</p>
                  </div>
                )}
              </button>
              <input
                ref={stampInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleStampFile(e.target.files?.[0])}
              />
              {stamp && isEdit && (
                <button
                  type="button"
                  onClick={handleDeleteStamp}
                  className="mt-2 w-full rounded-lg border border-boss-error/20 bg-boss-error/10 py-1.5 text-[11px] font-medium text-boss-error hover:bg-boss-error/20"
                >
                  도장 삭제
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CompanyField label="회사명" icon={Building2}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="company-input"
                placeholder="(주)도배르만"
              />
            </CompanyField>
            <CompanyField label="대표자명" icon={User}>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="company-input"
                placeholder="홍길동"
              />
            </CompanyField>
            <CompanyField label="사업자등록번호" icon={Hash}>
              <input
                type="text"
                value={bizno}
                onChange={(e) => setBizno(e.target.value)}
                className="company-input"
                placeholder="123-45-67890"
              />
            </CompanyField>
            <CompanyField label="대표 전화" icon={Phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="company-input"
                placeholder="02-1234-5678"
              />
            </CompanyField>
            <CompanyField label="팩스" icon={Phone}>
              <input
                type="tel"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                className="company-input"
                placeholder="02-1234-5679"
              />
            </CompanyField>
            <CompanyField label="이메일" icon={Mail}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="company-input"
                placeholder="company@example.com"
              />
            </CompanyField>
            <CompanyField label="업태" icon={FileText}>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="company-input"
                placeholder="서비스업"
              />
            </CompanyField>
            <CompanyField label="종목" icon={FileText}>
              <input
                type="text"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="company-input"
                placeholder="도배"
              />
            </CompanyField>
            <CompanyField label="우편번호" icon={MapPin}>
              <input
                type="text"
                value={post}
                onChange={(e) => setPost(e.target.value)}
                className="company-input"
                placeholder="12345"
              />
            </CompanyField>
            <CompanyField label="활동 지역" icon={MapPin}>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="company-input"
                placeholder="서울 강남구"
              />
            </CompanyField>
          </div>

          <CompanyField label="주소" icon={MapPin}>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="company-input"
              placeholder="기본 주소"
            />
          </CompanyField>
          <CompanyField label="상세 주소" icon={MapPin}>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="company-input"
              placeholder="상세 주소"
            />
          </CompanyField>
          <CompanyField label="홈페이지" icon={Globe}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="company-input"
              placeholder="https://example.com"
            />
          </CompanyField>
          <CompanyField label="회사 소개">
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2 text-sm text-boss-text focus:border-boss-primary focus:outline-none focus:ring-2 focus:ring-boss-primary/20"
              placeholder="회사를 소개해주세요"
            />
          </CompanyField>
          <CompanyField label="비고">
            <textarea
              value={bigo}
              onChange={(e) => setBigo(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2 text-sm text-boss-text focus:border-boss-primary focus:outline-none focus:ring-2 focus:ring-boss-primary/20"
              placeholder="추가 메모"
            />
          </CompanyField>

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-boss-primary to-boss-primary-hover text-sm font-semibold text-boss-text shadow-boss-md hover:from-boss-primary-hover hover:to-boss-primary disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-boss-text-muted"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save size={15} />
                {isEdit ? '회사 정보 저장' : '회사 등록'}
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        :global(.company-input) {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background-color: rgba(15, 23, 42, 0.4);
          padding-left: 2.5rem;
          padding-right: 0.75rem;
          font-size: 0.875rem;
          color: rgb(248 250 252);
        }
        :global(.company-input)::placeholder {
          color: rgb(100 116 139);
        }
        :global(.company-input:focus) {
          border-color: rgb(52 211 153);
          outline: none;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
}

type IconType = React.ComponentType<{ size?: number; className?: string }>;

function CompanyField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: IconType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-boss-text-muted">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="pointer-events-none absolute left-3.5 top-[0.85rem] text-boss-text-muted" />
        )}
        {children}
      </div>
    </div>
  );
}
