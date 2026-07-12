'use client';

import { FormEvent, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossUserApi } from '@/lib/api/boss/user';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossUserInfo } from '@/types/boss';
import { User, Mail, Phone, Save, Loader2, IdCard } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/boss/ui';

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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-boss-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="내 정보 수정"
        breadcrumbs={[{ label: '내 정보', href: '/boss/me' }, { label: '수정' }]}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="boss-label">아이디 (수정 불가)</label>
            <div className="relative">
              <IdCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
              <input
                type="text"
                value={userId}
                readOnly
                className="boss-input cursor-not-allowed bg-boss-elevated pl-10 opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="boss-label">이름</label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={15}
                  className="boss-input pl-10"
                  placeholder="홍길동"
                />
              </div>
            </div>
            <div>
              <label className="boss-label">닉네임</label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
                <input
                  type="text"
                  value={nickNm}
                  onChange={(e) => setNickNm(e.target.value)}
                  maxLength={15}
                  className="boss-input pl-10"
                  placeholder="닉네임"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="boss-label">휴대폰 번호</label>
            <div className="relative">
              <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
              <input
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

          <div>
            <label className="boss-label">이메일</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-boss-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="boss-input pl-10"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-boss-border pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Save} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
