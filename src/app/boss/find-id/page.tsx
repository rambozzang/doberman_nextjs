'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import type { BossFindIdRequest } from '@/types/boss';
import { Building2, User, Phone, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/boss/ui';

export default function BossFindIdPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(false);

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
    setFound(false);
    try {
      const payload: BossFindIdRequest = { name: name.trim(), phone: phone.trim() };
      const res = await bossAuthApi.findId(payload);
      if (res.success && res.data === true) {
        setFound(true);
        toast.success(res.message || '회원가입 시 등록된 이메일로 아이디를 발송했습니다.');
      } else {
        toast.error(res.message || res.error || '일치하는 사용자를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('boss find-id error', err);
      toast.error('아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-boss-border bg-boss-surface p-12 lg:flex">
        <Link href="/boss" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-boss-elevated ring-1 ring-inset ring-boss-border">
            <Building2 size={18} className="text-boss-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-boss-text">도배르만</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-boss-text-muted">PRO Workspace</p>
          </div>
        </Link>

        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-boss-text">
            아이디를
            <br />
            잊으셨나요?
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-boss-text-muted">
            가입 시 등록하신 이름과 휴대폰 번호로 아이디를 찾아드립니다.
          </p>
        </div>

        <div className="text-xs text-boss-text-muted">본인 확인 후 안전하게 안내드립니다.</div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/boss/login" className="mb-6 inline-flex items-center gap-1.5 text-xs text-boss-text-muted hover:text-boss-primary">
            <ArrowLeft size={13} /> 로그인으로 돌아가기
          </Link>

          <div className="mb-7">
            <h2 className="text-xl font-semibold tracking-tight text-boss-text">아이디 찾기</h2>
            <p className="mt-1 text-sm text-boss-text-muted">
              가입 시 등록한 이메일로 아이디를 발송합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="boss-label">이름</label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="boss-input pl-10"
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="boss-label">휴대폰 번호</label>
              <div className="relative">
                <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="boss-input pl-10"
                  placeholder="01012345678"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full">
              {loading ? '조회 중...' : '아이디 찾기'}
            </Button>
          </form>

          {found && (
            <div className="mt-6 rounded-lg border border-boss-primary/30 bg-boss-primary/10 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-boss-primary">
                <Mail size={13} /> 아이디 안내 발송 완료
              </div>
              <p className="mt-1 text-sm text-boss-text">
                회원가입 시 등록된 이메일로 아이디를 발송했습니다.
              </p>
              <Link href="/boss/login" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-boss-primary">
                로그인하러 가기
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-boss-text-muted">
            비밀번호를 잊으셨나요?{' '}
            <Link href="/boss/find-password" className="font-medium text-boss-primary">비밀번호 찾기</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
