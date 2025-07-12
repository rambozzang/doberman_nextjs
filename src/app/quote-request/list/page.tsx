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
  ChevronRightIcon,
  FilterIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShieldCheckIcon
} from "lucide-react";
import Link from "next/link";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest } from "@/types/api";
import { AuthManager } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";

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
  const { user: currentUser, isLoggedIn } = useAuth();
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "area">("latest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // 통계 정보를 위한 상태
  const [stats, setStats] = useState({
    total: 0,
    reviewing: 0,
    inProgress: 0,
    completed: 0,
    canceled: 0
  });

  // 고객명 가운데 이름 * 으로 변경 함수
  const hideMiddleName = (name: string) => {
    const nameString = name.trim();
    if(nameString.length > 2) {
      return nameString.slice(0, 1) + '*'.repeat(nameString.length - 2) + nameString.slice(-1);
    } else if(nameString.length === 2) {
      return nameString.slice(0, 1) + '*';
    }
    return nameString;
  };
 

  // 필터 옵션을 위한 상태 (현재는 사용하지 않음)
  // const [filterOptions, setFilterOptions] = useState({
  //   regions: [] as string[]
  // });

  // 통계 데이터 로딩
  const loadStatistics = useCallback(async () => {
    try {
      console.log("통계 데이터 로딩 시작");
      const response = await CustomerRequestService.getStatistics();
      console.log("통계 API 응답:", response);
      
      if (response.success && response.data) {
        const statsData = response.data;
        setStats({
          total: statsData.totalCount,
          reviewing: statsData.reviewingCount,
          inProgress: statsData.adoptedCount, // 채택 성공
          completed: statsData.completedCount, // 완료
          canceled: statsData.canceledCount // 취소
        });
        console.log("통계 데이터 설정 완료:", statsData);
      } else {
        console.log("통계 API 응답 실패:", response);
        console.log(response.error || "통계 데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("통계 API 호출 오류:", error);
      console.log("통계 데이터 로딩 중 오류가 발생했습니다.");
    }
  }, []);

  // API 데이터 로딩
  const loadCustomerRequests = useCallback(async (
    page: number = 0, 
    size: number = 12,
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
        
        console.log("상태 업데이트 완료");
      } else {
        console.log("API 응답 실패:", response);
        console.log(response.error || "데이터를 불러오는데 실패했습니다.");
        setCustomerRequests([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      console.log("서버 연결에 실패했습니다.");
      setCustomerRequests([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      console.log("로딩 완료");
      setIsLoading(false);
    }
  }, []);

  const initialLoadRan = useRef(false);

  // 초기 데이터 로딩 (Strict Mode 대응)
  useEffect(() => {
    if (initialLoadRan.current === false) {
      initialLoadRan.current = true;
      console.log("초기 데이터 로딩 시작");
      // 통계 데이터와 리스트 데이터를 병렬로 로딩
      Promise.all([
        loadStatistics(),
        loadCustomerRequests(0, pageSize, "", "all", "all", sortBy, sortOrder)
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색/필터/정렬 변경 시 데이터 다시 로딩은 수동으로 처리 (새로고침 버튼 사용)

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
    // 통계 데이터와 리스트 데이터를 병렬로 새로고침
    Promise.all([
      loadStatistics(),
      loadCustomerRequests(currentPage, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder)
    ]);
  };

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(0);
    loadCustomerRequests(0, pageSize, searchTerm, statusFilter, regionFilter, sortBy, sortOrder);
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

  // 접근 권한 확인 함수
  const canAccessRequest = (request: CustomerRequest) => {
    if (!currentUser || !currentUser.customerEmail) return false;
    
    // 이메일로 비교 (customerEmail과 현재 사용자 이메일 비교)
    return request.customerEmail === currentUser.customerEmail;
  };

  // 상세보기 클릭 핸들러
  const handleDetailClick = (request: CustomerRequest, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!canAccessRequest(request)) {
      toast.error("본인이 작성한 견적 요청만 확인할 수 있습니다.", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #ef4444',
        },
      });
      return;
    }
    
    // 접근 권한이 있는 경우 페이지 이동
    window.location.href = `/quote-request/${request.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16 sm:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-4 sm:py-6 relative">
          <div className="text-left">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25">
                <ListIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  전체 견적 요청
                </span>
                <span className="block text-xs sm:text-sm md:text-lg font-normal text-slate-300 mt-1">
                  총 {totalCount}개의 견적 요청이 등록되었습니다
                </span>
              </h1>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {[
                { label: "전체", count: stats.total, color: "from-blue-500 to-cyan-500" },
                { label: "검토중", count: stats.reviewing, color: "from-yellow-500 to-orange-500" },
                { label: "채택 성공", count: stats.inProgress, color: "from-purple-500 to-violet-500" },
                { label: "완료", count: stats.completed, color: "from-emerald-500 to-green-500" },
                { label: "취소", count: stats.canceled, color: "from-red-500 to-pink-500" }
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <button 
                className="w-full flex items-center justify-between lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setIsFilterVisible(!isFilterVisible)}
              >
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-white">검색 조건</span>
                </div>
                {isFilterVisible ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
              </button>
              
              <div className={`mt-4 lg:mt-0 ${isFilterVisible ? 'block' : 'hidden'} lg:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* 검색 */}
                  <div className="sm:col-span-2 md:col-span-4 lg:col-span-2">
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="견적 요청 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-400"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all text-blue-400 hover:text-blue-300"
                      >
                        검색
                      </button>
                    </div>
                  </div>

                  {/* 상태 필터 */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(0);
                        loadCustomerRequests(0, pageSize, searchTerm, e.target.value, regionFilter, sortBy, sortOrder);
                      }}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                    >
                      <option value="all">전체</option>
                      <option value="검토중">검토중</option>
                      <option value="채택 성공">채택 성공</option>
                      <option value="취소">취소</option>
                    </select>
                  </div>

                  {/* 지역 필터 */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <select
                      value={regionFilter}
                      onChange={(e) => {
                        setRegionFilter(e.target.value);
                        setCurrentPage(0);
                        loadCustomerRequests(0, pageSize, searchTerm, statusFilter, e.target.value, sortBy, sortOrder);
                      }}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                    >
                      <option value="all">모든 지역</option>
                      <option value="서울특별시">서울특별시</option>
                      <option value="부산광역시">부산광역시</option>
                      <option value="대구광역시">대구광역시</option>
                      <option value="인천광역시">인천광역시</option>
                      <option value="광주광역시">광주광역시</option>
                      <option value="대전광역시">대전광역시</option>
                      <option value="울산광역시">울산광역시</option>
                      <option value="세종특별자치시">세종특별자치시</option>
                      <option value="경기도">경기도</option>
                      <option value="강원도">강원도</option>
                      <option value="충청남도">충청남도</option>
                      <option value="충청북도">충청북도</option>
                      <option value="전라남도">전라남도</option>
                      <option value="전라북도">전라북도</option>
                      <option value="경상남도">경상남도</option>
                      <option value="경상북도">경상북도</option>
                      <option value="제주도">제주도</option>
                    </select>
                  </div>

                  {/* 정렬 */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [sort, order] = e.target.value.split('-');
                        setSortBy(sort as "latest" | "area");
                        setSortOrder(order as "asc" | "desc");
                        setCurrentPage(0);
                        loadCustomerRequests(0, pageSize, searchTerm, statusFilter, regionFilter, sort, order);
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
                  <div className="md:col-span-2 lg:col-span-1">
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
                    <option value={12}>12개</option>
                    <option value={24}>24개</option>
                    <option value={48}>48개</option>
                  </select>
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
                      className={`backdrop-blur-xl rounded-xl p-4 hover:scale-105 hover:-translate-y-1 transition-all duration-300 ${
                        canAccessRequest(request)
                          ? 'bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-400/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">#{request.id}</span>
                            {canAccessRequest(request) && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheckIcon className="w-3 h-3" />
                                내 견적
                              </div>
                            )}
                            {request.answerCount > 0 && (
                              <div className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
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
                          <span className="truncate">{hideMiddleName(request.customerName)}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-300">
                          <CalendarIcon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{formatDate(request.requestDate)}</span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="pt-3 border-t border-white/10">
                        <button
                          onClick={(e) => handleDetailClick(request, e)}
                          className={`flex items-center justify-center gap-2 w-full px-3 py-2 border rounded-lg transition-all text-sm font-medium ${
                            canAccessRequest(request)
                              ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-400 hover:text-blue-300'
                              : 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30 text-gray-400 hover:text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <EyeIcon className="w-4 h-4" />
                          {canAccessRequest(request) ? '상세보기' : '접근 제한'}
                        </button>
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