"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDownIcon, 
  SearchIcon, 
  HelpCircleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CreditCardIcon, 
  HomeIcon, 
  PhoneIcon 
} from "lucide-react";

// FAQ 데이터
const faqCategories = [
  {
    id: "service",
    title: "서비스 이용",
    icon: HelpCircleIcon,
    color: "from-blue-500 to-cyan-500",
    questions: [
      {
        id: "service-1",
        question: "도배르만은 어떤 서비스인가요?",
        answer: "도배르만은 전국 200명의 검증된 도배 전문가와 고객을 연결해주는 비교견적 서비스입니다. 무료로 최대 5개의 견적을 받아보고 비교할 수 있어 합리적인 선택이 가능합니다."
      },
      {
        id: "service-2",
        question: "서비스 이용료가 있나요?",
        answer: "도배르만의 견적 요청 및 전문가 매칭 서비스는 100% 무료입니다. 고객님께서는 어떠한 중개 수수료나 서비스 이용료를 지불하실 필요가 없습니다."
      },
      {
        id: "service-3",
        question: "어떻게 이용하나요?",
        answer: "1) 간단한 정보 입력으로 견적 요청 → 2) 24시간 내 전문가들의 견적 확인 → 3) 최대 5개 견적 비교 → 4) 마음에 드는 전문가 선택 → 5) 직접 연락 후 시공 진행 순으로 이용하실 수 있습니다."
      }
    ]
  },
  {
    id: "quote",
    title: "견적 관련",
    icon: CreditCardIcon,
    color: "from-emerald-500 to-green-500",
    questions: [
      {
        id: "quote-1",
        question: "견적은 얼마나 빨리 받을 수 있나요?",
        answer: "견적 요청 후 평균 2-6시간 내에 첫 번째 견적을 받으실 수 있으며, 24시간 내에 모든 견적이 완료됩니다. 급한 경우 당일 견적도 가능합니다."
      },
      {
        id: "quote-2",
        question: "몇 개의 견적을 받을 수 있나요?",
        answer: "최대 5개의 견적을 받으실 수 있습니다. 여러 전문가의 견적을 비교해보시고 가격, 서비스, 경력 등을 종합적으로 검토하여 선택하세요."
      },
      {
        id: "quote-3",
        question: "견적이 정확한가요?",
        answer: "온라인 견적은 대략적인 금액이며, 정확한 견적은 현장 방문 후 확정됩니다. 하지만 입력해주신 정보를 바탕으로 경험 많은 전문가들이 최대한 정확하게 산출해드립니다."
      },
      {
        id: "quote-4",
        question: "견적을 받은 후 꼭 계약해야 하나요?",
        answer: "아니요, 견적을 받으신 후에도 계약 의무는 없습니다. 충분히 비교검토하시고 마음에 드는 전문가와만 계약하시면 됩니다."
      }
    ]
  },
  {
    id: "construction",
    title: "시공 관련",
    icon: HomeIcon,
    color: "from-purple-500 to-violet-500",
    questions: [
      {
        id: "construction-1",
        question: "도배 시공 기간은 얼마나 걸리나요?",
        answer: "아파트 기준으로 거실 1일, 방 1개당 반나일~1일 정도 소요됩니다. 전체 도배의 경우 20평대 아파트는 2-3일, 30평대는 3-4일 정도 예상하시면 됩니다."
      },
      {
        id: "construction-2",
        question: "시공 전 준비해야 할 것이 있나요?",
        answer: "가구 이동 서비스를 신청하지 않으셨다면 가구를 미리 이동해 주세요. 또한 귀중품은 안전한 곳에 보관하시고, 애완동물이나 화분은 다른 곳으로 옮겨주세요."
      },
      {
        id: "construction-3",
        question: "시공 중 집에 있어야 하나요?",
        answer: "시공 시작과 완료 시에는 고객님께서 확인해주시는 것이 좋습니다. 시공 중간에는 외출하셔도 되며, 전문가와 미리 협의하시면 됩니다."
      },
      {
        id: "construction-4",
        question: "기존 벽지 제거도 해주나요?",
        answer: "네, 대부분의 전문가들이 기존 벽지 제거 서비스를 제공합니다. 견적 요청 시 '기존 벽지 제거' 옵션을 선택하시면 포함된 견적을 받으실 수 있습니다."
      }
    ]
  }
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("service");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 질문 토글
  const toggleQuestion = (questionId: string) => {
    setOpenQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // 검색 필터링
  const getFilteredQuestions = () => {
    const currentCategory = faqCategories.find(cat => cat.id === selectedCategory);
    if (!currentCategory) return [];
    
    if (!searchTerm) return currentCategory.questions;
    
    return currentCategory.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
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
              className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-blue-500/25"
            >
              <HelpCircleIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                자주 묻는 질문
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              도배르만 서비스에 대한 궁금한 점들을 빠르게 해결해보세요
            </motion.p>

            {/* 검색창 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="relative max-w-sm mx-auto"
            >
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="궁금한 내용을 검색해보세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300 text-sm"
              />
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
              <div className="sticky top-6 space-y-2.5">
                <h3 className="text-base font-bold text-white mb-3">카테고리</h3>
                {faqCategories.map((category, index) => {
                  const Icon = category.icon;
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
                          ? `bg-gradient-to-r ${category.color} shadow-xl shadow-blue-500/25 text-white`
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 ${
                          selectedCategory === category.id 
                            ? 'bg-white/20' 
                            : 'bg-white/10'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-sm">{category.title}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* FAQ 콘텐츠 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="lg:col-span-3"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-5">{faqCategories.find(c => c.id === selectedCategory)?.title}</h2>
                    <div className="space-y-4">
                      {getFilteredQuestions().length > 0 ? (
                        getFilteredQuestions().map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="border-b border-white/10 last:border-b-0 pb-4 last:pb-0"
                          >
                            <button
                              onClick={() => toggleQuestion(item.id)}
                              className="w-full flex justify-between items-center text-left"
                            >
                              <h3 className="text-base font-semibold text-white">{item.question}</h3>
                              <motion.div
                                animate={{ rotate: openQuestions.includes(item.id) ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                              </motion.div>
                            </button>
                            <AnimatePresence>
                              {openQuestions.includes(item.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                  <p className="text-slate-300 text-sm leading-relaxed">
                                    {item.answer}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-slate-400">검색 결과가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* 하단 도움말 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="border-t border-white/10 py-12"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/25">
                <PhoneIcon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                원하는 답변을 찾지 못하셨나요?
              </h3>
              <p className="text-slate-300 text-sm mb-6">
                고객센터로 문의하시면 신속하게 답변해드리겠습니다.
              </p>
              
              <motion.a
                href="/customer-support"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 text-sm"
              >
                고객센터 바로가기
              </motion.a>
            </motion.div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
} 