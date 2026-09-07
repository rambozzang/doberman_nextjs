'use client';

// 회사 등록 — Industry 패턴 (참조 04 매물 등록 : 긴 폼 + 우측 안내 패널)
//
//   lg↑ grid minmax(0,1fr) + 280px
//   좌: 사업자 정보 → 연락처 → 주소 → 소개, 각각 패널 + 2열 grid(Field) → 하단 액션 패널
//   우: 안내 패널(필수 항목 · 등록 뒤에 할 일)
//   화면 제목 · 상위 링크(← 회사 정보)는 헤더(PAGE_META)가 그린다.
//   로고 · 도장은 등록 뒤 회사 정보 화면에서 올린다(업로드 API 가 companyId 를 받는다).

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossCompanyData } from '@/types/boss';
import { Button, ButtonLink, Field, Panel, Skeleton, TextareaField } from '@/components/boss/ui';
import PostcodeField from '@/components/boss/PostcodeField';

export default function BossCompanyNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [bizno, setBizno] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [post, setPost] = useState('');
  const [region, setRegion] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [type, setType] = useState('');
  const [kind, setKind] = useState('');
  const [url, setUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [bigo, setBigo] = useState('');

  useEffect(() => {
    const cached = BossAuthManager.getUserInfo();
    if (!cached?.userId) {
      toast.error('로그인이 필요합니다.');
      router.replace('/boss/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('회사명을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload: BossCompanyData = {
        name: name.trim(),
        owner: owner.trim(),
        bizno: bizno.trim(),
        phone: phone.trim(),
        fax: fax.trim(),
        email: email.trim(),
        post: post.trim(),
        region: region.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        type: type.trim(),
        kind: kind.trim(),
        url: url.trim(),
        intro: intro.trim(),
        bigo: bigo.trim(),
      };

      const res = await bossCompanyApi.create(payload);
      if (res.success && res.data) {
        const cached = BossAuthManager.getUserInfo();
        if (cached && res.data.id) {
          BossAuthManager.setUserInfo({ ...cached, companyId: res.data.id });
        }

        toast.success('회사가 등록되었습니다.');
        router.replace('/boss/me/company');
      } else {
        toast.error(res.message || res.error || '등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('boss company create error', err);
      toast.error('등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="boss-card p-5" aria-busy>
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* 좌: 폼 */}
      <div className="flex min-w-0 flex-col gap-4">
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
              autoFocus
              maxLength={50}
            />
            <Field
              id="co-owner"
              label="대표자명"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="홍길동"
              maxLength={50}
            />
            <Field
              id="co-bizno"
              label="사업자등록번호"
              type="text"
              value={bizno}
              onChange={(e) => setBizno(e.target.value)}
              placeholder="123-45-67890"
              className="[&_input]:font-boss-head [&_input]:tabular-nums"
              maxLength={12}
            />
            <Field
              id="co-region"
              label="활동 지역"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="서울 강남구"
              hint="견적 요청 알림을 받을 지역입니다."
              maxLength={50}
            />
            <Field
              id="co-type"
              label="업태"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="서비스업"
              maxLength={50}
            />
            <Field
              id="co-kind"
              label="종목"
              type="text"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="도배"
              maxLength={50}
            />
          </div>
        </Panel>

        <Panel kicker="연락처" title="연락처">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="co-phone"
              label="대표 전화"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-1234-5678"
              maxLength={20}
            />
            <Field
              id="co-fax"
              label="팩스"
              type="tel"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              placeholder="02-1234-5679"
              maxLength={20}
            />
            <Field
              id="co-email"
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="company@example.com"
              maxLength={100}
            />
            <Field
              id="co-url"
              label="홈페이지"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              maxLength={500}
            />
          </div>
        </Panel>

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
              maxLength={200}
            />
            <Field
              id="co-address2"
              label="상세 주소"
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="층 · 호수 등"
              className="md:col-span-2"
              maxLength={200}
            />
          </div>
        </Panel>

        <Panel kicker="소개" title="회사 소개">
          <div className="flex flex-col gap-4">
            <TextareaField
              id="co-intro"
              label="회사 소개"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="고객에게 보여 줄 한두 문장. 시공 경력 · 주력 공종 · 지역을 적으면 좋습니다."
              maxLength={2000}
            />
            <TextareaField
              id="co-bigo"
              label="비고"
              value={bigo}
              onChange={(e) => setBigo(e.target.value)}
              rows={2}
              placeholder="내부 메모 (고객에게 보이지 않습니다)"
              maxLength={2000}
            />
          </div>
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <p className="text-[12.5px] text-boss-text-secondary">회사명만 있어도 등록됩니다.</p>
          <div className="flex items-center gap-2">
            <ButtonLink href="/boss/me/company" variant="secondary">
              취소
            </ButtonLink>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '등록 중…' : '회사 등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* 우: 안내 */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[104px]">
        <section className="boss-card p-5">
          <p className="boss-kicker">필수 항목</p>
          <p className="mt-2 text-[12.5px] leading-relaxed">
            <span className={name.trim() ? 'text-boss-text-secondary line-through' : 'font-semibold text-boss-error'}>
              · 회사명
            </span>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-boss-text-secondary">
            나머지는 선택입니다. 사업자등록번호와 대표 전화까지 채우면 고객이 견적서를 더 믿습니다.
          </p>
        </section>

        <section className="boss-card p-5">
          <p className="boss-kicker">등록 뒤에</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-soft">
            등록이 끝나면 회사 정보 화면으로 이동합니다. 로고 · 도장 이미지는 그 화면에서 올릴 수
            있습니다.
          </p>
        </section>
      </aside>
    </form>
  );
}
