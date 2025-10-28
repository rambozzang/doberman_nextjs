import { Metadata } from "next";
import Link from "next/link";
import { 
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  PaintBucketIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon
} from "lucide-react";

export const metadata: Metadata = {
  title: "도배 시공 전문업체 | 전국 도배 시공 서비스 - 도베르만",
  description: "전국 도배 시공 전문업체를 찾고 계신가요? 경험 풍부한 도배 기사들이 깔끔하고 완벽한 도배 시공을 제공합니다.",
  keywords: "도배시공, 도배업체, 도배기사, 벽지시공, 도배전문, 인테리어도배, 주택도배, 아파트도배, 상가도배",
  openGraph: {
    title: "도배 시공 전문업체 | 도베르만",
    description: "전국 도배 시공 전문업체. 경험 풍부한 기사들의 완벽한 도배 시공 서비스",
    type: "website",
    locale: "ko_KR",
  },
  alternates: {
    canonical: "https://www.doberman.kr/도배-시공"
  }
};

export default function DobaeSigongPage() {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: "검증된 전문 기사",
      description: "10년 이상 경력의 도배 전문 기사들만 선별하여 최고 품질의 시공을 보장합니다."
    },
    {
      icon: ClockIcon,
      title: "빠른 시공 완료",
      description: "효율적인 작업 프로세스로 약속된 기간 내 완벽한 도배 시공을 완료합니다."
    },
    {
      icon: CheckCircleIcon,
      title: "A/S 보장",
      description: "시공 후 1년간 무료 A/S를 제공하여 고객 만족도를 최우선으로 합니다."
    },
    {
      icon: StarIcon,
      title: "고품질 자재",
      description: "친환경 고급 벽지와 접착제만을 사용하여 건강하고 오래가는 도배를 제공합니다."
    }
  ];

  const process = [
    { step: "01", title: "견적 요청", description: "온라인으로 간편하게 도배 견적을 요청하세요" },
    { step: "02", title: "현장 방문", description: "전문 기사가 직접 방문하여 정확한 견적을 산출합니다" },
    { step: "03", title: "시공 진행", description: "약속된 날짜에 깔끔하고 정확한 도배 작업을 진행합니다" },
    { step: "04", title: "완료 검수", description: "고객과 함께 꼼꼼한 검수 후 작업을 완료합니다" }
  ];

  const regions = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시",
    "울산광역시", "세종특별자치시", "경기도", "강원도", "충청남도", "충청북도",
    "전라남도", "전라북도", "경상남도", "경상북도", "제주도"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
              <PaintBucketIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                전문 도배 시공
              </span>
              <br />
              <span className="text-2xl md:text-4xl font-normal text-slate-300">
                깔끔하고 완벽한 마감
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              10년 이상 경력의 전문 도배 기사들이 고품질 자재와 정교한 기술로<br />
              여러분의 공간을 새롭게 변화시켜드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <HomeIcon className="w-6 h-6" />
                무료 견적 받기
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link
                href="/quote-request/list"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
              >
                시공 사례 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              왜 <span className="text-blue-400">도베르만</span>을 선택해야 할까요?
            </h2>
            <p className="text-slate-300 text-lg">전문성과 신뢰성을 바탕으로 최고의 도배 시공 서비스를 제공합니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 시공 프로세스 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              도배 시공 <span className="text-blue-400">프로세스</span>
            </h2>
            <p className="text-slate-300 text-lg">체계적이고 전문적인 4단계 시공 과정</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-xl mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </div>
                
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-blue-400/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 서비스 지역 */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-blue-400">전국</span> 서비스 지역
            </h2>
            <p className="text-slate-300 text-lg">전국 어디서나 전문 도배 시공 서비스를 이용하실 수 있습니다</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {regions.map((region, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300">
                <MapPinIcon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <span className="text-white font-medium text-sm">{region}</span>
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
              지금 바로 <span className="text-blue-400">무료 견적</span>을 받아보세요!
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              전문 도배 기사가 직접 방문하여 정확한 견적을 산출해드립니다.<br />
              견적 상담은 100% 무료이며, 부담 없이 문의하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote-request"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <HomeIcon className="w-6 h-6" />
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

      {/* 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "도배 시공 서비스",
            "description": "전국 도배 시공 전문업체. 경험 풍부한 기사들의 완벽한 도배 시공 서비스",
            "provider": {
              "@type": "Organization",
              "name": "도베르만",
              "url": "https://www.doberman.kr"
            },
            "areaServed": {
              "@type": "Country",
              "name": "대한민국"
            },
            "serviceType": "도배 시공",
            "offers": {
              "@type": "Offer",
              "description": "무료 견적 상담"
            }
          })
        }}
      />
    </div>
  );
}
