"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckIcon, 
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

// 서비스 특징 데이터
const serviceFeatures = [
  {
    icon: UsersIcon,
    title: "지역별 도배 전문가",
    description: "요청 지역의 작업 조건을 확인하는 도배 전문가들",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: ShieldCheckIcon,
    title: "시공 범위 확인",
    description: "계약 전 자재·작업 범위와 AS 조건을 업체와 확인",
    color: "from-emerald-500 to-green-500"
  },
  {
    icon: ClockIcon,
    title: "빠른 매칭 서비스",
    // 시간 보장 표현은 실측(요청의 상당수가 미응답)과 맞지 않아 뺐다.
    description: "요청 내용을 확인한 지역 전문가에게 바로 전달",
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
    description: "요청 지역과 작업 조건을 전문가에게 전달",
    icon: SearchIcon,
    details: [
      "지역별 전문가 필터링",
      "요청 내용 전달",
      "전문가의 작업 조건 확인",
      "시공 가능 일정 협의"
    ]
  },
  {
    step: "03",
    title: "견적 비교",
    description: "도착한 전문가 견적의 금액과 작업 범위 비교",
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
      "업체와 계약 조건 확인",
      "시공 일정 조율",
      "업체와 진행 상황 확인",
      "품질 점검 및 완료"
    ]
  }
];

export default function ServiceIntroPage() {
  return (
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
              도배르만은 전국의 도배 전문가와 고객을 연결하여 합리적이고 투명한 도배 서비스를 제공합니다.
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
                4단계의 간단하고 체계적인 프로세스로 견적 요청부터 시공 조건 확인까지 안내합니다.
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


        </div>
      </main>

      {/* 하단 CTA */}
      <section className="w-full bg-slate-900 border-t border-white/10">
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
              한 번의 요청으로 도착한 견적을 비교하세요. 응답 시간과 견적 수는 지역·시공 조건에 따라 달라집니다.
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
      </section>
    </div>
  );
} 