import type { Metadata } from 'next';
import Link from 'next/link';
import { RATES, SUB_MAT } from '@/lib/quoteCalculator';

export const metadata: Metadata = {
  title: '도배 비용 산정 기준과 자료 | 도배르만',
  description: '도배르만 비용표와 계산기의 면적 기준, 참고 단가, 추가 비용 및 예상 범위 산정 방법을 안내합니다.',
  alternates: { canonical: '/pricing-method' },
  openGraph: { title: '도배 비용 산정 기준과 자료', url: '/pricing-method' },
};

export default function PricingMethodPage() {
  return <article className="mx-auto max-w-4xl px-4 py-24 text-slate-200">
    <h1 className="mb-4 text-3xl font-bold text-white">도배 비용은 어떻게 계산하나요?</h1>
    <p className="mb-8 leading-7">도배르만의 비용표와 계산기는 예산 비교를 위한 참고값입니다. 전국 계약 금액을 통계 조사한 평균이나 업체의 확정 견적이 아닙니다. 실제 계약 전에는 현장 실측과 작업 범위를 확인해 주세요.</p>
    <p className="mb-8 text-sm text-slate-400">작성·관리: 도배르만 운영팀 · 안내 내용 수정일: 2026년 10월 5일</p>
    <section className="mb-10 space-y-3">
      <h2 className="text-xl font-semibold text-white">지역·평형 비용표와 AI 견적</h2>
      <p className="leading-7">지역·평형 페이지는 도배르만에 등록한 평형별 참고표를 사용합니다. 분양평수 기준이며, 벽지 종류·지역·주거 형태의 보정값을 적용합니다. 합지의 기준은 소폭 합지이고 실크는 참고표의 실크 항목입니다. 천연·수입 벽지는 실크 기준값에 소재별 가정 배수를 적용합니다.</p>
      <p className="leading-7">지역·평형 표의 예상 범위는 보정 기준가의 약 ±10%를 만원 단위로 반올림한 값입니다. 통계적 신뢰구간이나 실제 최저·최고 계약 금액이 아닙니다. AI 견적은 시공 범위·추가 요청을 반영하므로 같은 평형이라도 결과가 달라질 수 있습니다.</p>
    </section>
    <section className="mb-10 space-y-3">
      <h2 className="text-xl font-semibold text-white">상세 견적 계산기</h2>
      <p className="leading-7">상세 계산기는 전용면적을 입력합니다. 시공 범위·천장 높이·면적 보정·자재 로스를 반영한 벽지 시공 면적에 자재비와 인건비를 적용하고, 부자재·옵션·마진·할인·부가세 설정을 반영합니다. 지역·평형 참고표와 면적 기준 및 산정 방식이 달라 금액이 같지 않을 수 있습니다.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <caption className="pb-3 text-left text-slate-400">계산기 참고 단가 · 벽지 시공 면적 1평당 · 계약 단가 아님</caption>
        <thead><tr className="border-b border-slate-600"><th className="p-3 text-left">벽지</th><th className="p-3 text-right">자재비</th><th className="p-3 text-right">인건비</th></tr></thead>
        <tbody>{Object.entries(RATES).map(([name, rate]) => <tr key={name} className="border-b border-slate-800"><th scope="row" className="p-3 text-left font-normal">{name}</th><td className="p-3 text-right">{rate.mat.toLocaleString('ko-KR')}원</td><td className="p-3 text-right">{rate.lab.toLocaleString('ko-KR')}원</td></tr>)}</tbody>
      </table></div>
      <p className="leading-7">부자재 기준은 시공 면적 1평당 {SUB_MAT.toLocaleString('ko-KR')}원입니다. 기본 단가와 보정 계수는 도배르만이 관리하는 가정값이며 제조사의 고시 가격이나 공식 전국 평균이 아닙니다.</p>
    </section>
    <section className="mb-10 space-y-3">
      <h2 className="text-xl font-semibold text-white">견적 비교 전에 확인할 조건</h2>
      <p className="leading-7">전용면적과 분양면적을 구분하고, 벽·천장 시공 범위, 소폭·광폭 합지와 실크 등급, 기존 벽지 철거, 곰팡이·퍼티 보수, 가구 이동, 폐기물 처리, 부가세 포함 여부를 같은 조건으로 비교하세요.</p>
      <p className="leading-7">지역 페이지의 업체 수와 견적 요청 수는 도배르만 등록·요청 데이터입니다. 전국 업체 수나 해당 지역의 모든 시공 실적을 뜻하지 않습니다.</p>
    </section>
    <section className="mb-10 space-y-3">
      <h2 className="text-xl font-semibold text-white">제품 정보를 확인할 자료</h2>
      <p className="leading-7">아래 자료는 제품 소재·규격·샘플 확인을 위한 제조사 자료입니다. 도배르만의 시공 가격을 보증하는 자료는 아닙니다.</p>
      <ul className="list-disc space-y-2 pl-5"><li><a className="text-blue-300 underline" href="https://www.didwallpaper.com/collection/seven?code=65434-1">DID 제품 정보: 소재·규격·품번</a></li><li><a className="text-blue-300 underline" href="https://www.shinhanwall.co.kr/cs/consulting_faq.html">KCC신한벽지: 제품·샘플·아파트 특판 안내</a></li></ul>
    </section>
    <div className="flex flex-wrap gap-5"><Link className="text-blue-300 underline" href="/quote-calculator">조건별 비용 계산</Link><Link className="text-blue-300 underline" href="/quote-request">실제 업체 견적 요청</Link></div>
  </article>;
}
