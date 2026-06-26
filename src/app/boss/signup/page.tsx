'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import { BossAuthManager } from '@/lib/bossAuth';
import { ensureDeviceId } from '@/lib/bossDeviceId';
import type { BossSignupRequest } from '@/types/boss';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  IdCard,
  ArrowLeft,
} from 'lucide-react';

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

    setLoading(true);
    try {
      const payload: BossSignupRequest = {
        userId: userId.trim(),
        password,
        name: name.trim(),
        phone: phoneDigits,
        email: email.trim(),
        companyId: 0,
        fcmToken: '',
        deviceId: ensureDeviceId() ?? '',
      };
      const res = await bossAuthApi.register(payload);
      if (res.success && res.data?.token) {
        BossAuthManager.setToken(res.data.token);
        if (res.data.userInfo) BossAuthManager.setUserInfo(res.data.userInfo);
        toast.success('가입이 완료되었습니다!');
        router.replace('/boss');
      } else {
        toast.error(res.message || res.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss signup error', err);
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-boss-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-boss-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-boss-info/10 blur-[120px]" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <aside className="hidden flex-col justify-between border-r border-boss-border p-12 lg:flex">
          <Link href="/boss" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-boss-primary-hover shadow-boss-md shadow-emerald-500/30">
              <Building2 size={20} className="text-boss-text" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-boss-text">도배르만</p>
              <p className="text-[11px] font-medium text-boss-primary">PRO Workspace</p>
            </div>
          </Link>

          <div className="space-y-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-boss-primary/20 bg-boss-primary/5 px-3 py-1">
              <Sparkles size={11} className="text-boss-primary" />
              <span className="text-[11px] font-medium text-boss-primary">무료로 시작하세요</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-boss-text">
              지금 가입하고
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                도배 사업을 키우세요
              </span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-boss-text-muted">
              가입 후 바로 견적·시공·매출 관리 도구를 사용할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-boss-text-muted">
            <ShieldCheck size={13} className="text-boss-primary" />
            <span>SSL 암호화 · 안전한 가입 절차</span>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <Link
              href="/boss/login"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-boss-text-muted hover:text-boss-primary"
            >
              <ArrowLeft size={13} /> 로그인으로 돌아가기
            </Link>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-boss-text">사장님 회원가입</h2>
              <p className="mt-2 text-sm text-boss-text-muted">도배 사장님 전용 계정을 만드세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 아이디 + 중복확인 */}
              <div>
                <label htmlFor="userId" className="mb-1.5 block text-xs font-medium text-boss-text-secondary">
                  아이디
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IdCard
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-boss-text-muted"
                    />
                    <input
                      id="userId"
                      type="text"
                      value={userId}
                      onChange={(e) => {
                        setUserId(e.target.value);
                        setIsIdChecked(false);
                        setIdCheckOk(false);
                        setIdCheckMessage(null);
                      }}
                      className="h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-surface focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                      placeholder="영문/숫자 6자 이상"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckId}
                    disabled={checkingId}
                    className="h-11 shrink-0 rounded-lg border border-boss-border bg-boss-surface px-4 text-xs font-semibold text-boss-text hover:border-boss-primary/30 hover:text-boss-primary disabled:opacity-50"
                  >
                    {checkingId ? '확인 중' : '중복확인'}
                  </button>
                </div>
                {idCheckMessage && (
                  <p
                    className={`mt-1.5 flex items-center gap-1 text-[11px] ${
                      idCheckOk ? 'text-boss-primary' : 'text-boss-error'
                    }`}
                  >
                    {idCheckOk ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {idCheckMessage}
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-boss-text-secondary">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-boss-text-muted"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-10 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-surface focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                    placeholder="6자 이상"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-boss-text-muted hover:text-boss-text-secondary"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* 이름 + 전화 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-boss-text-secondary">
                    이름
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-boss-text-muted"
                    />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-surface focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                      placeholder="홍길동"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-boss-text-secondary">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-boss-text-muted"
                    />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-surface focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                      placeholder="01012345678"
                    />
                  </div>
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-boss-text-secondary">
                  이메일
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-boss-text-muted"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-boss-border bg-boss-surface pl-10 pr-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-surface focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-boss-primary to-boss-primary-hover text-sm font-semibold text-boss-text shadow-boss-md transition-all hover:from-boss-primary-hover hover:to-boss-primary disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    가입 중...
                  </span>
                ) : (
                  <>
                    가입하기
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] text-boss-text-muted">
              이미 계정이 있으신가요?{' '}
              <Link href="/boss/login" className="font-medium text-boss-primary hover:text-boss-primary">
                로그인
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
