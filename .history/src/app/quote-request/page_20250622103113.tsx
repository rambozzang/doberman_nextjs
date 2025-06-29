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
            className="text-3xl font-bold text-gray-800 mb-4"
          >
            🎉 견적 요청 완료!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-8 leading-relaxed"
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
      <div className="quote-header">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-white">무료 견적 요청하기</h1>
              <p className="mt-2 text-slate-300">
                전국 200명의 도배사와 함께하는 도배 비교견적 서비스, 한 번의 신청으로 여러 도배 전문가의 견적을 비교해보세요!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom page-wrapper">
        <div className="grid-responsive-2">
                      {/* 왼쪽 사이드바 */}
            <div>
              <div className="card-enhanced sticky top-8">
              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <h2 className="text-h4 font-semibold text-white" style={{ marginBottom: 'var(--spacing-2)' }}>무료 견적 요청</h2>
                <p className="text-body-sm text-subtle">
                  3분만 투자하면 최대 5개 업체의<br />
                  맞춤 견적을 받아보세요
                </p>
              </div>

              {/* 진행률 */}
              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-2)' }}>
                  <span className="text-caption font-medium text-white">진행률</span>
                  <span className="text-caption font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="progress-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 단계 네비게이션 */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'glass-effect border-l-4 border-primary glow-effect' 
                          : isCompleted 
                            ? 'glass-effect border-l-4 border-success' 
                            : 'card border-l-4 border-transparent'
                      }`}
                      style={{ padding: 'var(--spacing-3)' }}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive 
                          ? 'bg-primary text-white glow-effect' 
                          : isCompleted 
                            ? 'bg-success text-white' 
                            : 'bg-muted text-white'
                      }`}>
                        {isCompleted ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className={`text-body-sm font-medium ${
                          isActive ? 'text-white' : isCompleted ? 'text-success' : 'text-muted'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

                      {/* 메인 콘텐츠 */}
            <div>
              <div className="card-enhanced">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* 단계별 헤더 */}
                    <div style={{ marginBottom: 'var(--spacing-8)' }}>
                      <div className="flex items-center" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                          {(() => {
                            const Icon = steps[currentStep].icon;
                            return <Icon className="w-5 h-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <h3 className="text-h3 font-bold text-white">{steps[currentStep].title}</h3>
                          <p className="text-body text-subtle mt-1">{steps[currentStep].description}</p>
                        </div>
                      </div>
                    </div>

                    {/* 단계별 콘텐츠 */}
                    <div style={{ marginBottom: 'var(--spacing-8)' }}>
                      {/* 1단계: 건물 유형 */}
                      {currentStep === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                          {buildingTypes.map((type) => (
                            <motion.div
                              key={type.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                formState.buildingType === type.value
                                  ? 'border-blue-500 bg-blue-500/10 backdrop-blur-sm'
                                  : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
                              }`}
                              onClick={() => updateField('buildingType', type.value)}
                            >
                              {formState.buildingType === type.value && (
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                이름 *
                              </label>
                              <input
                                type="text"
                                required
                                value={formState.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="홍길동"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                연락처 *
                              </label>
                              <input
                                type="tel"
                                required
                                value={formState.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="010-1234-5678"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              시공 주소 *
                            </label>
                            <input
                              type="text"
                              required
                              value={formState.address}
                              onChange={(e) => updateField('address', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="서울특별시 강남구 테헤란로 123"
                            />
                          </div>

                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-yellow-800">
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
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
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
                <div className="flex justify-between items-center border-t border-gray-200" style={{ paddingTop: 'var(--spacing-6)' }}>
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`btn ${
                      currentStep === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                        ? 'bg-gray-400 text-white cursor-not-allowed'
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 