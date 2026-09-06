'use client';

// 사장님 가입 신청 — Industry 패턴 (참조 agent/apply/page.tsx 와 같은 조판)
//
// 로그인 전 화면이라 레일(BossChrome)이 없다. AuthFrame(wide 620px) 안에
// 번호 kicker(01·02·03)를 단 패널 세 장 — 계정 · 담당자 · 회사 — 과 하단 액션 패널.
// 단계 전환은 없다(한 번에 제출). 검증·API 순서(가입 → 회사 생성 → 사용자 갱신)는 그대로다.

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';
import { ensureDeviceId } from '@/lib/bossDeviceId';
import type { BossSignupRequest, BossCompanyData, BossUserInfo } from '@/types/boss';
import { Button, ButtonLink, Field, FieldLabel } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

export default function BossSignupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idCheckMessage, setIdCheckMessage] = useState<string | null>(null);
  const [idCheckOk, setIdCheckOk] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [loading, setLoading] = useState(false);

  // 회사 정보
  const [companyName, setCompanyName] = useState('');
  const [companyOwner, setCompanyOwner] = useState('');
  const [companyBizno, setCompanyBizno] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress1, setCompanyAddress1] = useState('');

  const validateUserId = (v: string) => /^[a-zA-Z0-9]{6,}$/.test(v);
  const validateEmail = (v: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);

  const handleCheckId = async () => {
    if (!validateUserId(userId)) {
      toast.error('아이디는 영문/숫자 조합 6자 이상이어야 합니다.');
      return;
    }
    setCheckingId(true);
    try {
      const res = await bossAuthApi.checkId(userId.trim());
      if (res.success) {
        // available 응답 우선, 아니면 boolean
        const data = res.data;
        let available = false;
        if (typeof data === 'boolean') {
          available = !data; // 백엔드는 중복 여부를 반환
        } else if (data && typeof data === 'object' && 'available' in data) {
          available = !!data.available;
        } else {
          available = true;
        }
        setIsIdChecked(true);
        setIdCheckOk(available);
        setIdCheckMessage(available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
        if (available) toast.success('사용 가능한 아이디입니다.');
        else toast.error('이미 사용 중인 아이디입니다.');
      } else {
        setIsIdChecked(false);
        setIdCheckOk(false);
        setIdCheckMessage(res.message || res.error || '중복 확인에 실패했습니다.');
        toast.error(res.message || res.error || '중복 확인에 실패했습니다.');
      }
    } catch (e) {
      console.error('checkId error', e);
      toast.error('중복 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingId(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateUserId(userId)) {
      toast.error('아이디는 영문/숫자 조합 6자 이상이어야 합니다.');
      return;
    }
    if (!isIdChecked || !idCheckOk) {
      toast.error('아이디 중복 확인이 필요합니다.');
      return;
    }
    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length !== 11) {
      toast.error('휴대폰 번호는 11자리 숫자여야 합니다.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('이메일 형식이 올바르지 않습니다.');
      return;
    }
    if (!companyName.trim()) {
      toast.error('회사명을 입력해주세요.');
      return;
    }
    if (!companyOwner.trim()) {
      toast.error('대표자명을 입력해주세요.');
      return;
    }
    const biznoDigits = companyBizno.replace(/[^\d]/g, '');
    if (biznoDigits.length < 10 || biznoDigits.length > 12) {
      toast.error('사업자등록번호는 10~12자리 숫자여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = ensureDeviceId() ?? '';
      const payload: BossSignupRequest = {
        userId: userId.trim(),
        password,
        name: name.trim(),
        phone: phoneDigits,
        email: email.trim(),
        companyId: 0,
        fcmToken: '',
        deviceId,
      };
      const res = await bossAuthApi.register(payload);
      if (!res.success || !res.data?.token) {
        toast.error(res.message || res.error || '회원가입에 실패했습니다.');
        return;
      }

      BossAuthManager.setToken(res.data.token);
      const registeredUser = res.data.userInfo;
      if (registeredUser) BossAuthManager.setUserInfo(registeredUser);

      // 회사 생성 후 사용자의 companyId 를 연결한다.
      const companyData: BossCompanyData = {
        name: companyName.trim(),
        owner: companyOwner.trim(),
        bizno: biznoDigits,
        phone: companyPhone.replace(/[^\d]/g, '') || undefined,
        address1: companyAddress1.trim() || undefined,
        email: email.trim(),
      };
      const companyRes = await bossCompanyApi.create(companyData);
      if (!companyRes.success || !companyRes.data?.id) {
        toast.error(companyRes.message || companyRes.error || '회사 정보 등록에 실패했습니다.');
        return;
      }

      const companyId = companyRes.data.id;
      const userUpdate: BossUserInfo = {
        ...registeredUser,
        userId: userId.trim(),
        name: name.trim(),
        phone: phoneDigits,
        email: email.trim(),
        companyId,
      };
      const userRes = await bossUserApi.update(userUpdate);
      if (userRes.success && userRes.data) {
        BossAuthManager.setUserInfo(userRes.data);
      }

      toast.success('가입이 완료되었습니다!');
      router.replace('/boss');
    } catch (err) {
      console.error('boss signup error', err);
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      title="사장님 가입 신청"
      description="계정 · 담당자 · 회사 정보를 입력하면 바로 사용할 수 있습니다"
      width="wide"
      footer={
        <>
          가입하면{' '}
          <Link
            href="/boss/help/terms"
            className="underline underline-offset-2 !text-boss-text-secondary hover:!text-boss-text"
          >
            이용약관
          </Link>
          과{' '}
          <Link
            href="/boss/help/privacy"
            className="underline underline-offset-2 !text-boss-text-secondary hover:!text-boss-text"
          >
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Section kicker="01" title="계정">
          {/* 아이디 + 중복확인 — 아이디를 고치면 확인 결과를 지운다 */}
          <div>
            <FieldLabel required htmlFor="userId">
              아이디
            </FieldLabel>
            <div className="flex gap-2">
              <input
                id="userId"
                type="text"
                autoComplete="username"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setIsIdChecked(false);
                  setIdCheckOk(false);
                  setIdCheckMessage(null);
                }}
                className="boss-input min-w-0 flex-1"
                placeholder="영문 · 숫자 6자 이상"
              />
              <Button
                variant="secondary"
                onClick={handleCheckId}
                disabled={checkingId}
                className="h-9 shrink-0"
              >
                {checkingId ? '확인 중…' : '중복 확인'}
              </Button>
            </div>
            <p
              className={`mt-1 text-[12px] leading-relaxed ${
                idCheckMessage
                  ? idCheckOk
                    ? 'text-boss-pill-ok-fg'
                    : 'text-boss-error'
                  : 'text-boss-text-secondary'
              }`}
            >
              {idCheckMessage ?? '중복 확인을 거쳐야 가입할 수 있습니다.'}
            </p>
          </div>

          <div>
            <FieldLabel required htmlFor="password">
              비밀번호
            </FieldLabel>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="boss-input pr-10"
                placeholder="6자 이상"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-boss-text-muted hover:text-boss-text"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={1.75} />
                ) : (
                  <Eye size={15} strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>
        </Section>

        <Section kicker="02" title="담당자">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="name"
              label="이름"
              required
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
            />
            <Field
              id="phone"
              label="휴대폰"
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="01012345678"
              hint="- 없이 숫자 11자리"
            />
          </div>
          <Field
            id="email"
            label="이메일"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            hint="아이디 찾기 안내를 받을 주소입니다."
          />
        </Section>

        <Section
          kicker="03"
          title="회사 정보"
          description="대시보드와 견적서에 표시됩니다. 가입 후 설정에서 바꿀 수 있습니다."
        >
          <Field
            id="companyName"
            label="회사명"
            required
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="(주) 도배르만"
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="companyOwner"
              label="대표자명"
              required
              type="text"
              value={companyOwner}
              onChange={(e) => setCompanyOwner(e.target.value)}
              placeholder="홍길동"
            />
            <Field
              id="companyBizno"
              label="사업자등록번호"
              required
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={companyBizno}
              onChange={(e) => setCompanyBizno(e.target.value.replace(/[^\d-]/g, ''))}
              placeholder="000-00-00000"
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="companyPhone"
              label="회사 전화"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="0212345678"
            />
            <Field
              id="companyAddress1"
              label="기본 주소"
              type="text"
              autoComplete="street-address"
              value={companyAddress1}
              onChange={(e) => setCompanyAddress1(e.target.value)}
              placeholder="서울시 강남구 …"
            />
          </div>
        </Section>

        {/* 하단 액션 패널 — 참조 ListingForm 하단 바 */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          <span className="text-[12.5px] text-boss-text-secondary">
            <span className="text-boss-error">*</span> 표시는 필수 항목입니다
          </span>
          <ButtonLink href="/boss/login" variant="secondary" className="ml-auto">
            취소
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '가입 중…' : '가입하기'}
          </Button>
        </div>

        <p className="text-center text-[12.5px] text-boss-text-secondary">
          이미 계정이 있으신가요?{' '}
          <Link href="/boss/login" className="font-semibold text-boss-primary underline underline-offset-2">
            로그인
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

/** 번호 kicker + 17px 제목을 단 패널 — 참조 apply 의 Section */
function Section({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="boss-card p-5">
      <p className="boss-kicker">{kicker}</p>
      <h2 className="boss-section-title">{title}</h2>
      {description && (
        <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">{description}</p>
      )}
      <div className="mt-3.5 flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
