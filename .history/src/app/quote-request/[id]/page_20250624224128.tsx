"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeftIcon,
  FileTextIcon, 
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  MessageCircleIcon,
  PhoneIcon,
  MailIcon,
  HomeIcon,
  PaletteIcon,
  RefreshCwIcon,
  EyeIcon,
  InfoIcon,
  StarIcon,
  XIcon,
  MessageSquareIcon
} from "lucide-react";
import Link from "next/link";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest, CustomerRequestAnswer } from "@/types/api";
import { toast } from "react-hot-toast";
import { ChatModal, useChatLogic } from "@/components/chat";

// 상태 매핑 설정 (리스트 페이지와 동일)
const statusConfig = {
  "검토중": { 
    label: "검토중", 
    color: "from-yellow-500 to-orange-500", 
    bgColor: "bg-yellow-500/10", 
    textColor: "text-yellow-400",
    icon: ClockIcon 
  },
  "진행중": { 
    label: "진행중", 
    color: "from-blue-500 to-cyan-500", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-400",
    icon: AlertCircleIcon 
  },
  "채택 성공": { 
    label: "채택 성공", 
    color: "from-emerald-500 to-green-500", 
    bgColor: "bg-emerald-500/10", 
    textColor: "text-emerald-400",
    icon: CheckCircleIcon 
  },
  "취소": { 
    label: "취소", 
    color: "from-red-500 to-pink-500", 
    bgColor: "bg-red-500/10", 
    textColor: "text-red-400",
    icon: XCircleIcon 
  }
};

export default function QuoteRequestDetailPage() {
  const params = useParams();
  const [customerRequest, setCustomerRequest] = useState<CustomerRequest | null>(null);
  const [answers, setAnswers] = useState<CustomerRequestAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswersLoading, setIsAnswersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 채택 확인 모달 상태
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<CustomerRequestAnswer | null>(null);
  const [isAdopting, setIsAdopting] = useState(false);

  // 채팅 로직 (분리된 훅 사용)
  const {
    showChatModal,
    chatPartner,
    chatMessages,
    handleChatClick,
    handleCloseChatModal,
    handleSendMessage
  } = useChatLogic({ customerName: customerRequest?.customerName });

  // ID 파라미터 추출
  const requestId = typeof params.id === 'string' ? parseInt(params.id) : null;



  // 답변 리스트 로딩
  const loadAnswers = useCallback(async () => {
    if (!requestId) return;

    setIsAnswersLoading(true);
    
    try {
      const response = await CustomerRequestService.getAnswerList(requestId);
      
      if (response.success && response.data) {
        setAnswers(response.data);
      } else {
        console.error("답변 리스트 로딩 실패:", response.error);
      }
    } catch (error) {
      console.error("답변 리스트 API 호출 오류:", error);
    } finally {
      setIsAnswersLoading(false);
    }
  }, [requestId]);

  // 데이터 로딩
  const loadCustomerRequest = useCallback(async () => {
    if (!requestId) {
      setError("잘못된 요청 ID입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await CustomerRequestService.getDetail(requestId);
      
      if (response.success && response.data) {
        setCustomerRequest(response.data);
        // 상세 정보 로딩 후 답변 리스트도 로딩
        loadAnswers();
      } else {
        setError(response.error || "데이터를 불러오는데 실패했습니다.");
        toast.error(response.error || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      setError("서버 연결에 실패했습니다.");
      toast.error("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [requestId, loadAnswers]);

  useEffect(() => {
    loadCustomerRequest();
  }, [loadCustomerRequest]);

  // 새로고침
  const handleRefresh = () => {
    loadCustomerRequest();
    loadAnswers();
  };

  // 채택하기 버튼 클릭
  const handleAdoptClick = (answer: CustomerRequestAnswer) => {
    setSelectedAnswer(answer);
    setShowAdoptModal(true);
  };

  // 채택 확인
  const handleAdoptConfirm = async () => {
    if (!selectedAnswer || !requestId) return;

    setIsAdopting(true);
    
    try {
      // TODO: 실제 채택 API 호출
      // const response = await CustomerRequestService.adoptAnswer(requestId, selectedAnswer.id);
      
      // 임시로 성공 처리
      toast.success("답변이 채택되었습니다!");
      setShowAdoptModal(false);
      setSelectedAnswer(null);
      
      // 데이터 새로고침
      loadCustomerRequest();
      loadAnswers();
    } catch (error) {
      console.error("채택 처리 오류:", error);
      toast.error("채택 처리에 실패했습니다.");
    } finally {
      setIsAdopting(false);
    }
  };

  // 채택 취소
  const handleAdoptCancel = () => {
    setShowAdoptModal(false);
    setSelectedAnswer(null);
  };





  // 문자열에서 대괄호 제거 헬퍼 함수
  const removeBrackets = (str: string) => {
    return str.replace(/[\[\]]/g, '');
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 날짜와 시간 포맷팅 함수
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <RefreshCwIcon className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <p className="text-slate-300">견적 요청 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customerRequest) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <FileTextIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">견적 요청을 찾을 수 없습니다</h3>
            <p className="text-slate-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-400"
              >
                <RefreshCwIcon className="w-4 h-4 inline mr-2" />
                다시 시도
              </button>
              <Link
                href="/quote-request/list"
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg transition-all text-slate-300"
              >
                <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
                목록으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConf = statusConfig[customerRequest.status as keyof typeof statusConfig] || {
    label: "기타", 
    color: "from-gray-500 to-slate-500", 
    bgColor: "bg-gray-500/10", 
    textColor: "text-gray-400",
    icon: AlertCircleIcon
  };
  const StatusIcon = statusConf.icon;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900/95 via-blue-900/30 to-purple-900/30 relative overflow-hidden pt-16 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/quote-request/list"
              className="group inline-flex items-center justify-center w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-slate-300 hover:text-white backdrop-blur-sm hover:scale-105"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl shadow-2xl shadow-blue-500/25 ring-1 ring-white/10">
                  <EyeIcon className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    견적 요청 상세
                  </h1>
                  <p className="text-slate-400 font-medium">#{customerRequest.id}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusConf.bgColor} ${statusConf.textColor} border border-current/20 backdrop-blur-sm shadow-lg`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-semibold">{statusConf.label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow w-full">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 왼쪽 컬럼 - 기본 정보 */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* 기본 정보 카드 */}
              <div className="group bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                    <InfoIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  기본 정보
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-md">
                        <BuildingIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">건물 유형</div>
                        <div className="text-white font-semibold text-sm">{removeBrackets(customerRequest.buildingType)}</div>
                      </div>
                    </div>
                    
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-md">
                        <HomeIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">시공 위치</div>
                        <div className="text-white font-semibold text-sm">{removeBrackets(customerRequest.constructionLocation)}</div>
                      </div>
                    </div>
                    
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-md">
                        <FileTextIcon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">면적</div>
                        <div className="text-white font-semibold text-sm">{customerRequest.areaSize}평</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-md">
                        <PaletteIcon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">벽지 종류</div>
                        <div className="text-white font-semibold text-sm">{removeBrackets(customerRequest.wallpaper)}</div>
                      </div>
                    </div>
                    
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-md">
                        <MapPinIcon className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">지역</div>
                        <div className="text-white font-semibold text-sm">{customerRequest.region}</div>
                      </div>
                    </div>
                    
                    <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                      <div className="p-1.5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-md">
                        <CalendarIcon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">요청일</div>
                        <div className="text-white font-semibold text-sm">{formatDate(customerRequest.requestDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 정보 카드 */}
              <div className="group bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg">
                    <FileTextIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  상세 정보
                </h2>
                
                <div className="space-y-3">
                  {/* 특이사항 */}
                  {customerRequest.specialInfo && (
                    <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                      <div className="text-sm text-slate-300 mb-1 font-medium">특이사항</div>
                      <div className="text-white text-sm leading-relaxed">{customerRequest.specialInfo}</div>
                    </div>
                  )}
                  
                  {/* 특이사항 상세 */}
                  {customerRequest.specialInfoDetail && (
                    <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                      <div className="text-sm text-slate-300 mb-1 font-medium">특이사항 상세</div>
                      <div className="text-white text-sm leading-relaxed">{customerRequest.specialInfoDetail}</div>
                    </div>
                  )}
                  
                  {/* 짐 보관 상태 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                      <div className="text-sm text-slate-300 mb-1 font-medium">짐 보관 상태</div>
                      <div className="text-white text-sm font-semibold">{customerRequest.hasItems}</div>
                    </div>
                    
                    {/* 천장 시공 여부 */}
                    <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                      <div className="text-sm text-slate-300 mb-1 font-medium">천장 시공</div>
                      <div className="text-white text-sm font-semibold">{customerRequest.ceiling}</div>
                    </div>
                  </div>
                  
                  {/* 선호 일정 */}
                  <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                    <div className="text-sm text-slate-300 mb-1 font-medium">선호 일정</div>
                    <div className="text-white text-sm font-semibold">{customerRequest.preferredDate}</div>
                    {customerRequest.preferredDateDetail && (
                      <div className="text-xs text-slate-400 mt-1">
                        상세: {formatDate(customerRequest.preferredDateDetail)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 - 고객 정보 */}
            <div className="space-y-4">
              
              {/* 고객 정보 카드 */}
              <div className="group bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg">
                    <UserIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  고객 정보
                </h2>
                
                <div className="space-y-2">
                  <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                    <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-md">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">이름</div>
                      <div className="text-white font-semibold text-sm">{customerRequest.customerName}</div>
                    </div>
                  </div>
                  
                  <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                    <div className="p-1.5 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-md">
                      <PhoneIcon className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">전화번호</div>
                      <div className="text-white font-semibold text-sm">{customerRequest.customerPhone}</div>
                    </div>
                  </div>
                  
                  <div className="group/item flex items-center gap-3 p-2.5 bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/50 hover:to-slate-600/50 rounded-lg transition-all duration-200 border border-slate-700/30 hover:border-slate-600/50">
                    <div className="p-1.5 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-md">
                      <MailIcon className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">이메일</div>
                      <div className="text-white font-semibold text-sm">{customerRequest.customerEmail}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="group bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="space-y-2">
                  <button
                    onClick={handleRefresh}
                    className="group/btn w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded-lg transition-all duration-300 text-blue-400 hover:text-blue-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <RefreshCwIcon className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                    새로고침
                  </button>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="group/btn w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/60 hover:to-slate-500/60 border border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-300 text-slate-300 hover:text-white hover:scale-[1.02] hover:shadow-lg"
                  >
                    <ArrowLeftIcon className="w-4 h-4 group-hover/btn:-translate-x-0.5 transition-transform" />
                    뒤로가기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 답변 현황 섹션 */}
          <div className="mt-6">
            <div className="group bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-500/20 to-violet-600/20 rounded-lg">
                    <MessageCircleIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  답변 현황
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/20 shadow-lg">
                  <MessageCircleIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold text-sm">{answers.length}개의 답변</span>
                </div>
              </div>

              {/* 답변 리스트 */}
              <div className="space-y-3">
                {isAnswersLoading ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mb-2">
                      <RefreshCwIcon className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                    <div className="text-slate-400 text-sm font-medium">답변을 불러오는 중...</div>
                  </div>
                ) : answers.length > 0 ? (
                  answers.map((answer, index) => (
                    <div key={answer.id} className="group/answer bg-gradient-to-r from-slate-800/40 via-slate-700/40 to-slate-800/40 hover:from-slate-700/50 hover:via-slate-600/50 hover:to-slate-700/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full border border-blue-400/20 shadow-lg">
                            <span className="text-blue-400 font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-base mb-1 group-hover/answer:text-blue-100 transition-colors">
                              {answer.answerTitle || "제목 없음"}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <div className="p-0.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded">
                                <UserIcon className="w-3 h-3 text-cyan-400" />
                              </div>
                              <span>{answer.user?.userName || answer.webCustomer?.customerName || "익명"}</span>
                              {answer.createdDt && (
                                <>
                                  <span className="text-slate-500">•</span>
                                  <span>{formatDateTime(answer.createdDt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {answer.cost && (
                            <div className="text-right bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg px-3 py-1 border border-blue-400/20">
                              <div className="text-xs text-slate-400 font-medium">견적 금액</div>
                              <div className="text-blue-400 font-bold text-base">
                                {answer.cost.toLocaleString()}원
                              </div>
                            </div>
                          )}
                          {/* 채택하기 버튼 - 검토중 상태이고 아직 채택되지 않은 답변에만 표시 */}
                          {customerRequest?.status === "검토중" && answer.status !== '채택' && (
                            <button
                              onClick={() => handleAdoptClick(answer)}
                              className="group/adopt flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg transition-all duration-300 text-emerald-400 hover:text-emerald-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                            >
                              <StarIcon className="w-3 h-3 group-hover/adopt:rotate-12 transition-transform" />
                              <span className="text-xs font-semibold">채택하기</span>
                            </button>
                          )}
                          {/* 대화하기 버튼 - 채택 성공 상태이고 채택된 답변에만 표시 */}
                          {customerRequest?.status === "채택 성공" && answer.status === '채택 성공' && (
                            <button
                              onClick={() => handleChatClick(answer)}
                              className="group/chat flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 rounded-lg transition-all duration-300 text-blue-400 hover:text-blue-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                            >
                              <MessageSquareIcon className="w-3 h-3 group-hover/chat:scale-110 transition-transform" />
                              <span className="text-xs font-semibold">대화하기</span>
                            </button>
                          )}
                          
                          {/* 답변 상태 표시 - 채택 성공일 때는 채택된 답변에만 표시 */}
                          {((customerRequest?.status !== "채택 성공") || (customerRequest?.status === "채택 성공" && answer.status === '채택 성공')) && answer.status && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-lg ${
                              answer.status === '채택' 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/30'
                            }`}>
                              {answer.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {answer.answerBody && (
                        <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-3 mt-3 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-200">
                          <div className="text-slate-300 leading-relaxed text-sm">
                            {answer.answerBody}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-full mb-3 border border-slate-600/30">
                      <MessageCircleIcon className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">아직 답변이 없습니다</h3>
                    <p className="text-slate-400 text-sm">업체들의 견적 답변을 기다리고 있습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 채택 확인 모달 */}
      {showAdoptModal && selectedAnswer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full">
                  <StarIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">답변 채택</h3>
              </div>
              <button
                onClick={handleAdoptCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/30 mb-4">
                <h4 className="text-white font-semibold mb-2">
                  {selectedAnswer.answerTitle || "제목 없음"}
                </h4>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <UserIcon className="w-4 h-4" />
                  <span>{selectedAnswer.user?.userName || selectedAnswer.webCustomer?.customerName || "익명"}</span>
                  {selectedAnswer.cost && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        {selectedAnswer.cost.toLocaleString()}원
                      </span>
                    </>
                  )}
                </div>
                {selectedAnswer.answerBody && (
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedAnswer.answerBody.length > 150 
                      ? `${selectedAnswer.answerBody.substring(0, 150)}...` 
                      : selectedAnswer.answerBody
                    }
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-2">
                  해당 전문가를 채택하시겠습니까?
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  채택 후에는 해당 전문가와 채팅을 통해<br />
                  자세한 상담을 진행할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 모달 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleAdoptCancel}
                disabled={isAdopting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-500/50 hover:from-slate-500/60 hover:to-slate-400/60 border border-slate-500/30 hover:border-slate-400/50 rounded-lg transition-all duration-300 text-slate-300 hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleAdoptConfirm}
                disabled={isAdopting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-500 hover:to-green-500 border border-emerald-400/30 hover:border-emerald-300/50 rounded-lg transition-all duration-300 text-white font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAdopting ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    처리중...
                  </div>
                ) : (
                  "채택하기"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 사이드바 */}
      {showChatModal && chatPartner && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={handleCloseChatModal}
          />
          
          {/* 채팅 사이드바 */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[480px] lg:w-[520px] bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl transform transition-transform duration-300 ease-out">
            
            {/* 채팅 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/20">
                  <UserIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {chatPartner.user?.userName || chatPartner.webCustomer?.customerName || '전문가'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-slate-400 text-sm">온라인</p>
                    {chatPartner.cost && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-blue-400 font-semibold text-sm">
                          {chatPartner.cost.toLocaleString()}원
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseChatModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white group"
              >
                <XIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* 채팅 컨테이너 */}
            <div className="flex flex-col h-full">
              
              {/* 채택 정보 배너 */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400">
                  <StarIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">채택된 전문가와의 대화</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  시공 관련 문의사항을 자유롭게 상담하세요
                </p>
              </div>

              {/* 메시지 영역 */}
              <div 
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                style={{ height: 'calc(100vh - 200px)' }}
              >
                {chatMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-[85%] ${
                      message.senderType === 'customer' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-600/20'
                    } rounded-2xl px-4 py-3 shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                      
                      {/* 발신자 이름 (상대방 메시지에만 표시) */}
                      {message.senderType !== 'customer' && (
                        <p className="text-xs text-slate-300 mb-1 font-medium opacity-80">
                          {message.senderName}
                        </p>
                      )}
                      
                      <p className="text-white leading-relaxed whitespace-pre-wrap">
                        {message.message}
                      </p>
                      
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <span className="text-xs text-slate-200 opacity-70">
                          {formatChatTime(message.timestamp)}
                        </span>
                        {message.senderType === 'customer' && (
                          <div className="flex items-center">
                            {message.isRead ? (
                              <CheckCheckIcon className="w-3 h-3 text-blue-200" />
                            ) : (
                              <CheckIcon className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 메시지가 없을 때 */}
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                      <MessageSquareIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">대화를 시작해보세요</h4>
                    <p className="text-slate-400 text-sm max-w-xs">
                      채택된 전문가와 시공에 대한 상세한 상담을 나눠보세요
                    </p>
                  </div>
                )}
              </div>

              {/* 메시지 입력 영역 */}
              <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                      rows={3}
                      className="w-full p-3 bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 focus:border-blue-400/50 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs text-slate-500">
                        Shift + Enter로 줄바꿈
                      </span>
                      <span className="text-xs text-slate-500">
                        {newMessage.length}/1000
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:hover:scale-100 disabled:hover:shadow-none group"
                  >
                    <SendIcon className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}