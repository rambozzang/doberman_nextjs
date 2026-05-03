'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Layers, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthManager } from '@/lib/auth';
import { CustomerRequestService } from '@/services/customerRequestService';
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

  useEffect(() => {
    setUser(AuthManager.getUserInfo());
  }, []);

  // user 상태 변수는 향후 사용자 정보 표시 확장을 위해 유지
  void user;

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
      toast.error('견적 신청을 위해 로그인이 필요합니다.', { position: 'top-center' });
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
    </div>
  );
}
