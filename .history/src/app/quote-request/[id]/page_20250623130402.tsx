"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  StarIcon,
  PhoneIcon,
  MailIcon,
  DollarSignIcon,
  HomeIcon,
  PaletteIcon,
  HammerIcon,
  SendIcon,
  RefreshCwIcon
} from "lucide-react";
import Link from "next/link";

interface QuoteDetail {
  id: string;
  title: string;
  buildingType: string;
  constructionScope: string[];
  area: {
    pyeong: number;
    squareMeter: number;
  };
  wallpaperType: string;
  region: string;
  address: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  requestDate: string;
  visitDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  budget?: {
    min: number;
    max: number;
  };
  description?: string;
  additionalRequests: string[];
  quotesReceived: QuoteResponse[];
  messages: Message[];
  timeline: TimelineEvent[];
  selectedExpertId?: string;
  estimatedCompletion?: string;
  completionDate?: string;
  rating?: number;
  review?: string;
}

interface QuoteResponse {
  id: string;
  expertId: string;
  expertName: string;
  expertCompany: string;
  expertRating: number;
  expertExperience: number;
  expertPhone: string;
  expertEmail: string;
  quotedPrice: number;
  estimatedDuration: string;
  workSchedule: string;
  materials: string[];
  warranty: string;
  description: string;
  submittedDate: string;
  isSelected: boolean;
  portfolio: string[];
  reviews: number;
}

interface Message {
  id: string;
  sender: 'customer' | 'expert' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface TimelineEvent {
  id: string;
  type: 'request' | 'quote' | 'selection' | 'start' | 'progress' | 'completion' | 'review';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'upcoming';
}

// 더미 데이터
const mockQuoteDetail: QuoteDetail = {
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
  pending: { 
    label: "견적 대기중", 
    color: "from-yellow-500 to-orange-500", 
    bgColor: "bg-yellow-500/10", 
    textColor: "text-yellow-400",
    icon: ClockIcon 
  },
  "in-progress": { 
    label: "시공 진행중", 
    color: "from-blue-500 to-cyan-500", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-400",
    icon: AlertCircleIcon 
  },
  completed: { 
    label: "시공 완료", 
    color: "from-emerald-500 to-green-500", 
    bgColor: "bg-emerald-500/10", 
    textColor: "text-emerald-400",
    icon: CheckCircleIcon 
  },
  cancelled: { 
    label: "취소됨", 
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
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "quotes" | "messages" | "timeline">("overview");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

  // 데이터 로딩 시뮬레이션
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 실제로는 params.id를 사용하여 API에서 데이터를 가져옴
      setQuoteDetail(mockQuoteDetail);
      setIsLoading(false);
    };
    loadData();
  }, [params.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSubmittingMessage(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const message: Message = {
      id: `MSG-${Date.now()}`,
      sender: "customer",
      senderName: quoteDetail?.customerName || "고객",
      content: newMessage,
      timestamp: new Date().toLocaleString('ko-KR'),
      isRead: true
    };
    
    setQuoteDetail(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message]
    } : null);
    
    setNewMessage("");
    setIsSubmittingMessage(false);
  };

  const handleSelectExpert = (expertId: string) => {
    if (confirm("이 전문가를 선택하시겠습니까?")) {
      setQuoteDetail(prev => prev ? {
        ...prev,
        selectedExpertId: expertId,
        status: "in-progress",
        quotesReceived: prev.quotesReceived.map(quote => ({
          ...quote,
          isSelected: quote.expertId === expertId
        }))
      } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex-grow flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <RefreshCwIcon className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <p className="text-slate-300">견적 요청 정보를 불러오는 중...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!quoteDetail) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center py-12">
            <FileTextIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">견적 요청을 찾을 수 없습니다</h3>
            <p className="text-slate-400 mb-6">요청하신 견적 정보가 존재하지 않거나 삭제되었습니다.</p>
            <Link 
              href="/quote-request/my-quotes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all text-blue-400 hover:text-blue-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              내 견적 요청으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[quoteDetail.status].icon;
  const selectedQuote = quoteDetail.quotesReceived.find(q => q.isSelected);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* 뒤로가기 버튼 */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-slate-300 hover:text-white"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                뒤로가기
              </button>
            </div>

            {/* 제목 및 상태 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-slate-400">{quoteDetail.id}</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig[quoteDetail.priority].bgColor} ${priorityConfig[quoteDetail.priority].color}`}>
                    {priorityConfig[quoteDetail.priority].label}
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{quoteDetail.title}</h1>
                <p className="text-slate-300">{quoteDetail.description}</p>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${statusConfig[quoteDetail.status].bgColor} ${statusConfig[quoteDetail.status].textColor}`}>
                <StatusIcon className="w-5 h-5" />
                {statusConfig[quoteDetail.status].label}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BuildingIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">건물 유형</span>
                </div>
                <div className="text-white font-semibold">{quoteDetail.buildingType}</div>
                <div className="text-sm text-slate-300">{quoteDetail.area.pyeong}평 ({quoteDetail.area.squareMeter}㎡)</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MapPinIcon className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-400">위치</span>
                </div>
                <div className="text-white font-semibold">{quoteDetail.region}</div>
                <div className="text-sm text-slate-300">{quoteDetail.address}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-slate-400">일정</span>
                </div>
                <div className="text-white font-semibold">요청: {quoteDetail.requestDate}</div>
                {quoteDetail.visitDate && (
                  <div className="text-sm text-slate-300">방문: {quoteDetail.visitDate}</div>
                )}
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSignIcon className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-slate-400">예산</span>
                </div>
                {quoteDetail.budget ? (
                  <>
                    <div className="text-white font-semibold">{quoteDetail.budget.min}만원 ~ {quoteDetail.budget.max}만원</div>
                    <div className="text-sm text-slate-300">{quoteDetail.quotesReceived.length}개 견적 받음</div>
                  </>
                ) : (
                  <div className="text-slate-400">예산 미정</div>
                )}
              </div>
            </div>
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
        <div className="container mx-auto px-4 py-8">
          {/* 탭 네비게이션 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "overview", label: "개요", icon: FileTextIcon },
                  { id: "quotes", label: `견적 (${quoteDetail.quotesReceived.length})`, icon: DollarSignIcon },
                  { id: "messages", label: `메시지 (${quoteDetail.messages.length})`, icon: MessageCircleIcon },
                  { id: "timeline", label: "진행상황", icon: ClockIcon }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "overview" | "quotes" | "messages" | "timeline")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        activeTab === tab.id
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 탭 콘텐츠 */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 시공 범위 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <HomeIcon className="w-5 h-5 text-blue-400" />
                    시공 범위
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {quoteDetail.constructionScope.map((scope, idx) => (
                      <span key={idx} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 벽지 종류 및 추가 요청사항 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <PaletteIcon className="w-5 h-5 text-purple-400" />
                      벽지 종류
                    </h3>
                    <div className="text-slate-300">{quoteDetail.wallpaperType}</div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <HammerIcon className="w-5 h-5 text-emerald-400" />
                      추가 요청사항
                    </h3>
                    {quoteDetail.additionalRequests.length > 0 ? (
                      <div className="space-y-2">
                        {quoteDetail.additionalRequests.map((request, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-300">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                            {request}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400">추가 요청사항 없음</div>
                    )}
                  </div>
                </div>

                {/* 고객 정보 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-yellow-400" />
                    고객 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{quoteDetail.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{quoteDetail.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MailIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{quoteDetail.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* 선택된 전문가 정보 */}
                {selectedQuote && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      선택된 전문가
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xl font-bold text-white mb-2">{selectedQuote.expertName}</div>
                        <div className="text-emerald-400 mb-2">{selectedQuote.expertCompany}</div>
                        <div className="flex items-center gap-2 mb-2">
                          <StarIcon className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span className="text-white">{selectedQuote.expertRating}</span>
                          <span className="text-slate-400">({selectedQuote.reviews}개 리뷰)</span>
                        </div>
                        <div className="text-slate-300 text-sm">{selectedQuote.expertExperience}년 경력</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">{selectedQuote.expertPhone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MailIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">{selectedQuote.expertEmail}</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400 mt-4">
                          {selectedQuote.quotedPrice}만원
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "quotes" && (
              <motion.div
                key="quotes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {quoteDetail.quotesReceived.map((quote, index) => (
                  <div
                    key={quote.id}
                    className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 transition-all ${
                      quote.isSelected 
                        ? "border-emerald-500/30 bg-emerald-500/5" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* 견적 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{quote.expertName}</h3>
                          {quote.isSelected && (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
                              선택됨
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 mb-2">{quote.expertCompany}</div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            <span>{quote.expertRating}</span>
                          </div>
                          <span>경력 {quote.expertExperience}년</span>
                          <span>리뷰 {quote.reviews}개</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          {quote.quotedPrice}만원
                        </div>
                        <div className="text-sm text-slate-400">
                          {quote.submittedDate} 제출
                        </div>
                      </div>
                    </div>

                    {/* 견적 상세 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">예상 작업기간</div>
                        <div className="text-slate-300">{quote.estimatedDuration}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">작업 시간</div>
                        <div className="text-slate-300">{quote.workSchedule}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">품질보증</div>
                        <div className="text-slate-300">{quote.warranty}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">연락처</div>
                        <div className="text-slate-300">{quote.expertPhone}</div>
                      </div>
                    </div>

                    {/* 사용 자재 */}
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-2">사용 자재</div>
                      <div className="flex flex-wrap gap-2">
                        {quote.materials.map((material, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-lg">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 견적 설명 */}
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-2">견적 설명</div>
                      <div className="text-slate-300 text-sm leading-relaxed">{quote.description}</div>
                    </div>

                    {/* 액션 버튼 */}
                    {!quote.isSelected && quoteDetail.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSelectExpert(quote.expertId)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all text-blue-400 hover:text-blue-300"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          선택하기
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-xl transition-all text-slate-300 hover:text-white">
                          <MessageCircleIcon className="w-4 h-4" />
                          문의하기
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 메시지 리스트 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="space-y-4 mb-6" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {quoteDetail.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            message.sender === 'customer'
                              ? 'bg-blue-500 text-white'
                              : message.sender === 'system'
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">
                            {message.senderName} • {message.timestamp}
                          </div>
                          <div className="text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 메시지 입력 */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-400"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSubmittingMessage}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all text-white"
                      >
                        {isSubmittingMessage ? (
                          <RefreshCwIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <SendIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">진행 상황</h3>
                  <div className="space-y-6">
                    {quoteDetail.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              event.status === 'completed'
                                ? 'bg-emerald-500'
                                : event.status === 'current'
                                ? 'bg-blue-500'
                                : 'bg-slate-600'
                            }`}
                          >
                            {event.status === 'completed' ? (
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            ) : event.status === 'current' ? (
                              <ClockIcon className="w-5 h-5 text-white" />
                            ) : (
                              <div className="w-3 h-3 bg-slate-400 rounded-full" />
                            )}
                          </div>
                          {index < quoteDetail.timeline.length - 1 && (
                            <div
                              className={`w-px h-12 ${
                                event.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-600'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`font-semibold ${
                                event.status === 'completed'
                                  ? 'text-emerald-400'
                                  : event.status === 'current'
                                  ? 'text-blue-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {event.title}
                            </h4>
                            <span className="text-sm text-slate-400">{event.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}