"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SearchIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  EditIcon,
  PlusIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  ChevronRightIcon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest } from "@/types/api";

// 상태 매핑 함수
const getStatusConfig = (status: string) => {
  const statusMap: Record<string, {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = {
    "검토중": {
      label: "검토중",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
      textColor: "text-yellow-400",
      icon: ClockIcon
    },
    "진행중": {
      label: "진행중",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-blue-400",
      icon: AlertCircleIcon
    },
    "채택 성공": {
      label: "채택 성공",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      textColor: "text-emerald-400",
      icon: CheckCircleIcon
    },
    "취소": {
      label: "취소",
      bgColor: "bg-red-500/10 border-red-500/20",
      textColor: "text-red-400",
      icon: XCircleIcon
    }
  };

  return statusMap[status] || statusMap["검토중"];
};

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "검토중", label: "검토중" },
  { value: "진행중", label: "진행중" },
  { value: "채택 성공", label: "채택 성공" },
  { value: "취소", label: "취소" }
];

// 대괄호 제거
const removeBrackets = (text: string) => text.replace(/[[\]]/g, '');

// 목록용 짧은 날짜 (YY.MM.DD)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
};

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
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 확인
  const { user } = useAuth();
  const { isLoading: authLoading, shouldRender } = useAuthGuard({
    redirectMessage: "내 견적 요청을 보려면 로그인이 필요합니다."
  });

  // 실제 API를 통한 데이터 로딩
  const loadData = useCallback(async () => {
    if (!user?.customerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
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
        setError("데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("데이터 로딩 오류:", error);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, pageSize, statusFilter]);

  useEffect(() => {
    if (shouldRender && user?.customerId) {
      loadData();
    }
  }, [shouldRender, user, currentPage, pageSize, statusFilter, loadData]);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...myQuoteRequests];

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm.toLowerCase()) ||
        request.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.constructionLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터는 API에서 처리되므로 여기서는 제거

    filtered.sort((a, b) => {
      // "채택 성공" 상태를 최우선으로 정렬
      const isACompleted = a.status === "채택 성공";
      const isBCompleted = b.status === "채택 성공";

      if (isACompleted && !isBCompleted) return -1;
      if (!isACompleted && isBCompleted) return 1;

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

  // 상태별 건수는 '전체'로 조회했을 때만 정확하므로 그때만 노출한다
  const statusCounts = myQuoteRequests.reduce<Record<string, number>>((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  const countForTab = (value: string) =>
    value === "all" ? myQuoteRequests.length : statusCounts[value] || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-300 text-sm">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <main className="flex-grow w-full pt-16 sm:pt-20">
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white">내 견적 요청</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLoading ? '불러오는 중' : `${filteredRequests.length}건`}
              </p>
            </div>
            <Link
              href="/quote-request"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              새 견적 요청
            </Link>
          </div>

          {/* 상태 탭 - 통계 카드를 겸한다 */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mb-3">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-blue-600 border-blue-500 text-white font-medium'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {/* 상태별로 조회하면 다른 상태의 건수를 알 수 없어 '전체'일 때만 표시 */}
                  {statusFilter === 'all' && (
                    <span className={active ? 'text-blue-100' : 'text-slate-500'}>{countForTab(tab.value)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 검색 · 정렬 툴바 */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="지역 · 시공위치 · 번호 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-800/60 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white text-sm placeholder-slate-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as "date" | "status" | "quotes");
                  setSortOrder(order as "asc" | "desc");
                }}
                className="flex-1 sm:flex-none h-9 px-3 bg-slate-800/60 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm transition-colors"
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
                aria-label="새로고침"
                title="새로고침"
                className="h-9 w-9 flex items-center justify-center bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCwIcon className={`w-4 h-4 text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 오류 안내 */}
          {error && (
            <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-300">
                <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={handleRefresh} className="text-xs text-red-300 underline underline-offset-2 whitespace-nowrap">
                다시 시도
              </button>
            </div>
          )}

          {/* 견적 요청 리스트 */}
          {isLoading ? (
            <div className="space-y-2">
              {/* 스켈레톤 - 목록 높이를 유지해 화면이 튀지 않게 한다 */}
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[104px] bg-slate-800/40 border border-slate-800 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-700 rounded-lg">
              <SearchIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-1">견적 요청이 없습니다</p>
              <p className="text-xs text-slate-500 mb-5">
                {searchTerm || statusFilter !== "all"
                  ? "검색 조건에 맞는 견적 요청이 없습니다."
                  : "첫 번째 견적 요청을 만들어보세요."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link
                  href="/quote-request"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  견적 요청하기
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <li key={request.id}>
                    <Link
                      href={`/quote-request/${request.id}`}
                      className="group block bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/70 rounded-lg px-4 py-3 transition-colors"
                    >
                      {/* 1행: 상태 · 번호 · 답변 수 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">#{request.id}</span>
                        <span className="ml-auto text-xs text-slate-400">
                          답변 <span className="text-blue-400 font-semibold">{request.answerCount}</span>
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>

                      {/* 2행: 제목 */}
                      <h3 className="text-sm font-medium text-white truncate">
                        {removeBrackets(request.buildingType)} {request.constructionLocation}
                      </h3>

                      {/* 특이사항은 한 줄로 줄여 보여주고 상세는 상세 페이지에서 */}
                      {request.specialInfo && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{request.specialInfo}</p>
                      )}

                      {/* 3행: 메타 정보 한 줄 */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                          {request.region}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BuildingIcon className="w-3.5 h-3.5 text-slate-500" />
                          {request.areaSize}㎡
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(request.requestDate)}
                        </span>
                        {request.wallpaper && (
                          <span className="text-slate-500">{removeBrackets(request.wallpaper)}</span>
                        )}
                        {request.status === '검토중' && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // TODO: 수정 기능 구현
                              console.log("수정할 ID:", request.id);
                            }}
                            className="ml-auto inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            수정
                          </button>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
