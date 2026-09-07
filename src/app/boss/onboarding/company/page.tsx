'use client';

// 온보딩 — 회사(사업자) 정보 입력 — Industry 패턴 (참조 04 매물 등록 : 긴 폼 + 우측 안내 패널)
//
//   lg↑ grid minmax(0,1fr) + 280px
//   좌: 사업자 정보 → 견적 수신 지역(사각 칩, 최대 3개 · 전국은 단독) → 연락처 → 주소 → 소개
//       → 하단 액션 패널(등록 primary 우측)
//   우: 안내 패널(필수 항목 · 지역 선택 상태 · 다음 단계)
//   화면 제목 · 상위 링크(← 시작하기)는 헤더(PAGE_META)가 그린다.

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossCompanyData } from '@/types/boss';
import { Button, Field, Panel, Skeleton, TextareaField } from '@/components/boss/ui';
import PostcodeField from '@/components/boss/PostcodeField';

// 견적 수신 지역: 최대 3개까지 선택. '전국'은 모든 지역을 의미하므로 단독 선택만 가능하다.
const MAX_RECEIVE_REGIONS = 3;
const NATIONWIDE_REGION = '전국';
const REGION_OPTIONS = [
  NATIONWIDE_REGION,
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청남도',
  '충청북도',
  '전라남도',
  '전라북도',
  '경상남도',
  '경상북도',
  '제주도',
];

const isNationwide = (regions: string[]) => regions.includes(NATIONWIDE_REGION);

export default function BossOnboardingCompanyPage() {
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
  const [regions, setRegions] = useState<string[]>([]);
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

  const toggleRegion = (option: string) => {
    setRegions((prev) => {
      if (option === NATIONWIDE_REGION) {
        return prev.includes(NATIONWIDE_REGION) ? [] : [NATIONWIDE_REGION];
      }

      if (prev.includes(option)) {
        return prev.filter((r) => r !== option);
      }

      // 다른 지역을 고르면 전국은 해제
      const next = prev.filter((r) => r !== NATIONWIDE_REGION);
      if (next.length >= MAX_RECEIVE_REGIONS) {
        toast.error(`지역은 최대 ${MAX_RECEIVE_REGIONS}개까지 선택할 수 있습니다.`);
        return next;
      }
      return [...next, option];
    });
  };

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
        region: regions.join(','),
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

        toast.success('사업자 정보가 등록되었습니다.');
        router.replace('/boss');
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

  const regionSummary = isNationwide(regions)
    ? '전국 (모든 지역 수신)'
    : regions.length === 0
      ? '미선택 — 전국으로 등록됩니다'
      : `${regions.length} / ${MAX_RECEIVE_REGIONS} 선택`;

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* 좌: 폼 */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="border border-boss-primary/35 bg-boss-pill-info px-4 py-3 text-[13px] leading-relaxed text-boss-pill-info-fg">
          <span className="font-bold">견적 답변에는 사업자 정보가 필요합니다.</span> 회사명만 있어도
          등록되고, 나머지는 회사 정보 화면에서 나중에 채울 수 있습니다.
        </div>

        <Panel kicker="사업자" title="사업자 정보">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="ob-name"
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
              id="ob-owner"
              label="대표자명"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="홍길동"
              maxLength={50}
            />
            <Field
              id="ob-bizno"
              label="사업자등록번호"
              type="text"
              value={bizno}
              onChange={(e) => setBizno(e.target.value)}
              placeholder="123-45-67890"
              className="[&_input]:font-boss-head [&_input]:tabular-nums"
              maxLength={12}
            />
            <Field
              id="ob-type"
              label="업태"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="서비스업"
              maxLength={50}
            />
            <Field
              id="ob-kind"
              label="종목"
              type="text"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="도배"
              maxLength={50}
            />
          </div>
        </Panel>

        {/* 견적 수신 지역 — 사각 칩(참조 Chip). 선택 = accent 테두리 + accent-100 배경 */}
        <Panel
          kicker="알림"
          title="견적 수신 지역"
          right={
            <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
              {regionSummary}
            </span>
          }
        >
          <p className="mb-3 text-[12.5px] leading-relaxed text-boss-text-secondary">
            견적 요청 알림을 받을 지역을 최대 {MAX_RECEIVE_REGIONS}개까지 고릅니다. «전국» 을 고르면 다른
            지역은 풀립니다. 아무것도 고르지 않으면 전국으로 등록됩니다.
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="견적 수신 지역">
            {REGION_OPTIONS.map((option) => {
              const selected = regions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleRegion(option)}
                  className={`border px-2.5 py-[5px] text-[12.5px] transition-colors duration-[120ms] ease-out ${
                    selected
                      ? 'border-boss-primary bg-boss-elevated font-semibold text-boss-pill-info-fg'
                      : 'border-boss-border bg-boss-bg text-boss-text-dim hover:bg-boss-hover'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel kicker="연락처" title="연락처">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              id="ob-phone"
              label="대표 전화"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-1234-5678"
              maxLength={20}
            />
            <Field
              id="ob-fax"
              label="팩스"
              type="tel"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              placeholder="02-1234-5679"
              maxLength={20}
            />
            <Field
              id="ob-email"
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="company@example.com"
              maxLength={100}
            />
            <Field
              id="ob-url"
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
              id="ob-post"
              value={post}
              onChange={setPost}
              onSelect={({ zonecode, address }) => {
                setPost(zonecode);
                setAddress1(address);
              }}
              detailInputId="ob-address2"
            />
            <Field
              id="ob-address1"
              label="주소"
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="도로명 또는 지번 주소"
              maxLength={200}
            />
            <Field
              id="ob-address2"
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
              id="ob-intro"
              label="회사 소개"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="고객에게 보여 줄 한두 문장. 시공 경력 · 주력 공종 · 지역을 적으면 좋습니다."
              maxLength={2000}
            />
            <TextareaField
              id="ob-bigo"
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
          <p className="text-[12.5px] text-boss-text-secondary">
            등록하면 대시보드로 이동합니다.
          </p>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? '등록 중…' : '사업자 정보 등록'}
          </Button>
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
          <p className="boss-kicker">견적 수신 지역</p>
          <p className="mt-1 font-boss-head text-[22px] font-semibold leading-tight tabular-nums text-boss-text">
            {isNationwide(regions) ? '전국' : regions.length === 0 ? '전국' : `${regions.length}곳`}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
            {isNationwide(regions) || regions.length === 0
              ? '모든 지역의 견적 요청 알림을 받습니다.'
              : regions.join(' · ')}
          </p>
        </section>

        <section className="boss-card p-5">
          <p className="boss-kicker">다음 단계</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-boss-text-soft">
            등록이 끝나면 대시보드로 이동합니다. 로고 · 도장은 내 정보 → 회사 정보에서 올릴 수 있습니다.
          </p>
        </section>
      </aside>
    </form>
  );
}
