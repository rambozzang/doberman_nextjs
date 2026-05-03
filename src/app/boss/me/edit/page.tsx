'use client';

import { FormEvent, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';
import { ArrowLeft, User, Mail, Phone, Save, Loader2, IdCard } from 'lucide-react';

export default function BossMyInfoEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [nickNm, setNickNm] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadUser = useCallback(async () => {
    const cached = BossAuthManager.getUserInfo();
    if (!cached?.userId) {
      toast.error('로그인이 필요합니다.');
      router.replace('/boss/login');
      return;
    }
    setLoading(true);
    try {
      const res = await bossUserApi.get(cached.userId);
      if (res.success && res.data) {
        const u = res.data;
        setUserId(u.userId || '');
        setName(u.name || '');
        setNickNm(u.nickNm || '');
        setPhone(u.phone || '');
        setEmail(u.email || '');
      } else {
        toast.error(res.message || res.error || '정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('boss me edit load error', err);
      toast.error('내 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload: BossUserInfo = {
        userId,
        name: name.trim(),
        nickNm: nickNm.trim(),
        phone: phone.trim(),
        email: email.trim(),
        profilePath: '',
      };
      const res = await bossUserApi.update(payload);
      if (res.success) {
        if (res.data) BossAuthManager.setUserInfo(res.data);
        toast.success('수정되었습니다.');
        router.back();
      } else {
        toast.error(res.message || res.error || '수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss me update error', err);
      toast.error('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/me"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={15} /> 뒤로
        </Link>
        <h1 className="text-xl font-bold text-white">내 정보 수정</h1>
        <div className="w-12" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-6"
      >
        <Field label="아이디 (수정 불가)" icon={IdCard}>
          <input
            type="text"
            value={userId}
            readOnly
            className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800/60 pl-10 pr-3 text-sm text-slate-500"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="이름" icon={User}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/10"
              placeholder="홍길동"
            />
          </Field>
          <Field label="닉네임" icon={User}>
            <input
              type="text"
              value={nickNm}
              onChange={(e) => setNickNm(e.target.value)}
              maxLength={15}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/10"
              placeholder="닉네임"
            />
          </Field>
        </div>

        <Field label="휴대폰 번호" icon={Phone}>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/10"
            placeholder="01012345678"
          />
        </Field>

        <Field label="이메일" icon={Mail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/10"
            placeholder="example@email.com"
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save size={15} />
              저장
            </>
          )}
        </button>
      </form>
    </div>
  );
}

type IconType = React.ComponentType<{ size?: number; className?: string }>;

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <div className="relative">
        <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        {children}
      </div>
    </div>
  );
}
