"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles, MapPin, Home, Calendar, User } from "lucide-react";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CreateCustomerRequestRequest, UserInfo } from "@/types/api";
import { AuthManager } from "@/lib/auth";

// 단계 정의
const steps = [
  { id: 'step-1', title: '건물 유형', fields: ['buildingType'], icon: Home, description: '시공할 건물의 종류를 알려주세요' },
  { id: 'step-2', title: '시공 위치', fields: ['constructionScope'], icon: MapPin, description: '어느 공간을 시공하실 계획인가요?' },
  { id: 'step-3', title: '시공 면적', fields: ['area'], icon: Sparkles, description: '정확한 견적을 위해 면적을 알려주세요' },
  { id: 'step-4', title: '벽지 종류', fields: ['wallpaperType'], icon: Sparkles, description: '원하시는 벽지 종류를 선택해주세요' },
  { id: 'step-5', title: '추가 요청사항', fields: ['additionalRequest', 'visitDate'], icon: Calendar, description: '추가 서비스나 방문 일정을 알려주세요' },
  { id: 'step-6', title: '지역 선택', fields: ['region'], icon: MapPin, description: '시공 지역을 선택해주세요' },
  { id: 'step-7', title: '고객 정보', fields: ['name', 'phone', 'email', 'password'], icon: User, description: '견적 및 상담을 위한 연락처 정보를 입력해주세요' },
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
  { value: 'room', label: '방', icon: '🛏️', description: '방 도배 (개수 선택 가능)' },
  { value: 'kitchen', label: '주방', icon: '🍳', description: '주방 도배' },
  { value: 'bathroom', label: '화장실', icon: '🚿', description: '화장실 도배' },
  { value: 'all-rooms', label: '전체', icon: '🏠', description: '집 전체 도배' },
];

const wallpaperTypes = [
  { value: 'vinyl', label: '합지벽지', icon: '📋', description: '가장 일반적인 벽지', price: '저렴' },
  { value: 'fabric', label: '실크벽지', icon: '🧵', description: '고급스러운 질감', price: '중간' },
  { value: 'silk-vinyl', label: '실크 + 합지', icon: '🎨', description: '실크와 합지의 조합', price: '중간' },
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
  { value: 'daegu', label: '대구광역시', icon: '🏔️' },
  { value: 'incheon', label: '인천광역시', icon: '✈️' },
  { value: 'gwangju', label: '광주광역시', icon: '🌸' },
  { value: 'daejeon', label: '대전광역시', icon: '🚄' },
  { value: 'ulsan', label: '울산광역시', icon: '🏭' },
  { value: 'sejong', label: '세종특별자치시', icon: '🏛️' },
  { value: 'gyeonggi', label: '경기도', icon: '🏘️' },
  { value: 'gangwon', label: '강원도', icon: '⛰️' },
  { value: 'chungnam', label: '충청남도', icon: '🌾' },
  { value: 'chungbuk', label: '충청북도', icon: '🏞️' },
  { value: 'jeonnam', label: '전라남도', icon: '🌿' },
  { value: 'jeonbuk', label: '전라북도', icon: '🍃' },
  { value: 'gyeongnam', label: '경상남도', icon: '🏔️' },
  { value: 'gyeongbuk', label: '경상북도', icon: '⛰️' },
  { value: 'jeju', label: '제주도', icon: '🏝️' },
];

export default function QuoteRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
    email: "",
    password: "",
    address: "",
    region: "",
    privacyConsent: false,
  });

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const loginStatus = AuthManager.isLoggedIn();
      const user = AuthManager.getUserInfo();
      setIsLoggedIn(loginStatus);
      setUserInfo(user);
    };

    checkLoginStatus();
  }, []);

  // 로그인 상태에 따른 총 단계 수 계산 (로그인된 경우 고객정보 단계 제외)
  const totalSteps = isLoggedIn ? steps.length - 1 : steps.length;
  
  // 진행률 계산
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // 평수 변환 함수
  const calculateSquareMeters = (pyeong: number | undefined) => {
    if (!pyeong) return undefined;
    return parseFloat((pyeong * 3.305785).toFixed(2));
  };

  // 현재 단계 검증
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // 건물 유형
        return !!formState.buildingType;
      case 1: // 시공 위치
        const hasConstructionScope = formState.constructionScope.length > 0;
        const hasRoomSelected = formState.constructionScope.includes('room');
        const hasRoomCount = formState.roomCount && formState.roomCount > 0;
        
        // "방"이 선택된 경우 방 개수도 입력되어야 함
        if (hasRoomSelected && !hasRoomCount) {
          return false;
        }
        
        return hasConstructionScope;
      case 2: // 시공 면적
        return !!formState.area.pyeong;
      case 3: // 벽지 종류
        return !!formState.wallpaperType;
      case 4: // 추가 요청사항 (선택사항)
        return true;
      case 5: // 지역 선택
        return !!formState.region;
      case 6: // 고객 정보 (로그인된 경우 스킵)
        if (isLoggedIn) return true; // 로그인된 경우 항상 통과
        return !!(formState.name && formState.phone && formState.email && formState.password);
      default:
        return true;
    }
  };

  // 다음 단계로 이동
  const nextStep = () => {
    if (!validateCurrentStep()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    // 로그인된 경우 6단계(지역선택) 후 바로 완료 단계로 이동
    if (isLoggedIn && currentStep === 5) {
      setCurrentStep(7); // 완료 단계로 바로 이동
      window.scrollTo(0, 0);
      return;
    }
    
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

  // value를 label로 변환하는 헬퍼 함수들
  const getBuildingTypeLabel = (value: string): string => {
    const item = buildingTypes.find(type => type.value === value);
    return item ? `[${item.label}]` : "";
  };

  const getConstructionScopeLabels = (values: string[]): string => {
    const labels = values.map(value => {
      const item = constructionScopes.find(scope => scope.value === value);
      if (!item) return "";
      
      // "방"이 선택되고 방 개수가 있는 경우 개수 정보 추가
      if (value === 'room' && formState.roomCount) {
        return `[${item.label} ${formState.roomCount}개]`;
      }
      
      return `[${item.label}]`;
    }).filter(label => label !== "");
    return labels.join(',');
  };

  const getWallpaperTypeLabel = (value: string): string => {
    const item = wallpaperTypes.find(type => type.value === value);
    return item ? `[${item.label}]` : "";
  };

  const getAdditionalRequestLabels = (values: string[]): string => {
    const labels = values.map(value => {
      const item = additionalRequests.find(req => req.value === value);
      return item ? item.label : "";
    }).filter(label => label !== "");
    return labels.join(', ');
  };

  const getRegionLabel = (value: string): string => {
    const item = regions.find(region => region.value === value);
    return item ? item.label : "";
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 마지막 단계(완료)에서는 아무것도 하지 않음
    if (currentStep === steps.length - 1) {
      return;
    }
    
    // 견적 요청 단계가 아니면 다음 단계로 이동
    if ((isLoggedIn && currentStep < 5) || (!isLoggedIn && currentStep < 6)) {
      nextStep();
      return;
    }
    
    // 마지막 견적 요청 단계에서 다음 단계(완료 단계)로 이동
    nextStep();
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
      email: "",
      password: "",
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
      
      // "방"이 선택 해제되면 방 개수도 초기화
      const updatedState = {
        ...prev,
        [field]: newArray
      };
      
      if (field === 'constructionScope' && value === 'room' && !newArray.includes('room')) {
        updatedState.roomCount = undefined;
      }
      
      return updatedState;
    });
  };

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="quote-main-content flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-8 md:py-12 px-4 pt-24">
          <div className="max-w-lg mx-auto text-center p-6 md:p-8">
            {/* 성공 아이콘 */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                <CheckIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                🎉 견적 요청 완료!
              </span>
            </h2>
            
            <div className="mb-10">
              <p className="text-xl text-slate-200 mb-4 leading-relaxed">
                견적 요청이 성공적으로 완료되었습니다!
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                전문가들이 검토 후 <span className="text-blue-300 font-semibold">24시간 내</span>에<br />
                맞춤 견적을 제공해드릴 예정입니다.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 md:px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-base md:text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 min-h-[48px] hover:scale-105"
              >
                홈으로 돌아가기
              </button>
              
              <button
                onClick={resetForm}
                className="w-full px-6 md:px-8 py-4 bg-slate-700/50 hover:bg-slate-600/60 text-white font-semibold text-base md:text-lg rounded-xl border border-slate-600 hover:border-slate-500 backdrop-blur-sm transition-all duration-300 min-h-[48px] hover:scale-105"
              >
                새 견적 요청하기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 빠른 링크 섹션 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/30 to-purple-900/30 pt-20 pb-4">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-base md:text-xl font-bold text-white mb-1">
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                견적 요청 서비스
              </span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">원하는 서비스를 선택해주세요</p>
          </div>
          
          {/* 카드들만 모바일에서 숨김 */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* 견적 요청하기 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">견적 요청하기</h3>
                  <p className="text-slate-400 text-sm">새로운 도배 견적 요청</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                무료로 최대 5개의 견적을 받아보세요. 검증된 전문가들이 24시간 내에 연락드립니다.
              </p>
              <div className="text-blue-400 text-sm font-medium">여기서 시작 →</div>
            </div>
            
            {/* 전체 견적 리스트 */}
            <div
              onClick={() => router.push('/quote-request/list')}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mr-4">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">전체 견적 리스트</h3>
                  <p className="text-slate-400 text-sm">모든 견적 요청 보기</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                다른 고객들의 견적 요청을 확인하고 시장 가격을 파악해보세요.
              </p>
              <div className="text-emerald-400 text-sm font-medium">리스트 보기 →</div>
            </div>
            
            {/* 내 견적 요청 */}
            <div
              onClick={() => router.push('/quote-request/my-quotes')}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">내 견적 요청</h3>
                  <p className="text-slate-400 text-sm">내가 요청한 견적 관리</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                내가 요청한 견적들을 확인하고 진행 상황을 관리하세요.
              </p>
              <div className="text-purple-400 text-sm font-medium">내 견적 보기 →</div>
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 상단 네비게이션 */}
      <div className="quote-mobile-nav lg:hidden w-full">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 hover:scale-110 hover:rotate-5 transition-transform duration-300">
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
                  <div className="text-xs font-bold text-blue-400">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-xs text-slate-400">완료</div>
                </div>
              </div>
              <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      
         

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
                      <h2 className="text-lg font-bold text-white">
                        견적 요청
                      </h2>
                      <p className="text-xs text-blue-200">
                        빠르고 정확하게
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-white">진행률</span>
                    <span className="text-xs font-bold text-blue-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <nav className="space-y-2">
                  {steps.map((step, index) => {
                    // 로그인된 경우 고객정보 단계(6번) 스킵
                    if (isLoggedIn && index === 6) return null;
                    
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isSkipped = isLoggedIn && index === 6;
                    
                    return (
                      <div
                        key={step.id}
                        className={`relative flex items-center p-3 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg' 
                            : isCompleted 
                              ? 'bg-green-500/10 border border-green-400/30' 
                              : isSkipped
                                ? 'bg-slate-600/20 border border-slate-500/20 opacity-50'
                                : 'bg-slate-800/30 border border-slate-600/30 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                            : isCompleted 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' 
                              : isSkipped
                                ? 'bg-slate-500 shadow-md opacity-50'
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
                            isActive ? 'text-white' : isCompleted ? 'text-green-300' : isSkipped ? 'text-slate-400' : 'text-slate-300'
                          }`}>
                            {step.title}
                            {isSkipped && isLoggedIn && <span className="ml-2 text-xs text-blue-300">(스킵됨)</span>}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {isSkipped && isLoggedIn ? "로그인 정보 사용" : step.description}
                          </div>
                        </div>
                        
                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isSkipped
                                ? 'bg-slate-500 text-slate-300 opacity-50'
                                : 'bg-slate-600 text-slate-300'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-2 col-span-full">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-3">
                          {(() => {
                            const Icon = steps[currentStep].icon;
                            return <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{steps[currentStep].title}</h3>
                          <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{steps[currentStep].description}</p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                          <span className="text-sm font-bold text-blue-300">
                            {currentStep + 1}/{steps.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 sm:hidden">{steps[currentStep].description}</p>
                  </div>

                  <div className="mb-6 md:mb-8">
                    {/* 1단계: 건물 유형 */}
                    {currentStep === 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {buildingTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`group relative p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[90px] md:min-h-[100px] hover:scale-105 hover:-translate-y-1 ${
                              formState.buildingType === type.value
                                ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                            }`}
                            onClick={() => updateField('buildingType', type.value)}
                          >
                            {formState.buildingType === type.value && (
                              <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                              </div>
                            )}
                            
                            <div className="relative mb-2 md:mb-3">
                              <div className={`text-xl md:text-2xl mb-1 transition-transform duration-300 ${
                                formState.buildingType === type.value ? 'scale-110' : 'group-hover:scale-105'
                              }`}>
                                {type.icon}
                              </div>
                            </div>
                            
                            <div className="relative">
                              <h4 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                formState.buildingType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                              }`}>
                                {type.label}
                              </h4>
                              <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                                formState.buildingType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                              }`}>
                                {type.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2단계: 시공 위치 */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                          {constructionScopes.map((scope) => (
                            <div
                              key={scope.value}
                              className={`group relative p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[90px] md:min-h-[100px] hover:scale-105 hover:-translate-y-1 ${
                                formState.constructionScope.includes(scope.value)
                                  ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                  : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                              }`}
                              onClick={() => toggleCheckbox('constructionScope', scope.value)}
                            >
                              {formState.constructionScope.includes(scope.value) && (
                                <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                </div>
                              )}
                              
                              <div className="relative mb-2 md:mb-3">
                                <div className={`text-xl md:text-2xl mb-1 transition-transform duration-300 ${
                                  formState.constructionScope.includes(scope.value) ? 'scale-110' : 'group-hover:scale-105'
                                }`}>
                                  {scope.icon}
                                </div>
                              </div>
                              
                              <div className="relative">
                                <h4 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                  formState.constructionScope.includes(scope.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                }`}>
                                  {scope.label}
                                </h4>
                                <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                                  formState.constructionScope.includes(scope.value) ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                                }`}>
                                  {scope.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 방 개수 입력 필드 - "방"이 선택되었을 때만 표시 */}
                        {formState.constructionScope.includes('room') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 animate-in slide-in-from-top duration-300">
                            <div className="flex  items-center mb-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-bold">🛏️</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">방 개수 입력</h4>
                                <p className="text-sm text-blue-200">도배할 방의 개수를 입력해주세요</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                  방 개수 *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  placeholder="예: 3"
                                  value={formState.roomCount || ''}
                                  onChange={(e) => updateField('roomCount', parseInt(e.target.value) || undefined)}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        )}
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {wallpaperTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`group relative p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[100px] md:min-h-[110px] hover:scale-105 hover:-translate-y-1 ${
                              formState.wallpaperType === type.value
                                ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                            }`}
                            onClick={() => updateField('wallpaperType', type.value)}
                          >
                            {formState.wallpaperType === type.value && (
                              <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                              </div>
                            )}
                            
                            <div className="relative mb-2 md:mb-3">
                              <div className={`text-xl md:text-2xl mb-1 transition-transform duration-300 ${
                                formState.wallpaperType === type.value ? 'scale-110' : 'group-hover:scale-105'
                              }`}>
                                {type.icon}
                              </div>
                            </div>
                            
                            <div className="relative">
                              <h4 className={`text-sm md:text-base font-bold mb-1 transition-colors duration-300 ${
                                formState.wallpaperType === type.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                              }`}>
                                {type.label}
                              </h4>
                              <p className={`text-xs leading-relaxed mb-1 transition-colors duration-300 ${
                                formState.wallpaperType === type.value ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-200'
                              }`}>
                                {type.description}
                              </p>
                              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                                type.price === '저렴' ? 'bg-green-500/20 text-green-300' :
                                type.price === '중간' ? 'bg-yellow-500/20 text-yellow-300' :
                                type.price === '비싸' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-red-500/20 text-red-300'
                              }`}>
                                {type.price}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 5단계: 추가 요청사항 */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-white mb-3">추가 서비스 (선택사항)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                            {additionalRequests.map((request) => (
                              <div
                                key={request.value}
                                className={`group relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 min-h-[56px] hover:scale-[1.02] ${
                                  formState.additionalRequest.includes(request.value)
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => toggleCheckbox('additionalRequest', request.value)}
                              >
                                {formState.additionalRequest.includes(request.value) && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckIcon className="w-2 h-2 text-white" />
                                  </div>
                                )}
                              
                                <div className="flex items-center">
                                  <div className={`text-base mr-3 transition-transform duration-300 ${
                                    formState.additionalRequest.includes(request.value) ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {request.icon}
                                  </div>
                                  <h4 className={`text-sm font-semibold transition-colors duration-300 ${
                                    formState.additionalRequest.includes(request.value) ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {request.label}
                                  </h4>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            방문 희망 날짜 (선택사항)
                          </label>
                          <input
                            type="date"
                            value={formState.visitDate}
                            onChange={(e) => updateField('visitDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-blue-400 focus:outline-none transition-colors input-mobile"
                          />
                        </div>
                      </div>
                    )}

                    {/* 6단계: 지역 선택 */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">
                            지역 선택 *
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                            {regions.map((region) => (
                              <div
                                key={region.value}
                                className={`group relative py-2 md:py-2 md:px-2 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 min-h-[80px] hover:scale-105 hover:-translate-y-1 ${
                                  formState.region === region.value
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl shadow-blue-500/25'
                                    : 'border-slate-600/50 hover:border-blue-400/50 bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm'
                                }`}
                                onClick={() => updateField('region', region.value)}
                              >
                                {formState.region === region.value && (
                                  <div className="absolute top-1 right-1 md:top-1 md:right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                  </div>
                                )}
                                
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className={`text-lg md:text-xl transition-transform duration-300 ${
                                    formState.region === region.value ? 'scale-110' : 'group-hover:scale-105'
                                  }`}>
                                    {region.icon}
                                  </div>
                                  <h4 className={`text-xs md:text-sm font-bold transition-colors duration-300 ${
                                    formState.region === region.value ? 'text-white' : 'text-white group-hover:text-blue-200'
                                  }`}>
                                    {region.label}
                                  </h4>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7단계: 고객 정보 (로그인된 경우 스킵) */}
                    {currentStep === 6 && !isLoggedIn && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              이름 *
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
                              핸드폰번호 *
                            </label>
                            <input
                              type="tel"
                              placeholder="(-) 없이 숫자만 입력 (예: 01012345678)"
                              value={formState.phone}
                              onChange={(e) => updateField('phone', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              이메일 *
                            </label>
                            <input
                              type="email"
                              placeholder="example@email.com"
                              value={formState.email}
                              onChange={(e) => updateField('email', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              비밀번호 *
                            </label>
                            <input
                              type="password"
                              placeholder="비밀번호를 입력하세요"
                              value={formState.password}
                              onChange={(e) => updateField('password', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 로그인된 사용자를 위한 정보 표시 */}
                    {currentStep === 6 && isLoggedIn && userInfo && (
                      <div className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">로그인된 사용자 정보</h4>
                              <p className="text-sm text-blue-200">아래 정보로 견적 요청이 진행됩니다</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">이름</label>
                              <div className="text-white font-semibold">{userInfo.customerName}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">핸드폰번호</label>
                              <div className="text-white font-semibold">{userInfo.customerPhone}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-1">이메일</label>
                              <div className="text-white font-semibold">{userInfo.customerEmail}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8단계: 완료 단계 */}
                    {currentStep === 7 && (
                      <div className="text-center space-y-6">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
                          <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                            <CheckIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                        </div>
                        
                        <div>
                          <h4 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                              🎉 견적 요청 준비 완료!
                            </span>
                          </h4>
                          <p className="text-lg text-slate-200 mb-4 leading-relaxed">
                            모든 정보가 입력되었습니다.
                          </p>
                          <p className="text-base text-slate-300 leading-relaxed">
                            아래 버튼을 클릭하여 견적 요청을 완료하세요.
                          </p>
                        </div>
                        
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6">
                          <h5 className="text-lg font-semibold text-white mb-4">요청 정보 요약</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">건물 유형:</span>
                              <span className="text-white ml-2">{getBuildingTypeLabel(formState.buildingType)}</span>
                            </div>
                                                         <div>
                               <span className="text-slate-400">시공 위치:</span>
                               <span className="text-white ml-2">{getConstructionScopeLabels(formState.constructionScope)}</span>
                             </div>
                             {formState.constructionScope.includes('room') && formState.roomCount && (
                               <div>
                                 <span className="text-slate-400">방 개수:</span>
                                 <span className="text-white ml-2">{formState.roomCount}개</span>
                               </div>
                             )}
                            <div>
                              <span className="text-slate-400">시공 면적:</span>
                              <span className="text-white ml-2">{formState.area.pyeong}평 ({formState.area.squareMeter}㎡)</span>
                            </div>
                            <div>
                              <span className="text-slate-400">벽지 종류:</span>
                              <span className="text-white ml-2">{getWallpaperTypeLabel(formState.wallpaperType)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">지역:</span>
                              <span className="text-white ml-2">{getRegionLabel(formState.region)}</span>
                            </div>
                            {formState.additionalRequest.length > 0 && (
                              <div>
                                <span className="text-slate-400">추가 요청:</span>
                                <span className="text-white ml-2">{getAdditionalRequestLabels(formState.additionalRequest)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-6">
                          <button
                            onClick={async () => {
                              setIsLoading(true);
                              try {
                                // 로그인된 경우 사용자 정보 사용, 비로그인시 폼 데이터 사용
                                const customerName = isLoggedIn && userInfo ? userInfo.customerName : formState.name;
                                const customerPhone = isLoggedIn && userInfo ? userInfo.customerPhone : formState.phone;
                                const customerEmail = isLoggedIn && userInfo ? userInfo.customerEmail : formState.email;
                                const customerPassword = isLoggedIn && userInfo ? userInfo.customerPassword : formState.password;
                                const webCustomerId = isLoggedIn && userInfo ? userInfo.customerId : 0;

                                                                 // API 요청 데이터 구성
                                 const requestData: CreateCustomerRequestRequest = {
                                   webCustomerId: webCustomerId,
                                   buildingType: getBuildingTypeLabel(formState.buildingType),
                                   constructionLocation: getConstructionScopeLabels(formState.constructionScope),
                                   roomCount: formState.roomCount || 0,
                                   area: formState.area.pyeong || 0,
                                   areaSize: formState.area.squareMeter || 0,
                                   wallpaper: getWallpaperTypeLabel(formState.wallpaperType),
                                   ceiling: "전체",
                                   specialInfo: getAdditionalRequestLabels(formState.additionalRequest),
                                   specialInfoDetail: "",
                                   hasItems: formState.additionalRequest.includes('furniture-move') ? "짐이 있음" : "",
                                   preferredDate: formState.visitDate,
                                   preferredDateDetail: formState.visitDate ? "원하는 날짜가 있어요" : "",
                                   region: getRegionLabel(formState.region),
                                   customerName: customerName,
                                   customerPhone: customerPhone,
                                   customerEmail: customerEmail,
                                   customerPassword: customerPassword,
                                   agreeTerms: formState.privacyConsent,
                                   requestDate: new Date().toISOString(),
                                   status: "검토중",
                                   etc1: "",
                                   etc2: "",
                                   etc3: ""
                                 };

                                // 로그인 상태 확인
                                const currentLoginStatus = AuthManager.isTokenValid();
                                
                                let response;
                                if (currentLoginStatus) {
                                  response = await CustomerRequestService.createCustomerRequest(requestData);
                                } else {
                                  response = await CustomerRequestService.createCustomerRequestNonLogin(requestData);
                                }
                                
                                if (response.success) {
                                  console.log("견적 요청 성공:", response.data);
                                  setIsComplete(true);
                                } else {
                                  console.error("견적 요청 실패:", response.message);
                                  alert(response.message || "견적 요청 중 오류가 발생했습니다.");
                                }
                              } catch (error) {
                                console.error("제출 오류:", error);
                                alert("견적 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl ${
                              isLoading
                                ? 'bg-slate-600/50 text-slate-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {isLoading ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                  <span>견적 요청 중...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-3" />
                                  <span>견적 요청 완료하기</span>
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-6 md:pt-8 mt-6 md:mt-10">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                                              <button
                          type="button"
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className={`group relative px-6 py-4 sm:py-3 rounded-xl font-semibold transition-all duration-300 min-h-[48px] ${
                            currentStep === 0
                              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600'
                              : 'bg-slate-700/50 hover:bg-slate-600/60 text-white border border-slate-600 hover:border-slate-500 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <ChevronLeftIcon className="w-5 h-5 mr-2" />
                            <span>이전</span>
                          </div>
                        </button>

                        <button
                          type="submit"
                          disabled={isLoading || (currentStep < steps.length - 1 && !validateCurrentStep())}
                          className={`group relative px-6 sm:px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-xl min-h-[48px] flex-1 sm:flex-initial ${
                            isLoading || (currentStep < steps.length - 1 && !validateCurrentStep())
                              ? 'bg-slate-600/50 text-slate-300 cursor-not-allowed border border-slate-600'
                              : currentStep === steps.length - 1
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border border-green-400/50 hover:border-green-300/50 shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105'
                                : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6)
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-blue-400/50 hover:border-blue-300/50 shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-blue-400/50 hover:border-blue-300/50 shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                          }`}
                        >
                        <div className="flex items-center justify-center">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                              <span>처리중...</span>
                            </>
                          ) : currentStep === steps.length - 1 ? (
                            <>
                              <CheckIcon className="w-5 h-5 mr-3" />
                              <span>완료</span>
                            </>
                          ) : (isLoggedIn && currentStep === 5) || (!isLoggedIn && currentStep === 6) ? (
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
                      </button>
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