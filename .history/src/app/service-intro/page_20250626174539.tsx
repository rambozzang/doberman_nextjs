"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckIcon, 
  StarIcon, 
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  TrendingUpIcon,
  AwardIcon,
  DollarSignIcon,
  SearchIcon,
  FileTextIcon,
  HandshakeIcon,
  ArrowRightIcon
} from "lucide-react";
import JsonLd from "@/components/JsonLd";

// 서비스 특징 데이터
const serviceFeatures = [
  {
    icon: UsersIcon,
    title: "200+ 검증된 전문가",
    description: "엄격한 심사를 통과한 전국의 도배 전문가들",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: ShieldCheckIcon,
    title: "품질 보증 시스템",
    description: "시공 품질과 안전을 보장하는 체계적인 관리",
    color: "from-emerald-500 to-green-500"
  },
  {
    icon: ClockIcon,
    title: "빠른 매칭 서비스",
    description: "24시간 내 최적의 전문가 매칭 완료",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: DollarSignIcon,
    title: "투명한 가격 비교",
    description: "숨겨진 비용 없는 명확한 견적 비교",
    color: "from-amber-500 to-orange-500"
  }
];

// 서비스 프로세스
const serviceProcess = [
  {
    step: "01",
    title: "견적 요청",
    description: "간단한 정보 입력으로 견적 요청",
    icon: FileTextIcon,
    details: [
      "시공 위치 및 면적 입력",
      "원하는 벽지 종류 선택",
      "예산 범위 설정",
      "연락처 정보 입력"
    ]
  },
  {
    step: "02", 
    title: "전문가 매칭",
    description: "AI 알고리즘을 통한 최적 전문가 선별",
    icon: SearchIcon,
    details: [
      "지역별 전문가 필터링",
      "리뷰 점수 기반 선별",
      "경력 및 전문성 평가",
      "가용 일정 확인"
    ]
  },
  {
    step: "03",
    title: "견적 비교",
    description: "최대 3명의 전문가 견적 동시 비교",
    icon: TrendingUpIcon,
    details: [
      "상세 견적서 제공",
      "가격 대비 품질 분석",
      "시공 기간 비교",
      "추가 서비스 옵션"
    ]
  },
  {
    step: "04",
    title: "계약 및 시공",
    description: "안전하고 체계적인 시공 진행",
    icon: HandshakeIcon,
    details: [
      "온라인 계약 체결",
      "시공 일정 조율",
      "실시간 진행상황 공유",
      "품질 점검 및 완료"
    ]
  }
];

// 고객 후기
const customerReviews = [
  {
    name: "김○○",
    location: "서울 강남구",
    rating: 5,
    comment: "3명의 전문가 견적을 한번에 비교할 수 있어서 정말 편했어요. 가격도 합리적이고 품질도 만족스럽습니다.",
    project: "아파트 25평 전체 도배"
  },
  {
    name: "박○○", 
    location: "부산 해운대구",
    rating: 5,
    comment: "전문가분이 정말 친절하고 꼼꼼하게 작업해주셨어요. 추천받은 벽지도 예상보다 훨씬 예쁘네요.",
    project: "오피스텔 16평 거실/침실"
  },
  {
    name: "이○○",
    location: "대구 수성구", 
    rating: 5,
    comment: "시공 전부터 완료까지 체계적으로 관리해주셔서 안심이 됐습니다. 다음에도 꼭 이용할게요.",
    project: "단독주택 35평 전체"
  }
];

export default function ServiceIntroPage() {
  // 서비스 구조화된 데이터
  const serviceStructuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "도배르만 - 도배 전문가 매칭 서비스",
    "description": "전국 200명 이상의 검증된 도배 전문가와 고객을 연결하여 합리적이고 투명한 도배 서비스를 제공합니다.",
    "provider": {
      "@type": "Organization",
      "name": "도배르만",
      "url": "https://doberman.co.kr"
    },
    "serviceType": "도배 전문가 매칭",
    "areaServed": "대한민국",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "도배 서비스",
      "itemListElement": serviceFeatures.map(feature => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": feature.title,
          "description": feature.description
        }
      }))
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1250"
    },
    "review": customerReviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "reviewBody": review.comment
    }))
  };

  return (
    <>
      <JsonLd data={serviceStructuredData} />
      <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {/* 히어로 섹션 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="container mx-auto px-4 py-12 md:py-20 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-blue-500/25"
            >
              <AwardIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                신뢰할 수 있는 도배 전문가를 만나보세요
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              도배르만은 전국 200명 이상의 검증된 전문가와 고객을 연결하여 합리적이고 투명한 도배 서비스를 제공합니다.
            </motion.p>
          </motion.div>
        </div>
      </section>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-10">
          {/* 서비스 특징 */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">도배르만 핵심 서비스</h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                고객 만족을 최우선으로, 믿을 수 있는 도배 경험을 선사합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {serviceFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* 서비스 프로세스 */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="mb-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">서비스 이용 과정</h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                4단계의 간단하고 체계적인 프로세스로 최상의 결과를 보장합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {serviceProcess.map((process, index) => {
                const Icon = process.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <div className="text-3xl font-bold text-slate-600 mr-4">{process.step}</div>
                      <div className={`w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{process.title}</h3>
                    <p className="text-slate-300 text-sm mb-3">{process.description}</p>
                    <ul className="space-y-1.5 text-xs">
                      {process.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-slate-400">
                          <CheckIcon className="w-3 h-3 mr-2 text-emerald-500" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>

          {/* 고객 후기 */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">고객 만족 후기</h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                실제 이용 고객들이 남긴 생생한 후기를 확인해보세요.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {customerReviews.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-600'}`} 
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white ml-3">{review.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({review.location})</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">&ldquo;{review.comment}&rdquo;</p>
                  <p className="text-xs text-indigo-400 bg-indigo-500/10 rounded-full px-2 py-1 inline-block">
                    {review.project}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      {/* 하단 CTA */}
      <footer className="w-full bg-slate-900 border-t border-white/10">
        <div className="container mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              지금 바로 무료 견적을 받아보세요
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              간단한 정보 입력으로 24시간 내에 최대 3개의 견적을 비교할 수 있습니다.
            </p>
            <motion.a
              href="/quote-request"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 text-sm"
            >
              무료 견적 요청하기
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </motion.a>
          </motion.div>
        </div>
      </footer>
    </div>
    </>
  );
} 