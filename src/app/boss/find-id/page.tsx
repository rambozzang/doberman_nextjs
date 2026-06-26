'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import type { BossFindIdRequest } from '@/types/boss';
import {
  Building2,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
} from 'lucide-react';

export default function BossFindIdPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (phone.length !== 11) {
      toast.error('휴대폰 번호 11자리를 입력해주세요.');
      return;
    }
    setLoading(true);
    setFoundId(null);
    try {
      const payload: BossFindIdRequest = { name: name.trim(), phone: phone.trim() };
      const res = await bossAuthApi.findId(payload);
      if (res.success) {
        const id = res.data?.userId;
        if (id) {
          setFoundId(id);
          toast.success('아이디를 찾았습니다.');
        } else {
          toast.success(res.message || '등록된 이메일로 아이디를 발송했습니다.');
        }
      } else {
        toast.error(res.message || res.error || '아이디 찾기에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss find-id error', err);
      toast.error('아이디 찾기 중 오류가 발생했습니다.');
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

          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-boss-text">
              아이디를
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                잊으셨나요?
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-boss-text-muted">
              가입 시 등록하신 이름과 휴대폰 번호로 아이디를 찾아드립니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-boss-text-muted">
            <ShieldCheck size={13} className="text-boss-primary" />
            <span>본인 확인 후 안전하게 안내드립니다.</span>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <Link
              href="/boss/login"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-boss-text-muted hover:text-boss-primary"
            >
              <ArrowLeft size={13} /> 로그인으로 돌아가기
            </Link>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-boss-text">아이디 찾기</h2>
              <p className="mt-2 text-sm text-boss-text-muted">
                가입 시 등록한 이메일로 아이디를 발송합니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  휴대폰 번호
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

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-boss-primary to-boss-primary-hover text-sm font-semibold text-boss-text shadow-boss-md transition-all hover:from-boss-primary-hover hover:to-boss-primary disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    조회 중...
                  </span>
                ) : (
                  <>
                    아이디 찾기
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {foundId && (
              <div className="mt-6 rounded-lg border border-boss-primary/30 bg-boss-primary/10 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-boss-primary">
                  <Mail size={13} />
                  찾은 아이디
                </div>
                <p className="mt-1 text-base font-bold text-boss-text">{foundId}</p>
                <Link
                  href="/boss/login"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-boss-primary hover:text-boss-primary"
                >
                  로그인하러 가기 <ArrowRight size={12} />
                </Link>
              </div>
            )}

            <p className="mt-6 text-center text-[11px] text-boss-text-muted">
              비밀번호를 잊으셨나요?{' '}
              <Link href="/boss/find-password" className="font-medium text-boss-primary hover:text-boss-primary">
                비밀번호 찾기
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
