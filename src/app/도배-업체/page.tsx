import { Metadata } from "next";
import Link from "next/link";
import { 
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  FileTextIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  HomeIcon,
  SearchIcon,
  AwardIcon,
  ThumbsUpIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 업체 찾기 | 검증된 전문 도배 업체 추천 - 도베르만",
  description: "신뢰할 수 있는 도배 업체를 찾고 계신가요? 검증된 전문 도배 업체들을 엄선하여 추천드립니다. 무료 견적 비교까지!",
  keywords: "도배업체, 도배업체추천, 도배전문업체, 신뢰할수있는도배업체, 검증된도배업체, 도배기사, 인테리어업체, 벽지업체",
  openGraph: {
    title: "도배 업체 찾기 | 검증된 전문 도배 업체 추천",
    description: "검증된 전문 도배 업체들을 엄선하여 추천. 무료 견적 비교 서비스",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-업체"
  }
};

export default function DobaeEopchePage() {
  const selectionCriteria = [
    {
      icon: AwardIcon,
      title: "풍부한 경험",
      description: "10년 이상의 도배 시공 경험을 보유한 전문 업체만 선별합니다."
    },
    {
      icon: ShieldCheckIcon,
      title: "검증된 자격",
      description: "관련 자격증과 사업자등록증을 보유한 정식 등록 업체입니다."
    },
    {
      icon: ThumbsUpIcon,
      title: "고객 만족도",
      description: "실제 고객 후기와 재시공 요청률을 기준으로 엄선합니다."
    },
    {
      icon: CheckCircleIcon,
      title: "A/S 보장",
      description: "시공 후 1년간 무료 A/S를 보장하는 업체만 추천합니다."
    }
  ];

  const serviceTypes = [
    {
      type: "주거용 도배",
      description: "아파트, 빌라, 주택 등 주거 공간 전문",
      features: ["원룸부터 대형 평수까지", "가족 친화적 자재 사용", "생활 패턴 고려 시공"],
      icon: HomeIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      type: "상업용 도배",
      description: "사무실, 상가, 매장 등 상업 공간 전문",
      features: ["브랜드 이미지 고려", "내구성 강화 자재", "야간 시공 가능"],
      icon: BuildingIcon,
      color: "from-purple-500 to-violet-500"
    },
    {
      type: "특수 도배",
      description: "병원, 학교, 카페 등 특수 목적 공간",
      features: ["용도별 맞춤 자재", "특수 기능성 벽지", "전문 시공 기법"],
      icon: StarIcon,
      color: "from-emerald-500 to-green-500"
    }
  ];

  const regions = [
    { region: "서울특별시", count: "120+", description: "강남, 강북, 송파 등 전 지역" },
    { region: "경기도", count: "80+", description: "수원, 성남, 고양 등 주요 도시" },
    { region: "부산광역시", count: "45+", description: "해운대, 사하, 동래 등" },
    { region: "대구광역시", count: "35+", description: "중구, 동구, 서구 등" },
    { region: "인천광역시", count: "30+", description: "연수, 남동, 부평 등" },
    { region: "기타 지역", count: "150+", description: "전국 주요 도시 커버" }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "업체 매칭",
      description: "고객님의 조건에 맞는 검증된 도배 업체를 추천해드립니다."
    },
    {
      step: "02", 
      title: "견적 비교",
      description: "여러 업체의 견적을 한 번에 받아 비교할 수 있습니다."
    },
    {
      step: "03",
      title: "업체 선택",
      description: "가격, 후기, 포트폴리오를 비교하여 최적의 업체를 선택하세요."
    },
    {
      step: "04",
      title: "시공 완료",
      description: "선택한 업체가 전문적이고 깔끔한 도배 시공을 진행합니다."
    }
  ];

  const benefits = [
    {
      title: "시간 절약",
      description: "여러 업체를 직접 찾아다닐 필요 없이 한 번에 비교 가능",
      icon: ClockIcon
    },
    {
      title: "비용 절약",
      description: "여러 업체의 견적을 비교하여 합리적인 가격에 시공",
      icon: FileTextIcon
    },
    {
      title: "품질 보장",
      description: "검증된 업체만 추천하여 시공 품질과 서비스 만족도 보장",
      icon: StarIcon
    },
    {
      title: "안전한 거래",
      description: "정식 등록 업체와 계약서 작성으로 안전한 거래 보장",
      icon: ShieldCheckIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
              <BuildingIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                도배 업체 찾기
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                검증된 전문 업체 추천
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              10년 이상 경력의 검증된 도배 전문 업체들을<br />
              엄선하여 고객님께 추천해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <SearchIcon className="w-6 h-6" />
                업체 찾기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                <FileTextIcon className="w-6 h-6" />
                시공 사례 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 업체 선별 기준 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">엄격한 기준</span>으로 선별된 업체들
            </h2>
            <p className="text-slate-300 text-lg">다음 기준을 모두 만족하는 업체만 추천합니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {selectionCriteria.map((criteria, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <criteria.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{criteria.title}</h3>
                <p className="text-slate-300 leading-relaxed">{criteria.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 서비스 유형별 전문 업체 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              분야별 <span className="text-blue-400">전문 업체</span>
            </h2>
            <p className="text-slate-300 text-lg">각 분야의 전문성을 갖춘 업체들을 추천합니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceTypes.map((service, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl mb-6`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{service.type}</h3>
                <p className="text-slate-300 mb-6">{service.description}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
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

      {/* 지역별 업체 현황 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">전국</span> 업체 네트워크
            </h2>
            <p className="text-slate-300 text-lg">전국 주요 지역의 검증된 도배 업체들</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">{region.region}</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{region.count}</div>
                </div>
                <p className="text-slate-300 text-sm">{region.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 업체 매칭 프로세스 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              업체 매칭 <span className="text-blue-400">프로세스</span>
            </h2>
            <p className="text-slate-300 text-lg">간단한 4단계로 최적의 도배 업체를 찾아보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </div>
                
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-blue-400/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 도베르만 업체 매칭의 장점 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              왜 <span className="text-blue-400">도베르만</span>을 선택해야 할까요?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              업체 선택 <span className="text-blue-400">자주 묻는 질문</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: "추천해주시는 업체들은 어떤 기준으로 선별되나요?",
                a: "10년 이상의 경력, 관련 자격증 보유, 고객 만족도, A/S 보장 등 엄격한 기준을 통과한 업체만 추천합니다."
              },
              {
                q: "업체 추천 서비스는 유료인가요?",
                a: "업체 추천과 견적 비교 서비스는 100% 무료입니다. 별도의 수수료나 중개 수수료는 없습니다."
              },
              {
                q: "추천받은 업체와 직접 계약해야 하나요?",
                a: "네, 고객님이 직접 업체와 계약하시면 됩니다. 저희는 신뢰할 수 있는 업체를 소개해드리는 역할만 합니다."
              },
              {
                q: "시공 후 문제가 생기면 어떻게 하나요?",
                a: "추천 업체들은 모두 1년간 무료 A/S를 보장합니다. 문제 발생 시 해당 업체에서 직접 해결해드립니다."
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
              지금 바로 <span className="text-blue-400">최적의 도배 업체</span>를 찾아보세요!
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              검증된 전문 업체들 중에서 고객님의 조건에<br />
              가장 적합한 업체를 추천해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <SearchIcon className="w-6 h-6" />
                업체 찾기 시작
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

      {/* 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "도배 업체 추천 서비스",
            "description": "검증된 전문 도배 업체들을 엄선하여 추천하는 서비스",
            "provider": {
              "@type": "Organization",
              "name": "도베르만",
              "url": "https://www.doberman.kr"
            },
            "areaServed": {
              "@type": "Country",
              "name": "대한민국"
            },
            "serviceType": "도배 업체 추천",
            "offers": {
              "@type": "Offer",
              "description": "무료 업체 추천 및 견적 비교 서비스",
              "price": "0",
              "priceCurrency": "KRW"
            }
          })
        }}
      />
    </div>
  );
}
