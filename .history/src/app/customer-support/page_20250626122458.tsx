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
import { CustomerRequestService } from "@/services/customerRequestService";
import { ContactSendRequest } from "@/types/api";

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
  const [submitError, setSubmitError] = useState<string>("");

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
    setSubmitError("");
    
    try {
      // API 요청 데이터 변환
      const contactRequest: ContactSendRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        inquiryType: formData.category,
        subject: formData.subject,
        content: formData.message
      };
      
      // API 호출
      const response = await CustomerRequestService.sendContactInquiry(contactRequest);
      
      if (response.success) {
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
      } else {
        setSubmitError(response.error || response.message || "문의 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("문의 전송 중 오류:", error);
      setSubmitError("문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
              <HeadphonesIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-4xl font-bold text-white mb-3"
            >
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                고객지원
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              언제든지 도움이 필요하시면 연락해 주세요. 전문 상담팀이 신속하고 정확하게 도와드리겠습니다.
            </motion.p>

            {/* 운영 시간 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl"
            >
              <ClockIcon className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm">
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
        <div className="container mx-auto px-4 py-10">
          {/* 연락처 정보 그리드 */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                다양한 방법으로 연락하세요
              </h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                고객님의 편의에 맞는 방법으로 문의해 주시면 빠르게 응답해드리겠습니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {contactInfo.map((contact, index) => (
                <motion.div
                  key={contact.type}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all duration-300 flex flex-col items-center"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${contact.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    {contact.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{contact.title}</h3>
                  <p className="text-slate-300 text-2xl font-mono tracking-wider mb-2">{contact.value}</p>
                  <p className="text-slate-400 text-sm mb-4 flex-grow">{contact.description}</p>
                  <div className="text-xs text-slate-500 bg-slate-800/50 rounded-full px-3 py-1">
                    <ClockIcon className="w-3 h-3 inline-block mr-1.5" />
                    {contact.available}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
          
          {/* 문의하기 폼 & FAQ 섹션 */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* 문의하기 폼 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <SendIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">온라인 문의</h2>
                    <p className="text-slate-300">궁금한 점을 남겨주시면 24시간 내에 답변드립니다.</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center py-12"
                    >
                      <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">문의가 성공적으로 접수되었습니다.</h3>
                      <p className="text-slate-300">
                        빠른 시일 내에 회신드리겠습니다. <br/>
                        다른 문의가 있으시면 언제든 다시 이용해주세요.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 이름 */}
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">이름</label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="성함을 입력하세요"
                            required
                          />
                        </div>
                        {/* 이메일 */}
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">이메일</label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="example@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 연락처 */}
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">연락처</label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="010-1234-5678"
                            required
                          />
                        </div>

                        {/* 문의 유형 */}
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">문의 유형</label>
                          <select
                            name="category"
                            id="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            required
                          >
                            <option value="" disabled>유형 선택</option>
                            {supportCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 제목 */}
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">제목</label>
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                          placeholder="문의 제목을 입력하세요"
                          required
                        />
                      </div>
                      
                      {/* 내용 */}
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">문의 내용</label>
                        <textarea
                          name="message"
                          id="message"
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                          placeholder="궁금한 점을 자세히 작성해주세요."
                          required
                        ></textarea>
                      </div>

                      {/* 에러 메시지 */}
                      {submitError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <div className="flex items-center">
                            <AlertCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                            <span className="text-red-300 text-sm">{submitError}</span>
                          </div>
                        </div>
                      )}

                      {/* 제출 버튼 */}
                      <div className="pt-2">
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              제출 중...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <SendIcon className="w-5 h-5 mr-2" />
                              문의하기
                            </div>
                          )}
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* FAQ 섹션 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-8">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
                  <h3 className="text-xl font-bold text-white mb-6">자주 묻는 질문 (FAQ)</h3>
                  <ul className="space-y-4">
                    {[
                      {
                        question: "도배 시공 비용은 어떻게 되나요?",
                        link: "/faq#cost"
                      },
                      {
                        question: "시공 기간은 보통 얼마나 걸리나요?",
                        link: "/faq#duration"
                      },
                      {
                        question: "견적 비교는 어떻게 하나요?",
                        link: "/faq#quote"
                      },
                      {
                        question: "A/S 정책은 어떻게 되나요?",
                        link: "/faq#as"
                      },
                      {
                        question: "전문가 선택 기준이 궁금해요.",
                        link: "/regional-guide"
                      }
                    ].map((item, index) => (
                      <li key={index}>
                        <Link href={item.link}>
                          <div className="flex items-center text-slate-300 hover:text-white transition-colors group">
                            <HelpCircleIcon className="w-4 h-4 mr-3 text-blue-400" />
                            <span className="flex-grow">{item.question}</span>
                            <ExternalLinkIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">고객 만족 후기</h3>
                  <div className="space-y-6">
                    {[
                      {
                        name: "김민준",
                        rating: 5,
                        comment: "정말 꼼꼼하고 빠르게 시공해주셨어요. 결과물도 대만족입니다!",
                        location: "서울 강남구"
                      },
                      {
                        name: "이서아",
                        rating: 5,
                        comment: "상담부터 마무리까지 친절하게 응대해주셔서 좋았습니다. 다음에 또 이용할게요.",
                        location: "경기 성남시"
                      }
                    ].map((review, index) => (
                      <div key={index} className="border-b border-slate-700/50 pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-center mb-2">
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
                        <p className="text-slate-300 text-sm">&quot;{review.comment}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        </div>
      </motion.main>
    </div>
  );
} 