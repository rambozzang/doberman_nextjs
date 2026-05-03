import type { AIQuoteEngine } from './types';
import { MockAIEngine } from './mockAIEngine';

let _engine: AIQuoteEngine | null = null;

export function getAIEngine(): AIQuoteEngine {
  if (_engine) return _engine;
  // 추후 OpenAI 도입 시: NEXT_PUBLIC_AI_PROVIDER === 'openai' 분기로 OpenAIEngine 반환
  _engine = new MockAIEngine();
  return _engine;
}
