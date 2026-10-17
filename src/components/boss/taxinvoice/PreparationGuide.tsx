// 전자세금계산서 시작 전 준비 안내 — 본문
//
// 독립 화면(/boss/tax-invoice/guide)과 등록 화면의 안내 대화상자가 같은 본문을 쓴다.
// 등록 화면은 작성 중인 신청서가 사라지지 않게 화면을 옮기지 않고 대화상자로 띄운다.
// API · 개인정보 · 저장소를 쓰지 않는 정적 본문이라 훅이 없다(서버 · 클라이언트 어디서든 그린다).
// "5초"는 준비물을 읽는 시간이다 — 등록 · 발급이 몇 초 만에 끝난다고 약속하지 않고, 비용 · 소요 시간도 적지 않는다.
// 320px · 큰 글꼴에서도 자르지 않고 줄바꿈으로 버틴다. 색은 boss-* 토큰만 쓴다.

import type { ReactNode } from 'react';
import { ArrowDown, ArrowRight, ChevronDown } from 'lucide-react';
import { ELECTRONIC_TAX_INVOICE_OPEN } from '@/lib/boss/electronicTaxInvoiceLaunch';
import { Note } from './RegistrationParts';

const FLOW = [
  { where: '도배르만에서', what: '신청' },
  { where: '연결된 팝빌 화면에서', what: '인증서 등록' },
  { where: '도배르만에서', what: '발급' },
];

// 근거: 팝빌 개발자센터 — 연동회원 가입은 연동 서비스가 API로 처리, 인증서는 최초 1회 사전 등록(금융거래용은 불가)
const FAQ = [
  {
    q: '인증서가 없어요',
    a: '은행이나 인증기관에서 전자세금계산서용 또는 사업자 범용 공동인증서를 먼저 발급받아 주세요. 금융인증서와 일반 인터넷뱅킹용 인증서는 현재 연동에서 사용할 수 없어요.',
  },
  {
    q: '인증서는 매번 등록하나요?',
    a: '처음에 사업자별로 등록하면 돼요. 같은 사업장의 직원마다 따로 준비할 필요는 없고, 인증서를 갱신하거나 바꿨을 때 다시 등록해 주세요.',
  },
  {
    q: '현금영수증만 쓰고 싶어요',
    a: '현금영수증은 공동인증서 등록 없이 이용할 수 있어요. 사업자 정보 등록과 서비스 연동을 마치면 발급 가능 여부를 안내해 드려요.',
  },
];

/** cta — 독립 화면은 등록 화면으로 가는 링크, 대화상자는 하단 버튼을 쓰므로 넘기지 않는다 */
export default function PreparationGuide({ cta }: { cta?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12.5px] font-semibold text-boss-primary">준비물 확인은 5초</p>
        <h2 className="mt-1 break-keep font-boss-head text-[24px] font-semibold leading-tight tracking-[-0.01em] text-boss-text sm:text-[28px]">
          세금계산서, 시작은 간단하게
        </h2>
        <p className="mt-2 break-keep text-[16px] leading-relaxed text-boss-text-soft">시작 전, 딱 두 가지만 준비해 주세요.</p>
      </div>

      <ol aria-label="준비물" className="grid gap-3 sm:grid-cols-2">
        <Item n={1} title="사업자 정보">
          <p>내정보에 등록했다면 자동으로 불러와요.</p>
        </Item>
        <Item n={2} title="사업자용 공동인증서">
          <p>전자세금계산서용 또는 사업자 범용을 준비해 주세요.</p>
        </Item>
      </ol>

      <section aria-labelledby="tax-guide-flow">
        <h3 id="tax-guide-flow" className="boss-section-title">
          이렇게 진행돼요
        </h3>
        <ol className="mt-3 grid gap-6 sm:grid-cols-3 sm:gap-7">
          {FLOW.map((s, i) => (
            <li key={s.what} className="boss-card-inset px-4 py-3">
              <span className="block break-keep text-[13px] text-boss-text-secondary">{s.where}</span>
              <span className="mt-0.5 block break-keep text-[17px] font-semibold text-boss-text">{s.what}</span>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowDown
                    aria-hidden
                    size={16}
                    strokeWidth={1.75}
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-boss-text-muted sm:hidden"
                  />
                  <ArrowRight
                    aria-hidden
                    size={16}
                    strokeWidth={1.75}
                    className="absolute -right-[22px] top-1/2 hidden -translate-y-1/2 text-boss-text-muted sm:block"
                  />
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 break-keep text-[14px] leading-relaxed text-boss-text-secondary">
          팝빌 홈페이지에 따로 가입하지 않아도 돼요. 연동 가입은 도배르만에서 함께 처리해요.
        </p>
      </section>

      {!ELECTRONIC_TAX_INVOICE_OPEN && <Note>곧 정식 오픈해요. 지금 미리 준비해 둘 수 있고, 실제 연동은 설정이 끝나면 안내해 드려요.</Note>}

      {cta}

      <section aria-labelledby="tax-guide-faq">
        <h3 id="tax-guide-faq" className="boss-section-title">
          더 궁금하다면
        </h3>
        <div className="mt-3 border border-boss-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-boss-border-row last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-boss-text transition-colors duration-[120ms] ease-out hover:bg-boss-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-boss-primary group-open:bg-boss-elevated [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 break-keep">{f.q}</span>
                <ChevronDown
                  aria-hidden
                  size={16}
                  strokeWidth={1.75}
                  className="flex-none text-boss-text-muted transition-transform duration-[120ms] group-open:rotate-180"
                />
              </summary>
              <p className="break-keep border-t border-boss-border-row bg-boss-inset px-4 py-3.5 text-[14.5px] leading-[1.75] text-boss-text-soft">
                {f.a}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-3 break-keep text-[12px] leading-relaxed text-boss-text-secondary">
          사업자 확인과 인증서 준비에 따라 등록 시간은 달라요.
        </p>
      </section>
    </div>
  );
}

function Item({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="boss-card-inset flex gap-3.5 p-4">
      <span aria-hidden className="font-boss-head text-[28px] font-semibold leading-none tabular-nums text-boss-primary">
        {n}
      </span>
      <div className="min-w-0 flex-1 break-keep text-[14.5px] leading-relaxed text-boss-text-secondary">
        <h3 className="boss-section-title">{title}</h3>
        <div className="mt-1.5">{children}</div>
      </div>
    </li>
  );
}
