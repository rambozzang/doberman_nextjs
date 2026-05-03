'use client';

// 사장님 FAQ
// Flutter 원본: lib/app/setting/faq_page.dart
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Search } from 'lucide-react';

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
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 설정
        </Link>
        <h1 className="text-xl font-bold text-white">자주 묻는 질문</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="궁금한 것을 빠르게 검색해보세요."
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/40 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelected(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selected === cat
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">검색 결과가 없습니다.</div>
        ) : (
          filtered.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div key={`${item.q}-${idx}`} className="border-b border-slate-800/70 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-emerald-400">{item.category}</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{item.q}</div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="border-t border-slate-800/70 bg-slate-950/40 px-4 py-4 text-sm leading-relaxed text-slate-300">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
