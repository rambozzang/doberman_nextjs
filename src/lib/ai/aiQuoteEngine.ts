import type { AIQuoteEngine } from './types';
import { MockAIEngine } from './mockAIEngine';
import { QwenEngine } from './qwenEngine';

let _engine: AIQuoteEngine | null = null;

export function getAIEngine(): AIQuoteEngine {
  if (_engine) return _engine;
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER;
  if (provider === 'qwen') {
    _engine = new QwenEngine();
  } else {
    _engine = new MockAIEngine();
  }
  return _engine;
}
