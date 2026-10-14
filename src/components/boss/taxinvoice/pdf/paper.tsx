'use client';

// 세금계산서 · 현금영수증 PDF 공용 부품 — 상태 띠 · 워터마크 · 쪽 바닥 · 격자 칸
//
// 이 파일과 같은 폴더의 PDF 문서는 @react-pdf/renderer 를 쓰므로 반드시 동적 import 로만 불러온다
// (정적으로 들어가면 화면 자체가 죽는다 — 2026-09-07 장애, components/boss/print/pdfRender.ts 참고).
//
// 종이는 인쇄용 색만 쓴다(boss-* 토큰은 화면용). 흑백 프린터에서도 상태 띠 · 워터마크가 읽히게 진하기를 맞췄다.

import type { ReactNode } from 'react';
import { Font, Text, View } from '@react-pdf/renderer';
import { registerPdfFont } from '@/components/boss/print/pdf/form';
import type { TaxInvoice, TaxInvoiceSupplier } from '@/types/boss-taxinvoice';
import type { PaperState } from '@/lib/boss/taxInvoiceDocument';
import { HANGUL_FONT_FAMILY } from './fontPlan';

export const INK = '#111111';
export const BORDER = '#555555';
export const MUTED = '#555555';
export const FAINT = '#8A8A8A';
export const LABEL_BG = '#F0F0F0';
export const HAIR = 0.5;
export const RULE = 1;

export const TONE_COLOR: Record<PaperState['tone'], string> = {
  plain: '#333333',
  warn: '#8A4B00',
  bad: '#B42318',
};

/** PDF 한 장을 그리는 데 필요한 값 — 화면 미리보기 · 저장 · 인쇄가 같은 값을 쓴다 */
export interface PaperModel {
  invoice: TaxInvoice;
  /** 서버 문서 API 의 공급자(발급 시도 문서는 발급 당시 스냅샷). 없으면 null — 다른 값으로 채우지 않는다 */
  supplier: TaxInvoiceSupplier | null;
  /** 공급자가 없을 때 종이에 찍을 이유 */
  supplierNote: string | null;
  state: PaperState;
  fontFamily: string;
  /** 출력 시각 yyyy-MM-dd HH:mm */
  printedAt: string;
}

let hangulRegistered = false;

/** 기본 글꼴(견적서와 공용) + 한글 전체 글꼴을 등록한다. 큰 글꼴 파일은 실제로 쓰는 문서에서만 내려받는다 */
export function registerTaxPdfFonts() {
  registerPdfFont();
  if (hangulRegistered) return;
  Font.register({
    family: HANGUL_FONT_FAMILY,
    fonts: [
      { src: '/fonts/NotoSansKR-Regular.hangul.ttf', fontWeight: 400 },
      { src: '/fonts/NotoSansKR-Bold.hangul.ttf', fontWeight: 700 },
    ],
  });
  hangulRegistered = true;
}

/**
 * 쪽 가운데 옅은 큰 글씨 — 미발급 · 시험 · 취소 · 결과 미확정. 모든 쪽에 찍힌다.
 * react-pdf 는 fixed 요소를 본문 위에 그리므로 불투명 회색이면 아래 글자를 가린다 — 검정을 아주 옅게(투명도) 얹어 글자가 비치게 한다.
 */
export function Watermark({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        top: 330,
        left: 0,
        right: 0,
        alignItems: 'center',
        transform: 'rotate(-28deg)',
        opacity: 0.09,
      }}
    >
      <Text style={{ fontSize: 68, fontWeight: 700, color: '#000000', letterSpacing: 8 }}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// 줄바꿈 — react-pdf 는 단어 가운데서 줄을 바꾸면 '-' 를 끼워 넣는다.
// 이메일 · 승인번호 · 사업자번호에 없는 하이픈이 찍히면 틀린 값이 되므로, 단어 안에서는 하이픈 없이 끊는다:
// 칸보다 긴 덩어리만 글자 조각으로 나눠 따로 그리고(flex wrap), 나머지는 공백에서만 줄을 바꾼다.
// ─────────────────────────────────────────────

/** 대략의 글자 폭(pt) — 한글 · 전각은 글자 크기만큼, 나머지는 0.56배 */
function estimateWidth(s: string, size: number): number {
  let w = 0;
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) >= 0x1100 ? size : size * 0.56;
  return w;
}

const BREAK_AFTER = /[@.\-_/,:)]/;

/** 칸 폭을 넘는 덩어리를 조각으로 — 가능하면 @ . - _ / 뒤에서 끊는다 */
function chunkWord(word: string, maxWidth: number, size: number): string[] {
  const chars = Array.from(word);
  const out: string[] = [];
  let cur = '';
  let lastBreak = -1;
  for (const ch of chars) {
    if (cur && estimateWidth(cur + ch, size) > maxWidth) {
      if (lastBreak > 0 && lastBreak < cur.length) {
        out.push(cur.slice(0, lastBreak));
        cur = cur.slice(lastBreak);
      } else {
        out.push(cur);
        cur = '';
      }
      lastBreak = -1;
    }
    cur += ch;
    if (BREAK_AFTER.test(ch)) lastBreak = cur.length;
  }
  if (cur) out.push(cur);
  return out;
}

const noHyphenation = (word: string) => [word];

/**
 * 종이 글자 — 공백에서만 줄을 바꾸고(하이픈 없음), 칸보다 긴 덩어리는 조각으로 나눠 줄을 바꾼다.
 * maxWidth 는 글자가 들어갈 폭(pt). 모르면 넉넉한 값을 넘긴다.
 */
export function PaperText({
  text,
  size,
  maxWidth,
  align = 'left',
  bold,
  color,
  spacing,
}: {
  text: string;
  size: number;
  maxWidth: number;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  color?: string;
  spacing?: number;
}) {
  const style = { fontSize: size, fontWeight: bold ? 700 : 400, color, letterSpacing: spacing, lineHeight: 1.3 } as const;
  const words = text.split(/(\s+)/).filter(Boolean);
  const tooLong = words.some((w) => w.trim() && estimateWidth(w, size) > maxWidth);
  if (!tooLong) {
    return (
      <Text style={{ ...style, textAlign: align }} hyphenationCallback={noHyphenation}>
        {text}
      </Text>
    );
  }
  // 조각마다 따로 그리고 줄 바꿈은 flex wrap 이 맡는다 — 끊긴 자리에 하이픈이 생기지 않는다
  const pieces: string[] = [];
  for (const w of words) {
    if (!w.trim()) {
      if (pieces.length) pieces[pieces.length - 1] += ' ';
      continue;
    }
    pieces.push(...(estimateWidth(w, size) > maxWidth ? chunkWord(w, maxWidth, size) : [w]));
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {pieces.map((p, i) => (
        <Text key={i} style={style} hyphenationCallback={noHyphenation}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/** 맨 위 상태 띠 — 모든 쪽에 찍힌다. 효력 없는 문서가 원본처럼 보이지 않게 */
export function StatusBand({ state, width }: { state: PaperState; width?: number }) {
  const color = TONE_COLOR[state.tone];
  return (
    <View
      fixed
      style={{
        width,
        alignSelf: width ? 'center' : undefined,
        borderWidth: state.tone === 'plain' ? HAIR : RULE,
        borderColor: color,
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 8.5, fontWeight: 700, color, marginRight: 8 }}>{state.banner}</Text>
      <Text style={{ flex: 1, fontSize: 7, color: state.tone === 'plain' ? MUTED : color }}>{state.note}</Text>
    </View>
  );
}

/** 쪽 바닥 — 어떤 문서의 몇 쪽인지. 여러 장을 섞어 출력해도 짝을 맞출 수 있게 */
export function PageFooter({ left, printedAt }: { left: string; printedAt: string }) {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        left: 28,
        right: 28,
        bottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: HAIR,
        borderColor: BORDER,
        paddingTop: 3,
      }}
    >
      <Text style={{ fontSize: 6.5, color: FAINT, maxWidth: 360 }}>{left}</Text>
      <Text
        style={{ fontSize: 6.5, color: MUTED }}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages} 쪽`}
      />
      <Text style={{ fontSize: 6.5, color: FAINT }}>출력 {printedAt} · 도배르만</Text>
    </View>
  );
}

type CellProps = {
  children?: ReactNode;
  w?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  bg?: string;
  color?: string;
  size?: number;
  /** 오른쪽 선 없음(줄의 마지막 칸) */
  last?: boolean;
  /** 아래 선 없음(격자의 마지막 줄) */
  bottom?: boolean;
  minH?: number;
  spacing?: number;
  /** flex 칸의 글자 폭(pt) — 줄바꿈 판단용. 모르면 생략 */
  tw?: number;
};

/** 폭을 모르는(flex) 칸의 글자 폭 기준 — 서식에서 가장 좁은 flex 칸(품목 · 상호)보다 조금 작게 */
const FLEX_TEXT_WIDTH = 96;

/** 격자 한 칸 — 긴 글자는 칸 안에서 줄을 바꾼다(잘리지 않는다). 같은 줄의 칸은 가장 긴 칸 높이에 맞춰 늘어난다 */
export function Cell({
  children,
  w,
  flex,
  align = 'left',
  bold,
  bg,
  color,
  size = 8.5,
  last,
  bottom,
  minH = 18,
  spacing,
  tw,
}: CellProps) {
  const pad = 3.5;
  return (
    <View
      style={{
        width: w,
        flex: w === undefined ? (flex ?? 1) : undefined,
        minHeight: minH,
        borderRightWidth: last ? 0 : HAIR,
        borderBottomWidth: bottom ? 0 : HAIR,
        borderColor: BORDER,
        backgroundColor: bg,
        justifyContent: 'center',
        paddingHorizontal: pad,
        paddingVertical: 2,
      }}
    >
      {typeof children === 'string' && children.trim() ? (
        <PaperText
          text={children}
          size={size}
          maxWidth={w !== undefined ? w - pad * 2 - 1 : (tw ?? FLEX_TEXT_WIDTH)}
          align={align}
          bold={bold}
          color={color}
          spacing={spacing}
        />
      ) : (
        <Text style={{ fontSize: size, fontWeight: bold ? 700 : 400, textAlign: align, color, letterSpacing: spacing, lineHeight: 1.3 }}>
          {children ?? ' '}
        </Text>
      )}
    </View>
  );
}

/** 라벨 칸 — 옅은 회색 · 가운데 */
export function LabelCell(props: CellProps) {
  return <Cell bg={LABEL_BG} align="center" size={7.5} color="#222222" {...props} />;
}
