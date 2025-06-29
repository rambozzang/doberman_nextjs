"use client";

import { useState, useEffect } from "react";
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
  InfoIcon
} from "lucide-react";
import Link from "next/link";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest } from "@/types/api";
import { toast } from "react-hot-toast";

// 상태 매핑 설정 (리스트 페이지와 동일)
  id: "QR-2024-001",
  title: "강남구 아파트 전체 도배",
  buildingType: "아파트/빌라",
  constructionScope: ["거실", "침실", "주방"],
  area: { pyeong: 32, squareMeter: 105.8 },
  wallpaperType: "실크벽지",
  region: "서울특별시",
  address: "서울 강남구 역삼동 123-45 아파트 101동 1234호",
  customerName: "김민수",
  customerPhone: "010-1234-5678",
  customerEmail: "kim@email.com",
  requestDate: "2024-01-15",
  visitDate: "2024-01-20",
  status: "in-progress",
  priority: "high",
  budget: { min: 150, max: 200 },
  description: "아이가 있어서 친환경 소재로 부탁드립니다. 깔끔하고 모던한 느낌으로 시공해주세요.",
  additionalRequests: ["가구 이동 서비스", "기존 벽지 제거"],
  selectedExpertId: "EXP-001",
  estimatedCompletion: "2024-01-25",
  quotesReceived: [
    {
      id: "QT-001",
      expertId: "EXP-001",
      expertName: "김도배",
      expertCompany: "프리미엄 인테리어",
      expertRating: 4.8,
      expertExperience: 15,
      expertPhone: "010-9999-1234",
      expertEmail: "kim@premium.com",
      quotedPrice: 180,
      estimatedDuration: "2일",
      workSchedule: "평일 오전 9시~오후 6시",
      materials: ["LG 실크벽지", "친환경 접착제", "마감재"],
      warranty: "1년 품질보증",
      description: "친환경 소재를 사용하여 안전하게 시공해드리겠습니다. 15년 경력으로 완벽한 마감을 약속드립니다.",
      submittedDate: "2024-01-16",
      isSelected: true,
      portfolio: ["portfolio1.jpg", "portfolio2.jpg"],
      reviews: 127
    },
    {
      id: "QT-002",
      expertId: "EXP-002",
      expertName: "박인테리어",
      expertCompany: "모던 홈스타일",
      expertRating: 4.6,
      expertExperience: 12,
      expertPhone: "010-8888-5678",
      expertEmail: "park@modern.com",
      quotedPrice: 165,
      estimatedDuration: "3일",
      workSchedule: "평일 오전 10시~오후 5시",
      materials: ["삼성 실크벽지", "일반 접착제", "마감재"],
      warranty: "6개월 품질보증",
      description: "합리적인 가격으로 깔끔하게 시공해드립니다.",
      submittedDate: "2024-01-16",
      isSelected: false,
      portfolio: ["portfolio3.jpg"],
      reviews: 89
    },
    {
      id: "QT-003",
      expertId: "EXP-003",
      expertName: "이벽지",
      expertCompany: "퀄리티 인테리어",
      expertRating: 4.9,
      expertExperience: 20,
      expertPhone: "010-7777-9999",
      expertEmail: "lee@quality.com",
      quotedPrice: 220,
      estimatedDuration: "2일",
      workSchedule: "평일 오전 8시~오후 7시",
      materials: ["수입 실크벽지", "프리미엄 접착제", "고급 마감재"],
      warranty: "2년 품질보증",
      description: "최고급 소재와 완벽한 기술력으로 최상의 결과를 보장합니다.",
      submittedDate: "2024-01-17",
      isSelected: false,
      portfolio: ["portfolio4.jpg", "portfolio5.jpg", "portfolio6.jpg"],
      reviews: 203
    }
  ],
  messages: [
    {
      id: "MSG-001",
      sender: "system",
      senderName: "시스템",
      content: "견적 요청이 성공적으로 등록되었습니다.",
      timestamp: "2024-01-15 14:30",
      isRead: true
    },
    {
      id: "MSG-002",
      sender: "expert",
      senderName: "김도배",
      content: "안녕하세요. 견적 요청 확인했습니다. 친환경 소재로 안전하게 시공해드리겠습니다. 방문 상담 일정 조율하겠습니다.",
      timestamp: "2024-01-16 09:15",
      isRead: true
    },
    {
      id: "MSG-003",
      sender: "customer",
      senderName: "김민수",
      content: "감사합니다. 토요일 오전에 방문 가능하신가요?",
      timestamp: "2024-01-16 10:30",
      isRead: true
    },
    {
      id: "MSG-004",
      sender: "expert",
      senderName: "김도배",
      content: "네, 토요일 오전 10시에 방문하겠습니다. 현장 확인 후 정확한 견적 안내드리겠습니다.",
      timestamp: "2024-01-16 11:00",
      isRead: true
    }
  ],
  timeline: [
    {
      id: "TL-001",
      type: "request",
      title: "견적 요청",
      description: "도배 견적 요청이 등록되었습니다",
      timestamp: "2024-01-15 14:30",
      status: "completed"
    },
    {
      id: "TL-002",
      type: "quote",
      title: "견적 접수",
      description: "3명의 전문가로부터 견적을 받았습니다",
      timestamp: "2024-01-17 18:00",
      status: "completed"
    },
    {
      id: "TL-003",
      type: "selection",
      title: "전문가 선택",
      description: "김도배님을 선택하셨습니다",
      timestamp: "2024-01-18 10:00",
      status: "completed"
    },
    {
      id: "TL-004",
      type: "start",
      title: "시공 시작",
      description: "도배 시공이 시작되었습니다",
      timestamp: "2024-01-20 09:00",
      status: "current"
    },
    {
      id: "TL-005",
      type: "completion",
      title: "시공 완료",
      description: "도배 시공이 완료됩니다",
      timestamp: "2024-01-25 18:00",
      status: "upcoming"
    }
  ]
};

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

const priorityConfig = {
  high: { label: "긴급", color: "text-red-400", bgColor: "bg-red-500/10" },
  medium: { label: "보통", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  low: { label: "여유", color: "text-green-400", bgColor: "bg-green-500/10" }
};

export default function QuoteRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customerRequest, setCustomerRequest] = useState<CustomerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ID 파라미터 추출
  const requestId = typeof params.id === 'string' ? parseInt(params.id) : null;

  // 데이터 로딩
  const loadCustomerRequest = async () => {
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
  };

  useEffect(() => {
    loadCustomerRequest();
  }, [requestId]);

  // 새로고침
  const handleRefresh = () => {
    loadCustomerRequest();
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/quote-request/list"
              className="inline-flex items-center justify-center w-12 h-12 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-all text-slate-300 hover:text-white"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-2xl shadow-blue-500/25">
                  <EyeIcon className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    견적 요청 상세
                  </h1>
                  <p className="text-slate-300">#{customerRequest.id}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusConf.bgColor} ${statusConf.textColor} border border-current/20`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{statusConf.label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 왼쪽 컬럼 - 기본 정보 */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 기본 정보 카드 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <InfoIcon className="w-5 h-5 text-blue-400" />
                  기본 정보
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <BuildingIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">건물 유형</div>
                        <div className="text-white font-medium">{removeBrackets(customerRequest.buildingType)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <HomeIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">시공 위치</div>
                        <div className="text-white font-medium">{removeBrackets(customerRequest.constructionLocation)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <FileTextIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">면적</div>
                        <div className="text-white font-medium">{customerRequest.areaSize}평</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <PaletteIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">벽지 종류</div>
                        <div className="text-white font-medium">{removeBrackets(customerRequest.wallpaper)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">지역</div>
                        <div className="text-white font-medium">{customerRequest.region}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">요청일</div>
                        <div className="text-white font-medium">{formatDate(customerRequest.requestDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 정보 카드 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-blue-400" />
                  상세 정보
                </h2>
                
                <div className="space-y-4">
                  {/* 특이사항 */}
                  {customerRequest.specialInfo && (
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">특이사항</div>
                      <div className="text-white">{customerRequest.specialInfo}</div>
                    </div>
                  )}
                  
                  {/* 특이사항 상세 */}
                  {customerRequest.specialInfoDetail && (
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">특이사항 상세</div>
                      <div className="text-white">{customerRequest.specialInfoDetail}</div>
                    </div>
                  )}
                  
                  {/* 짐 보관 상태 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">짐 보관 상태</div>
                      <div className="text-white">{customerRequest.hasItems}</div>
                    </div>
                    
                    {/* 천장 시공 여부 */}
                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">천장 시공</div>
                      <div className="text-white">{customerRequest.ceiling}</div>
                    </div>
                  </div>
                  
                  {/* 선호 일정 */}
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">선호 일정</div>
                    <div className="text-white">{customerRequest.preferredDate}</div>
                    {customerRequest.preferredDateDetail && (
                      <div className="text-sm text-slate-300 mt-1">
                        상세: {formatDate(customerRequest.preferredDateDetail)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 - 고객 정보 및 기타 */}
            <div className="space-y-6">
              
              {/* 고객 정보 카드 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-400" />
                  고객 정보
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">이름</div>
                      <div className="text-white font-medium">{customerRequest.customerName}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <PhoneIcon className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">전화번호</div>
                      <div className="text-white font-medium">{customerRequest.customerPhone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <MailIcon className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">이메일</div>
                      <div className="text-white font-medium">{customerRequest.customerEmail}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 답변 현황 카드 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircleIcon className="w-5 h-5 text-blue-400" />
                  답변 현황
                </h2>
                
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                    <MessageCircleIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{customerRequest.answerCount}</div>
                  <div className="text-slate-400">개의 답변</div>
                </div>
              </div>

              {/* 시간 정보 카드 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-400" />
                  시간 정보
                </h2>
                
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-xs text-slate-400">요청일시</div>
                    <div className="text-white font-medium">{formatDateTime(customerRequest.requestDate)}</div>
                  </div>
                  
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-xs text-slate-400">등록일시</div>
                    <div className="text-white font-medium">{formatDateTime(customerRequest.createdDt)}</div>
                  </div>
                  
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-xs text-slate-400">수정일시</div>
                    <div className="text-white font-medium">{formatDateTime(customerRequest.updatedDt)}</div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="space-y-3">
                  <button
                    onClick={handleRefresh}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                    새로고침
                  </button>
                  
                  <Link
                    href="/quote-request/list"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg transition-all text-slate-300 hover:text-white"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    목록으로 돌아가기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}