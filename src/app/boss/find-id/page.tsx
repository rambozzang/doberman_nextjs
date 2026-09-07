'use client';

// 아이디 찾기 — Industry 패턴 (로그인과 같은 380px 열, AuthFrame)
//
// 이름 + 휴대폰으로 조회하면 등록된 이메일로 아이디를 보낸다. 성공 시 화면 안 안내 상자로
// "어디로 보냈는지 + 다음 행동(로그인)" 을 보여 준다. 조회 로직은 그대로다.

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossAuthApi } from '@/lib/api/boss/auth';
import type { BossFindIdRequest } from '@/types/boss';
import { AlertBanner, Button, Field } from '@/components/boss/ui';
import { AuthFrame } from '@/components/boss/AuthFrame';

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
    <AuthFrame
      title="아이디 찾기"
      description="가입 때 적은 이름과 휴대폰 번호가 맞으면 등록된 이메일로 아이디를 보내 드립니다"
      footer={
        <>
          이메일을 받지 못하셨나요? 스팸함을 확인하시고, 그래도 없으면 고객센터로 문의해 주세요.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="boss-card p-6">
        <Field
          id="name"
          label="이름"
          required
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          autoFocus
          maxLength={50}
        />
        <Field
          id="phone"
          label="휴대폰 번호"
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="01012345678"
          hint="- 없이 숫자 11자리"
          className="mt-4"
        />

        {found && (
          <div className="mt-4">
            <AlertBanner
              tone="info"
              action={
                <Link
                  href="/boss/login"
                  className="boss-btn boss-btn-sm boss-btn-primary"
                >
                  로그인하러 가기
                </Link>
              }
            >
              가입 때 등록한 이메일로 아이디를 보냈습니다.
            </AlertBanner>
          </div>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="mt-5 w-full py-3">
          {loading ? '조회 중…' : '아이디 찾기'}
        </Button>

        <p className="mt-5 border-t border-boss-border pt-4 text-center text-[12.5px] text-boss-text-secondary">
          비밀번호를 잊으셨나요?{' '}
          <Link
            href="/boss/find-password"
            className="font-semibold text-boss-primary underline underline-offset-2"
          >
            비밀번호 찾기
          </Link>
        </p>
        <p className="mt-2 text-center text-[12.5px] text-boss-text-secondary">
          <Link href="/boss/login" className="font-semibold text-boss-primary underline underline-offset-2">
            로그인으로 돌아가기
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
