"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  FileTextIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  PhoneIcon,
  MailIcon,
  RefreshCwIcon,
  StarIcon,
  XIcon,
  MessageSquareIcon,
  AlertTriangleIcon
} from "lucide-react";
import Link from "next/link";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CustomerRequest, CustomerRequestAnswer } from "@/types/api";
import { toast } from "react-hot-toast";
import { ChatModal, useChatLogic } from "@/components/chat";

// 상태 매핑 설정 (목록 페이지와 동일한 톤)
const statusConfig = {
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

// 문자열에서 대괄호 제거
const removeBrackets = (str: string | null | undefined) => (str ? str.replace(/[[\]]/g, '') : '');

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** 정보 카드의 라벨/값 한 줄 */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <dt className="text-xs text-slate-400 flex-shrink-0">{label}</dt>
    <dd className="text-xs text-white text-right break-words">{value || '-'}</dd>
  </div>
);

export default function QuoteRequestDetailPage() {
  const params = useParams();
  const [customerRequest, setCustomerRequest] = useState<CustomerRequest | null>(null);
  const [answers, setAnswers] = useState<CustomerRequestAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswersLoading, setIsAnswersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 채택 확인 모달 상태
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<CustomerRequestAnswer | null>(null);
  const [isAdopting, setIsAdopting] = useState(false);

  // 채팅 상태
  const [currentChatPartner, setCurrentChatPartner] = useState<CustomerRequestAnswer | undefined>(undefined);
  const [shouldOpenChat, setShouldOpenChat] = useState(false);

  // ID 파라미터 추출
  const requestId = typeof params.id === 'string' ? parseInt(params.id) : null;

  // 채팅 로직 사용
  const {
    isOpen: isChatOpen,
    openChat,
    closeChat,
    newMessage,
    isLoading: isChatLoading,
    isLoadingMore: isChatLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    isConnected,
    partnerTyping,
    uploadingFile,
    messagesEndRef,
    sendMessage,
    uploadFile,
    handleMessageChange,
    handleKeyPress,
    messages: chatMessages,
    observeMessage,
    unobserveMessage
  } = useChatLogic(currentChatPartner, customerRequest?.id);

  // 답변 리스트 로딩
  const loadAnswers = useCallback(async () => {
    if (!requestId) return;

    setIsAnswersLoading(true);

    try {
      const response = await CustomerRequestService.getAnswerList(requestId);

      if (response.success && response.data) {
        setAnswers(response.data);
      } else {
        console.error("답변 리스트 로딩 실패:", response.error);
      }
    } catch (error) {
      console.error("답변 리스트 API 호출 오류:", error);
    } finally {
      setIsAnswersLoading(false);
    }
  }, [requestId]);

  // 데이터 로딩
  const loadCustomerRequest = useCallback(async () => {
    if (!requestId) {
      setError("잘못된 요청 ID입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await CustomerRequestService.getDetail(requestId);

      if (response.success && response.data) {
        setCustomerRequest(response.data);
        setError(null);
        // 상세 정보 로딩 후 답변 리스트도 로딩
        loadAnswers();
      } else {
        setError(response.error || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("API 호출 오류:", error);
      setError("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [requestId, loadAnswers]);

  useEffect(() => {
    loadCustomerRequest();
  }, [loadCustomerRequest]);

  // 채팅 파트너가 설정되고 채팅을 열어야 할 때 처리
  useEffect(() => {
    if (shouldOpenChat && currentChatPartner) {
      openChat();
      setShouldOpenChat(false);
    }
  }, [currentChatPartner, shouldOpenChat, openChat]);

  const handleRefresh = () => {
    loadCustomerRequest();
    loadAnswers();
  };

  const handleStartChat = (answer: CustomerRequestAnswer) => {
    setCurrentChatPartner(answer);
    setShouldOpenChat(true);
  };

  // 채택하기 버튼 클릭
  const handleAdoptClick = (answer: CustomerRequestAnswer) => {
    setSelectedAnswer(answer);
    setShowAdoptModal(true);
  };

  // 채택 확인
  const handleAdoptConfirm = async () => {
    if (!selectedAnswer || !requestId) return;

    setIsAdopting(true);

    try {
      const answerId = selectedAnswer.answerId || selectedAnswer.id;
      if (!answerId) {
        throw new Error("답변 ID를 찾을 수 없습니다.");
      }

      const response = await CustomerRequestService.adoptAnswer(requestId, answerId);

      if (response.success) {
        const adopted = selectedAnswer;
        toast.success(response.data?.message || "채택되었습니다. 이제 전문가와 바로 대화할 수 있어요.");
        setShowAdoptModal(false);
        setSelectedAnswer(null);

        loadCustomerRequest();
        loadAnswers();

        // 채택 직후 대화를 바로 열어준다 (채택의 목적이 곧 상담이므로)
        handleStartChat(adopted);
      } else {
        throw new Error(response.error || "채택 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("채택 처리 오류:", error);
      toast.error(error instanceof Error ? error.message : "채택 처리에 실패했습니다.");
    } finally {
      setIsAdopting(false);
    }
  };

  // 채택 취소
  const handleAdoptCancel = () => {
    setShowAdoptModal(false);
    setSelectedAnswer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pt-16 sm:pt-20">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-3">
          {/* 스켈레톤 - 실제 레이아웃과 비슷한 높이로 화면이 튀지 않게 한다 */}
          <div className="h-12 bg-slate-800/40 rounded-lg animate-pulse"></div>
          <div className="h-44 bg-slate-800/40 rounded-lg animate-pulse"></div>
          <div className="h-28 bg-slate-800/40 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !customerRequest) {
    return (
      <div className="min-h-screen bg-slate-900 pt-16 sm:pt-20">
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <div className="text-center py-16 border border-dashed border-slate-700 rounded-lg">
            <FileTextIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-300 mb-1">견적 요청을 찾을 수 없습니다</p>
            <p className="text-xs text-slate-500 mb-5">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                <RefreshCwIcon className="w-4 h-4" />
                다시 시도
              </button>
              <Link
                href="/quote-request/my-quotes"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                목록으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConf = statusConfig[customerRequest.status as keyof typeof statusConfig] || {
    label: customerRequest.status || "기타",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    textColor: "text-slate-400",
    icon: AlertCircleIcon
  };
  const StatusIcon = statusConf.icon;

  const isAdoptedRequest = customerRequest.status === "채택 성공";
  const isUnderReview = customerRequest.status === "검토중";
  const areaLabel = customerRequest.area
    ? `${customerRequest.area}평 (${customerRequest.areaSize}㎡)`
    : `${customerRequest.areaSize}㎡`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <main className="flex-grow w-full pt-16 sm:pt-20">
        <div className="mx-auto w-full max-w-4xl px-4 py-6">

          {/* 페이지 헤더 */}
          <div className="flex items-start gap-3 mb-4">
            <Link
              href="/quote-request/my-quotes"
              aria-label="목록으로"
              className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-8 h-8 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Link>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
                {removeBrackets(customerRequest.buildingType)} {removeBrackets(customerRequest.constructionLocation)}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-mono">#{customerRequest.id}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                {formatDate(customerRequest.requestDate)}
              </p>
            </div>

            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${statusConf.bgColor} ${statusConf.textColor}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConf.label}
            </span>

            <button
              onClick={handleRefresh}
              aria-label="새로고침"
              title="새로고침"
              className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-8 h-8 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCwIcon className={`w-4 h-4 text-slate-400 ${isAnswersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 요청 정보 · 고객 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <section className="md:col-span-2 bg-slate-800/40 border border-slate-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-white mb-2">요청 정보</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y divide-slate-800/70 sm:divide-y-0">
                <div className="sm:divide-y sm:divide-slate-800/70">
                  <InfoRow label="건물 유형" value={removeBrackets(customerRequest.buildingType)} />
                  <InfoRow label="시공 위치" value={removeBrackets(customerRequest.constructionLocation)} />
                  <InfoRow label="면적" value={areaLabel} />
                  <InfoRow label="벽지 종류" value={removeBrackets(customerRequest.wallpaper)} />
                </div>
                <div className="sm:divide-y sm:divide-slate-800/70">
                  <InfoRow label="지역" value={customerRequest.region} />
                  <InfoRow label="짐 보관" value={customerRequest.hasItems} />
                  <InfoRow label="천장 시공" value={customerRequest.ceiling} />
                  <InfoRow label="선호 일정" value={customerRequest.preferredDate} />
                </div>
              </dl>

              {customerRequest.specialInfo && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">특이사항</p>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{customerRequest.specialInfo}</p>
                </div>
              )}
            </section>

            <section className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-white mb-2">고객 정보</h2>
              <dl className="divide-y divide-slate-800/70">
                <InfoRow label="이름" value={customerRequest.customerName} />
                <InfoRow
                  label="전화번호"
                  value={
                    customerRequest.customerPhone ? (
                      <a href={`tel:${customerRequest.customerPhone}`} className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300">
                        <PhoneIcon className="w-3 h-3" />
                        {customerRequest.customerPhone}
                      </a>
                    ) : null
                  }
                />
                <InfoRow
                  label="이메일"
                  value={
                    customerRequest.customerEmail ? (
                      <a href={`mailto:${customerRequest.customerEmail}`} className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 break-all">
                        <MailIcon className="w-3 h-3 flex-shrink-0" />
                        {customerRequest.customerEmail}
                      </a>
                    ) : null
                  }
                />
              </dl>
            </section>
          </div>

          {/* 답변 섹션 */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-sm font-medium text-white">
                받은 답변 <span className="text-blue-400">{answers.length}</span>
              </h2>
              {isUnderReview && answers.length > 0 && (
                <span className="text-xs text-slate-500">한 곳을 채택하면 대화가 열립니다</span>
              )}
            </div>

            {/* 주의사항 - 답변마다 반복하지 않고 섹션에 한 번만 노출 */}
            {answers.length > 0 && (
              <p className="flex items-start gap-1.5 mb-3 px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-lg text-xs text-amber-200/80">
                <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                추가 요청사항에 따라 비용이 변동될 수 있습니다 (주차비, 인력 추가 투입 등).
              </p>
            )}

            {isAnswersLoading && answers.length === 0 ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 bg-slate-800/40 border border-slate-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : answers.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-slate-700 rounded-lg">
                <MessageSquareIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-1">아직 답변이 없습니다</p>
                <p className="text-xs text-slate-500">업체들의 견적 답변을 기다리고 있습니다.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {answers.map((answer, index) => {
                  // 기존 판정 조건을 그대로 유지 (서버가 '채택' / '채택 성공' 을 섞어 쓴다)
                  const isAdopted = isAdoptedRequest && answer.status === '채택 성공';
                  const canAdopt = isUnderReview && answer.status !== '채택';
                  const expertName =
                    answer.userName || answer.user?.userName || answer.webCustomer?.customerName || "익명";
                  const contact = answer.companyPhone || answer.userPhone;

                  return (
                    <li
                      key={answer.answerId || answer.id || index}
                      className={`rounded-lg border p-4 transition-colors ${
                        isAdopted
                          ? 'bg-emerald-500/[0.07] border-emerald-500/30'
                          : 'bg-slate-800/40 border-slate-800'
                      }`}
                    >
                      {/* 상단: 전문가 · 배지 · 시각 */}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-2">
                        <span className="inline-flex items-center gap-1 text-sm text-white font-medium">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          {expertName}
                        </span>
                        {answer.companyName && (
                          <span className="text-xs text-blue-400">{answer.companyName}</span>
                        )}
                        {isAdopted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-300">
                            <CheckCircleIcon className="w-3 h-3" />
                            채택됨
                          </span>
                        )}
                        {answer.createdDt && (
                          <span className="ml-auto text-xs text-slate-500">{formatDateTime(answer.createdDt)}</span>
                        )}
                      </div>

                      {/* 제목 · 본문 */}
                      <h3 className="text-sm font-medium text-white mb-1">
                        {answer.answerTitle || "견적서 보내드립니다."}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {answer.answerBody || "서비스 내용이 아직 입력되지 않았습니다."}
                      </p>

                      {/* 하단: 금액 · 액션 */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                        {answer.cost != null && (
                          <div className="mr-auto">
                            <span className="text-xs text-slate-400">견적 </span>
                            <span className="text-base font-semibold text-blue-400">
                              {answer.cost.toLocaleString()}원
                            </span>
                          </div>
                        )}

                        {isAdopted && contact && (
                          <a
                            href={`tel:${contact}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors"
                          >
                            <PhoneIcon className="w-3.5 h-3.5" />
                            {contact}
                          </a>
                        )}

                        {isAdopted && (
                          <button
                            onClick={() => handleStartChat(answer)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition-colors"
                          >
                            <MessageSquareIcon className="w-3.5 h-3.5" />
                            대화하기
                          </button>
                        )}

                        {canAdopt && (
                          <button
                            onClick={() => handleAdoptClick(answer)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
                          >
                            <StarIcon className="w-3.5 h-3.5" />
                            채택하기
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      {/* 채택 확인 모달 */}
      {showAdoptModal && selectedAnswer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">답변 채택</h3>
              <button
                onClick={handleAdoptCancel}
                aria-label="닫기"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-white mb-1">
                {selectedAnswer.answerTitle || "제목 없음"}
              </h4>
              <div className="flex items-center flex-wrap gap-x-1.5 text-xs text-slate-400">
                <span>{selectedAnswer.userName || selectedAnswer.user?.userName || selectedAnswer.webCustomer?.customerName || "익명"}</span>
                {selectedAnswer.companyName && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-blue-400">{selectedAnswer.companyName}</span>
                  </>
                )}
                {selectedAnswer.cost != null && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400 font-semibold">{selectedAnswer.cost.toLocaleString()}원</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-200 mb-1">이 전문가를 채택할까요?</p>
            <p className="text-xs text-slate-400 mb-5">채택하면 바로 대화창이 열립니다.</p>

            <div className="flex gap-2">
              <button
                onClick={handleAdoptCancel}
                disabled={isAdopting}
                className="flex-1 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleAdoptConfirm}
                disabled={isAdopting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {isAdopting ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    처리중
                  </span>
                ) : (
                  "채택하기"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 모달 */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
        chatPartner={currentChatPartner}
        messages={chatMessages}
        newMessage={newMessage}
        onMessageChange={handleMessageChange}
        onSendMessage={sendMessage}
        onKeyPress={handleKeyPress}
        onFileUpload={uploadFile}
        isLoading={isChatLoading}
        isConnected={isConnected}
        connectionError={null}
        isTyping={partnerTyping}
        uploadingFile={uploadingFile}
        messagesEndRef={messagesEndRef}
        observeMessage={observeMessage}
        unobserveMessage={unobserveMessage}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isChatLoadingMore}
        onLoadMore={loadMoreMessages}
      />
    </div>
  );
}
