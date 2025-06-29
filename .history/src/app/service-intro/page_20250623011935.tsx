"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckIcon, 
  StarIcon, 
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  TrendingUpIcon,
  PhoneIcon,
  MessageSquareIcon,
  CalendarIcon,
  HomeIcon,
  AwardIcon,
  DollarSignIcon,
  SearchIcon,
  FileTextIcon,
  HandshakeIcon,
  ThumbsUpIcon,
  ArrowRightIcon
} from "lucide-react";

// 서비스 특징 데이터
const serviceFeatures = [
  {
    icon: UsersIcon,
    title: "200+ 검증된 전문가",
    description: "엄격한 심사를 통과한 전국의 도배 전문가들",
    color: "from-blue-500 to-cyan-500",
    stats: "전국 200명+"
  },
  {
    icon: ShieldCheckIcon,
    title: "품질 보증 시스템",
    description: "시공 품질과 안전을 보장하는 체계적인 관리",
    color: "from-emerald-500 to-green-500",
    stats: "100% 보증"
  },
  {
    icon: ClockIcon,
    title: "빠른 매칭 서비스",
    description: "24시간 내 최적의 전문가 매칭 완료",
    color: "from-purple-500 to-violet-500",
    stats: "24시간 내"
  },
  {
    icon: DollarSignIcon,
    title: "투명한 가격 비교",
    description: "숨겨진 비용 없는 명확한 견적 비교",
    color: "from-amber-500 to-orange-500",
    stats: "투명한 견적"
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
  const [activeProcess, setActiveProcess] = useState(0);

  return (
    <div className="main-layout">
      <div className="container-custom page-wrapper px-4 sm:px-6 md:px-8">
        
        {/* 히어로 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 py-16 sm:py-20 md:py-24 overflow-hidden"
        >
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
            />
            
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-r from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            {/* 상단 배지 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-full"
            >
              <AwardIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-blue-300">업계 1위 도배 견적 플랫폼</span>
            </motion.div>

            {/* 메인 타이틀 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 mb-6 leading-tight tracking-tight"
            >
              도배 전문가와
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                스마트하게 연결
              </span>
            </motion.h1>

            {/* 서브타이틀 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            >
              전국 200명의 검증된 전문가들과 함께하는 
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
                신뢰할 수 있는 도배 견적 서비스
              </span>
            </motion.p>

            {/* 통계 정보 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
            >
              {[
                { number: "200+", label: "검증된 전문가" },
                { number: "5,000+", label: "완료된 프로젝트" },
                { number: "4.9", label: "평균 만족도" },
                { number: "24h", label: "평균 응답시간" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-slate-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* 서비스 특징 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4">
              왜 도베르만을 선택해야 할까요?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              검증된 전문가, 투명한 견적, 품질 보증까지. 도배 견적의 새로운 기준을 제시합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden"
              >
                {/* 호버 효과 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color.replace('to-', 'to-').replace('from-', 'from-')} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-slate-400 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${feature.color} bg-opacity-10 border border-current rounded-full text-sm font-semibold text-transparent bg-clip-text`}>
                    {feature.stats}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 서비스 프로세스 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4">
              간단한 4단계 프로세스
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              복잡한 절차 없이 간단하게. 견적 요청부터 시공 완료까지 체계적으로 관리합니다.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* 프로세스 탭 */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {serviceProcess.map((process, index) => (
                <motion.button
                  key={process.step}
                  onClick={() => setActiveProcess(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 ${
                    activeProcess === index
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span className="font-bold">{process.step}</span>
                  <span className="font-medium">{process.title}</span>
                </motion.button>
              ))}
            </div>

            {/* 활성 프로세스 상세 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProcess}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                        <serviceProcess[activeProcess].icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-400 mb-1">
                          {serviceProcess[activeProcess].step}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">
                          {serviceProcess[activeProcess].title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-lg text-slate-300 mb-8">
                      {serviceProcess[activeProcess].description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {serviceProcess[activeProcess].details.map((detail, detailIndex) => (
                        <motion.div
                          key={detailIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: detailIndex * 0.1, duration: 0.3 }}
                          className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl"
                        >
                          <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{detail}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl flex items-center justify-center">
                      <serviceProcess[activeProcess].icon className="w-24 h-24 text-blue-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>

        {/* 고객 후기 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4">
              고객들의 생생한 후기
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              실제 이용하신 고객분들의 솔직한 후기를 확인해보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerReviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl"
              >
                {/* 별점 */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* 후기 내용 */}
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "{review.comment}"
                </p>
                
                {/* 고객 정보 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-sm text-slate-400">{review.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-400 font-medium">{review.project}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="relative max-w-4xl mx-auto text-center p-8 md:p-12 bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl border border-blue-500/20 rounded-3xl overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-6">
                지금 바로 시작하세요
              </h2>
              
              <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                무료 견적 요청으로 당신의 공간을 새롭게 변화시켜보세요. 
                검증된 전문가들이 최고의 서비스를 제공합니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/quote-request"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <FileTextIcon className="w-5 h-5" />
                  무료 견적 요청하기
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.a>
                
                <motion.a
                  href="tel:1588-0000"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-700/50 text-white rounded-2xl font-semibold border border-slate-600/50 hover:bg-slate-600/50 transition-all duration-300"
                >
                  <PhoneIcon className="w-5 h-5" />
                  1588-0000
                </motion.a>
              </div>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
} 