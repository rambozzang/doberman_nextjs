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

const constructionScopes = [
  { value: 'all', label: '전체', icon: '🏠', description: '모든 공간' },
  { value: 'living_room', label: '거실', icon: '🛋️', description: '거실 공간' },
  { value: 'room', label: '방', icon: '🛏️', description: '침실, 방' },
  { value: 'kitchen', label: '주방', icon: '🍳', description: '주방, 다이닝' },
  { value: 'bathroom', label: '욕실', icon: '🚿', description: '욕실, 화장실' },
  { value: 'other', label: '기타', icon: '📦', description: '기타 공간' },
];

const wallpaperTypes = [
  { value: 'hapji', label: '합지', icon: '📄', description: '일반 합지 벽지' },
  { value: 'silk', label: '실크', icon: '✨', description: '실크 벽지' },
  { value: 'premium', label: '친환경/프리미엄', icon: '🌿', description: '친환경 고급 벽지' },
  { value: 'consult', label: '상담 후 결정', icon: '💬', description: '전문가와 상담 후 결정' },
];

const additionalRequests = [
  { value: 'remove_wallpaper', label: '기존 벽지 제거', icon: '🔧', description: '기존 벽지 철거 작업' },
  { value: 'mold_removal', label: '곰팡이 제거', icon: '🧽', description: '곰팡이 제거 및 방지' },
  { value: 'furniture_moving', label: '가구 이동 지원', icon: '📦', description: '가구 이동 서비스' },
  { value: 'eco_friendly_glue', label: '친환경 풀 사용', icon: '🌱', description: '친환경 접착제 사용' },
];

const regions = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", 
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", 
  "충청남도", "충청북도", "전라남도", "전라북도", "경상남도", "경상북도", "제주도"
];

export default function QuoteRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
      const currentValues = prev[field as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  if (isComplete) {
    return (
      <div className="min-h-screen quote-request-bg flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckIcon className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-4"
          >
            🎉 견적 요청 완료!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-slate-300 mb-8 leading-relaxed"
          >
            견적 요청이 성공적으로 완료되었습니다.<br />
            곧 전문가들로부터 연락을 받으실 수 있습니다.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}
          >
            <button
              onClick={() => router.push('/')}
              className="w-full btn btn-lg btn-primary"
            >
              홈으로 돌아가기
            </button>
            
            <button
              onClick={resetForm}
              className="w-full btn btn-lg btn-secondary"
            >
              새 견적 요청하기
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen quote-request-bg">
      {/* 헤더 */}
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%), url(/bg1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* 배경 오버레이 및 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-indigo-900/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        {/* 장식적 요소들 */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl"></div>
        
        <div className="container-custom relative z-10 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 mb-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-white">무료 견적 서비스</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  전문 도배 견적을
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  3분만에 받아보세요
                </span>
              </h1>
              
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                전국 200명의 검증된 도배 전문가와 함께하는 스마트 견적 서비스
                <br />
                <span className="text-lg text-blue-200">한 번의 신청으로 최대 5개 업체 견적 비교</span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-100">
                <div className="flex items-center">
                  <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                  무료 견적
                </div>
                <div className="flex items-center">
                  <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                  빠른 매칭
                </div>
                <div className="flex items-center">
                  <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                  검증된 전문가
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 모바일 상단 네비게이션 */}
      <div className="lg:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container-custom py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {currentStep + 1}/{steps.length}단계: {steps[currentStep].title}
                </span>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="ml-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <svg 
                className={`w-5 h-5 text-white transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* 모바일 단계 드롭다운 */}
          <AnimatePresence>
            {isMobileNavOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 space-y-2 max-h-64 overflow-y-auto"
              >
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-500/20 border border-blue-500/50' 
                          : isCompleted 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : 'bg-slate-800/50 border border-slate-600'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-slate-600 text-white'
                      }`}>
                        {isCompleted ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-slate-300'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="container-custom page-wrapper">
        <div className="grid-responsive-2 items-start">
          {/* 왼쪽 사이드바 - 데스크톱에서만 표시 */}
          <div className="hidden lg:block">
            <div className="sticky top-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">견적 요청</h2>
                    <p className="text-sm text-blue-200">빠르고 정확하게</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  간단한 정보 입력으로<br />
                  <span className="text-blue-300 font-medium">최대 5개 업체</span>의 맞춤 견적을 받아보세요
                </p>
              </div>

              {/* 진행률 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-white">진행률</span>
                  <span className="text-sm font-bold text-blue-400">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
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
                      {/* 활성 상태 글로우 효과 */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm"></div>
                      )}
                      
                      <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                          : isCompleted 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' 
                            : 'bg-slate-600 shadow-md'
                      }`}>
                        {isCompleted ? (
                          <CheckIcon className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      
                      <div className="ml-4 flex-1 relative">
                        <div className={`text-sm font-semibold transition-colors duration-300 ${
                          isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-slate-300'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {step.description}
                        </div>
                      </div>
                      
                      {/* 단계 번호 */}
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${
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

              {/* 하단 도움말 */}
              <div className="mt-8 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-xl">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 mt-1">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">도움이 필요하세요?</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      정확한 견적을 위해 최대한 상세히 입력해주세요. 
                      전문가가 현장 확인 후 정확한 견적을 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-1 col-span-full">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
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
                    <div className="mb-10">
                      <motion.div 
                        className="flex items-center mb-6"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="relative mr-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            {(() => {
                              const Icon = steps[currentStep].icon;
                              return <Icon className="w-8 h-8 text-white" />;
                            })()}
                          </div>
                          {/* 글로우 효과 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30 -z-10"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-3xl font-bold text-white mr-4">{steps[currentStep].title}</h3>
                            <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
                              <span className="text-sm font-medium text-blue-300">
                                {currentStep + 1}/{steps.length}
                              </span>
                            </div>
                          </div>
                          <p className="text-lg text-slate-300 leading-relaxed">{steps[currentStep].description}</p>
                        </div>
                      </motion.div>
                      
                      {/* 진행률 바 - 모바일용 */}
                      <div className="lg:hidden mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white">진행률</span>
                          <span className="text-sm font-bold text-blue-400">{Math.round(progress)}%</span>
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

                    {/* 단계별 콘텐츠 */}
                    <div style={{ marginBottom: 'var(--spacing-8)' }}>
                      {/* 1단계: 건물 유형 */}
                      {currentStep === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {buildingTypes.map((type, index) => (
                            <motion.div
                              key={type.value}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.03, y: -5 }}
                              whileTap={{ scale: 0.97 }}
                              className={`group relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                                formState.buildingType === type.value
                                  ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                  : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                              }`}
                              onClick={() => updateField('buildingType', type.value)}
                            >
                              {/* 선택된 상태 표시 */}
                              {formState.buildingType === type.value && (
                                <>
                                  <motion.div 
                                    className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckIcon className="w-5 h-5 text-white" />
                                  </motion.div>
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
                                </>
                              )}
                              
                              {/* 아이콘 */}
                              <div className="relative mb-4">
                                <div className={`text-4xl mb-2 transition-transform duration-300 ${
                                  formState.buildingType === type.value ? 'scale-110' : 'group-hover:scale-105'
                                }`}>
                                  {type.icon}
                                </div>
                              </div>
                              
                              {/* 텍스트 */}
                              <div className="relative">
                                <h4 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                                  formState.buildingType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                }`}>
                                  {type.label}
                                </h4>
                                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                                  formState.buildingType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                }`}>
                                  {type.description}
                                </p>
                              </div>
                              
                              {/* 호버 효과 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* 2단계: 시공 위치 */}
                      {currentStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                            {constructionScopes.map((scope) => (
                              <motion.div
                                key={scope.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                  formState.constructionScope.includes(scope.value)
                                    ? 'border-blue-500 bg-blue-500/10 backdrop-blur-sm'
                                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
                                }`}
                                onClick={() => toggleCheckbox('constructionScope', scope.value)}
                              >
                                {formState.constructionScope.includes(scope.value) && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div className="text-2xl mb-2">{scope.icon}</div>
                                <h4 className="font-semibold text-white mb-1">{scope.label}</h4>
                                <p className="text-sm text-slate-300">{scope.description}</p>
                              </motion.div>
                            ))}
                          </div>

                          {/* 방 선택 시 방 개수 입력 */}
                          {formState.constructionScope.includes('room') && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 p-4 rounded-lg"
                            >
                              <label className="block text-sm font-medium text-white mb-2">
                                방 개수
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={formState.roomCount || ''}
                                onChange={(e) => updateField('roomCount', parseInt(e.target.value) || undefined)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                                placeholder="예: 3"
                              />
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* 3단계: 시공 면적 */}
                      {currentStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                평수
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.1"
                                value={formState.area.pyeong || ''}
                                onChange={(e) => {
                                  const pyeong = parseFloat(e.target.value) || undefined;
                                  updateField('area', { 
                                    pyeong, 
                                    squareMeter: calculateSquareMeters(pyeong) 
                                  });
                                }}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                                placeholder="예: 32"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                제곱미터 (자동 계산)
                              </label>
                              <input
                                type="text"
                                value={formState.area.squareMeter ? `약 ${formState.area.squareMeter} m²` : ''}
                                disabled
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-slate-300 rounded-md"
                                placeholder="평수 입력 시 자동 계산"
                              />
                            </div>
                          </div>
                          
                          <div className="bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-sm text-blue-300">
                              💡 <strong>팁:</strong> 정확한 면적을 모르시는 경우, 대략적인 평수를 입력해주세요. 
                              전문가가 현장 확인 후 정확한 견적을 제공해드립니다.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4단계: 벽지 종류 */}
                      {currentStep === 3 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                          {wallpaperTypes.map((type) => (
                            <motion.div
                              key={type.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                formState.wallpaperType === type.value
                                  ? 'border-blue-500 bg-blue-500/10 backdrop-blur-sm'
                                  : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
                              }`}
                              onClick={() => updateField('wallpaperType', type.value)}
                            >
                              {formState.wallpaperType === type.value && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div className="text-2xl mb-2">{type.icon}</div>
                              <h4 className="font-semibold text-white mb-1">{type.label}</h4>
                              <p className="text-sm text-slate-300">{type.description}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* 5단계: 추가 요청사항 */}
                      {currentStep === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                          <div>
                            <h4 className="text-lg font-semibold text-white" style={{ marginBottom: 'var(--spacing-4)' }}>추가 서비스 (선택사항)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                              {additionalRequests.map((request) => (
                                <motion.div
                                  key={request.value}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    formState.additionalRequest.includes(request.value)
                                      ? 'border-blue-500 bg-blue-500/10 backdrop-blur-sm'
                                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
                                  }`}
                                  onClick={() => toggleCheckbox('additionalRequest', request.value)}
                                >
                                  {formState.additionalRequest.includes(request.value) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <CheckIcon className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  <div className="text-2xl mb-2">{request.icon}</div>
                                  <h4 className="font-semibold text-white mb-1">{request.label}</h4>
                                  <p className="text-sm text-slate-300">{request.description}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              희망 방문 날짜 (선택사항)
                            </label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={formState.visitDate}
                              onChange={(e) => updateField('visitDate', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* 6단계: 고객 정보 */}
                      {currentStep === 5 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                이름 *
                              </label>
                              <input
                                type="text"
                                required
                                value={formState.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                                placeholder="홍길동"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                연락처 *
                              </label>
                              <input
                                type="tel"
                                required
                                value={formState.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                                placeholder="010-1234-5678"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              시공 주소 *
                            </label>
                            <input
                              type="text"
                              required
                              value={formState.address}
                              onChange={(e) => updateField('address', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                              placeholder="서울특별시 강남구 테헤란로 123"
                            />
                          </div>

                          <div className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-sm text-yellow-300">
                              📞 <strong>개인정보 처리 방침:</strong> 입력하신 정보는 견적 제공 목적으로만 사용되며, 
                              관련 법령에 따라 안전하게 보관됩니다.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 7단계: 지역 선택 */}
                      {currentStep === 6 && (
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4" style={{ gap: 'var(--spacing-3)' }}>
                            {regions.map((region) => (
                              <motion.button
                                key={region}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                  formState.region === region
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-300 backdrop-blur-sm'
                                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 text-white backdrop-blur-sm'
                                }`}
                                onClick={() => updateField('region', region)}
                              >
                                {region}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 네비게이션 버튼 */}
                <div className="border-t border-slate-600" style={{ paddingTop: 'var(--spacing-6)' }}>
                  {/* 모바일에서 현재 단계 정보 */}
                  <div className="lg:hidden mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">
                        {currentStep + 1}/{steps.length}단계
                      </span>
                      <span className="text-primary font-medium">
                        {Math.round(progress)}% 완료
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="progress-container">
                        <div 
                          className="progress-bar"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`btn ${
                        currentStep === 0
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'btn-secondary'
                      }`}
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-2" />
                      이전
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`btn btn-lg ${
                        isLoading
                          ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          처리중...
                        </div>
                      ) : currentStep === steps.length - 2 ? (
                        '견적 요청하기'
                      ) : (
                        <>
                          다음
                          <ChevronRightIcon className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 