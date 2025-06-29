"use client";

import { useState, useEffect } from "react";
import { 
  UserIcon, 
  SearchIcon, 
  MapPinIcon,
  CalendarIcon,
  BuildingIcon,
  FileTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  RefreshCwIcon,
  StarIcon,
  MessageCircleIcon
} from "lucide-react";
import Link from "next/link";

interface MyQuoteRequest {
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
  quotesReceived: number;
  lastUpdated: string;
  estimatedCompletion?: string;
  selectedExpert?: {
    name: string;
    rating: number;
    company: string;
  };
  messages: number;
}

// 더미 데이터 (현재 사용자의 견적 요청)
const mockMyQuoteRequests: MyQuoteRequest[] = [
  {
    id: "QR-2024-001",
    title: "우리집 거실 도배",
    buildingType: "아파트/빌라",
    constructionScope: ["거실", "복도"],
    area: { pyeong: 18, squareMeter: 59.5 },
    wallpaperType: "실크벽지",
    region: "서울특별시",
    address: "서울 강남구 역삼동",
    requestDate: "2024-01-15",
    visitDate: "2024-01-20",
    status: "in-progress",
    priority: "high",
    budget: { min: 120, max: 150 },
    description: "깔끔하고 모던한 느낌으로 부탁드립니다. 아이가 있어서 친환경 소재 선호합니다.",
    additionalRequests: ["가구 이동 서비스", "기존 벽지 제거"],
    quotesReceived: 5,
    lastUpdated: "2024-01-18",
    estimatedCompletion: "2024-01-25",
    selectedExpert: {
      name: "김도배",
      rating: 4.8,
      company: "프리미엄 인테리어"
    },
    messages: 3
  },
  {
    id: "QR-2024-007",
    title: "침실 2개 도배",
    buildingType: "아파트/빌라",
    constructionScope: ["침실1", "침실2"],
    area: { pyeong: 12, squareMeter: 39.7 },
    wallpaperType: "천연벽지",
    region: "서울특별시",
    address: "서울 서초구 서초동",
    requestDate: "2024-01-10",
    status: "pending",
    priority: "medium",
    budget: { min: 80, max: 100 },
    description: "조용하고 편안한 분위기로 만들어주세요.",
    additionalRequests: ["벽면 보수"],
    quotesReceived: 8,
    lastUpdated: "2024-01-16",
    messages: 1
  },
  {
    id: "QR-2024-012",
    title: "전체 집 도배",
    buildingType: "단독주택",
    constructionScope: ["전체"],
    area: { pyeong: 35, squareMeter: 115.7 },
    wallpaperType: "수입벽지",
    region: "경기도",
    address: "경기 성남시 분당구",
    requestDate: "2024-01-05",
    visitDate: "2024-01-12",
    status: "completed",
    priority: "high",
    budget: { min: 300, max: 400 },
    description: "고급스럽고 세련된 인테리어를 원합니다.",
    additionalRequests: ["가구 이동 서비스", "기존 벽지 제거", "벽면 보수"],
    quotesReceived: 12,
    lastUpdated: "2024-01-14",
    selectedExpert: {
      name: "박인테리어",
      rating: 4.9,
      company: "럭셔리 홈 디자인"
    },
    messages: 8
  },
  {
    id: "QR-2024-018",
    title: "주방 도배",
    buildingType: "아파트/빌라",
    constructionScope: ["주방"],
    area: { pyeong: 6, squareMeter: 19.8 },
    wallpaperType: "합지벽지",
    region: "서울특별시",
    address: "서울 마포구 상암동",
    requestDate: "2024-01-08",
    status: "cancelled",
    priority: "low",
    budget: { min: 40, max: 60 },
    description: "간단한 주방 도배입니다.",
    additionalRequests: [],
    quotesReceived: 3,
    lastUpdated: "2024-01-10",
    messages: 0
  }
];

const statusConfig = {
  pending: { 
    label: "견적 대기중", 
    color: "from-yellow-500 to-orange-500", 
    bgColor: "bg-yellow-500/10", 
    textColor: "text-yellow-400",
    icon: ClockIcon,
    description: "전문가들의 견적을 기다리고 있습니다"
  },
  "in-progress": { 
    label: "시공 진행중", 
    color: "from-blue-500 to-cyan-500", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-400",
    icon: AlertCircleIcon,
    description: "선택한 전문가가 시공을 진행중입니다"
  },
  completed: { 
    label: "시공 완료", 
    color: "from-emerald-500 to-green-500", 
    bgColor: "bg-emerald-500/10", 
    textColor: "text-emerald-400",
    icon: CheckCircleIcon,
    description: "시공이 성공적으로 완료되었습니다"
  },
  cancelled: { 
    label: "취소됨", 
    color: "from-red-500 to-pink-500", 
    bgColor: "bg-red-500/10", 
    textColor: "text-red-400",
    icon: XCircleIcon,
    description: "견적 요청이 취소되었습니다"
  }
};

const priorityConfig = {
  high: { label: "긴급", color: "text-red-400", bgColor: "bg-red-500/10" },
  medium: { label: "보통", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  low: { label: "여유", color: "text-green-400", bgColor: "bg-green-500/10" }
};

export default function MyQuoteRequestsPage() {
  const [myQuoteRequests, setMyQuoteRequests] = useState<MyQuoteRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MyQuoteRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "status" | "quotes">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 데이터 로딩 시뮬레이션 - 빠른 로딩을 위해 시간 단축
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // 로딩 시간을 단축
      await new Promise(resolve => setTimeout(resolve, 100));
      setMyQuoteRequests(mockMyQuoteRequests);
      setFilteredRequests(mockMyQuoteRequests);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...myQuoteRequests];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case "status":
          const statusOrder = { pending: 1, "in-progress": 2, completed: 3, cancelled: 4 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case "quotes":
          aValue = a.quotesReceived;
          bValue = b.quotesReceived;
          break;
        default:
          return 0;
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredRequests(filtered);
  }, [myQuoteRequests, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말로 이 견적 요청을 삭제하시겠습니까?")) {
      setMyQuoteRequests(prev => prev.filter(req => req.id !== id));
    }
  };

  const getStatusCounts = () => {
    return {
      total: myQuoteRequests.length,
      pending: myQuoteRequests.filter(r => r.status === 'pending').length,
      inProgress: myQuoteRequests.filter(r => r.status === 'in-progress').length,
      completed: myQuoteRequests.filter(r => r.status === 'completed').length,
      cancelled: myQuoteRequests.filter(r => r.status === 'cancelled').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-blue-500/25">
              <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                내 견적 요청
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              내가 요청한 견적들을 확인하고 관리하세요. 진행 상황을 실시간으로 추적할 수 있습니다.
            </p>

            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {[
                { label: "전체", count: statusCounts.total, color: "from-blue-500 to-cyan-500" },
                { label: "대기중", count: statusCounts.pending, color: "from-yellow-500 to-orange-500" },
                { label: "진행중", count: statusCounts.inProgress, color: "from-purple-500 to-violet-500" },
                { label: "완료", count: statusCounts.completed, color: "from-emerald-500 to-green-500" },
                { label: "취소", count: statusCounts.cancelled, color: "from-red-500 to-pink-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
                  <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.count}
                  </div>
                  <div className="text-xs text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* 액션 바 */}
          <section className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4">
                <Link 
                  href="/quote-request"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                >
                  <PlusIcon className="w-5 h-5" />
                  새 견적 요청
                </Link>
              </div>
            </div>
          </section>

          {/* 검색 및 필터 섹션 */}
          <section className="mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 검색 */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="내 견적 요청 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* 상태 필터 */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                  >
                    <option value="all">모든 상태</option>
                    <option value="pending">견적 대기중</option>
                    <option value="in-progress">시공 진행중</option>
                    <option value="completed">시공 완료</option>
                    <option value="cancelled">취소됨</option>
                  </select>
                </div>

                {/* 정렬 및 새로고침 */}
                <div className="flex gap-2">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSortBy(sort as "date" | "status" | "quotes");
                      setSortOrder(order as "asc" | "desc");
                    }}
                    className="flex-1 px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white text-sm"
                  >
                    <option value="date-desc">최신순</option>
                    <option value="date-asc">오래된순</option>
                    <option value="status-asc">상태순</option>
                    <option value="quotes-desc">견적 많은순</option>
                    <option value="quotes-asc">견적 적은순</option>
                  </select>
                  
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCwIcon className={`w-5 h-5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 견적 요청 리스트 */}
          <section>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                  <RefreshCwIcon className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <p className="text-slate-300">내 견적 요청을 불러오는 중...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">견적 요청이 없습니다</h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "검색 조건에 맞는 견적 요청이 없습니다." 
                    : "첫 번째 견적 요청을 만들어보세요."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Link 
                    href="/quote-request"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  >
                    <PlusIcon className="w-5 h-5" />
                    견적 요청하기
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRequests.map((request) => {
                  const StatusIcon = statusConfig[request.status].icon;
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 기본 정보 */}
                        <div className="lg:col-span-2">
                          {/* 헤더 */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-slate-400">{request.id}</span>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[request.priority].bgColor} ${priorityConfig[request.priority].color}`}>
                                  {priorityConfig[request.priority].label}
                                </div>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{request.title}</h3>
                              <p className="text-sm text-slate-400">{statusConfig[request.status].description}</p>
                            </div>
                            
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusConfig[request.status].bgColor} ${statusConfig[request.status].textColor}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig[request.status].label}
                            </div>
                          </div>

                          {/* 상세 정보 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-3">
                              <div className="flex items-center text-sm text-slate-300">
                                <BuildingIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>{request.buildingType}</span>
                                <span className="mx-2">•</span>
                                <span>{request.area.pyeong}평</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-slate-300">
                                <MapPinIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>{request.address}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center text-sm text-slate-300">
                                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>요청: {request.requestDate}</span>
                              </div>
                              
                              {request.visitDate && (
                                <div className="flex items-center text-sm text-slate-300">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>방문: {request.visitDate}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 시공 범위 */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {request.constructionScope.map((scope, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-700/50 text-sm text-slate-300 rounded-lg">
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 선택된 전문가 정보 */}
                          {request.selectedExpert && (
                            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm text-emerald-400 font-medium mb-1">선택된 전문가</div>
                                  <div className="text-white font-semibold">{request.selectedExpert.name}</div>
                                  <div className="text-sm text-slate-300">{request.selectedExpert.company}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <StarIcon className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                  <span className="text-white font-medium">{request.selectedExpert.rating}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 설명 */}
                          {request.description && (
                            <div className="mb-4">
                              <p className="text-sm text-slate-300 line-clamp-2">{request.description}</p>
                            </div>
                          )}
                        </div>

                        {/* 우측 정보 패널 */}
                        <div className="space-y-4">
                          {/* 견적 정보 */}
                          <div className="bg-slate-800/30 rounded-xl p-4">
                            <div className="text-center mb-3">
                              <div className="text-2xl font-bold text-blue-400">{request.quotesReceived}</div>
                              <div className="text-sm text-slate-400">받은 견적</div>
                            </div>
                            
                            {request.budget && (
                              <div className="text-center">
                                <div className="text-sm text-slate-400 mb-1">예상 예산</div>
                                <div className="text-white font-semibold">
                                  {request.budget.min}만원 ~ {request.budget.max}만원
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 메시지 */}
                          {request.messages > 0 && (
                            <div className="bg-slate-800/30 rounded-xl p-4">
                              <div className="flex items-center justify-center gap-2 text-blue-400">
                                <MessageCircleIcon className="w-5 h-5" />
                                <span className="font-semibold">{request.messages}</span>
                                <span className="text-slate-400">개의 메시지</span>
                              </div>
                            </div>
                          )}

                          {/* 완료 예정일 */}
                          {request.estimatedCompletion && (
                            <div className="bg-slate-800/30 rounded-xl p-4">
                              <div className="text-center">
                                <div className="text-sm text-slate-400 mb-1">완료 예정</div>
                                <div className="text-white font-semibold">{request.estimatedCompletion}</div>
                              </div>
                            </div>
                          )}

                          {/* 액션 버튼 */}
                          <div className="space-y-2">
                            <Link 
                              href={`/quote-request/${request.id}`}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all text-blue-400 hover:text-blue-300"
                            >
                              <EyeIcon className="w-4 h-4" />
                              상세보기
                            </Link>
                            
                            {request.status === 'pending' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-lg transition-all text-slate-300 hover:text-white text-sm">
                                  <EditIcon className="w-3 h-3" />
                                  수정
                                </button>
                                <button 
                                  onClick={() => handleDelete(request.id)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all text-red-400 hover:text-red-300 text-sm"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 페이지네이션 영역 (추후 구현) */}
          {filteredRequests.length > 0 && (
            <div className="mt-8 text-center">
              <div className="text-sm text-slate-400">
                총 {filteredRequests.length}개의 견적 요청
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}