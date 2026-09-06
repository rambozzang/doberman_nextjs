'use client';

// 내 정보 수정 — Industry 패턴 (참조 agent/profile 의 수정 폼)
//
//   패널: 잠긴 항목(아이디 — 입력창이 아니라 kicker + 값) → 2열 grid(Field) → 하단 액션 패널
//   (취소 secondary / 저장 primary 우측). 화면 제목은 헤더(PAGE_META)가 그린다.
//   못 고치는 값은 입력창으로 만들지 않는다 — 잠긴 입력창은 고장난 화면으로 읽힌다.

import { FormEvent, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';
import { Button, Field, Skeleton } from '@/components/boss/ui';

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
        profilePath: BossAuthManager.getUserInfo()?.profilePath,
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
      <div className="boss-card p-5" aria-busy>
        <Skeleton className="h-3 w-12" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section className="boss-card p-5">
        <p className="boss-kicker">프로필</p>
        <h3 className="boss-section-title">내 정보</h3>

        {/* 잠긴 항목 — 아이디는 바꿀 수 없다 */}
        <div className="mt-3 border-b border-boss-border pb-3">
          <p className="boss-mono-label">아이디 (변경 불가)</p>
          <p className="mt-0.5 break-all font-boss-head text-[14px] text-boss-text">{userId || '-'}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            id="me-name"
            label="이름"
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={15}
            placeholder="홍길동"
            autoFocus
          />
          <Field
            id="me-nick"
            label="닉네임"
            type="text"
            value={nickNm}
            onChange={(e) => setNickNm(e.target.value)}
            maxLength={15}
            placeholder="커뮤니티에 보이는 이름"
            hint="커뮤니티 글 · 댓글에 이름 대신 표시됩니다."
          />
          <Field
            id="me-phone"
            label="휴대폰 번호"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="01012345678"
            hint="숫자만 입력합니다. 견적 요청 고객에게 이 번호가 안내됩니다."
          />
          <Field
            id="me-email"
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </div>
      </section>

      {/* 하단 액션 패널 */}
      <div className="boss-card flex flex-wrap items-center justify-end gap-2 px-5 py-3.5">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={saving}>
          취소
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  );
}
