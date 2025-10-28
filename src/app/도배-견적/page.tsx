import { Metadata } from "next";
import Link from "next/link";
import { 
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  FileTextIcon,
  ShieldCheckIcon,
  PhoneIcon,
  HomeIcon,
  DollarSignIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 견적 | 무료 도배 견적 상담 - 도베르만",
  description: "도배 견적이 궁금하신가요? 전문 기사가 직접 방문하여 정확한 도배 견적을 무료로 산출해드립니다. 지금 바로 신청하세요!",
  keywords: "도배견적, 도배비용, 벽지견적, 도배가격, 무료견적, 도배상담, 인테리어견적, 리모델링견적",
  openGraph: {
    title: "도배 견적 | 무료 도배 견적 상담 - 도베르만",
    description: "전문 기사가 직접 방문하여 정확한 도배 견적을 무료로 산출해드립니다.",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-견적"
  }
};

export default function DobaeGyeonjeokPage() {
  const benefits = [
    {
      icon: DollarSignIcon,
      title: "100% 무료 견적",
      description: "견적 상담부터 현장 방문까지 모든 과정이 완전 무료입니다."
    },
    {
      icon: ClockIcon,
      title: "빠른 견적 산출",
      description: "신청 후 24시간 내 전문 기사가 연락드려 빠르게 견적을 산출합니다."
    },
    {
      icon: CheckCircleIcon,
      title: "정확한 견적",
      description: "현장 방문을 통해 정확하고 합리적인 견적을 제공합니다."
    },
    {
      icon: ShieldCheckIcon,
      title: "투명한 견적서",
      description: "자재비, 인건비 등 모든 항목을 투명하게 공개합니다."
    }
  ];

  const estimateFactors = [
    { factor: "시공 면적", description: "평수에 따른 기본 시공비" },
    { factor: "벽지 종류", description: "일반지, 실크지, 합지 등 벽지 등급" },
    { factor: "작업 난이도", description: "벽면 상태, 기존 벽지 제거 등" },
    { factor: "시공 위치", description: "아파트, 주택, 상가 등 건물 유형" },
    { factor: "추가 작업", description: "몰딩, 보수 작업 등 부대공사" },
    { factor: "지역별 차이", description: "서울, 지방 등 지역별 인건비 차이" }
  ];

  const priceRanges = [
    {
      type: "원룸/투룸",
      area: "10-20평",
      price: "30-80만원",
      description: "기본 도배 작업 기준"
    },
    {
      type: "3룸/4룸",
      area: "20-30평",
      price: "80-150만원", 
      description: "거실, 방 전체 도배"
    },
    {
      type: "대형 평수",
      area: "30평 이상",
      price: "150만원 이상",
      description: "고급 벽지 선택 시 추가"
    }
  ];

  const steps = [
    { step: "01", title: "온라인 신청", description: "간단한 정보 입력으로 견적 요청" },
    { step: "02", title: "전화 상담", description: "전문 상담사가 자세한 상담 진행" },
    { step: "03", title: "현장 방문", description: "전문 기사가 직접 방문하여 측정" },
    { step: "04", title: "견적서 제공", description: "상세하고 투명한 견적서 제공" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
              <CalculatorIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 견적
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                100% 무료 상담
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              전문 도배 기사가 직접 현장을 방문하여<br />
              정확하고 투명한 견적을 무료로 제공해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <CalculatorIcon className="w-6 h-6" />
                무료 견적 신청
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/customer-support"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <PhoneIcon className="w-6 h-6" />
                전화 상담
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 견적의 장점 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              왜 <span className="text-blue-400">도베르만 견적</span>을 선택해야 할까요?
            </h2>
            <p className="text-slate-300 text-lg">정확하고 투명한 견적으로 고객 만족도 1위를 달성했습니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-300 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 견적 산출 요소 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 견적 <span className="text-blue-400">산출 요소</span>
            </h2>
            <p className="text-slate-300 text-lg">정확한 견적을 위해 다음 요소들을 종합적으로 검토합니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {estimateFactors.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.factor}</h3>
                </div>
                <p className="text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 대략적인 가격 범위 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">참고용</span> 가격 범위
            </h2>
            <p className="text-slate-300 text-lg">실제 견적은 현장 상황에 따라 달라질 수 있습니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {priceRanges.map((range, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                  <HomeIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{range.type}</h3>
                <p className="text-blue-400 font-semibold mb-2">{range.area}</p>
                <div className="text-3xl font-bold text-white mb-3">{range.price}</div>
                <p className="text-slate-300 text-sm">{range.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm mb-4">
              * 위 가격은 참고용이며, 정확한 견적은 현장 방문 후 산출됩니다
            </p>
            <Link
              href="/quote-request"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-semibold transition-all duration-300"
            >
              정확한 견적 받기
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 견적 신청 프로세스 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              견적 신청 <span className="text-blue-400">프로세스</span>
            </h2>
            <p className="text-slate-300 text-lg">간단한 4단계로 정확한 견적을 받아보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-blue-400/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              견적 관련 <span className="text-blue-400">자주 묻는 질문</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: "견적 상담이 정말 무료인가요?",
                a: "네, 견적 상담부터 현장 방문까지 모든 과정이 100% 무료입니다. 견적을 받은 후 시공을 결정하지 않아도 비용이 발생하지 않습니다."
              },
              {
                q: "견적 신청 후 얼마나 빨리 연락이 오나요?",
                a: "견적 신청 후 24시간 내에 전문 상담사가 연락드립니다. 급한 경우 전화로 직접 상담받으실 수도 있습니다."
              },
              {
                q: "현장 방문 없이 견적을 받을 수 있나요?",
                a: "정확한 견적을 위해서는 현장 방문이 필요합니다. 하지만 사진을 통한 대략적인 견적도 가능하니 상담 시 말씀해주세요."
              },
              {
                q: "견적서에는 어떤 내용이 포함되나요?",
                a: "자재비, 인건비, 부대비용 등 모든 항목이 투명하게 기재됩니다. 추가 비용 발생 요소도 미리 안내해드립니다."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">Q</span>
                  {faq.q}
                </h3>
                <p className="text-slate-300 leading-relaxed pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              지금 바로 <span className="text-blue-400">무료 견적</span>을 신청하세요!
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              전문 기사가 직접 방문하여 정확한 견적을 산출해드립니다.<br />
              견적 상담은 100% 무료이며, 부담 없이 문의하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <CalculatorIcon className="w-6 h-6" />
                무료 견적 신청
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                견적 사례 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "도배 견적 서비스",
            "description": "전문 기사가 직접 방문하여 정확한 도배 견적을 무료로 산출해드립니다",
            "provider": {
              "@type": "Organization",
              "name": "도베르만",
              "url": "https://www.doberman.kr"
            },
            "areaServed": {
              "@type": "Country",
              "name": "대한민국"
            },
            "serviceType": "도배 견적",
            "offers": {
              "@type": "Offer",
              "description": "무료 도배 견적 상담",
              "price": "0",
              "priceCurrency": "KRW"
            }
          })
        }}
      />
    </div>
  );
}
