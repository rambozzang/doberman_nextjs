"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckIcon, 
  CheckCircleIcon, 
  ClipboardListIcon, 
  HomeIcon, 
  UserCheckIcon,
  // CalendarIcon,
  AlertTriangleIcon,
  StarIcon,
  PhoneIcon,
  DownloadIcon,
  PrinterIcon,
  ClockIcon
} from "lucide-react";

// 체크리스트 데이터
const checklistCategories = [
  {
    id: "pre-construction",
    title: "시공 전 준비사항",
    icon: ClipboardListIcon,
    color: "from-blue-500 to-cyan-500",
    description: "도배 시공을 시작하기 전에 반드시 확인해야 할 사항들",
    items: [
      {
        id: "pre-1",
        text: "시공 일정 및 소요 기간 확인",
        description: "전문가와 시공 시작일, 완료 예정일을 명확히 협의했나요?"
      },
      {
        id: "pre-2", 
        text: "벽지 종류 및 색상 최종 확정",
        description: "원하는 벽지의 종류, 색상, 패턴을 최종 결정했나요?"
      },
      {
        id: "pre-3",
        text: "시공 범위 명확히 설정",
        description: "어느 공간을 시공할지 구체적으로 정했나요? (거실, 침실, 화장실 등)"
      },
      {
        id: "pre-4",
        text: "가구 이동 계획 수립",
        description: "가구 이동 서비스 신청 여부를 결정하고 계획을 세웠나요?"
      },
      {
        id: "pre-5",
        text: "기존 벽지 제거 여부 확인",
        description: "기존 벽지 제거가 견적에 포함되어 있는지 확인했나요?"
      },
      {
        id: "pre-6",
        text: "추가 작업 사항 논의",
        description: "벽면 보수, 콘센트 커버 교체 등 추가 작업이 필요한지 확인했나요?"
      },
      {
        id: "pre-7",
        text: "결제 방법 및 조건 협의",
        description: "결제 방법, 시기, 현금영수증 발행 등을 미리 협의했나요?"
      },
      {
        id: "pre-8",
        text: "보험 및 보증 조건 확인",
        description: "전문가의 보험 가입 여부와 품질보증 기간을 확인했나요?"
      }
    ]
  },
  {
    id: "expert-selection",
    title: "전문가 선택 기준",
    icon: UserCheckIcon,
    color: "from-emerald-500 to-green-500",
    description: "신뢰할 수 있는 도배 전문가를 선택하기 위한 체크포인트",
    items: [
      {
        id: "expert-1",
        text: "경력 및 자격증 확인",
        description: "3년 이상의 경력과 관련 자격증을 보유하고 있나요?"
      },
      {
        id: "expert-2",
        text: "이전 고객 리뷰 검토",
        description: "최근 고객들의 리뷰와 평점을 확인해보셨나요?"
      },
      {
        id: "expert-3",
        text: "포트폴리오 및 시공 사례",
        description: "비슷한 규모나 스타일의 시공 사례를 보여줄 수 있나요?"
      },
      {
        id: "expert-4",
        text: "견적서 상세 내역 확인",
        description: "견적서에 자재비, 인건비, 부대비용이 명확히 구분되어 있나요?"
      },
      {
        id: "expert-5",
        text: "소통 및 응답 속도",
        description: "문의에 대한 응답이 빠르고 명확한가요?"
      },
      {
        id: "expert-6",
        text: "보험 가입 여부",
        description: "작업 중 발생할 수 있는 사고에 대비한 보험에 가입되어 있나요?"
      },
      {
        id: "expert-7",
        text: "사후 A/S 정책",
        description: "시공 후 문제 발생 시 A/S 정책이 명확한가요?"
      },
      {
        id: "expert-8",
        text: "주변 지역 시공 경험",
        description: "해당 지역에서의 시공 경험이 풍부한가요?"
      }
    ]
  },
  {
    id: "during-construction",
    title: "시공 중 확인사항",
    icon: HomeIcon,
    color: "from-purple-500 to-violet-500", 
    description: "도배 시공이 진행되는 동안 체크해야 할 중요한 사항들",
    items: [
      {
        id: "during-1",
        text: "시공 시작 전 현장 정리",
        description: "바닥 보호, 가구 보호 조치가 적절히 이루어졌나요?"
      },
      {
        id: "during-2",
        text: "기존 벽지 제거 상태",
        description: "기존 벽지가 깔끔하게 제거되고 벽면이 평평한가요?"
      },
      {
        id: "during-3",
        text: "벽면 상태 점검",
        description: "균열, 구멍, 요철 부분이 적절히 보수되었나요?"
      },
      {
        id: "during-4",
        text: "벽지 재료 확인",
        description: "주문한 벽지와 동일한 제품인지 확인했나요?"
      },
      {
        id: "during-5",
        text: "시공 진행 과정 모니터링",
        description: "벽지 부착 방향과 패턴 매칭이 올바르게 진행되고 있나요?"
      },
      {
        id: "during-6",
        text: "작업 환경 관리",
        description: "환기, 온도, 습도 등이 적절하게 관리되고 있나요?"
      },
      {
        id: "during-7",
        text: "안전 수칙 준수",
        description: "작업자의 안전장비 착용과 안전 수칙이 지켜지고 있나요?"
      },
      {
        id: "during-8",
        text: "진행 상황 소통",
        description: "작업 진행 상황과 예상 완료 시간을 주기적으로 확인하고 있나요?"
      }
    ]
  },
  {
    id: "post-construction",
    title: "시공 완료 후 점검",
    icon: CheckCircleIcon,
    color: "from-amber-500 to-orange-500",
    description: "도배 시공 완료 후 품질을 확인하기 위한 최종 체크리스트",
    items: [
      {
        id: "post-1",
        text: "전체적인 마감 상태",
        description: "벽지가 고르게 부착되었고 들뜸이나 기포가 없나요?"
      },
      {
        id: "post-2",
        text: "모서리 및 가장자리 처리",
        description: "벽 모서리, 천장, 바닥 경계면이 깔끔하게 마감되었나요?"
      },
      {
        id: "post-3",
        text: "패턴 연결 상태",
        description: "벽지 패턴이 자연스럽게 연결되고 어긋남이 없나요?"
      },
      {
        id: "post-4",
        text: "콘센트 및 스위치 주변",
        description: "콘센트, 스위치 주변이 정확하게 커팅되고 마감되었나요?"
      },
      {
        id: "post-5",
        text: "이음매 처리 상태",
        description: "벽지 이음매가 보이지 않거나 최소화되었나요?"
      },
      {
        id: "post-6",
        text: "현장 정리 및 청소",
        description: "작업 후 바닥 청소와 쓰레기 정리가 완료되었나요?"
      },
      {
        id: "post-7",
        text: "가구 원위치 복구",
        description: "이동했던 가구들이 손상 없이 원위치에 배치되었나요?"
      },
      {
        id: "post-8",
        text: "최종 품질 확인",
        description: "전체적인 시공 품질에 만족하시나요?"
      }
    ]
  }
];

export default function ChecklistPage() {
  const [selectedCategory, setSelectedCategory] = useState("pre-construction");
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  // 체크박스 토글
  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 카테고리별 진행률 계산
  const getCategoryProgress = (categoryId: string) => {
    const category = checklistCategories.find(cat => cat.id === categoryId);
    if (!category) return 0;
    
    const checkedCount = category.items.filter(item => checkedItems[item.id]).length;
    return Math.round((checkedCount / category.items.length) * 100);
  };

  // 전체 진행률 계산
  const getTotalProgress = () => {
    const totalItems = checklistCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((checkedCount / totalItems) * 100);
  };

  const currentCategory = checklistCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-indigo-500/25"
            >
              <ClipboardListIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                도배 시공 체크리스트
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              성공적인 도배 시공을 위한 단계별 체크리스트로<br />
              완벽한 결과를 만들어보세요
            </motion.p>

            {/* 전체 진행률 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="max-w-sm mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">전체 진행률</span>
                  <span className="text-indigo-300 font-bold text-base">{getTotalProgress()}%</span>
                </div>
                <div className="relative h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getTotalProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <motion.main 
        className="flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 카테고리 사이드바 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-6 space-y-3">
                <h3 className="text-base font-bold text-white mb-4">체크리스트 단계</h3>
                {checklistCategories.map((category, index) => {
                  const Icon = category.icon;
                  const progress = getCategoryProgress(category.id);
                  
                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full p-3 rounded-xl transition-all duration-300 text-left ${
                        selectedCategory === category.id
                          ? `bg-gradient-to-r ${category.color} shadow-xl shadow-indigo-500/25 text-white`
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 ${
                          selectedCategory === category.id 
                            ? 'bg-white/20' 
                            : 'bg-white/10'
                        }`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-xs">{category.title}</span>
                      </div>
                      
                      {/* 진행률 바 */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs opacity-80">진행률</span>
                          <span className="text-xs font-bold">{progress}%</span>
                        </div>
                        <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute top-0 left-0 h-full bg-white/60 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}

                {/* 액션 버튼들 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="space-y-2 pt-5 border-t border-white/10"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center text-sm">
                      <DownloadIcon className="w-3 h-3 mr-1.5" />
                      체크리스트 다운로드
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                  >
                    <div className="flex items-center justify-center text-sm">
                      <PrinterIcon className="w-3 h-3 mr-1.5" />
                      인쇄하기
                    </div>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            {/* 체크리스트 콘텐츠 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="lg:col-span-3"
            >
              <AnimatePresence mode="wait">
                {currentCategory && (
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* 카테고리 헤더 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-5"
                    >
                      <div className="flex items-center mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${currentCategory.color} rounded-xl flex items-center justify-center mr-3 shadow-lg`}>
                          {(() => {
                            const Icon = currentCategory.icon;
                            return <Icon className="w-5 h-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">{currentCategory.title}</h2>
                          <p className="text-slate-300 text-sm">{currentCategory.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {currentCategory.items.filter(item => checkedItems[item.id]).length} / {currentCategory.items.length} 완료
                        </span>
                        <span className="text-base font-bold text-indigo-300">
                          {getCategoryProgress(currentCategory.id)}%
                        </span>
                      </div>
                    </motion.div>

                    {/* 체크리스트 아이템들 */}
                    <div className="space-y-3">
                      {currentCategory.items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
                        >
                          <motion.div
                            className="p-5"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-start">
                              {/* 체크박스 */}
                              <motion.button
                                onClick={() => toggleCheck(item.id)}
                                className="flex-shrink-0 mr-3 mt-1"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                                  checkedItems[item.id]
                                    ? `bg-gradient-to-br ${currentCategory.color} border-transparent shadow-lg`
                                    : 'border-slate-400 hover:border-white'
                                }`}>
                                  <AnimatePresence>
                                    {checkedItems[item.id] && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: 180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: -180 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      >
                                        <CheckIcon className="w-3 h-3 text-white" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.button>

                              {/* 콘텐츠 */}
                              <div className="flex-1">
                                <h4 className={`text-base font-semibold mb-1.5 transition-colors duration-300 ${
                                  checkedItems[item.id] ? 'text-white' : 'text-white'
                                }`}>
                                  {item.text}
                                </h4>
                                <p className={`leading-relaxed transition-colors duration-300 text-sm ${
                                  checkedItems[item.id] ? 'text-slate-200' : 'text-slate-300'
                                }`}>
                                  {item.description}
                                </p>
                              </div>

                              {/* 완료 상태 표시 */}
                              <AnimatePresence>
                                {checkedItems[item.id] && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`ml-3 px-2.5 py-1 bg-gradient-to-r ${currentCategory.color} rounded-full`}
                                  >
                                    <span className="text-white text-xs font-medium">완료</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* 하단 도움말 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="border-t border-white/10 py-12"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-amber-500/25">
                <AlertTriangleIcon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                체크리스트 활용 팁
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
                {[
                  {
                    icon: ClockIcon,
                    title: "단계별 진행",
                    description: "시공 과정에 맞춰 단계별로 체크하세요",
                    color: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: StarIcon,
                    title: "품질 관리",
                    description: "각 항목을 꼼꼼히 확인하여 품질을 보장하세요",
                    color: "from-yellow-500 to-amber-500"
                  },
                  {
                    icon: PhoneIcon,
                    title: "전문가 소통",
                    description: "궁금한 점은 전문가와 즉시 소통하세요",
                    color: "from-emerald-500 to-green-500"
                  }
                ].map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 text-center hover:border-white/20 transition-all duration-300"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${tip.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-white font-semibold mb-2 text-sm">{tip.title}</h4>
                      <p className="text-slate-300 text-xs">{tip.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
} 