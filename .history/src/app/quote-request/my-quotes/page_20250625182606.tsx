"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserIcon, 
  SearchIcon, 
  MapPinIcon,
  CalendarIcon,
  BuildingIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  RefreshCwIcon,  
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest } from "@/types/api";
import { toast } from "react-hot-toast";

// 더미 데이터 제거 - 실제 API 사용

// 상태 매핑 함수
const getStatusConfig = (status: string) => {
  const statusMap: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType;
    description: string;
  }> = {
    "검토중": { 
      label: "검토중", 
      color: "from-yellow-500 to-orange-500", 
      bgColor: "bg-yellow-500/10", 
      textColor: "text-yellow-400",
      icon: ClockIcon,
      description: "전문가들이 검토중입니다"
    },
    "진행중": { 
      label: "진행중", 
      color: "from-blue-500 to-cyan-500", 
      bgColor: "bg-blue-500/10", 
      textColor: "text-blue-400",
      icon: AlertCircleIcon,
      description: "시공이 진행중입니다"
    },
    "채택 성공": { 
      label: "채택 성공", 
      color: "from-emerald-500 to-green-500", 
      bgColor: "bg-emerald-500/10", 
      textColor: "text-emerald-400",
      icon: CheckCircleIcon,
      description: "시공이 성공적으로 완료되었습니다"
    },
    "취소": { 
      label: "취소", 
      color: "from-red-500 to-pink-500", 
      bgColor: "bg-red-500/10", 
      textColor: "text-red-400",
      icon: XCircleIcon,
      description: "견적 요청이 취소되었습니다"
    }
  };
  
  return statusMap[status] || statusMap["검토중"];
};

// priorityConfig 제거 - 실제 API에는 priority 필드가 없음

export default function MyQuoteRequestsPage() {
  const [myQuoteRequests, setMyQuoteRequests] = useState<CustomerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CustomerRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "status" | "quotes">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage] = useState(0);
  const [pageSize] = useState(10);
  
  // 인증 상태 확인
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // 로그인 체크 및 리다이렉트
  useEffect(() => {
    // 인증 로딩이 완료되고 로그인하지 않은 상태인 경우
    if (!authLoading && !isLoggedIn) {
      toast.error("로그인이 필요한 페이지입니다.", {
        duration: 2000,
      });
      
      // 히스토리 백
      if (window.history.length > 1) {
        router.back();
      } else {
        // 히스토리가 없는 경우 홈으로 이동
        router.push('/');
      }
      return;
    }
  }, [authLoading, isLoggedIn, router]);

  // 실제 API를 통한 데이터 로딩
  const loadData = async () => {
    if (!isLoggedIn || !user?.customerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await CustomerRequestService.getMyList({
        page: currentPage,
        size: pageSize,
        customerId: user.customerId,
        status: statusFilter === "all" ? undefined : statusFilter
      });

      if (response.success && response.data) {
        setMyQuoteRequests(response.data.content);
        setFilteredRequests(response.data.content);
      } else {
        toast.error("데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("데이터 로딩 오류:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.customerId) {
      loadData();
    }
  }, [isLoggedIn, user, currentPage, pageSize, statusFilter]);

  // 로그인 상태가 확인되지 않은 경우 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-white text-lg">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 빈 컴포넌트 반환 (리다이렉트 처리됨)
  if (!isLoggedIn) {
    return null;
  }

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...myQuoteRequests];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm.toLowerCase()) ||
        request.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.constructionLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터는 API에서 처리되므로 여기서는 제거

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case "status":
          aValue = a.status.localeCompare(b.status);
          bValue = 0;
          break;
        case "quotes":
          aValue = a.answerCount;
          bValue = b.answerCount;
          break;
        default:
          return 0;
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredRequests(filtered);
  }, [myQuoteRequests, searchTerm, sortBy, sortOrder]);

  const handleRefresh = async () => {
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm("정말로 이 견적 요청을 삭제하시겠습니까?")) {
      // TODO: 실제 삭제 API 호출
      console.log("삭제할 ID:", id);
      toast.success("견적 요청이 삭제되었습니다.");
      await loadData(); // 목록 새로고침
    }
  };

  const getStatusCounts = () => {
    const statusCounts: Record<string, number> = {};
    myQuoteRequests.forEach(request => {
      statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;
    });
    
    return {
      total: myQuoteRequests.length,
      pending: statusCounts["검토중"] || 0,
      inProgress: statusCounts["진행중"] || 0,
      completed: statusCounts["채택 성공"] || 0,
      cancelled: statusCounts["취소"] || 0
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="text-left">
            <div className="flex items-center gap-4 mb-5 ">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl   shadow-2xl shadow-blue-500/25">
                <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  내 견적 요청
                </span>
              </h1>
            </div>
          
            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
              {[
                { label: "전체", count: statusCounts.total, color: "from-blue-500 to-cyan-500" },
                { label: "대기중", count: statusCounts.pending, color: "from-yellow-500 to-orange-500" },
                { label: "진행중", count: statusCounts.inProgress, color: "from-purple-500 to-violet-500" },
                { label: "완료", count: statusCounts.completed, color: "from-emerald-500 to-green-500" },
                { label: "취소", count: statusCounts.cancelled, color: "from-red-500 to-pink-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl  px-4 py-1 ">
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
                    <option value="검토중">검토중</option>
                    <option value="진행중">진행중</option>
                    <option value="채택 성공">채택 성공</option>
                    <option value="취소">취소</option>
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
                <SearchIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
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
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon as React.ComponentType<{ className?: string }>;
                  
                  // 대괄호 제거 함수
                  const removeBrackets = (text: string) => {
                    return text.replace(/[\[\]]/g, '');
                  };

                  // 날짜 포맷 함수
                  const formatDate = (dateString: string) => {
                    try {
                      const date = new Date(dateString);
                      return date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    } catch {
                      return dateString;
                    }
                  };
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* 기본 정보 */}
                        <div className="lg:col-span-2">
                          {/* 헤더 */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-slate-400">#{request.id}</span>
                              </div>
                              <h3 className="text-lg font-bold text-white mb-1">
                                {removeBrackets(request.buildingType)} {request.constructionLocation}
                              </h3>
                              <p className="text-sm text-slate-400">{statusConfig.description}</p>
                            </div>
                            
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </div>
                          </div>

                          {/* 상세 정보 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-slate-300">
                                <BuildingIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>{removeBrackets(request.buildingType)}</span>
                                <span className="mx-2">•</span>
                                <span>{request.areaSize}㎡</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-slate-300">
                                <MapPinIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>{request.region}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-slate-300">
                                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                                <span>요청: {formatDate(request.requestDate)}</span>
                              </div>
                              
                              {request.preferredDate && (
                                <div className="flex items-center text-sm text-slate-300">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>희망: {request.preferredDate}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 벽지 종류 */}
                          {request.wallpaper && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-slate-700/50 text-xs text-slate-300 rounded-md">
                                  {removeBrackets(request.wallpaper)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 특이사항 */}
                          {request.specialInfo && (
                            <div className="mb-3">
                              <p className="text-sm text-slate-300 line-clamp-2">{request.specialInfo}</p>
                            </div>
                          )}
                        </div>

                        {/* 우측 정보 패널 */}
                        <div className="space-y-3">
                          {/* 견적 정보 */}
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <div className="text-center mb-2">
                              <div className="text-xl font-bold text-blue-400">{request.answerCount}</div>
                              <div className="text-xs text-slate-400">받은 답변</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1">면적</div>
                              <div className="text-sm text-white font-semibold">
                                {request.areaSize}㎡
                              </div>
                            </div>
                          </div>

                          {/* 고객 정보 */}
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1">고객명</div>
                              <div className="text-sm text-white font-semibold">{request.customerName}</div>
                            </div>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="space-y-2">
                            <Link 
                              href={`/quote-request/${request.id}`}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <EyeIcon className="w-4 h-4" />
                              상세보기
                            </Link>
                            
                            {request.status === '검토중' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-md transition-all text-slate-300 hover:text-white text-xs">
                                  <EditIcon className="w-3 h-3" />
                                  수정
                                </button>
                                <button 
                                  onClick={() => handleDelete(request.id)}
                                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md transition-all text-red-400 hover:text-red-300 text-xs"
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