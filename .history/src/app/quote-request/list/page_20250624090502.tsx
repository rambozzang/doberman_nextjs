"use client";

import { useState, useEffect } from "react";
import { 
  ListIcon, 
  SearchIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  FileTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from "lucide-react";
import Link from "next/link";

interface QuoteRequest {
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
  customerName: string;
  customerPhone: string;
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
}

// 더미 데이터
const mockQuoteRequests: QuoteRequest[] = [
  {
    id: "QR-2024-001",
    title: "강남구 아파트 전체 도배",
    buildingType: "아파트/빌라",
    constructionScope: ["거실", "침실", "주방"],
    area: { pyeong: 32, squareMeter: 105.8 },
    wallpaperType: "실크벽지",
    region: "서울특별시",
    customerName: "김민수",
    customerPhone: "010-1234-5678",
    requestDate: "2024-01-15",
    visitDate: "2024-01-20",
    status: "pending",
    priority: "high",
    budget: { min: 150, max: 200 },
    description: "아이가 있어서 친환경 소재로 부탁드립니다.",
    additionalRequests: ["가구 이동 서비스", "기존 벽지 제거"]
  },
  {
    id: "QR-2024-002", 
    title: "성남시 단독주택 거실 도배",
    buildingType: "단독주택",
    constructionScope: ["거실"],
    area: { pyeong: 15, squareMeter: 49.6 },
    wallpaperType: "합지벽지",
    region: "경기도",
    customerName: "이서연",
    customerPhone: "010-9876-5432",
    requestDate: "2024-01-14",
    status: "in-progress",
    priority: "medium",
    budget: { min: 80, max: 120 },
    additionalRequests: ["벽면 보수"]
  },
  {
    id: "QR-2024-003",
    title: "부산 해운대 카페 인테리어",
    buildingType: "상가",
    constructionScope: ["전체"],
    area: { pyeong: 25, squareMeter: 82.6 },
    wallpaperType: "수입벽지",
    region: "부산광역시",
    customerName: "박준호",
    customerPhone: "010-5555-7777",
    requestDate: "2024-01-13",
    visitDate: "2024-01-18",
    status: "completed",
    priority: "high",
    budget: { min: 300, max: 400 },
    description: "모던한 분위기의 카페를 원합니다.",
    additionalRequests: ["당일 시공"]
  },
  {
    id: "QR-2024-004",
    title: "인천 연수구 오피스텔 침실",
    buildingType: "아파트/빌라", 
    constructionScope: ["침실"],
    area: { pyeong: 8, squareMeter: 26.4 },
    wallpaperType: "천연벽지",
    region: "인천광역시",
    customerName: "최영희",
    customerPhone: "010-3333-4444",
    requestDate: "2024-01-12",
    status: "cancelled",
    priority: "low",
    additionalRequests: []
  },
  {
    id: "QR-2024-005",
    title: "대전 유성구 사무실 전체",
    buildingType: "사무실",
    constructionScope: ["전체"],
    area: { pyeong: 45, squareMeter: 148.8 },
    wallpaperType: "실크 + 합지",
    region: "대전광역시",
    customerName: "정현우",
    customerPhone: "010-7777-8888",
    requestDate: "2024-01-11",
    visitDate: "2024-01-22",
    status: "pending",
    priority: "medium",
    budget: { min: 250, max: 350 },
    description: "깔끔하고 업무에 집중할 수 있는 환경으로 부탁드립니다.",
    additionalRequests: ["가구 이동 서비스", "기존 벽지 제거", "벽면 보수"]
  }
];

const statusConfig = {
  pending: { 
    label: "대기중", 
    color: "from-yellow-500 to-orange-500", 
    bgColor: "bg-yellow-500/10", 
    textColor: "text-yellow-400",
    icon: ClockIcon 
  },
  "in-progress": { 
    label: "진행중", 
    color: "from-blue-500 to-cyan-500", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-400",
    icon: AlertCircleIcon 
  },
  completed: { 
    label: "완료", 
    color: "from-emerald-500 to-green-500", 
    bgColor: "bg-emerald-500/10", 
    textColor: "text-emerald-400",
    icon: CheckCircleIcon 
  },
  cancelled: { 
    label: "취소", 
    color: "from-red-500 to-pink-500", 
    bgColor: "bg-red-500/10", 
    textColor: "text-red-400",
    icon: XCircleIcon 
  }
};

const priorityConfig = {
  high: { label: "높음", color: "text-red-400", bgColor: "bg-red-500/10" },
  medium: { label: "보통", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  low: { label: "낮음", color: "text-green-400", bgColor: "bg-green-500/10" }
};

export default function QuoteRequestListPage() {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<QuoteRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [priorityFilter, ] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "area">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 데이터 로딩 시뮬레이션 - 빠른 로딩을 위해 시간 단축
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // 로딩 시간을 단축
      await new Promise(resolve => setTimeout(resolve, 100));
      setQuoteRequests(mockQuoteRequests);
      setFilteredRequests(mockQuoteRequests);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...quoteRequests];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // 지역 필터
    if (regionFilter !== "all") {
      filtered = filtered.filter(request => request.region === regionFilter);
    }

    // 우선순위 필터
    if (priorityFilter !== "all") {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case "area":
          aValue = a.area.pyeong;
          bValue = b.area.pyeong;
          break;
        default:
          return 0;
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredRequests(filtered);
  }, [quoteRequests, searchTerm, statusFilter, regionFilter, priorityFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsLoading(false);
  };

  const getUniqueRegions = () => {
    const regions = [...new Set(quoteRequests.map(req => req.region))];
    return regions;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-5 shadow-2xl shadow-blue-500/25">
              <ListIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                전체 견적 요청
              </span>
            </h1>
            
      

            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: "전체", count: quoteRequests.length, color: "from-blue-500 to-cyan-500" },
                { label: "대기중", count: quoteRequests.filter(r => r.status === 'pending').length, color: "from-yellow-500 to-orange-500" },
                { label: "진행중", count: quoteRequests.filter(r => r.status === 'in-progress').length, color: "from-purple-500 to-violet-500" },
                { label: "완료", count: quoteRequests.filter(r => r.status === 'completed').length, color: "from-emerald-500 to-green-500" }
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
          {/* 검색 및 필터 섹션 */}
          <section className="mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 검색 */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="견적 요청 검색..."
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
                    <option value="pending">대기중</option>
                    <option value="in-progress">진행중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>

                {/* 지역 필터 */}
                <div>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                  >
                    <option value="all">모든 지역</option>
                    {getUniqueRegions().map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* 정렬 및 새로고침 */}
                <div className="flex gap-2">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSortBy(sort as "date" | "priority" | "area");
                      setSortOrder(order as "asc" | "desc");
                    }}
                    className="flex-1 px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white text-sm"
                  >
                    <option value="date-desc">최신순</option>
                    <option value="date-asc">오래된순</option>
                    <option value="priority-desc">우선순위 높음</option>
                    <option value="priority-asc">우선순위 낮음</option>
                    <option value="area-desc">면적 큰순</option>
                    <option value="area-asc">면적 작은순</option>
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
                <p className="text-slate-300">견적 요청을 불러오는 중...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">견적 요청이 없습니다</h3>
                <p className="text-slate-400">검색 조건을 변경하거나 새로운 견적 요청을 기다려주세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredRequests.map((request) => {
                  const StatusIcon = statusConfig[request.status].icon;
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">{request.id}</span>
                            <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[request.priority].bgColor} ${priorityConfig[request.priority].color}`}>
                              {priorityConfig[request.priority].label}
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-white mb-1 line-clamp-2 leading-tight">{request.title}</h3>
                        </div>
                        
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[request.status].bgColor} ${statusConfig[request.status].textColor} ml-2 flex-shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{statusConfig[request.status].label}</span>
                        </div>
                      </div>

                      {/* 기본 정보 - 더 컴팩트하게 */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-slate-300">
                          <BuildingIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{request.buildingType}</span>
                          <span className="mx-1">•</span>
                          <span className="flex-shrink-0">{request.area.pyeong}평</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-300">
                          <MapPinIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{request.region}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-300">
                          <UserIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{request.customerName}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-300">
                          <CalendarIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{request.requestDate}</span>
                          {request.visitDate && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="truncate text-blue-400">{request.visitDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 시공 범위 - 더 컴팩트하게 */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {request.constructionScope.slice(0, 3).map((scope, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-700/50 text-xs text-slate-300 rounded">
                              {scope}
                            </span>
                          ))}
                          {request.constructionScope.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-700/50 text-xs text-slate-400 rounded">
                              +{request.constructionScope.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 예산 정보 - 더 컴팩트하게 */}
                      {request.budget && (
                        <div className="mb-3 p-2 bg-slate-800/30 rounded-lg">
                          <div className="text-xs text-slate-400">예산</div>
                          <div className="text-sm text-white font-semibold">
                            {request.budget.min}~{request.budget.max}만원
                          </div>
                        </div>
                      )}

                      {/* 설명 - 더 간결하게 */}
                      {request.description && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{request.description}</p>
                        </div>
                      )}

                      {/* 액션 버튼 - 더 컴팩트하게 */}
                      <div className="flex gap-2">
                        <Link 
                          href={`/quote-request/${request.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <EyeIcon className="w-3 h-3" />
                          상세보기
                        </Link>
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