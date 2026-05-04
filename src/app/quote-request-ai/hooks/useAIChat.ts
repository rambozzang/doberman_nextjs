'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, QuoteSlots, QuickReply, PriceEstimate, ImageAnalysis } from '@/lib/ai/types';
import { getAIEngine } from '@/lib/ai/aiQuoteEngine';

const STORAGE_KEY = 'ai_quote_session';

interface PersistedState {
  messages: ChatMessage[];
  slots: QuoteSlots;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch { return null; }
}

function persist(state: PersistedState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId(): string {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const INITIAL_AI_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'ai',
  text: '안녕하세요! 도배르만 AI 컨시어지예요. 어떤 도배를 계획하고 계세요? 자유롭게 말씀해 주시거나 사진을 올려주셔도 좋아요.',
  quickReplies: undefined,
  timestamp: 0,
};

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_AI_MESSAGE]);
  const [slots, setSlots] = useState<QuoteSlots>({});
  const [isThinking, setIsThinking] = useState(false);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasImageAnalysis, setHasImageAnalysis] = useState(false);

  // 언마운트 시 최신 messages에 접근하기 위한 ref
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // 언마운트 시 모든 첨부 blob URL revoke (메모리 누수 방지)
  useEffect(() => {
    return () => {
      messagesRef.current.forEach((m) => {
        m.attachments?.forEach((a) => {
          if (a.url.startsWith('blob:')) URL.revokeObjectURL(a.url);
        });
      });
    };
  }, []);

  // 로컬스토리지 복원
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted && persisted.messages.length > 0) {
      setMessages(persisted.messages);
      setSlots(persisted.slots);
    }
  }, []);

  // 가격에 영향을 주는 핵심 슬롯이 모두 채워진 후에만 견적 계산.
  // 빈 슬롯 상태에서 임의 기본값으로 가격이 노출되는 것을 방지.
  useEffect(() => {
    const ready =
      !!slots.buildingType &&
      !!(slots.area?.pyeong || slots.area?.squareMeter) &&
      !!(slots.scope && slots.scope.length > 0) &&
      !!slots.wallpaperType;
    if (!ready) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    const engine = getAIEngine();
    engine.estimatePrice(slots).then((est) => {
      if (!cancelled) setEstimate(est);
    });
    return () => { cancelled = true; };
  }, [slots]);

  // 메시지/슬롯 영구화
  useEffect(() => {
    persist({ messages, slots });
  }, [messages, slots]);

  const sendUserText = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    const userMsg: ChatMessage = { id: makeId(), role: 'user', text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsThinking(true);
    try {
      const engine = getAIEngine();
      const res = await engine.chat({ messages: nextMessages, slots, userText: text });
      setMessages([...nextMessages, res.aiMessage]);
      setSlots(res.updatedSlots);
      setIsComplete(res.isComplete);
    } finally {
      setIsThinking(false);
    }
  }, [messages, slots, isThinking]);

  const applyQuickReply = useCallback(async (qr: QuickReply) => {
    if (isThinking) return;
    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: qr.label, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsThinking(true);
    try {
      const engine = getAIEngine();
      const res = await engine.chat({ messages: nextMessages, slots, selectedQuickReply: qr });
      setMessages([...nextMessages, res.aiMessage]);
      setSlots(res.updatedSlots);
      setIsComplete(res.isComplete);
    } finally {
      setIsThinking(false);
    }
  }, [messages, slots, isThinking]);

  const uploadImage = useCallback(async (file: File): Promise<ImageAnalysis | null> => {
    if (isThinking) return null;
    const previewUrl = URL.createObjectURL(file);
    const userMsg: ChatMessage = {
      id: makeId(), role: 'user', text: '사진을 업로드했어요',
      attachments: [{ type: 'image', url: previewUrl }], timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    try {
      const engine = getAIEngine();
      const analysis = await engine.analyzeImage(file);
      const next: QuoteSlots = {
        ...slots,
        area: { ...(slots.area ?? {}), pyeong: slots.area?.pyeong ?? analysis.estimatedPyeong },
        scope: slots.scope ?? (analysis.detectedScope ? [analysis.detectedScope] : undefined),
        wallpaperType: slots.wallpaperType ?? analysis.recommendedWallpaper,
      };
      const aiMsg: ChatMessage = {
        id: makeId(), role: 'ai',
        text: `🤖 이미지 분석 완료\n${analysis.notes}\n\n분석 결과를 우측 견적에 반영했어요. 추가로 알려주실 정보 있으세요?`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setSlots(next);
      setHasImageAnalysis(true);
      return analysis;
    } finally {
      setIsThinking(false);
    }
  }, [slots, isThinking]);

  const reset = useCallback(() => {
    // reset 시 첨부 blob URL revoke (메모리 누수 방지)
    messagesRef.current.forEach((m) => {
      m.attachments?.forEach((a) => {
        if (a.url.startsWith('blob:')) URL.revokeObjectURL(a.url);
      });
    });
    setMessages([INITIAL_AI_MESSAGE]);
    setSlots({});
    setEstimate(null);
    setIsComplete(false);
    setHasImageAnalysis(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    messages, slots, isThinking, estimate, isComplete, hasImageAnalysis,
    sendUserText, applyQuickReply, uploadImage, reset,
  };
}
