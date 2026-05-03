import type {
  AIQuoteEngine, ChatInput, ChatResponse, ChatMessage,
  ImageAnalysis, PriceEstimate, QuoteSlots,
} from './types';
import { extractSlots, nextMissingSlot } from './nlu';
import { calculatePrice } from './priceCalculator';
import { MockAIEngine } from './mockAIEngine';
import {
  BUILDING_TYPE_REPLIES, AREA_REPLIES, SCOPE_REPLIES,
  WALLPAPER_REPLIES, ADDITIONAL_REPLIES, ALL_REGION_REPLIES,
  VISIT_DATE_REPLIES, ROOM_COUNT_REPLIES, getDistrictReplies,
} from './data/quickReplies';

const QUESTION_BY_SLOT: Record<string, { text: string; replies: typeof BUILDING_TYPE_REPLIES }> = {
  buildingType: { text: '어떤 건물 도배를 계획하고 계세요?', replies: BUILDING_TYPE_REPLIES },
  area:         { text: '시공 면적은 어느 정도세요? (예: 24평, 32평)', replies: AREA_REPLIES },
  scope:        { text: '어느 공간을 시공하실 계획이에요?', replies: SCOPE_REPLIES },
  roomCount:    { text: '방은 몇 개 시공하시나요?', replies: ROOM_COUNT_REPLIES },
  wallpaperType:{ text: '벽지 종류 선호하는 게 있으세요?', replies: WALLPAPER_REPLIES },
  region:       { text: '시공 지역(시·도)을 알려주세요.', replies: ALL_REGION_REPLIES },
  additionalRequest: { text: '추가로 필요하신 서비스 있으세요?', replies: ADDITIONAL_REPLIES },
  visitDate:    { text: '방문 희망일이 있으세요?', replies: VISIT_DATE_REPLIES },
};

const SYSTEM_PROMPT = `당신은 한국 도배 시공 견적 컨시어지 AI입니다. 사용자의 자유 발화에서 도배 견적에 필요한 슬롯을 추출하고, 다음 부족한 정보를 자연스러운 한국어로 묻습니다.

추출 대상 슬롯 (있으면 채우고, 모르면 비움):
- buildingType: 'apartment'|'villa'|'officetel'|'house'|'office'|'commercial'|'other'
- scope: ('living-room'|'room'|'kitchen'|'bathroom'|'all-rooms')[]
- roomCount: 정수 (방 개수)
- area: { pyeong: 숫자, squareMeter?: 숫자 }
- wallpaperType: 'vinyl'|'silk-vinyl'|'fabric'|'natural'|'premium'
- additionalRequest: ('furniture-move'|'old-removal'|'wall-repair'|'quick-service')[]
- visitDate: 자연어 날짜
- region: 시도 ID ('seoul'|'busan'|'daegu'|'incheon'|'gwangju'|'daejeon'|'ulsan'|'sejong'|'gyeonggi'|'gangwon'|'chungbuk'|'chungnam'|'jeonbuk'|'jeonnam'|'gyeongbuk'|'gyeongnam'|'jeju')
- district: 시군구 ID

반드시 다음 JSON 형식으로만 응답:
{
  "slots": { /* 누적된 슬롯 (이전 슬롯 + 이번에 추출된 것 병합) */ },
  "reply": "사용자에게 보여줄 다음 질문 또는 안내 (1~3문장, 친근한 한국어, 가능하면 예제 포함)",
  "complete": false
}

모든 필수 슬롯이 다 채워지면 complete: true 로 응답하고 reply는 "정보가 모두 모였어요. 우측 견적 확인 후 신청 버튼을 눌러주세요." 같은 안내.`;

function makeId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface QwenResponse {
  slots?: QuoteSlots;
  reply?: string;
  complete?: boolean;
}

export class QwenEngine implements AIQuoteEngine {
  private fallback = new MockAIEngine();

  async chat(input: ChatInput): Promise<ChatResponse> {
    // 사용자 입력이 없으면 (초기 호출) Mock 흐름 사용
    if (!input.userText && !input.selectedQuickReply) {
      return this.fallback.chat(input);
    }

    // 빠른답변 칩 클릭은 Mock 으로 (단순 슬롯 세팅)
    if (input.selectedQuickReply) {
      return this.fallback.chat(input);
    }

    // 자유 텍스트는 Qwen LLM으로
    try {
      const conversationHistory = input.messages
        .slice(-6) // 최근 6개만 전달 (토큰 절약)
        .map((m) => ({
          role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
          content: m.text,
        }));

      const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: `현재 슬롯: ${JSON.stringify(input.slots)}` },
        ...conversationHistory,
        { role: 'user' as const, content: input.userText ?? '' },
      ];

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          temperature: 0.3,
          responseFormat: 'json',
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: { content?: string; error?: string } = await res.json();
      if (data.error || !data.content) throw new Error(data.error ?? 'empty content');

      // JSON 파싱 (LLM이 코드블록을 감쌀 수 있어 안전 파싱)
      const jsonText = this.extractJson(data.content);
      const parsed: QwenResponse = JSON.parse(jsonText);

      const updatedSlots: QuoteSlots = {
        ...input.slots,
        ...(parsed.slots ?? {}),
        // 텍스트 NLU도 추가로 적용해 보강 (LLM이 놓친 슬롯 보충)
        ...extractSlots(input.userText ?? '', { ...input.slots, ...(parsed.slots ?? {}) }),
      };

      const isComplete = parsed.complete ?? !nextMissingSlot(updatedSlots);

      // 다음 슬롯의 빠른답변 칩을 함께 제공 (district는 동적)
      const next = nextMissingSlot(updatedSlots);
      let quickReplies = undefined;
      if (next === 'district' && updatedSlots.region) {
        quickReplies = getDistrictReplies(updatedSlots.region);
      } else if (next && QUESTION_BY_SLOT[next]) {
        quickReplies = QUESTION_BY_SLOT[next].replies;
      }

      const aiMessage: ChatMessage = {
        id: makeId(),
        role: 'ai',
        text: parsed.reply ?? '계속 알려주세요.',
        quickReplies,
        timestamp: Date.now(),
      };

      return { aiMessage, updatedSlots, isComplete };
    } catch (err) {
      console.warn('Qwen 호출 실패, Mock 폴백:', err);
      return this.fallback.chat(input);
    }
  }

  async analyzeImage(file: File): Promise<ImageAnalysis> {
    // 이미지 분석은 일단 Mock 사용 (Qwen-VL 별도 작업 시 교체)
    return this.fallback.analyzeImage(file);
  }

  async estimatePrice(slots: QuoteSlots): Promise<PriceEstimate> {
    // 가격 계산은 클라이언트 룰로 일관 유지
    return Promise.resolve(calculatePrice(slots));
  }

  private extractJson(text: string): string {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return m[1].trim();
    const idx = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (idx >= 0 && last > idx) return text.slice(idx, last + 1);
    return text.trim();
  }
}
