import { Metadata } from "next";
import Link from "next/link";
import { 
  DollarSignIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  FileTextIcon,
  MapPinIcon,
  PhoneIcon,
  HomeIcon,
  CalculatorIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 가격 | 도배 비용 정보 - 도베르만",
  description: "2024년 최신 도배 가격 정보! 평수별, 벽지별 도배 비용을 투명하게 공개합니다. 합리적인 도배 가격으로 만나보세요.",
  keywords: "도배가격, 도배비용, 벽지가격, 도배단가, 평당도배비용, 도배시세, 인테리어비용, 리모델링비용",
  openGraph: {
    title: "도배 가격 | 도배 비용 정보 - 도베르만",
    description: "2024년 최신 도배 가격 정보. 평수별, 벽지별 투명한 도배 비용 공개",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-가격"
  }
};

export default function DobaeGagyeokPage() {
  const priceFactors = [
    {
      icon: HomeIcon,
      title: "시공 면적",
      description: "평수가 클수록 평당 단가는 저렴해집니다",
      impact: "높음"
    },
    {
      icon: StarIcon,
      title: "벽지 등급",
      description: "일반지 < 실크지 < 합지 순으로 가격이 상승합니다",
      impact: "높음"
    },
    {
      icon: ClockIcon,
      title: "작업 난이도",
      description: "기존 벽지 제거, 벽면 보수 등에 따라 달라집니다",
      impact: "중간"
    },
    {
      icon: MapPinIcon,
      title: "지역별 차이",
      description: "서울/수도권과 지방 간 인건비 차이가 있습니다",
      impact: "중간"
    }
  ];

  const wallpaperTypes = [
    {
      type: "일반 벽지",
      description: "가장 기본적인 벽지로 경제적입니다",
      priceRange: "평당 8,000-12,000원",
      features: ["경제적", "다양한 디자인", "기본 품질"],
      color: "from-green-500 to-emerald-500"
    },
    {
      type: "실크 벽지", 
      description: "부드러운 질감과 고급스러운 마감",
      priceRange: "평당 12,000-18,000원",
      features: ["고급 질감", "내구성 우수", "세련된 디자인"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      type: "합지 벽지",
      description: "최고급 벽지로 뛰어난 품질과 내구성",
      priceRange: "평당 18,000-25,000원",
      features: ["최고 품질", "뛰어난 내구성", "프리미엄 디자인"],
      color: "from-purple-500 to-violet-500"
    }
  ];

  const areaBasedPricing = [
    {
      area: "10평 이하",
      totalPrice: "40-80만원",
      perPyeong: "평당 4-8만원",
      description: "원룸, 소형 투룸",
      additionalInfo: "최소 시공비 적용"
    },
    {
      area: "10-20평",
      totalPrice: "60-120만원",
      perPyeong: "평당 3-6만원",
      description: "투룸, 소형 아파트",
      additionalInfo: "가장 일반적인 평수"
    },
    {
      area: "20-30평",
      totalPrice: "100-180만원",
      perPyeong: "평당 3-6만원",
      description: "3룸, 중형 아파트",
      additionalInfo: "거실 포함 전체"
    },
    {
      area: "30평 이상",
      totalPrice: "150만원 이상",
      perPyeong: "평당 3-5만원",
      description: "대형 아파트, 주택",
      additionalInfo: "규모의 경제 효과"
    }
  ];

  const additionalCosts = [
    { item: "기존 벽지 제거", cost: "평당 3,000-5,000원", required: "기존 벽지가 있는 경우" },
    { item: "벽면 보수 작업", cost: "평당 5,000-10,000원", required: "벽면 손상이 있는 경우" },
    { item: "몰딩 설치", cost: "미터당 3,000-8,000원", required: "몰딩 설치 희망 시" },
    { item: "천장 도배", cost: "평당 15,000-25,000원", required: "천장 도배 포함 시" },
    { item: "패턴 매칭", cost: "10-20% 추가", required: "복잡한 패턴 벽지" },
    { item: "당일 완료", cost: "10-15% 추가", required: "당일 완료 요청 시" }
  ];

  const regionPricing = [
    { region: "서울", multiplier: "100%", description: "기준 가격" },
    { region: "경기도", multiplier: "90-100%", description: "서울 대비 약간 저렴" },
    { region: "부산/대구", multiplier: "85-95%", description: "서울 대비 5-15% 저렴" },
    { region: "기타 광역시", multiplier: "80-90%", description: "서울 대비 10-20% 저렴" },
    { region: "지방 도시", multiplier: "75-85%", description: "서울 대비 15-25% 저렴" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
              <DollarSignIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 가격
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                투명한 비용 공개
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              2024년 최신 도배 가격 정보를 투명하게 공개합니다.<br />
              평수별, 벽지별 상세한 비용을 확인해보세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <CalculatorIcon className="w-6 h-6" />
                정확한 견적 받기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/customer-support"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <PhoneIcon className="w-6 h-6" />
                가격 상담
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 가격 결정 요소 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 가격 <span className="text-blue-400">결정 요소</span>
            </h2>
            <p className="text-slate-300 text-lg">다음 요소들이 최종 도배 가격에 영향을 미칩니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {priceFactors.map((factor, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <factor.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{factor.title}</h3>
                <p className="text-slate-300 mb-3 leading-relaxed">{factor.description}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  factor.impact === '높음' ? 'bg-red-500/20 text-red-400' :
                  factor.impact === '중간' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {factor.impact === '높음' ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                  영향도: {factor.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 벽지별 가격 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              벽지별 <span className="text-blue-400">가격 정보</span>
            </h2>
            <p className="text-slate-300 text-lg">벽지 종류에 따른 평당 가격을 확인해보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {wallpaperTypes.map((wallpaper, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${wallpaper.color} rounded-2xl mb-6`}>
                  <StarIcon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{wallpaper.type}</h3>
                <p className="text-slate-300 mb-4">{wallpaper.description}</p>
                
                <div className="text-2xl font-bold text-blue-400 mb-6">{wallpaper.priceRange}</div>
                
                <ul className="space-y-2">
                  {wallpaper.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 평수별 가격 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              평수별 <span className="text-blue-400">도배 가격</span>
            </h2>
            <p className="text-slate-300 text-lg">일반 벽지 기준 평수별 예상 가격입니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {areaBasedPricing.map((pricing, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3">
                    <HomeIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{pricing.area}</h3>
                  <p className="text-slate-400 text-sm">{pricing.description}</p>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{pricing.totalPrice}</div>
                  <div className="text-slate-300 text-sm">{pricing.perPyeong}</div>
                </div>
                
                <p className="text-slate-400 text-xs text-center">{pricing.additionalInfo}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm mb-6">
              * 위 가격은 일반 벽지 기준이며, 실제 가격은 현장 상황에 따라 달라질 수 있습니다
            </p>
            <Link
              href="/quote-request"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-semibold transition-all duration-300"
            >
              내 집 정확한 가격 알아보기
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 추가 비용 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">추가 비용</span> 항목
            </h2>
            <p className="text-slate-300 text-lg">기본 도배 외에 발생할 수 있는 추가 비용들입니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalCosts.map((cost, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{cost.item}</h3>
                  <div className="text-blue-400 font-bold">{cost.cost}</div>
                </div>
                <p className="text-slate-300 text-sm">{cost.required}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 지역별 가격 차이 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              지역별 <span className="text-blue-400">가격 차이</span>
            </h2>
            <p className="text-slate-300 text-lg">서울 기준 대비 지역별 가격 수준입니다</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {regionPricing.map((region, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
                    <MapPinIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{region.region}</h3>
                  <div className="text-xl font-bold text-blue-400 mb-2">{region.multiplier}</div>
                  <p className="text-slate-300 text-sm">{region.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 가격 절약 팁 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 비용 <span className="text-blue-400">절약 팁</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "비수기 시공",
                description: "3-5월, 9-11월은 도배 비수기로 더 저렴한 가격에 시공 가능합니다.",
                savings: "10-15% 절약"
              },
              {
                title: "여러 업체 견적 비교",
                description: "3-5개 업체의 견적을 비교하여 합리적인 가격을 찾으세요.",
                savings: "15-20% 절약"
              },
              {
                title: "패키지 할인",
                description: "전체 집을 한 번에 시공하면 평당 단가가 저렴해집니다.",
                savings: "10-15% 절약"
              },
              {
                title: "기본 벽지 선택",
                description: "고급 벽지 대신 품질 좋은 일반 벽지를 선택하면 비용을 절약할 수 있습니다.",
                savings: "30-50% 절약"
              }
            ].map((tip, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{tip.title}</h3>
                  <div className="px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm font-medium">
                    {tip.savings}
                  </div>
                </div>
                <p className="text-slate-300">{tip.description}</p>
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
              정확한 <span className="text-blue-400">도배 가격</span>이 궁금하신가요?
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              전문 기사가 직접 현장을 방문하여<br />
              정확하고 투명한 견적을 무료로 제공해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <CalculatorIcon className="w-6 h-6" />
                무료 견적 받기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                가격 사례 보기
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
            "@type": "WebPage",
            "name": "도배 가격 정보",
            "description": "2024년 최신 도배 가격 정보. 평수별, 벽지별 투명한 도배 비용 공개",
            "mainEntity": {
              "@type": "Service",
              "name": "도배 서비스",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "40000",
                "highPrice": "250000",
                "priceCurrency": "KRW",
                "offerCount": "4"
              }
            }
          })
        }}
      />
    </div>
  );
}
