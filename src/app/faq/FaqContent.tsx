"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDownIcon, 
  SearchIcon, 
  HelpCircleIcon, 
  CreditCardIcon, 
  HomeIcon, 
  PhoneIcon 
} from "lucide-react";

// FAQ 데이터
import { faqCategories as categoryData } from "./data";

const categoryIcons = { service: HelpCircleIcon, quote: CreditCardIcon, construction: HomeIcon };
const faqCategories = categoryData.map(category => ({
  ...category, icon: categoryIcons[category.id as keyof typeof categoryIcons],
}));
const categories = [{ id: 'all', title: '전체 질문', icon: HelpCircleIcon, color: 'from-blue-500 to-cyan-500' }, ...faqCategories];

export default function FaqContent() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const questions = faqCategories
    .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
    .flatMap(category => category.questions);
  const getFilteredQuestions = () => {
    const term = searchTerm.trim().toLowerCase();
    return questions.filter(item => !term || item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-blue-500/25"
            >
              <HelpCircleIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                자주 묻는 질문
              </span>
            </motion.h1>
            
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              도배르만 서비스에 대한 궁금한 점들을 빠르게 해결해보세요
            </motion.p>

            {/* 검색창 */}
            <motion.div
              initial={false}
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
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 카테고리 사이드바 */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-6 space-y-2.5">
                <h3 className="text-base font-bold text-white mb-3">카테고리</h3>
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      aria-pressed={selectedCategory === category.id}
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
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="lg:col-span-3"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-5">{categories.find(c => c.id === selectedCategory)?.title}</h2>
                    <div className="space-y-4">
                      {getFilteredQuestions().length > 0 ? (
                        getFilteredQuestions().map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="border-b border-white/10 last:border-b-0 pb-4 last:pb-0"
                          >
                            <details className="group">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                                <h3 className="text-base font-semibold text-white">{item.question}</h3>
                                <ChevronDownIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                              </summary>
                              <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.answer}</p>
                            </details>
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
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="border-t border-white/10 py-12"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={false}
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