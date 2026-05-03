import type {
  AIQuoteEngine, ChatInput, ChatResponse, ChatMessage,
  ImageAnalysis, PriceEstimate, QuoteSlots, QuickReply,
} from './types';
import { extractSlots, nextMissingSlot } from './nlu';
import { calculatePrice } from './priceCalculator';
import {
  BUILDING_TYPE_REPLIES, AREA_REPLIES, SCOPE_REPLIES,
  WALLPAPER_REPLIES, ADDITIONAL_REPLIES, POPULAR_REGION_REPLIES,
  ALL_REGION_REPLIES,
  VISIT_DATE_REPLIES,
  ROOM_COUNT_REPLIES,
  getDistrictReplies,
} from './data/quickReplies';

const QUESTION_BY_SLOT: Record<string, { text: string; replies: QuickReply[] }> = {
  buildingType: { text: '어떤 건물 도배를 계획하고 계세요?', replies: BUILDING_TYPE_REPLIES },
  area:         { text: '시공 면적은 어느 정도세요? (자유롭게 입력해도 됩니다)', replies: AREA_REPLIES },
  scope:        { text: '어느 공간을 시공하실 계획이에요? (여러 개 선택 가능)', replies: SCOPE_REPLIES },
  roomCount:    { text: '방은 몇 개를 시공하실 계획이세요?', replies: ROOM_COUNT_REPLIES },
  wallpaperType:{ text: '벽지 종류 선호하는 게 있으세요?', replies: WALLPAPER_REPLIES },
  region:       { text: '시공 지역(시·도) 알려주세요. 직접 입력해도 좋아요.', replies: ALL_REGION_REPLIES },
  // district는 동적이므로 chat() 내에서 처리
  additionalRequest: { text: '추가로 필요하신 서비스가 있으세요?', replies: ADDITIONAL_REPLIES },
  visitDate:    { text: '방문 희망일이 있으세요?', replies: VISIT_DATE_REPLIES },
};

function makeId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function applyQuickReplyToSlots(slots: QuoteSlots, qr: QuickReply): QuoteSlots {
  const next: QuoteSlots = { ...slots };
  if (qr.value === '__skip__') {
    if (qr.field === 'additionalRequest') next.additionalRequest = next.additionalRequest ?? [];
    if (qr.field === 'visitDate') next.visitDate = '협의 가능';
    return next;
  }
  switch (qr.field) {
    case 'buildingType':
      next.buildingType = qr.value as QuoteSlots['buildingType'];
      break;
    case 'area':
      next.area = { ...(next.area ?? {}), pyeong: parseFloat(qr.value) };
      break;
    case 'scope': {
      const v = qr.value as NonNullable<QuoteSlots['scope']>[number];
      if (v === 'all-rooms') next.scope = ['all-rooms'];
      else {
        const cur = (next.scope ?? []).filter((s) => s !== 'all-rooms');
        next.scope = cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v];
      }
      break;
    }
    case 'wallpaperType':
      next.wallpaperType = qr.value as QuoteSlots['wallpaperType'];
      break;
    case 'additionalRequest': {
      const v = qr.value as NonNullable<QuoteSlots['additionalRequest']>[number];
      const cur = next.additionalRequest ?? [];
      next.additionalRequest = cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v];
      break;
    }
    case 'roomCount':
      next.roomCount = parseInt(qr.value, 10);
      break;
    case 'region':
      if (next.region !== qr.value) {
        next.district = undefined; // 시도 변경 시 시군구 리셋
      }
      next.region = qr.value;
      break;
    case 'district':
      next.district = qr.value;
      break;
    case 'visitDate':
      next.visitDate = qr.value;
      break;
  }
  return next;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockAIEngine implements AIQuoteEngine {
  async chat(input: ChatInput): Promise<ChatResponse> {
    let slots: QuoteSlots = { ...input.slots };

    if (input.selectedQuickReply) {
      slots = applyQuickReplyToSlots(slots, input.selectedQuickReply);
    }
    if (input.userText) {
      slots = extractSlots(input.userText, slots);
    }

    await delay(450 + Math.random() * 350);

    const next = nextMissingSlot(slots);
    if (next) {
      // district는 시도(region)에 따라 동적으로 빠른답변 생성
      if (next === 'district' && slots.region) {
        const districtReplies = getDistrictReplies(slots.region);
        const aiMessage: ChatMessage = {
          id: makeId(),
          role: 'ai',
          text: '시·군·구를 선택해주세요. 직접 입력해도 좋아요.',
          quickReplies: districtReplies,
          timestamp: Date.now(),
        };
        return { aiMessage, updatedSlots: slots, isComplete: false };
      }
      const q = QUESTION_BY_SLOT[next];
      const aiMessage: ChatMessage = {
        id: makeId(),
        role: 'ai',
        text: q.text,
        quickReplies: q.replies,
        timestamp: Date.now(),
      };
      return { aiMessage, updatedSlots: slots, isComplete: false };
    }

    const aiMessage: ChatMessage = {
      id: makeId(),
      role: 'ai',
      text: '필요한 정보가 모두 모였어요. 우측 견적을 확인하시고 신청 버튼을 눌러주세요. 수정할 항목이 있으면 메시지로 알려주세요.',
      timestamp: Date.now(),
    };
    return { aiMessage, updatedSlots: slots, isComplete: true };
  }

  async analyzeImage(_file: File): Promise<ImageAnalysis> {
    await delay(2400);  // 윤곽 검출 → 면적 추정 → 벽지 추천 합산
    const pyeong = 6 + Math.floor(Math.random() * 8);
    return {
      estimatedPyeong: pyeong,
      detectedScope: 'living-room',
      recommendedWallpaper: 'fabric',
      conditionScore: 70 + Math.floor(Math.random() * 25),
      notes: `촬영된 공간은 약 ${pyeong}평 거실로 추정되며, 벽면 상태가 양호해 실크벽지 추천드려요.`,
    };
  }

  async estimatePrice(slots: QuoteSlots): Promise<PriceEstimate> {
    await delay(150);
    return calculatePrice(slots);
  }
}
