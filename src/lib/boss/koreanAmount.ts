// 금액 한글 표기 — 세금계산서 · 견적서 서식의 "金 일백이십삼만사천원整"
//
// 1,234,000 → "일백이십삼만사천". 0 → "영".
// 서식 관례대로 십 · 백 · 천 앞의 "일"도 적는다(일십 · 일백 · 일천) — 위조 방지용 표기.

const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SMALL_UNITS = ['', '십', '백', '천'];
const BIG_UNITS = ['', '만', '억', '조', '경'];

function chunkToKorean(chunk: number): string {
  // 0 ~ 9999
  let out = '';
  const s = String(chunk).padStart(4, '0');
  for (let i = 0; i < 4; i++) {
    const n = Number(s[i]);
    if (n === 0) continue;
    out += DIGITS[n] + SMALL_UNITS[3 - i];
  }
  return out;
}

export function toKoreanAmount(amount: number | null | undefined): string {
  const n = Math.floor(Math.abs(Number(amount) || 0));
  if (n === 0) return '영';
  const chunks: number[] = [];
  let rest = n;
  while (rest > 0) {
    chunks.push(rest % 10000);
    rest = Math.floor(rest / 10000);
  }
  let out = '';
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] === 0) continue;
    out += chunkToKorean(chunks[i]) + BIG_UNITS[i];
  }
  return out;
}

/** 서식 표기: "金 일백이십삼만사천원整" */
export function toKoreanAmountLabel(amount: number | null | undefined): string {
  return `金 ${toKoreanAmount(amount)}원整`;
}
