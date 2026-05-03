/**
 * 도배르만 견적 계산기 핵심 로직
 * HTML 원본(도배르만_견적계산기.html)의 calc() 함수를 1:1 포팅
 * 단가/계수는 원본과 동일하게 유지 (임의 변경 금지)
 */

// ========== 단가 데이터 (HTML 원본 RATES 그대로) ==========
export const RATES: Record<string, { mat: number; lab: number }> = {
  '합지(소폭)':  { mat: 4500,  lab: 5500  },
  '광폭합지':    { mat: 6000,  lab: 6500  },
  '실크(보급)':  { mat: 8000,  lab: 8500  },
  '실크(중급)':  { mat: 11000, lab: 10000 },
  '실크(고급)':  { mat: 16000, lab: 12000 },
  '친환경·방염': { mat: 20000, lab: 13000 },
  '수입벽지':    { mat: 30000, lab: 16000 },
};

// 부자재 평당 단가
export const SUB_MAT   = 1500;
// 옵션 단가
export const DEMO_RATE   = 6000;   // 철거 원/평
export const MOLD_RATE   = 50000;  // 곰팡이 부위당
export const PUTTY_RATE  = 5000;   // 퍼티 원/평
export const MOLDING_FEE = 80000;  // 몰딩 일괄
export const FURN_FEE    = 80000;  // 가구 이동 일괄
export const TRASH_FEE   = 50000;  // 폐기물 일괄
export const LOSS        = 0.10;   // 로스율 10%

// ========== 계수 테이블 (HTML 원본 그대로) ==========
export const SCOPE_K: Record<string, number> = {
  '전체': 3.3, '벽만': 2.4, '천장만': 1.0, '부분도배': 1.5, '거실만': 1.2,
};
export const HEIGHT_K: Record<string, number> = {
  '표준(2.3~2.5m)': 1.00,
  '높음(2.7m+)':    1.15,
  '매우높음(3m+)':  1.30,
  '낮음(2.2m이하)': 0.95,
};
export const HOUSE_K: Record<string, number> = {
  '아파트':         0.00,
  '빌라(다세대/연립)': 0.05,
  '단독주택':       0.10,
  '원룸·오피스텔':  -0.05,
  '상가·사무실':    0.10,
  '기타':           0.05,
};
export const AGE_K: Record<string, number> = {
  '신축(입주청소前)': -0.05,
  '5년이내':         0.00,
  '10년이내':        0.03,
  '15년이내':        0.07,
  '15년이상':        0.12,
};
// 도배 면적 비율 (거실:방:천장)
export const RATIO = { liv: 0.35, room: 0.35, ceil: 0.30 };

// ========== 타입 ==========

/** 주거 형태 */
export type HousingType =
  | '아파트'
  | '빌라(다세대/연립)'
  | '단독주택'
  | '원룸·오피스텔'
  | '상가·사무실'
  | '기타';

/** 건물 연식 */
export type AgeType =
  | '신축(입주청소前)'
  | '5년이내'
  | '10년이내'
  | '15년이내'
  | '15년이상';

/** 거주 상태 */
export type LiveType = '공실' | '거주中';

/** 천장 높이 */
export type CeilHType = '표준(2.3~2.5m)' | '높음(2.7m+)' | '매우높음(3m+)' | '낮음(2.2m이하)';

/** 도배 범위 */
export type ScopeType = '전체' | '벽만' | '천장만' | '부분도배' | '거실만';

/** 벽지 종류 (거실/방/천장) */
export type WallpaperType =
  | '합지(소폭)'
  | '광폭합지'
  | '실크(보급)'
  | '실크(중급)'
  | '실크(고급)'
  | '친환경·방염'
  | '수입벽지';

/** 천장 벽지 종류 (천장은 고급·친환경·수입 미지원) */
export type CeilWallpaperType = '합지(소폭)' | '광폭합지' | '실크(보급)' | '실크(중급)';

/** VAT 처리 방식 */
export type VatType = '별도' | '포함';

/** 결제 방식 */
export type PayType = '현금' | '계좌이체' | '카드';

/** 계산기 입력값 */
export interface CalculatorInput {
  // 기본 정보
  housing: HousingType;
  age: AgeType;
  live: LiveType;
  pyeong: number;       // 전용 평형
  rooms: number;        // 방 갯수
  livingY: boolean;     // 거실+주방 포함 여부
  ceilH: CeilHType;
  scope: ScopeType;
  // 벽지 선택
  wpLiving: WallpaperType;
  wpRoom: WallpaperType;
  wpCeil: CeilWallpaperType;
  funcGlue: boolean;    // 기능성 풀
  pntRoll: number;      // 포인트 벽지 롤 수
  pntPrice: number;     // 포인트 벽지 단가/롤
  // 추가 옵션
  opDemo: boolean;      // 기존 벽지 철거
  opMold: number;       // 곰팡이 제거 부위 수
  opPutty: number;      // 퍼티 평수
  opMold2: boolean;     // 몰딩 시공
  opFurn: boolean;      // 가구 이동
  opTrash: boolean;     // 폐기물 처리
  opDist: number;       // 출장 거리 (km)
  opUrg: boolean;       // 긴급/야간
  // 마진/세금
  margin: number;       // 마진율 (%) — 0~100
  discount: number;     // 할인율 (%) — 0~100
  vat: VatType;
  pay: PayType;
  adjPct: number;       // 면적 보정 (%) — 발코니 확장 등
}

/** 계산 결과 */
export interface CalculatorResult {
  // 도배 시공 평수
  dPyeong: number;
  // 면적 분배
  aLiv: number;
  aRoom: number;
  aCeil: number;
  // 자재비 항목
  mLiv: number;
  mRoom: number;
  mCeil: number;
  mPnt: number;
  mSub: number;
  mFunc: number;
  mSum: number;
  // 인건비 항목
  lLiv: number;
  lRoom: number;
  lCeil: number;
  lAdj: number;
  lUrg: number;
  lSum: number;
  // 옵션 항목
  oDemo: number;
  oMold: number;
  oPutty: number;
  oMold2: number;
  oFurn: number;
  oTrash: number;
  oDist: number;
  oSum: number;
  // 합계/마진/세금
  cost: number;
  marginV: number;
  supply: number;
  discV: number;
  afterDis: number;
  vatV: number;
  cardV: number;
  final: number;
  // 계산식 표시용 중간값
  scopeK: number;
  heightK: number;
  adjPctRatio: number;
  adjFactor: number;
}

// ========== 유틸 ==========

/** HTML 원본 won() 포매터 그대로 */
export const won = (n: number): string =>
  Math.round(n).toLocaleString('ko-KR') + '원';

// ========== 핵심 계산 함수 (HTML calc() 1:1 포팅) ==========

/**
 * 견적 계산 — HTML 원본 calc() 함수와 동일한 로직
 * pure function: 사이드 이펙트 없음
 */
export function calculateEstimate(input: CalculatorInput): CalculatorResult {
  const {
    pyeong, rooms, livingY, scope, ceilH, adjPct: adjPctRaw,
    wpLiving, wpRoom, wpCeil,
    funcGlue, pntRoll, pntPrice,
    housing, age, live,
    opDemo, opMold, opPutty, opMold2, opFurn, opTrash, opDist, opUrg,
    margin, discount, vat, pay,
  } = input;

  const adjPctRatio = (adjPctRaw || 0) / 100;
  const marginRatio  = (margin  || 0) / 100;
  const discountRatio = (discount || 0) / 100;

  // ① 도배 시공평수
  const scopeK  = SCOPE_K[scope]  ?? 3.3;
  const heightK = HEIGHT_K[ceilH] ?? 1.00;
  const dPyeong = pyeong * scopeK * heightK * (1 + adjPctRatio) * (1 + LOSS);

  // 면적 분배
  const aLiv  = livingY ? dPyeong * RATIO.liv : 0;
  const aRoom = dPyeong * RATIO.room * (rooms / 3); // 3개방 기준 비례
  const aCeil = (scope === '전체' || scope === '천장만')
    ? dPyeong * RATIO.ceil
    : 0;

  // ② 자재비
  const matL = RATES[wpLiving] ?? RATES['합지(소폭)'];
  const matR = RATES[wpRoom]   ?? RATES['합지(소폭)'];
  const matC = RATES[wpCeil]   ?? RATES['합지(소폭)'];

  const mLiv  = aLiv  * matL.mat;
  const mRoom = aRoom * matR.mat;
  const mCeil = aCeil * matC.mat;
  const mPnt  = pntRoll * pntPrice;
  const mSub  = dPyeong * SUB_MAT;
  const matBase = mLiv + mRoom + mCeil + mPnt + mSub;
  const mFunc = funcGlue ? matBase * 0.25 : 0;
  const mSum  = matBase + mFunc;

  // ③ 인건비
  const lLiv  = aLiv  * matL.lab;
  const lRoom = aRoom * matR.lab;
  const lCeil = aCeil * matC.lab;
  const labBase = lLiv + lRoom + lCeil;
  const adjFactor =
    (HOUSE_K[housing] ?? 0) +
    (AGE_K[age]       ?? 0) +
    (live === '거주中' ? 0.05 : 0);
  const lAdj = labBase * adjFactor;
  const lUrg = opUrg ? labBase * 0.20 : 0;
  const lSum = labBase + lAdj + lUrg;

  // ④ 옵션
  const oDemo  = opDemo  ? dPyeong * DEMO_RATE : 0;
  const oMold  = opMold  * MOLD_RATE;
  const oPutty = opPutty * PUTTY_RATE;
  const oMold2 = opMold2 ? MOLDING_FEE : 0;
  const oFurn  = opFurn  ? FURN_FEE    : 0;
  const oTrash = opTrash ? TRASH_FEE   : 0;
  const oDist  = opDist <= 10 ? 0 : (30000 + (opDist - 10) * 1000);
  const oSum   = oDemo + oMold + oPutty + oMold2 + oFurn + oTrash + oDist;

  // ⑤ 합계/마진/세금
  const cost     = mSum + lSum + oSum;
  const marginV  = cost * marginRatio;
  const supply   = cost + marginV;
  const discV    = supply * discountRatio;
  const afterDis = supply - discV;
  const vatV     = vat === '별도' ? afterDis * 0.10 : 0;
  const cardV    = pay === '카드' ? (afterDis + vatV) * 0.02 : 0;
  const final    = afterDis + vatV + cardV;

  return {
    dPyeong, aLiv, aRoom, aCeil,
    mLiv, mRoom, mCeil, mPnt, mSub, mFunc, mSum,
    lLiv, lRoom, lCeil, lAdj, lUrg, lSum,
    oDemo, oMold, oPutty, oMold2, oFurn, oTrash, oDist, oSum,
    cost, marginV, supply, discV, afterDis, vatV, cardV, final,
    scopeK, heightK, adjPctRatio, adjFactor,
  };
}

/**
 * 평형별 빠른 견적 계산
 * HTML renderQuick() 로직 그대로 (scope=전체, 표준천장, 옵션없음, 마진20%, VAT별도)
 */
export const QUICK_SIZES   = [8, 13, 18, 24, 30, 32, 34, 38, 42, 48, 55, 60];
export const QUICK_TARGETS: WallpaperType[] = [
  '합지(소폭)', '광폭합지', '실크(중급)', '실크(고급)', '친환경·방염',
];

export interface QuickRow {
  size: number;
  values: number[]; // 각 target별 최종 견적 (천원 단위 반올림)
}

export function calcQuickTable(): QuickRow[] {
  return QUICK_SIZES.map((sz) => ({
    size: sz,
    values: QUICK_TARGETS.map((t) => {
      const rate = RATES[t];
      const dP   = sz * 3.3 * 1.1; // 전체도배 + 표준천장 + 로스10%
      const cost = dP * (rate.mat + rate.lab + SUB_MAT);
      // 마진 20%, VAT 별도 10%, 천원 단위 반올림
      return Math.round(cost * 1.2 * 1.1 / 1000) * 1000;
    }),
  }));
}

/**
 * "적용된 계산식 보기" 텍스트 생성
 * HTML formulaShow 내용과 동일하게 출력
 */
export function buildFormulaText(
  input: CalculatorInput,
  r: CalculatorResult,
): string {
  const { pyeong, scope, ceilH, adjPct: adjPctRaw, wpLiving, wpRoom, wpCeil,
          funcGlue, live, housing, age, opUrg, margin, discount, vat, pay } = input;
  const adjPctRatio = (adjPctRaw || 0) / 100;
  const marginRatio = (margin || 0) / 100;
  const discountRatio = (discount || 0) / 100;

  const matL = RATES[wpLiving] ?? RATES['합지(소폭)'];
  const matR = RATES[wpRoom]   ?? RATES['합지(소폭)'];
  const matC = RATES[wpCeil]   ?? RATES['합지(소폭)'];

  return `▶ 1단계 도배 시공평수
  = 평형 × 도배계수(${r.scopeK}) × 천장계수(${r.heightK})
    × (1+${(adjPctRatio * 100).toFixed(0)}%) × (1+로스 10%)
  = ${pyeong} × ${r.scopeK} × ${r.heightK} × ${(1 + adjPctRatio).toFixed(2)} × 1.10
  = ${r.dPyeong.toFixed(1)}평

▶ 2단계 자재비
  = 거실(${r.aLiv.toFixed(1)}×${matL.mat}) + 방(${r.aRoom.toFixed(1)}×${matR.mat})
    + 천장(${r.aCeil.toFixed(1)}×${matC.mat}) + 포인트
    + 부자재(${r.dPyeong.toFixed(1)}×${SUB_MAT}) ${funcGlue ? '+ 기능성풀(자재×25%)' : ''}
  = ${won(r.mSum)}

▶ 3단계 인건비
  = (거실+방+천장 시공비) × (1 + 주거형태가산${((HOUSE_K[housing] ?? 0) * 100).toFixed(0)}%
    + 연식가산${((AGE_K[age] ?? 0) * 100).toFixed(0)}%
    + 거주중${live === '거주中' ? '+5%' : '0%'}) ${opUrg ? '+ 긴급20%' : ''}
  = ${won(r.lSum)}

▶ 4단계 옵션 = 철거 + 곰팡이 + 퍼티 + 몰딩 + 가구이동 + 폐기물 + 출장비
  = ${won(r.oSum)}

▶ 5단계 최종견적
  원가합계  = ${won(r.cost)}
  + 마진 ${(marginRatio * 100).toFixed(0)}%   = ${won(r.marginV)}
  - 할인 ${(discountRatio * 100).toFixed(0)}%   = -${won(r.discV)}
  + VAT 10%        = ${won(r.vatV)}
  ${pay === '카드' ? '+ 카드수수료 2% = ' + won(r.cardV) : ''}
  ──────────────────────────
  최종 청구 견적 = ${won(r.final)}`;
}
