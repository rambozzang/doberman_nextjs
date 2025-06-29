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

  // 초기 로딩 완료 플래그
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const hasInitialized = useRef(false);
  const isFirstRender = useRef(true);

  // API 데이터 로딩 (검색 API 사용)
  const loadCustomerRequests = useCallback(async (
    page: number = currentPage, 
    size: number = pageSize,
    searchKeyword?: string,
    status?: string,
    region?: string,
    sortBy?: string,
    sortDirection?: string
  ) => {
    setIsLoading(true);
    try {
      console.log("데이터 로딩 시작:", { page, size, searchKeyword, status, region, sortBy, sortDirection });
      
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
      if (sortBy) {
        params.sortBy = sortBy;
      }
      if (sortDirection) {
        params.sortDirection = sortDirection;
      }

      const response = await CustomerRequestService.searchRequests(params);
      console.log("데이터 로딩 응답:", response);
      
      if (response.success && response.data) {
        setCustomerRequests(response.data.content || []);
        setCurrentPage(response.data.currentPage || 0);
        setTotalPages(response.data.totalPages || 0);
        setTotalCount(response.data.totalCount || 0);
        console.log("데이터 설정 완료");
      } else {
        console.log("데이터 로딩 실패:", response);
        toast.error(response.error || "데이터를 불러오는데 실패했습니다.");
        setCustomerRequests([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalCount(0);
      }
    } catch (error) {
              console.error("API 호출 오류:", error);
        toast.error("서버 연결에 실패했습니다.");
        setCustomerRequests([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalCount(0);
    } finally {
      console.log("데이터 로딩 완료");
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  // 초기 데이터 로딩 (한 번만 실행)
  useEffect(() => {
    if (hasInitialized.current) return; // 이미 초기화되었으면 실행하지 않음
    
    let isMounted = true;
    hasInitialized.current = true;
    
    const initData = async () => {
      setIsLoading(true);
      console.log("초기 데이터 로딩 시작");
      console.log("요청 파라미터:", { page: 0, size: pageSize, sortBy, sortDirection: sortOrder });
      
      try {
        // 단순하게 페이지 데이터만 먼저 로딩
        console.log("API 호출 시작...");
        const response = await CustomerRequestService.searchRequests({ 
          page: 0, 
          size: pageSize, 
          sortBy: sortBy,
          sortDirection: sortOrder
        });
        
        console.log("API 응답 완료:", response);
        console.log("응답 타입:", typeof response);
        console.log("응답이 null인가?:", response === null);
        console.log("응답이 undefined인가?:", response === undefined);
        
        if (response) {
          console.log("응답 success:", response.success);
          console.log("응답 data:", response.data);
          console.log("응답 error:", response.error);
          
          if (response.data) {
            console.log("data.content:", response.data.content);
            console.log("data.content 타입:", typeof response.data.content);
            console.log("data.content 길이:", response.data.content?.length);
          }
        }
        
        if (isMounted) {
          console.log("isMounted = true, 상태 업데이트 시작");
          
          if (response && response.success === true && response.data) {
            console.log("성공 분기 진입");
            
            const content = response.data.content || [];
            console.log("설정할 content:", content);
            console.log("content 길이:", content.length);
            
            console.log("setCustomerRequests 호출 전");
            console.log("응답 데이터 상세:", {
              content: response.data.content,
              contentLength: response.data.content?.length,
              currentPage: response.data.currentPage,
              totalPages: response.data.totalPages,
              totalCount: response.data.totalCount,
              isLast: response.data.isLast
            });
            
            setCustomerRequests(content);
            setCurrentPage(response.data.currentPage || 0);
            setTotalPages(response.data.totalPages || 0);
            setTotalCount(response.data.totalCount || 0);
            
            // 통계 정보도 같은 데이터로 설정
            setStats({
              total: response.data.totalCount || 0,
              reviewing: content.filter(r => r.status === '검토중').length,
              inProgress: content.filter(r => r.status === '진행중').length,
              completed: content.filter(r => r.status === '채택 성공').length
            });

            // 필터 옵션 설정
            if (content.length > 0) {
              const uniqueStatuses = [...new Set(content.map(req => req.status))];
              const uniqueRegions = [...new Set(content.map(req => req.region))];
              setFilterOptions({
                statuses: uniqueStatuses,
                regions: uniqueRegions
              });
            }
            
            console.log("데이터 설정 완료");
          } else {
            console.log("실패 분기 진입");
            console.log("API 응답 실패:", response);
            // 기본값 설정
            setCustomerRequests([]);
            setCurrentPage(0);
            setTotalPages(0);
            setTotalCount(0);
            setStats({ total: 0, reviewing: 0, inProgress: 0, completed: 0 });
            
            if (response && response.error) {
              console.log("에러 메시지:", response.error);
              toast.error(response.error);
            } else {
              console.log("일반 에러 메시지");
              toast.error("데이터를 불러오는데 실패했습니다.");
            }
          }
          console.log("setIsInitialLoaded(true) 호출");
          setIsInitialLoaded(true);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 오류:", error);
        console.error("에러 스택:", error);
        if (isMounted) {
          toast.error("서버 연결에 실패했습니다.");
          // 오류 발생 시에도 기본값 설정
          setCustomerRequests([]);
          setCurrentPage(0);
          setTotalPages(0);
          setTotalCount(0);
          setStats({ total: 0, reviewing: 0, inProgress: 0, completed: 0 });
          setIsInitialLoaded(true);
        }
      } finally {
        if (isMounted) {
          console.log("초기 로딩 완료 - setIsLoading(false) 호출");
          setIsLoading(false);
        }
      }
    };

    initData();
    
    return () => {
      isMounted = false;
    };
  }, [pageSize, sortBy, sortOrder]);

  // 검색/필터/정렬 변경 시 데이터 다시 로딩 (초기 로딩 완료 후에만)
  useEffect(() => {
    if (!isInitialLoaded) return; // 초기 로딩이 완료되지 않았으면 실행하지 않음

    // 첫 번째 렌더링 후 isInitialLoaded가 true가 된 직후는 건너뛰기
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log("필터 변경으로 인한 API 호출");
      loadCustomerRequests(
        0, // 검색/필터 변경시 첫 페이지로
        pageSize,
        searchTerm,
        statusFilter,
        regionFilter,
        sortBy,
        sortOrder
      );
      setCurrentPage(0);
    }, 500); // 디바운싱

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, regionFilter, sortBy, sortOrder, pageSize, isInitialLoaded, loadCustomerRequests]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      loadCustomerRequests(
        newPage, 
        pageSize,
        searchTerm,
        statusFilter,
        regionFilter,
        sortBy,
        sortOrder
      );
    }
  };

  // 페이지 크기 변경
  const handlePageSizeChange = (newSize: number) => {
    if (newSize !== pageSize) {
      setPageSize(newSize);
      setCurrentPage(0); // 페이지 크기 변경 시 첫 페이지로
      loadCustomerRequests(
        0, 
        newSize,
        searchTerm,
        statusFilter,
        regionFilter,
        sortBy,
        sortOrder
      );
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
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 페이지 번호 생성
      let startPage = Math.max(0, currentPage - 2);
      const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
      
      // 끝에서 부족한 페이지를 앞에서 보충
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
    loadCustomerRequests(
      currentPage, 
      pageSize,
      searchTerm,
      statusFilter,
      regionFilter,
      sortBy,
      sortOrder
    );
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

  // 디버깅 정보 표시
  console.log("렌더링 상태:", {
    isLoading,
    isInitialLoaded,
    customerRequestsLength: customerRequests.length,
    totalCount,
    currentPage,
    totalPages
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              견적 요청 리스트
            </h1>
            <p className="text-gray-300 text-center">고객님의 견적 요청을 관리하세요</p>
          </div>

          {/* 로딩 스피너 */}
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
            <span className="ml-4 text-lg text-gray-300">데이터를 불러오는 중...</span>
          </div>

          {/* 디버깅 정보 */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">디버깅 정보:</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>isLoading: {isLoading.toString()}</div>
              <div>isInitialLoaded: {isInitialLoaded.toString()}</div>
              <div>customerRequests.length: {customerRequests.length}</div>
              <div>totalCount: {totalCount}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            견적 요청 리스트
          </h1>
          <p className="text-gray-300 text-center">고객님의 견적 요청을 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">전체 요청</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <ListIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">검토중</p>
                <p className="text-2xl font-bold text-white">{stats.reviewing}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">진행중</p>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              </div>
              <AlertCircleIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">완료</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-emerald-200" />
            </div>
          </div>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 검색 */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all" className="bg-gray-800">전체 상태</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status} className="bg-gray-800">{status}</option>
              ))}
            </select>

            {/* 지역 필터 */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all" className="bg-gray-800">전체 지역</option>
              {filterOptions.regions.map(region => (
                <option key={region} value={region} className="bg-gray-800">{removeBrackets(region)}</option>
              ))}
            </select>

            {/* 정렬 */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "area")}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="latest" className="bg-gray-800">최신순</option>
                <option value="area" className="bg-gray-800">지역순</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white hover:bg-white/20 transition-colors"
                title={sortOrder === "asc" ? "오름차순" : "내림차순"}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCwIcon className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>

        {/* 견적 요청 리스트 */}
        <div className="space-y-4 mb-8">
          {customerRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileTextIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">견적 요청이 없습니다</h3>
              <p className="text-gray-500">새로운 견적 요청을 기다리고 있습니다.</p>
            </div>
          ) : (
            customerRequests.map((request) => {
              const config = statusConfig[request.status as keyof typeof statusConfig] || defaultStatusConfig;
              const StatusIcon = config.icon;

              return (
                <div key={request.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 왼쪽: 주요 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* 상태 아이콘 */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                          <StatusIcon className={`h-6 w-6 ${config.textColor}`} />
                        </div>

                        {/* 기본 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {request.customerName}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border border-current/20`}>
                              {config.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              <span>{request.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4 text-gray-400" />
                              <span>{removeBrackets(request.region)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BuildingIcon className="h-4 w-4 text-gray-400" />
                              <span>{removeBrackets(request.buildingType)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 요청 내용 미리보기 */}
                      {request.requestContent && (
                        <div className="mt-4 pl-16">
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {request.requestContent.substring(0, 100)}
                            {request.requestContent.length > 100 && "..."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 오른쪽: 액션 버튼 */}
                    <div className="flex-shrink-0">
                      <Link 
                        href={`/quote-request/${request.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <EyeIcon className="h-4 w-4" />
                        상세보기
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            {/* 페이지 정보 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="text-sm text-gray-300">
                전체 <span className="font-semibold text-white">{totalCount}</span>개 중{' '}
                <span className="font-semibold text-white">{currentPage * pageSize + 1}</span>-
                <span className="font-semibold text-white">{Math.min((currentPage + 1) * pageSize, totalCount)}</span>개 표시
              </div>
              
              {/* 페이지 크기 선택 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">페이지당:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 bg-white/10 border border-white/30 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={10} className="bg-gray-800">10개</option>
                  <option value={20} className="bg-gray-800">20개</option>
                  <option value={50} className="bg-gray-800">50개</option>
                </select>
              </div>
            </div>

            {/* 페이지 버튼들 */}
            <div className="flex items-center justify-center gap-2">
              {/* 처음 페이지 */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 0}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                처음
              </button>

              {/* 이전 페이지 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {/* 페이지 번호들 */}
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    pageNum === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
                >
                  {pageNum + 1}
                </button>
              ))}

              {/* 다음 페이지 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>

              {/* 마지막 페이지 */}
              <button
                onClick={goToLastPage}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                마지막
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}