'use client';

// 회사 정보 — Industry 패턴 (참조 04 매물 등록 : 긴 폼 + 우측 안내 패널)
//
//   lg↑ grid minmax(0,1fr) + 280px
//   좌: 로고 · 도장(사각 자리표시자) → 사업자 정보 → 연락처 → 주소 → 소개, 각각 패널 + 2열 grid(Field)
//       → 하단 액션 패널(취소 secondary / 저장 primary 우측)
//   우: 안내 패널(어디에 쓰이는지 · 필수 항목)
//   화면 제목은 헤더(PAGE_META)가 그린다. 회사가 없으면 같은 폼이 등록 모드로 열린다.
//
//   로고 · 도장 업로드는 회사 id 가 있어야 동작한다(API 가 companyId 를 받는다) —
//   등록 전에는 버튼을 잠그고 그 이유를 적는다.

import RegionPicker from '@/components/boss/RegionPicker';
import { formatRegions } from '@/lib/boss/regions';
import { FormEvent, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossCompanyData } from '@/types/boss';
import {
  Button,
  ButtonLink,
  Field,
  FieldLabel,
  Panel,
  Placeholder,
  Skeleton,
  TextareaField,
} from '@/components/boss/ui';
import PostcodeField from '@/components/boss/PostcodeField';

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
  const [regionOpen, setRegionOpen] = useState(false);
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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]" aria-busy>
        <div className="flex flex-col gap-4">
          <div className="boss-card p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
          <div className="boss-card p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </div>
        </div>
        <div className="boss-card p-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>
      </div>
    );
  }

  // 로고 · 도장 업로드 API 는 companyId 를 받는다 — 등록 전에는 올릴 수 없다
  const canUploadImages = Boolean(companyId);

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* 좌: 폼 */}
      <div className="flex min-w-0 flex-col gap-4">
        {!isEdit && (
          <div className="border border-boss-primary/35 bg-boss-pill-info px-4 py-3 text-[13px] leading-relaxed text-boss-pill-info-fg">
            <span className="font-bold">아직 등록된 회사가 없습니다.</span> 회사명만 있어도 등록됩니다 —
            나머지는 나중에 채워도 됩니다.
          </div>
        )}

        {/* 로고 · 도장 */}
        <Panel kicker="브랜딩" title="로고 · 도장">
          <div className="grid grid-cols-2 gap-4">
            <ImageSlot
              label="회사 로고"
              placeholderLabel="LOGO"
              src={logo}
              alt="회사 로고"
              inputRef={logoInputRef}
              onFile={handleLogoFile}
              onDelete={handleDeleteLogo}
              canUpload={canUploadImages}
              canDelete={Boolean(logo && isEdit)}
            />
            <ImageSlot
              label="회사 도장"
              placeholderLabel="STAMP"
              src={stamp}
              alt="회사 도장"
              inputRef={stampInputRef}
              onFile={handleStampFile}
              onDelete={handleDeleteStamp}
              canUpload={canUploadImages}
              canDelete={Boolean(stamp && isEdit)}
            />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            {canUploadImages
              ? '이미지를 고르면 바로 저장됩니다(별도 저장 버튼 없음). PNG · JPG 권장.'
              : '로고 · 도장은 회사를 먼저 등록한 뒤 올릴 수 있습니다.'}
          </p>
        </Panel>

        {/* 사업자 정보 */}
        <Panel kicker="사업자" title="사업자 정보">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="co-name"
              label="회사명"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="(주)도배르만"
              autoFocus={!isEdit}
            />
            <Field
              id="co-owner"
              label="대표자명"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="홍길동"
            />
            <Field
              id="co-bizno"
              label="사업자등록번호"
              type="text"
              value={bizno}
              onChange={(e) => setBizno(e.target.value)}
              placeholder="123-45-67890"
              className="[&_input]:font-boss-head [&_input]:tabular-nums"
            />
            {/* 견적 수신 지역 — 자유 입력이 아니라 시 · 도 선택(최대 3개). 앱과 같은 규칙 */}
            <div>
              <FieldLabel>견적 수신 지역</FieldLabel>
              <button
                type="button"
                onClick={() => setRegionOpen(true)}
                className="boss-input flex items-center justify-between text-left"
              >
                <span className={region ? 'text-boss-text' : 'text-boss-text-muted'}>
                  {region ? formatRegions(region) : '지역을 고르세요'}
                </span>
                <span className="text-[12px] text-boss-primary">고르기</span>
              </button>
              <p className="mt-1 text-[11.5px] text-boss-text-secondary">
                이 지역의 견적 요청 알림을 받습니다. 최대 3개, 전국은 단독 선택입니다.
              </p>
            </div>
            <Field
              id="co-type"
              label="업태"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="서비스업"
            />
            <Field
              id="co-kind"
              label="종목"
              type="text"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="도배"
            />
          </div>
        </Panel>

        {/* 연락처 */}
        <Panel kicker="연락처" title="연락처">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="co-phone"
              label="대표 전화"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-1234-5678"
            />
            <Field
              id="co-fax"
              label="팩스"
              type="tel"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              placeholder="02-1234-5679"
            />
            <Field
              id="co-email"
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="company@example.com"
            />
            <Field
              id="co-url"
              label="홈페이지"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </Panel>

        {/* 주소 */}
        <Panel kicker="주소" title="사업장 주소">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
            {/* 우편번호 창(카카오)에서 고르면 우편번호 · 주소가 채워진다 — 앱과 같다 */}
            <PostcodeField
              id="co-post"
              value={post}
              onChange={setPost}
              onSelect={({ zonecode, address }) => {
                setPost(zonecode);
                setAddress1(address);
              }}
              detailInputId="co-address2"
            />
            <Field
              id="co-address1"
              label="주소"
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="도로명 또는 지번 주소"
            />
            <Field
              id="co-address2"
              label="상세 주소"
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="층 · 호수 등"
              className="md:col-span-2"
            />
          </div>
        </Panel>

        {/* 소개 */}
        <Panel kicker="소개" title="회사 소개">
          <div className="flex flex-col gap-4">
            <TextareaField
              id="co-intro"
              label="회사 소개"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="고객에게 보여 줄 한두 문장. 시공 경력 · 주력 공종 · 지역을 적으면 좋습니다."
            />
            <TextareaField
              id="co-bigo"
              label="비고"
              value={bigo}
              onChange={(e) => setBigo(e.target.value)}
              rows={2}
              placeholder="내부 메모 (고객에게 보이지 않습니다)"
            />
          </div>
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <p className="text-[12.5px] text-boss-text-secondary">
            {isEdit ? '변경한 내용은 저장을 눌러야 반영됩니다.' : '회사명은 필수입니다.'}
          </p>
          <div className="flex items-center gap-2">
            <ButtonLink href="/boss/me" variant="secondary">
              취소
            </ButtonLink>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '저장 중…' : isEdit ? '저장' : '회사 등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* 우: 안내 */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[104px]">
        <section className="boss-card p-5">
          <p className="boss-kicker">어디에 쓰이나</p>
          <ul className="mt-2 space-y-2 text-[12.5px] leading-relaxed text-boss-text-soft">
            <li className="flex gap-1.5">
              <span className="mt-[7px] h-1 w-1 flex-none bg-boss-primary" aria-hidden />
              <span>회사명 · 사업자등록번호는 화면 상단 회사 태그에 표시됩니다.</span>
            </li>
            <li className="flex gap-1.5">
              <span className="mt-[7px] h-1 w-1 flex-none bg-boss-primary" aria-hidden />
              <span>활동 지역은 견적 요청 알림 대상 지역으로 쓰입니다.</span>
            </li>
            <li className="flex gap-1.5">
              <span className="mt-[7px] h-1 w-1 flex-none bg-boss-primary" aria-hidden />
              <span>로고 · 도장 · 소개는 고객에게 보이는 견적서 브랜딩에 쓰입니다.</span>
            </li>
          </ul>
        </section>

        <section className="boss-card p-5">
          <p className="boss-kicker">필수 항목</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-soft">
            <span className={name.trim() ? 'text-boss-text-secondary line-through' : 'font-semibold text-boss-error'}>
              · 회사명
            </span>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-boss-text-secondary">
            나머지 항목은 선택입니다. 사업자등록번호와 대표 전화까지 채우면 고객이 견적서를 더 믿습니다.
          </p>
        </section>
      </aside>
      <RegionPicker
        open={regionOpen}
        value={region}
        onCancel={() => setRegionOpen(false)}
        onSave={(r) => {
          setRegion(r);
          setRegionOpen(false);
        }}
      />
    </form>
  );
}

// ── 로고 · 도장 자리 — 사각 자리표시자 + 이미지 선택 / 삭제 ──────────────────
function ImageSlot({
  label,
  placeholderLabel,
  src,
  alt,
  inputRef,
  onFile,
  onDelete,
  canUpload,
  canDelete,
}: {
  label: string;
  placeholderLabel: string;
  src: string;
  alt: string;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
  onDelete: () => void;
  canUpload: boolean;
  canDelete: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!canUpload}
        aria-label={`${label} 이미지 선택`}
        className="block h-32 w-full border border-boss-border bg-boss-inset transition-colors duration-[120ms] ease-out hover:border-boss-border-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-contain p-2" />
        ) : (
          <Placeholder className="h-full w-full" label={placeholderLabel} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="mt-2 flex gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={!canUpload}
        >
          {src ? '바꾸기' : '이미지 선택'}
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="!text-boss-text-muted hover:!text-boss-error"
          >
            삭제
          </Button>
        )}
      </div>
    </div>
  );
}
