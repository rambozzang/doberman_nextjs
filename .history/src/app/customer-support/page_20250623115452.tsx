"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeadphonesIcon, 
  PhoneIcon, 
  MailIcon, 
  MessageCircleIcon, 
  ClockIcon, 
  MapPinIcon,
  SendIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  FileTextIcon,
  UserIcon,
  StarIcon,
  ExternalLinkIcon
} from "lucide-react";
import Link from "next/link";

interface ContactInfo {
  type: string;
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: string;
}

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

const contactInfo: ContactInfo[] = [
  {
    type: "phone",
    title: "전화 상담",
    value: "1588-1234",
    description: "즉시 상담 가능",
    icon: <PhoneIcon className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    available: "평일 09:00-18:00"
  },
  {
    type: "email",
    title: "이메일 문의",
    value: "support@doberman.co.kr",
    description: "24시간 접수",
    icon: <MailIcon className="w-6 h-6" />,
    color: "from-emerald-500 to-green-500",
    available: "24시간 접수 가능"
  },
  {
    type: "chat",
    title: "실시간 채팅",
    value: "온라인 상담",
    description: "빠른 답변",
    icon: <MessageCircleIcon className="w-6 h-6" />,
    color: "from-purple-500 to-violet-500",
    available: "평일 09:00-22:00"
  },
  {
    type: "visit",
    title: "방문 상담",
    value: "서울특별시 강남구",
    description: "예약 필수",
    icon: <MapPinIcon className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    available: "평일 10:00-17:00"
  }
];

const supportCategories: SupportCategory[] = [
  {
    id: "general",
    title: "일반 문의",
    description: "서비스 관련 기본적인 질문",
    icon: <HelpCircleIcon className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "quote",
    title: "견적 관련",
    description: "견적 요청 및 비교 문의",
    icon: <FileTextIcon className="w-5 h-5" />,
    color: "from-emerald-500 to-green-500"
  },
  {
    id: "technical",
    title: "기술 지원",
    description: "사이트 이용 중 문제 해결",
    icon: <AlertCircleIcon className="w-5 h-5" />,
    color: "from-purple-500 to-violet-500"
  },
  {
    id: "business",
    title: "사업 제휴",
    description: "전문가 등록 및 파트너십",
    icon: <UserIcon className="w-5 h-5" />,
    color: "from-orange-500 to-red-500"
  }
];

export default function CustomerSupportPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 실제 API 호출을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // 폼 초기화
    setFormData({
      name: "",
      email: "",
      phone: "",
      category: "",
      subject: "",
      message: ""
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
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
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-blue-500/25"
            >
              <HeadphonesIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                고객지원
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              언제든지 도움이 필요하시면 연락해 주세요. 전문 상담팀이 신속하고 정확하게 도와드리겠습니다.
            </motion.p>

            {/* 운영 시간 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl"
            >
              <ClockIcon className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300">
                <strong className="text-white">평일 09:00-18:00</strong> 상담 가능 
                <span className="text-slate-400 ml-2">| 주말/공휴일 휴무</span>
              </span>
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
        <div className="container mx-auto px-4 py-12">
          {/* 연락처 정보 그리드 */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                다양한 방법으로 연락하세요
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                고객님의 편의에 맞는 방법으로 문의해 주시면 빠르게 응답해드리겠습니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((contact, index) => (
                <motion.div
                  key={contact.type}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${contact.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {contact.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{contact.title}</h3>
                  <p className="text-lg font-medium text-blue-400 mb-2">{contact.value}</p>
                  <p className="text-slate-400 text-sm mb-3">{contact.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ClockIcon className="w-3 h-3" />
                    <span>{contact.available}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 문의 양식과 추가 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 문의 양식 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <SendIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">문의하기</h2>
                </div>

                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">문의가 접수되었습니다</h3>
                      <p className="text-slate-400 mb-6">24시간 내에 답변드리겠습니다.</p>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
                      >
                        새 문의 작성
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                            이름 *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300"
                            placeholder="홍길동"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                            이메일 *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300"
                            placeholder="hong@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                            연락처
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300"
                            placeholder="010-1234-5678"
                          />
                        </div>
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                            문의 유형 *
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-blue-400 focus:outline-none transition-all duration-300"
                          >
                            <option value="">선택해주세요</option>
                            {supportCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                          제목 *
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300"
                          placeholder="문의 제목을 입력해주세요"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                          문의 내용 *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-all duration-300 resize-none"
                          placeholder="문의하실 내용을 자세히 작성해주세요"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>전송 중...</span>
                          </>
                        ) : (
                          <>
                            <SendIcon className="w-5 h-5" />
                            <span>문의하기</span>
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 사이드바 정보 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="space-y-6"
            >
              {/* 자주 묻는 질문 */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <HelpCircleIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">자주 묻는 질문</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  일반적인 궁금증은 FAQ에서 빠르게 해결하세요
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
                >
                  <span className="text-sm font-medium">FAQ 바로가기</span>
                  <ExternalLinkIcon className="w-4 h-4" />
                </Link>
              </div>

              {/* 평균 응답 시간 */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">응답 시간</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">전화 문의</span>
                    <span className="text-blue-400 font-medium">즉시</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">채팅 문의</span>
                    <span className="text-blue-400 font-medium">2-5분</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">이메일 문의</span>
                    <span className="text-blue-400 font-medium">24시간 이내</span>
                  </div>
                </div>
              </div>

              {/* 고객 만족도 */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <StarIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">고객 만족도</h3>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">98.5%</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm">
                    평균 4.9점 (지난 30일 기준)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
} 