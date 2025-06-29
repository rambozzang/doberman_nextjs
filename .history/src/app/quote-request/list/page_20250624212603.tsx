"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { CustomerRequest } from "@/types/api";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "area">("latest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 통계 정보를 위한 상태
  const [stats, setStats] = useState({
    total: 0,
    reviewing: 0,
    inProgress: 0,
    completed: 0
  });

  // 필터 옵션을 위한 상태
  const [filterOptions, setFilterOptions] = useState({
    statuses: [] as string[],
    regions: [] as string[]
  });

  const isInitialMount = useRef(true);

  // API 데이터 로딩
  const loadCustomerRequests = useCallback(async (
    page: number = 0, 
    size: number = 10,
    searchKeyword?: string,
    status?: string,
    region?: string,
    sortByParam?: string,
    sortDirection?: string
  ) => {
    setIsLoading(true);
    console.log("loadCustomerRequests 호출:", { page, size, searchKeyword, status, region, sortByParam, sortDirection });
    
    try {
      const params: Record<string, string | number> = { page, size };
      
      if (searchKeyword && searchKeyword.trim()) {
        params.searchKeyword = searchKeyword.trim();
      }
      if (status && status !== "all") {
        params.status = status;
      }
      if (region && region !== "all") {
        params.region = region;
      }
      if (sortByParam) {
        params.sortBy = sortByParam;
      }
      if (sortDirection) {
        params.sortDirection = sortDirection;
      }

      console.log("API 요청 파라미터:", params);
      const response = await CustomerRequestService.searchRequests(params);
      console.log("API 응답:", response);
      
      if (response.success && response.data) {
        const responseData = response.data;
        console.log("응답 데이터:", responseData);
        
        setCustomerRequests(responseData.content || []);
        setCurrentPage(responseData.currentPage || 0);
        setTotalPages(responseData.totalPages || 0);
        setTotalCount(responseData.totalCount || 0);
        
        // 통계 정보 설정
        const contentArray = responseData.content || [];
        setStats({
          total: responseData.totalCount || 0,
          reviewing: contentArray.filter(r => r.status === '검토중').length,
          inProgress: contentArray.filter(r => r.status === '진행중').length,
          completed: contentArray.filter(r => r.status === '채택 성공').length
        });

        // 필터 옵션 설정
        if (contentArray.length > 0) {
          const uniqueStatuses = [...new Set(contentArray.map(req => req.status))];
          const uniqueRegions = [...new Set(contentArray.map(req => req.region))];
          setFilterOptions({
            statuses: uniqueStatuses,
            regions: uniqueRegions
          });
        }
        
        console.log("상태 업데이트 완료");
      } else {
        console.log("API 응답 실패:", response);
        toast.error(response.error || "데이터를 불러오는데 실패했습니다.");
        setCustomerRequests([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalCount(0);
        setStats({ total: 0, reviewing: 0, inProgress: 0, completed: 0 });
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      toast.error("서버 연결에 실패했습니다.");
      setCustomerRequests([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalCount(0);
      setStats({ total: 0, reviewing: 0, inProgress: 0, completed: 0 });
    } finally {
      console.log("로딩 완료");
      setIsLoading(false);
    }
  }, []);

  // 데이터 로딩 통합 (초기 로딩 + 디바운싱)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log("초기 데이터 로딩 시작");
      loadCustomerRequests(0, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
      setCurrentPage(0);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log("필터 변경으로 인한 데이터 로딩");
      loadCustomerRequests(0, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
      setCurrentPage(0);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, regionFilter, sortBy, sortOrder, pageSize, loadCustomerRequests]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      loadCustomerRequests(newPage, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
    }
  };

  // 페이지 크기 변경
  const handlePageSizeChange = (newSize: number) => {
    if (newSize !== pageSize) {
      setPageSize(newSize);
      setCurrentPage(0);
      loadCustomerRequests(0, newSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
    }
  };

  // 첫 페이지로 이동
  const goToFirstPage = () => {
    handlePageChange(0);
  };

  // 마지막 페이지로 이동
  const goToLastPage = () => {
    handlePageChange(totalPages - 1);
  };

  // 페이지 번호 생성 로직
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(0, currentPage - 2);
      const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // 새로고침
  const handleRefresh = () => {
    loadCustomerRequests(currentPage, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
  };

  // 대괄호 제거 함수
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
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
                <span className="block text-sm md:text-lg font-normal text-slate-300 mt-1">
                  총 {totalCount}개의 견적 요청이 등록되었습니다
                </span>
              </h1>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: "전체", count: stats.total, color: "from-blue-500 to-cyan-500" },
                { label: "검토중", count: stats.reviewing, color: "from-yellow-500 to-orange-500" },
                { label: "진행중", count: stats.inProgress, color: "from-purple-500 to-violet-500" },
                { label: "채택 성공", count: stats.completed, color: "from-emerald-500 to-green-500" }
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
                    {filterOptions.statuses.map((status: string) => (
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
                    {filterOptions.regions.map((region: string) => (
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
                      setSortBy(sort as "latest" | "area");
                      setSortOrder(order as "asc" | "desc");
                    }}
                    className="w-full px-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white text-sm"
                  >
                    <option value="latest-desc">최신순</option>
                    <option value="latest-asc">오래된순</option>
                    <option value="area-desc">면적 큰순</option>
                    <option value="area-asc">면적 작은순</option>
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
            {/* 디버깅 정보 (임시) */}
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-white text-sm">
              <div>isLoading: {isLoading.toString()}</div>
              <div>customerRequests.length: {customerRequests.length}</div>
              <div>totalCount: {totalCount}</div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                  <RefreshCwIcon className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <p className="text-slate-300">견적 요청을 불러오는 중...</p>
              </div>
            ) : customerRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">견적 요청이 없습니다</h3>
                <p className="text-slate-400">검색 조건을 변경하거나 새로운 견적 요청을 기다려주세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {customerRequests.map((request) => {
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

                      {/* 액션 버튼 */}
                      <div className="pt-3 border-t border-white/10">
                        <Link
                          href={`/quote-request/${request.id}`}
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-400 text-sm font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          상세보기
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {!isLoading && customerRequests.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                {/* 페이지 정보 */}
                <div className="text-sm text-slate-400">
                  {totalCount}개 중 {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)}개 표시
                </div>

                {/* 페이지네이션 버튼 */}
                <div className="flex items-center gap-2">
                  {/* 첫 페이지 */}
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 0}
                    className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-white text-sm"
                  >
                    처음
                  </button>

                  {/* 이전 페이지 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-white"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>

                  {/* 페이지 번호 */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                          pageNum === currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    ))}
                  </div>

                  {/* 다음 페이지 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-white"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>

                  {/* 마지막 페이지 */}
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-white text-sm"
                  >
                    마지막
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}