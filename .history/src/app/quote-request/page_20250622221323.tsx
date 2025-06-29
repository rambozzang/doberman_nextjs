"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles, MapPin, Home, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 단계 정의
const steps = [
  { id: 'step-1', title: '건물 유형', fields: ['buildingType'], icon: Home, description: '시공할 건물의 종류를 알려주세요' },
  { id: 'step-2', title: '시공 위치', fields: ['constructionScope'], icon: MapPin, description: '어느 공간을 시공하실 계획인가요?' },
  { id: 'step-3', title: '시공 면적', fields: ['area'], icon: Sparkles, description: '정확한 견적을 위해 면적을 알려주세요' },
  { id: 'step-4', title: '벽지 종류', fields: ['wallpaperType'], icon: Sparkles, description: '원하시는 벽지 종류를 선택해주세요' },
  { id: 'step-5', title: '추가 요청사항', fields: ['additionalRequest', 'visitDate'], icon: Calendar, description: '추가 서비스나 방문 일정을 알려주세요' },
  { id: 'step-6', title: '고객 정보', fields: ['name', 'phone', 'address'], icon: User, description: '견적을 받으실 연락처를 입력해주세요' },
  { id: 'step-7', title: '지역 선택', fields: ['region'], icon: MapPin, description: '시공 지역을 선택해주세요' },
  { id: 'step-8', title: '완료', fields: [], icon: CheckIcon, description: '견적 요청이 완료되었습니다' },
];

// 옵션 데이터
const buildingTypes = [
  { value: 'apartment', label: '아파트/빌라', icon: '🏢', description: '아파트, 빌라, 오피스텔' },
  { value: 'house', label: '단독주택', icon: '🏠', description: '단독주택, 전원주택' },
  { value: 'office', label: '사무실', icon: '🏢', description: '사무실, 업무공간' },
  { value: 'commercial', label: '상가', icon: '🏪', description: '상가, 매장, 카페' },
  { value: 'other', label: '기타', icon: '🏗️', description: '기타 건물 유형' },
];

// 추후 구현될 옵션들
const constructionScopes = [
  { value: 'living-room', label: '거실', icon: '🛋️', description: '거실 전체 도배' },
  { value: 'bedroom', label: '침실', icon: '🛏️', description: '침실 도배' },
  { value: 'kitchen', label: '주방', icon: '🍳', description: '주방 도배' },
  { value: 'bathroom', label: '화장실', icon: '🚿', description: '화장실 도배' },
  { value: 'all-rooms', label: '전체', icon: '🏠', description: '집 전체 도배' },
];

const wallpaperTypes = [
  { value: 'vinyl', label: '합지벽지', icon: '📋', description: '가장 일반적인 벽지', price: '저렴' },
  { value: 'fabric', label: '실크벽지', icon: '🧵', description: '고급스러운 질감', price: '중간' },
  { value: 'natural', label: '천연벽지', icon: '🌿', description: '친환경 소재', price: '비싸' },
  { value: 'premium', label: '수입벽지', icon: '✨', description: '프리미엄 디자인', price: '매우 비싸' },
];

const additionalRequests = [
  { value: 'furniture-move', label: '가구 이동 서비스', icon: '📦' },
  { value: 'old-removal', label: '기존 벽지 제거', icon: '🗑️' },
  { value: 'wall-repair', label: '벽면 보수', icon: '🔨' },
  { value: 'quick-service', label: '당일 시공', icon: '⚡' },
];

const regions = [
  { value: 'seoul', label: '서울특별시', icon: '🏙️' },
  { value: 'busan', label: '부산광역시', icon: '🌊' },
  { value: 'incheon', label: '인천광역시', icon: '✈️' },
  { value: 'daegu', label: '대구광역시', icon: '🏔️' },
  { value: 'gwangju', label: '광주광역시', icon: '🌸' },
  { value: 'daejeon', label: '대전광역시', icon: '🚄' },
  { value: 'ulsan', label: '울산광역시', icon: '🏭' },
  { value: 'gyeonggi', label: '경기도', icon: '🏘️' },
  { value: 'other', label: '기타 지역', icon: '📍' },
];

export default function QuoteRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [formState, setFormState] = useState({
    buildingType: "",
    constructionScope: [] as string[],
    roomCount: undefined as number | undefined,
    area: { pyeong: undefined as number | undefined, squareMeter: undefined as number | undefined },
    wallpaperType: "",
    additionalRequest: [] as string[],
    visitDate: "",
    name: "",
    phone: "",
    address: "",
    region: "",
    privacyConsent: false,
  });

  // 진행률 계산
  const progress = ((currentStep + 1) / steps.length) * 100;

  // 평수 변환 함수
  const calculateSquareMeters = (pyeong: number | undefined) => {
    if (!pyeong) return undefined;
    return parseFloat((pyeong * 3.305785).toFixed(2));
  };

  // 다음 단계로 이동
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // 이전 단계로 이동
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < steps.length - 2) {
      nextStep();
      return;
    }
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("제출된 데이터:", formState);
      setIsComplete(true);
    } catch (error) {
      console.error("제출 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormState({
      buildingType: "",
      constructionScope: [],
      roomCount: undefined,
      area: { pyeong: undefined, squareMeter: undefined },
      wallpaperType: "",
      additionalRequest: [],
      visitDate: "",
      name: "",
      phone: "",
      address: "",
      region: "",
      privacyConsent: false,
    });
    setCurrentStep(0);
    setIsComplete(false);
  };

  // 폼 필드 업데이트
  const updateField = (field: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'area') {
      if ((value as { pyeong?: number })?.pyeong) {
        setFormState(prev => ({
          ...prev,
          area: {
            ...prev.area,
            squareMeter: calculateSquareMeters((value as { pyeong?: number }).pyeong)
          }
        }));
      }
    }
  };

  // 체크박스 토글
  const toggleCheckbox = (field: string, value: string) => {
    setFormState(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-8 md:py-12 px-4 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg mx-auto text-center p-6 md:p-8"
          >
            {/* 성공 아이콘 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6"
            >
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-3xl font-bold text-white mb-4"
            >
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                🎉 견적 요청 완료!
              </span>
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mb-10"
            >
              <p className="text-xl text-slate-200 mb-4 leading-relaxed">
                견적 요청이 성공적으로 완료되었습니다!
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                전문가들이 검토 후 <span className="text-blue-300 font-semibold">24시간 내</span>에<br />
                맞춤 견적을 제공해드릴 예정입니다.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="space-y-4"
            >
              <motion.button
                onClick={() => router.push('/')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 md:px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-base md:text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 min-h-[48px]"
              >
                홈으로 돌아가기
              </motion.button>
              
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 md:px-8 py-4 bg-slate-700/50 hover:bg-slate-600/60 text-white font-semibold text-base md:text-lg rounded-xl border border-slate-600 hover:border-slate-500 backdrop-blur-sm transition-all duration-300 min-h-[48px]"
              >
                새 견적 요청하기
              </motion.button>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 모바일 상단 네비게이션 */}
      <div className="quote-mobile-nav lg:hidden w-full pt-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                    {(() => {
                      const Icon = steps[currentStep].icon;
                      return <Icon className="w-3 h-3 text-white" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">
                      {steps[currentStep].title}
                    </span>
                    <div className="text-xs text-blue-300">
                      {currentStep + 1}/{steps.length}단계
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-400">{Math.round(progress)}%</div>
                  <div className="text-xs text-slate-400">완료</div>
                </div>
              </div>
              <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules 섹션 */}
      <section className="quote-rules-section w-full py-4 md:py-6 bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 border-y border-white/10 mt-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-4"
          >
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              🎯 도배맨 서비스 약속
            </h3>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm"
          >
            {[
              { icon: '✅', text: '100% 무료 견적', color: 'bg-green-400' },
              { icon: '⚡', text: '24시간 내 연락', color: 'bg-blue-400' },
              { icon: '👨‍🔧', text: '검증된 전문가만', color: 'bg-purple-400' },
              { icon: '🔒', text: '개인정보 보호', color: 'bg-yellow-400' },
              { icon: '📊', text: '최대 5개 견적 비교', color: 'bg-pink-400' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center bg-white/5 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-2 h-2 ${item.color} rounded-full mr-2 animate-pulse`}></div>
                <span className="text-slate-200 font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 메인 콘텐츠 영역 */}
      <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* 왼쪽 사이드바 - 데스크톱에서만 표시 */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">견적 요청</h2>
                      <p className="text-xs text-blue-200">빠르고 정확하게</p>
                    </div>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-white">진행률</span>
                    <span className="text-xs font-bold text-blue-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* 단계 네비게이션 */}
                <nav className="space-y-2">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative flex items-center p-3 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg' 
                            : isCompleted 
                              ? 'bg-green-500/10 border border-green-400/30' 
                              : 'bg-slate-800/30 border border-slate-600/30 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                            : isCompleted 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' 
                              : 'bg-slate-600 shadow-md'
                        }`}>
                          {isCompleted ? (
                            <CheckIcon className="w-4 h-4 text-white" />
                          ) : (
                            <Icon className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1 relative">
                          <div className={`text-xs font-semibold transition-colors duration-300 ${
                            isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-slate-300'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {step.description}
                          </div>
                        </div>
                        
                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-slate-600 text-slate-300'
                        }`}>
                          {index + 1}
                        </div>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-2 col-span-full">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-8 shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      {/* 단계별 헤더 */}
                      <div className="mb-6 md:mb-10">
                        <motion.div 
                          className="flex flex-col sm:flex-row items-start sm:items-center mb-4 md:mb-6"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="relative mb-3 sm:mb-0 sm:mr-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                              {(() => {
                                const Icon = steps[currentStep].icon;
                                return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
                              })()}
                            </div>
                          </div>
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center mb-1">
                              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-0 sm:mr-3">{steps[currentStep].title}</h3>
                              <div className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full self-start">
                                <span className="text-xs font-medium text-blue-300">
                                  {currentStep + 1}/{steps.length}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{steps[currentStep].description}</p>
                          </div>
                        </motion.div>
                      </div>

                      {/* 단계별 콘텐츠 */}
                      <div className="mb-6 md:mb-8">
                        {/* 1단계: 건물 유형 */}
                        {currentStep === 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {buildingTypes.map((type, index) => (
                              <motion.div
                                key={type.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 min-h-[120px] md:min-h-[140px] ${
                                  formState.buildingType === type.value
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => updateField('buildingType', type.value)}
                              >
                                {formState.buildingType === type.value && (
                                  <motion.div 
                                    className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckIcon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                                  </motion.div>
                                )}
                                
                                <div className="relative mb-3 md:mb-4">
                                  <div className={`text-2xl md:text-4xl mb-1 md:mb-2 transition-transform duration-300 ${
                                    formState.buildingType === type.value ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {type.icon}
                                  </div>
                                </div>
                                
                                <div className="relative">
                                  <h4 className={`text-base md:text-lg font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    formState.buildingType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {type.label}
                                  </h4>
                                  <p className={`text-xs md:text-sm leading-relaxed transition-colors duration-300 ${
                                    formState.buildingType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                  }`}>
                                    {type.description}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* 2단계: 시공 위치 */}
                        {currentStep === 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {constructionScopes.map((scope, index) => (
                              <motion.div
                                key={scope.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 min-h-[120px] md:min-h-[140px] ${
                                  formState.constructionScope.includes(scope.value)
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => toggleCheckbox('constructionScope', scope.value)}
                              >
                                {formState.constructionScope.includes(scope.value) && (
                                  <motion.div 
                                    className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckIcon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                                  </motion.div>
                                )}
                                
                                <div className="relative mb-3 md:mb-4">
                                  <div className={`text-2xl md:text-4xl mb-1 md:mb-2 transition-transform duration-300 ${
                                    formState.constructionScope.includes(scope.value) ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {scope.icon}
                                  </div>
                                </div>
                                
                                <div className="relative">
                                  <h4 className={`text-base md:text-lg font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    formState.constructionScope.includes(scope.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {scope.label}
                                  </h4>
                                  <p className={`text-xs md:text-sm leading-relaxed transition-colors duration-300 ${
                                    formState.constructionScope.includes(scope.value) ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                  }`}>
                                    {scope.description}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* 3단계: 시공 면적 */}
                        {currentStep === 2 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  평수 입력
                                </label>
                                <input
                                  type="number"
                                  placeholder="예: 25"
                                  value={formState.area.pyeong || ''}
                                  onChange={(e) => updateField('area', { 
                                    pyeong: parseFloat(e.target.value) || undefined,
                                    squareMeter: formState.area.squareMeter
                                  })}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  제곱미터 (자동 계산)
                                </label>
                                <input
                                  type="text"
                                  value={formState.area.squareMeter ? `${formState.area.squareMeter}㎡` : ''}
                                  readOnly
                                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-300 cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4단계: 벽지 종류 */}
                        {currentStep === 3 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {wallpaperTypes.map((type, index) => (
                              <motion.div
                                key={type.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 min-h-[140px] md:min-h-[160px] ${
                                  formState.wallpaperType === type.value
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => updateField('wallpaperType', type.value)}
                              >
                                {formState.wallpaperType === type.value && (
                                  <motion.div 
                                    className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckIcon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                                  </motion.div>
                                )}
                                
                                <div className="relative mb-3 md:mb-4">
                                  <div className={`text-2xl md:text-4xl mb-1 md:mb-2 transition-transform duration-300 ${
                                    formState.wallpaperType === type.value ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {type.icon}
                                  </div>
                                </div>
                                
                                <div className="relative">
                                  <h4 className={`text-base md:text-lg font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                                    formState.wallpaperType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {type.label}
                                  </h4>
                                  <p className={`text-xs md:text-sm leading-relaxed transition-colors duration-300 ${
                                    formState.wallpaperType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                  }`}>
                                    {type.description}
                                  </p>
                                  <div className={`text-xs font-semibold mt-2 px-2 py-1 rounded-full inline-block ${
                                    type.price === '저렴' ? 'bg-green-500/20 text-green-300' :
                                    type.price === '중간' ? 'bg-yellow-500/20 text-yellow-300' :
                                    type.price === '비싸' ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    {type.price}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* 5단계: 추가 요청사항 */}
                        {currentStep === 4 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              {additionalRequests.map((request, index) => (
                                <motion.div
                                  key={request.value}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`group relative p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 min-h-[100px] ${
                                    formState.additionalRequest.includes(request.value)
                                      ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                      : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                  }`}
                                  onClick={() => toggleCheckbox('additionalRequest', request.value)}
                                >
                                  {formState.additionalRequest.includes(request.value) && (
                                    <motion.div 
                                      className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    >
                                      <CheckIcon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                                    </motion.div>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <div className={`text-xl md:text-2xl mr-3 transition-transform duration-300 ${
                                      formState.additionalRequest.includes(request.value) ? 'scale-110' : 'group-hover:scale-105'
                                    }`}>
                                      {request.icon}
                                    </div>
                                    <h4 className={`text-sm md:text-base font-bold transition-colors duration-300 ${
                                      formState.additionalRequest.includes(request.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                    }`}>
                                      {request.label}
                                    </h4>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                방문 희망 날짜
                              </label>
                              <input
                                type="date"
                                value={formState.visitDate}
                                onChange={(e) => updateField('visitDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-blue-400 focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                        )}

                        {/* 6단계: 고객 정보 */}
                        {currentStep === 5 && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  성함 *
                                </label>
                                <input
                                  type="text"
                                  placeholder="홍길동"
                                  value={formState.name}
                                  onChange={(e) => updateField('name', e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                  연락처 *
                                </label>
                                <input
                                  type="tel"
                                  placeholder="010-1234-5678"
                                  value={formState.phone}
                                  onChange={(e) => updateField('phone', e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                시공 주소 *
                              </label>
                              <input
                                type="text"
                                placeholder="서울시 강남구 역삼동 123-45"
                                value={formState.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* 7단계: 지역 선택 */}
                        {currentStep === 6 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {regions.map((region, index) => (
                              <motion.div
                                key={region.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 min-h-[100px] ${
                                  formState.region === region.value
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => updateField('region', region.value)}
                              >
                                {formState.region === region.value && (
                                  <motion.div 
                                    className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckIcon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                                  </motion.div>
                                )}
                                
                                <div className="flex items-center">
                                  <div className={`text-xl md:text-2xl mr-3 transition-transform duration-300 ${
                                    formState.region === region.value ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {region.icon}
                                  </div>
                                  <h4 className={`text-sm md:text-base font-bold transition-colors duration-300 ${
                                    formState.region === region.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {region.label}
                                  </h4>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* 네비게이션 버튼 */}
                  <div className="border-t border-white/10 pt-6 md:pt-8 mt-6 md:mt-10">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                      <motion.button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        whileHover={currentStep === 0 ? {} : { scale: 1.02 }}
                        whileTap={currentStep === 0 ? {} : { scale: 0.98 }}
                        className={`group relative px-6 py-4 sm:py-3 rounded-xl font-semibold transition-all duration-300 min-h-[48px] ${
                          currentStep === 0
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600'
                            : 'bg-slate-700/50 hover:bg-slate-600/60 text-white border border-slate-600 hover:border-slate-500 backdrop-blur-sm shadow-lg hover:shadow-xl'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <ChevronLeftIcon className="w-5 h-5 mr-2" />
                          <span>이전</span>
                        </div>
                      </motion.button>

                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={isLoading ? {} : { scale: 1.02 }}
                        whileTap={isLoading ? {} : { scale: 0.98 }}
                        className={`group relative px-6 sm:px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-xl min-h-[48px] flex-1 sm:flex-initial ${
                          isLoading
                            ? 'bg-slate-600/50 text-slate-300 cursor-not-allowed border border-slate-600'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-blue-400/50 hover:border-blue-300/50 shadow-blue-500/25 hover:shadow-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                              <span>처리중...</span>
                            </>
                          ) : currentStep === steps.length - 2 ? (
                            <>
                              <Sparkles className="w-5 h-5 mr-3" />
                              <span>견적 요청하기</span>
                            </>
                          ) : (
                            <>
                              <span>다음 단계</span>
                              <ChevronRightIcon className="w-5 h-5 ml-3" />
                            </>
                          )}
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 