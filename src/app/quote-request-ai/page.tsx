'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Layers, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthManager } from '@/lib/auth';
import { CustomerRequestService } from '@/services/customerRequestService';
import SocialAuthService from '@/services/socialAuthService';
import type { UserInfo } from '@/types/api';
import { useAIChat } from './hooks/useAIChat';
import ChatPanel from './components/ChatPanel';
import LiveQuotePanel from './components/LiveQuotePanel';
import BottomSheet from './components/BottomSheet';
import AIBackground from './components/AIBackground';
import CompletionScreen from './components/CompletionScreen';
import { slotsToCustomerRequest } from '@/lib/ai/slotsMapper';
import type { PackageOption } from '@/lib/ai/types';
import { formatPriceShort } from '@/lib/ai/priceCalculator';

// localStorage 키
const AI_PENDING_SUBMIT_KEY = 'ai_quote_pending_submit';
const AI_PENDING_META_KEY = 'ai_quote_pending_meta';

interface PendingMeta {
  matchConfidence: number;
  selectedPackage: 'budget' | 'standard' | 'premium';
  hasImageAnalysis: boolean;
}

export default function QuoteRequestAIPage() {
  const router = useRouter();
  const {
    messages, slots, isThinking, estimate, isComplete, hasImageAnalysis,
    sendUserText, applyQuickReply, uploadImage, reset,
  } = useAIChat();

  const [selectedPackage, setSelectedPackage] = useState<PackageOption['id']>('standard');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  useEffect(() => {
    setUser(AuthManager.getUserInfo());
  }, []);

  // user 상태 변수는 향후 사용자 정보 표시 확장을 위해 유지
  void user;

  // slots 복원 후 pending submit 자동 처리 (소셜 로그인 후 돌아왔을 때)
  const autoSubmitTriedRef = useRef(false);
  useEffect(() => {
    if (autoSubmitTriedRef.current) return;
    if (Object.keys(slots).length === 0) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(AI_PENDING_SUBMIT_KEY) !== 'true') return;
    autoSubmitTriedRef.current = true;

    const run = async () => {
      if (!AuthManager.isLoggedIn()) return;
      const currentUser = AuthManager.getUserInfo();
      if (!currentUser) return;

      const metaRaw = localStorage.getItem(AI_PENDING_META_KEY);
      if (!metaRaw) {
        localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
        return;
      }
      let meta: PendingMeta;
      try {
        meta = JSON.parse(metaRaw) as PendingMeta;
      } catch {
        localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
        localStorage.removeItem(AI_PENDING_META_KEY);
        return;
      }

      setIsAutoSubmitting(true);
      toast.loading('AI 견적 신청을 처리 중입니다...', { id: 'ai-auto-submit', position: 'top-center' });
      try {
        const payload = slotsToCustomerRequest(slots, currentUser, meta);
        const res = await CustomerRequestService.createCustomerRequest(payload);
        toast.dismiss('ai-auto-submit');
        if (res.success) {
          toast.success('AI 견적 신청이 완료되었습니다!', { position: 'top-center' });
          setSubmitted(true);
        } else {
          toast.error(res.message ?? '신청 중 오류가 발생했습니다.', { position: 'top-center' });
        }
      } catch (e) {
        console.error(e);
        toast.dismiss('ai-auto-submit');
        toast.error('신청 중 오류가 발생했습니다.', { position: 'top-center' });
      } finally {
        localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
        localStorage.removeItem(AI_PENDING_META_KEY);
        setIsAutoSubmitting(false);
      }
    };
    void run();
  }, [slots]);

  // 소셜 로그인 팝업으로부터 메시지 수신
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        event.data?.type === 'KAKAO_LOGIN_SUCCESS' ||
        event.data?.type === 'NAVER_LOGIN_SUCCESS' ||
        event.data?.type === 'GOOGLE_LOGIN_SUCCESS'
      ) {
        toast.success('로그인이 완료되었습니다!', { position: 'top-center', duration: 1500 });
        setShowLoginModal(false);
        setUser(AuthManager.getUserInfo());

        if (typeof window === 'undefined') return;
        const pending = localStorage.getItem(AI_PENDING_SUBMIT_KEY) === 'true';
        if (!pending) return;
        const currentUser = AuthManager.getUserInfo();
        if (!currentUser) return;

        const metaRaw = localStorage.getItem(AI_PENDING_META_KEY);
        if (!metaRaw) {
          localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
          return;
        }
        let meta: PendingMeta;
        try {
          meta = JSON.parse(metaRaw) as PendingMeta;
        } catch {
          localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
          localStorage.removeItem(AI_PENDING_META_KEY);
          return;
        }

        setIsAutoSubmitting(true);
        toast.loading('AI 견적 신청을 처리 중입니다...', { id: 'ai-auto-submit-msg', position: 'top-center' });
        try {
          const payload = slotsToCustomerRequest(slots, currentUser, meta);
          const res = await CustomerRequestService.createCustomerRequest(payload);
          toast.dismiss('ai-auto-submit-msg');
          if (res.success) {
            toast.success('AI 견적 신청이 완료되었습니다!', { position: 'top-center' });
            setSubmitted(true);
          } else {
            toast.error(res.message ?? '신청 중 오류가 발생했습니다.', { position: 'top-center' });
          }
        } catch (e) {
          console.error(e);
          toast.dismiss('ai-auto-submit-msg');
          toast.error('신청 중 오류가 발생했습니다.', { position: 'top-center' });
        } finally {
          localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
          localStorage.removeItem(AI_PENDING_META_KEY);
          setIsAutoSubmitting(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slots, selectedPackage, hasImageAnalysis]);

  const handleResetClick = () => {
    // 처음 시작 상태(빈 슬롯 + 초기 메시지 1개) 면 확인 없이 바로 초기화
    const hasProgress = messages.length > 1 || Object.keys(slots).length > 0;
    if (!hasProgress) {
      reset();
      return;
    }
    setResetDialogOpen(true);
  };

  const performReset = () => {
    reset();
    setResetDialogOpen(false);
    toast.success('처음부터 다시 시작합니다.', { position: 'top-center', duration: 1500 });
  };

  const handleSubmit = async () => {
    if (!estimate) return;
    const currentUser = AuthManager.getUserInfo();
    if (!AuthManager.isLoggedIn() || !currentUser) {
      // 슬롯/메시지는 useAIChat이 ai_quote_session에 이미 저장 중
      // AI 메타만 추가 저장
      if (typeof window !== 'undefined' && estimate) {
        const meta: PendingMeta = {
          matchConfidence: estimate.matchConfidence,
          selectedPackage,
          hasImageAnalysis,
        };
        localStorage.setItem(AI_PENDING_META_KEY, JSON.stringify(meta));
        localStorage.setItem(AI_PENDING_SUBMIT_KEY, 'true');
      }
      setShowLoginModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = slotsToCustomerRequest(slots, currentUser, {
        matchConfidence: estimate.matchConfidence,
        selectedPackage,
        hasImageAnalysis,
      });
      const res = await CustomerRequestService.createCustomerRequest(payload);
      if (res.success) {
        toast.success('AI 견적 신청이 완료되었습니다!', { position: 'top-center' });
        setSubmitted(true);
      } else {
        toast.error(res.message ?? '신청 중 오류가 발생했습니다.', { position: 'top-center' });
      }
    } catch (e) {
      console.error(e);
      toast.error('신청 중 오류가 발생했습니다.', { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <CompletionScreen
          onGoHome={() => router.push('/')}
          onReset={() => { setSubmitted(false); reset(); }}
        />
      </div>
    );
  }

  const summaryPrice = estimate
    ? `${formatPriceShort(estimate.min)} ~ ${formatPriceShort(estimate.max)}`
    : '분석 중';

  return (
    <div className="relative flex flex-col min-h-screen pt-16">
      <AIBackground />

      <header className="relative z-10 px-4 py-3 border-b border-slate-800 bg-slate-900/40 backdrop-blur">
        <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                도배르만 AI 컨시어지
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">NEW</span>
              </div>
              <div className="text-xs text-slate-400">자연어 · 사진 · 음성으로 도배 견적</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {estimate && (
              <div className="hidden md:flex items-center gap-2 text-xs">
                <span className="text-slate-400">매칭 신뢰도</span>
                <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${estimate.matchConfidence}%` }}
                  />
                </div>
                <span className="text-emerald-300 font-semibold tabular-nums">{estimate.matchConfidence}%</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleResetClick}
              aria-label="처음부터 다시"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">처음부터</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 container mx-auto max-w-7xl px-2 md:px-4 py-3 md:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-160px)]">
          <div className="lg:col-span-3 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-800 overflow-hidden">
            <ChatPanel
              messages={messages}
              isThinking={isThinking}
              onSendText={sendUserText}
              onUploadImage={uploadImage}
              onQuickReply={applyQuickReply}
            />
          </div>
          <aside className="hidden lg:block lg:col-span-2 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-800 overflow-hidden">
            <LiveQuotePanel
              slots={slots}
              estimate={estimate}
              isComplete={isComplete}
              isSubmitting={isSubmitting}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
              onSubmit={handleSubmit}
            />
          </aside>
        </div>
      </main>

      {/* 모바일 하단 견적 보기 버튼 */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden p-3 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full py-3 rounded-2xl bg-slate-900/90 border border-emerald-400/30 backdrop-blur flex items-center justify-between px-4 shadow-xl shadow-emerald-500/10"
        >
          <span className="flex items-center gap-2 text-white text-sm">
            <Layers className="w-4 h-4 text-emerald-300" />
            견적 보기
          </span>
          <span className="text-emerald-300 text-sm font-bold tabular-nums">{summaryPrice}</span>
        </button>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="실시간 견적">
        <LiveQuotePanel
          slots={slots}
          estimate={estimate}
          isComplete={isComplete}
          isSubmitting={isSubmitting}
          selectedPackage={selectedPackage}
          onSelectPackage={setSelectedPackage}
          onSubmit={() => {
            setSheetOpen(false);
            void handleSubmit();
          }}
        />
      </BottomSheet>

      {/* 초기화 확인 다이얼로그 */}
      <AnimatePresence>
        {resetDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setResetDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="text-white font-bold text-lg">처음부터 다시 시작</h3>
              </div>
              <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                지금까지 입력하신 내용이 모두 사라지고<br />
                새로 견적을 시작합니다. 계속할까요?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetDialogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={performReset}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-white font-bold transition shadow-lg shadow-emerald-500/30"
                >
                  네, 초기화
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 소셜 로그인 모달 */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl shadow-black/50"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">간편 로그인 후 신청 완료</h3>
                <p className="text-slate-300 text-xs">
                  지금까지 입력하신 견적 정보가 그대로 자동 신청됩니다.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await SocialAuthService.initiateKakaoLogin();
                    } catch (error) {
                      console.error('Kakao 로그인 시작 오류:', error);
                      const errorMessage = error instanceof Error ? error.message : '';
                      if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                        toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', { duration: 3000, position: 'top-center' });
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  카카오로 시작하기
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await SocialAuthService.initiateNaverLogin();
                    } catch (error) {
                      console.error('Naver 로그인 시작 오류:', error);
                      const errorMessage = error instanceof Error ? error.message : '';
                      if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                        toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', { duration: 3000, position: 'top-center' });
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#03C75A] hover:bg-[#02B350] text-white font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  네이버로 시작하기
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await SocialAuthService.initiateGoogleLogin();
                    } catch (error) {
                      console.error('Google 로그인 시작 오류:', error);
                      const errorMessage = error instanceof Error ? error.message : '';
                      if (errorMessage.includes('팝업') || errorMessage.includes('차단')) {
                        toast.error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', { duration: 3000, position: 'top-center' });
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-300"
                >
                  Google로 시작하기
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  // 사용자가 닫으면 pending도 정리
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(AI_PENDING_SUBMIT_KEY);
                    localStorage.removeItem(AI_PENDING_META_KEY);
                  }
                }}
                className="w-full mt-3 py-2 text-slate-400 hover:text-slate-200 text-xs transition"
              >
                나중에 하기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 자동 제출 처리 중 오버레이 */}
      {isAutoSubmitting && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-white text-sm">AI 견적 신청 처리 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
