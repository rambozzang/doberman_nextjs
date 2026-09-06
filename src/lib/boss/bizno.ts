// 사업자등록번호 — 형식 · 체크섬 검증
//
// 국세청 사업자등록번호는 10자리이고 마지막 자리가 검증번호다.
//   가중치 1,3,7,1,3,7,1,3,5 를 앞 9자리에 곱해 더하고, 9번째 자리×5 의 십의 자리(몫)를 한 번 더 더한 뒤
//   (10 − 합 % 10) % 10 이 10번째 자리와 같아야 한다.
// 사장님이 고객에게 받아 적은 번호의 오타를 홈택스에 가기 전에 잡는다.

const WEIGHTS = [1, 3, 7, 1, 3, 7, 1, 3, 5];

/** 숫자만 남긴다 */
export function bizNoDigits(input: string | null | undefined): string {
  return (input ?? '').replace(/\D/g, '');
}

/** 000-00-00000 로 표기. 10자리가 아니면 입력 그대로 */
export function formatBizNo(input: string | null | undefined): string {
  const d = bizNoDigits(input);
  if (d.length !== 10) return (input ?? '').trim();
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** 체크섬까지 맞는 사업자등록번호인가 */
export function isValidBizNo(input: string | null | undefined): boolean {
  const d = bizNoDigits(input);
  if (d.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * WEIGHTS[i];
  sum += Math.floor((Number(d[8]) * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(d[9]);
}

/** 입력 중 자동 하이픈 — 최대 10자리 */
export function maskBizNo(input: string): string {
  const d = bizNoDigits(input).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
