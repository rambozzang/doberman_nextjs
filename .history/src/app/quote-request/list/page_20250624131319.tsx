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
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react";
import Link from "next/link";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest, CustomerRequestListResponse } from "@/types/api";
import { toast } from "react-hot-toast";

// 상태 매핑 설정
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

// 기본 상태 설정 (매핑되지 않은 상태용)
const defaultStatusConfig = {
  label: "기타", 
  color: "from-gray-500 to-slate-500", 
  bgColor: "bg-gray-500/10", 
  textColor: "text-gray-400",
  icon: AlertCircleIcon
};

export default function QuoteRequestListPage() {
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CustomerRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "area" | "answers">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLast, setIsLast] = useState(true);

  // API 데이터 로딩
  const loadCustomerRequests = async (page: number = currentPage, size: number = pageSize) => {
    setIsLoading(true);
    try {
      const response = await CustomerRequestService.getAllList({ page, size });
      
      if (response.success && response.data) {
        setCustomerRequests(response.data.content);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
        setIsLast(response.data.isLast);
      } else {
        toast.error(response.error || "데이터를 불러오는데 실패했습니다.");
        setCustomerRequests([]);
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      toast.error("서버 연결에 실패했습니다.");
      setCustomerRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    loadCustomerRequests(0, pageSize);
  }, [pageSize]);

  // 필터링 및 검색 (클라이언트 사이드)
  useEffect(() => {
    let filtered = [...customerRequests];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm) ||
        request.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.constructionLocation.toLowerCase().includes(searchTerm.toLowerCase())
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

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case "area":
          aValue = a.areaSize;
          bValue = b.areaSize;
          break;
        case "answers":
          aValue = a.answerCount;
          bValue = b.answerCount;
          break;
        default:
          return 0;
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredRequests(filtered);
  }, [customerRequests, searchTerm, statusFilter, regionFilter, sortBy, sortOrder]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadCustomerRequests(newPage, pageSize);
    }
  };

  // 페이지 크기 변경
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // 새로고침
  const handleRefresh = () => {
    loadCustomerRequests(currentPage, pageSize);
  };

  // 유니크 지역 목록
  const getUniqueRegions = () => {
    const regions = [...new Set(customerRequests.map(req => req.region))];
    return regions;
  };

  // 유니크 상태 목록
  const getUniqueStatuses = () => {
    const statuses = [...new Set(customerRequests.map(req => req.status))];
    return statuses;
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="text-left">
            <div className="flex items-center gap-4 mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25">
                <ListIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  전체 견적 요청
                </span>
              </h1>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: "전체", count: totalCount, color: "from-blue-500 to-cyan-500" },
                { label: "검토중", count: customerRequests.filter(r => r.status === '검토중').length, color: "from-yellow-500 to-orange-500" },
                { label: "진행중", count: customerRequests.filter(r => r.status === '진행중').length, color: "from-purple-500 to-violet-500" },
                { label: "채택 성공", count: customerRequests.filter(r => r.status === '채택 성공').length, color: "from-emerald-500 to-green-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-1">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                    {getUniqueStatuses().map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
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

                {/* 정렬 */}
                <div>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSortBy(sort as "date" | "area" | "answers");
                      setSortOrder(order as "asc" | "desc");
                    }}
                    className="w-full px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white text-sm"
                  >
                    <option value="date-desc">최신순</option>
                    <option value="date-asc">오래된순</option>
                    <option value="area-desc">면적 큰순</option>
                    <option value="area-asc">면적 작은순</option>
                    <option value="answers-desc">답변 많은순</option>
                    <option value="answers-asc">답변 적은순</option>
                  </select>
                </div>

                {/* 새로고침 */}
                <div>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCwIcon className={`w-5 h-5 text-blue-400 mx-auto ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 페이지 크기 선택 */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-sm text-slate-300">페이지당 항목:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
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
                  const statusConf = statusConfig[request.status as keyof typeof statusConfig] || defaultStatusConfig;
                  const StatusIcon = statusConf.icon;
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">#{request.id}</span>
                            {request.answerCount > 0 && (
                              <div className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                답변 {request.answerCount}
                              </div>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white mb-1 line-clamp-2 leading-tight">
                            {removeBrackets(request.constructionLocation)} 도배 요청
                          </h3>
                        </div>
                        
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConf.bgColor} ${statusConf.textColor} ml-2 flex-shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{statusConf.label}</span>
                        </div>
                      </div>

                      {/* 기본 정보 */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-slate-300">
                          <BuildingIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{removeBrackets(request.buildingType)}</span>
                          <span className="mx-1">•</span>
                          <span className="flex-shrink-0">{request.areaSize}평</span>
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
                          <span className="truncate">{formatDate(request.requestDate)}</span>
                        </div>
                      </div>

                      {/* 추가 정보 */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-slate-700/50 text-xs text-slate-300 rounded">
                            {removeBrackets(request.wallpaper)}
                          </span>
                          {request.specialInfo && (
                            <span className="px-1.5 py-0.5 bg-slate-700/50 text-xs text-slate-300 rounded">
                              {request.specialInfo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 선호 일정 */}
                      {request.preferredDate && (
                        <div className="mb-3 p-2 bg-slate-800/30 rounded-lg">
                          <div className="text-xs text-slate-400">선호 일정</div>
                          <div className="text-sm text-white font-semibold">
                            {request.preferredDate}
                          </div>
                        </div>
                      )}

                      {/* 액션 버튼 */}
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                이전
              </button>

              {/* 페이지 번호들 */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={isLast}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                다음
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 총 개수 표시 */}
          {totalCount > 0 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-slate-400">
                총 {totalCount}개의 견적 요청 (페이지 {currentPage + 1} / {totalPages})
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
}