'use client';

// 자주 묻는 질문 — Industry 패턴
//
//   필터 줄: ListTabs(카테고리) + 검색(boss-input) + 우측 "전체 n건"
//   → 패널 안 행 리스트(사각 아코디언). 행 = 카테고리 태그 + 질문 + ›(펼침 시 ⌄)
//   화면 제목은 헤더(PAGE_META)가 그린다. /boss/help/faq 도 이 화면을 그대로 쓴다.
//
// Flutter 원본: lib/app/setting/faq_page.dart

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ContentCard, EmptyState, ListTabs, SearchInput, Tag } from '@/components/boss/ui';

type FaqItem = {
  category: string;
  q: string;
  a: string;
};

const FAQ_CATEGORIES = [
  '전체',
  'TOP10',
  '사건수임',
  '견적서',
  '사전정보',
  '보험가입',
  '지급정보',
  '대출금',
  '상환말소',
  '접수번호',
  '서류등록',
  '회원정보',
  '기타',
];

const FAQ_LIST: FaqItem[] = [
  {
    category: 'TOP10',
    q: '도베르만은 어떤 서비스인가요?',
    a: '도베르만은 인테리어 사장님을 위한 견적, 일정, 고객, 결제 관리를 한 곳에서 처리할 수 있는 B2B SaaS 입니다.',
  },
  {
    category: '회원정보',
    q: '회원가입은 어떻게 하나요?',
    a: '메인 화면 우측 상단의 회원가입 버튼을 통해 사업자등록번호 인증 후 가입하실 수 있습니다.',
  },
  {
    category: '회원정보',
    q: '비밀번호를 분실했습니다.',
    a: '로그인 화면의 "비밀번호 찾기" 메뉴를 이용해주세요. 가입 시 등록한 휴대폰 번호로 본인인증 후 재설정하실 수 있습니다.',
  },
  {
    category: '견적서',
    q: '견적서는 어떻게 작성하나요?',
    a: '견적 메뉴 → 새 견적 작성에서 고객 정보, 항목, 단가, 총액을 입력 후 저장하시면 됩니다. 저장된 견적은 PDF로 출력 및 공유할 수 있습니다.',
  },
  {
    category: '견적서',
    q: '작성한 견적서를 고객에게 어떻게 전달하나요?',
    a: '견적서 상세 화면의 공유 버튼을 통해 카카오톡, 문자, 이메일로 전송하거나 PDF로 다운로드 하실 수 있습니다.',
  },
  {
    category: '사건수임',
    q: '견적 요청은 어디에서 확인하나요?',
    a: '메인 대시보드 또는 "견적 요청" 메뉴에서 신규 요청을 실시간으로 확인하실 수 있습니다.',
  },
  {
    category: '지급정보',
    q: '결제는 어떤 방법으로 가능한가요?',
    a: '신용카드, 계좌이체, 정기 구독 결제(월/연 단위)를 지원합니다. 결제 메뉴에서 상세 정보를 확인할 수 있습니다.',
  },
  {
    category: '기타',
    q: '서비스 이용 중 오류가 발생했어요.',
    a: '고객센터(앱 내 1:1 문의)로 문의해주시면 빠른 시간 내에 답변드리겠습니다.',
  },
  {
    category: '기타',
    q: '회원 탈퇴는 어떻게 하나요?',
    a: '설정 → 탈퇴하기 메뉴를 통해 진행하실 수 있습니다. 단, 1년간 재가입이 불가능하며 데이터는 모두 삭제됩니다.',
  },
];

const CATEGORY_TABS = FAQ_CATEGORIES.map((c) => ({ key: c, label: c }));

export default function BossFaqPage() {
  const [selected, setSelected] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      if (selected !== '전체' && item.category !== selected) return false;
      if (!keyword.trim()) return true;
      const k = keyword.trim();
      return item.q.includes(k) || item.a.includes(k);
    });
  }, [selected, keyword]);

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-col gap-2.5">
        <ListTabs tabs={CATEGORY_TABS} active={selected} onChange={setSelected} />
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            placeholder="질문 · 답변 검색"
            hint={false}
            className="w-full sm:w-[280px]"
          />
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
            전체 {filtered.length}건
          </span>
        </div>
      </div>

      <ContentCard>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="맞는 질문이 없습니다"
              description={
                keyword.trim()
                  ? `"${keyword.trim()}" 이(가) 들어간 질문이 없습니다. 다른 단어로 검색하거나 카테고리를 전체로 바꿔보세요.`
                  : '이 카테고리에는 아직 등록된 질문이 없습니다. 전체 카테고리에서 찾아보세요.'
              }
            />
          </div>
        ) : (
          filtered.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div key={`${item.q}-${idx}`} className="border-b border-boss-border-row last:border-b-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIdx(open ? null : idx)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-[120ms] ease-out hover:bg-boss-elevated ${
                    open ? 'bg-boss-elevated' : ''
                  }`}
                >
                  <Tag tone="neutral" className="w-[64px] justify-center">
                    {item.category}
                  </Tag>
                  <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-boss-text">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={1.75}
                    className={`flex-none text-boss-text-ghost transition-transform duration-[120ms] ${
                      open ? 'rotate-180 text-boss-text-secondary' : ''
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-boss-border-row bg-boss-inset px-5 py-4 text-[13.5px] leading-[1.75] text-boss-text-soft">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </ContentCard>
    </div>
  );
}
