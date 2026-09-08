'use client';
/* eslint-disable jsx-a11y/alt-text -- 여기 <Image> 는 HTML img 가 아니라 @react-pdf/renderer 의 PDF 요소다 */

// 견적서 · 영수증 공통 서식 부품 — 종이 서류처럼 보이게 하는 규칙을 한 곳에 둔다
//
//   · 외곽선은 살짝 굵게(1.0pt), 칸 사이 선은 가늘게(0.5pt). 전부 같은 굵기면 웹 표처럼 보인다.
//     (외곽선은 원래 1.4pt 였는데 상자들이 너무 두꺼워 보인다는 피드백에 낮췄다)
//   · 항목 표는 빈 줄을 채워 페이지 바닥까지 내려간다. 반쯤 비어 있으면 서류가 아니라 화면이다.
//   · 도장은 성명 칸 안에 갇히지 않는다. 실물처럼 칸을 넘어 크게, 살짝 기울여 찍는다.
//   · 금액은 "一金 ○○원整" 한 줄과 숫자를 함께 쓴다.

import type { ReactNode } from 'react';
import { Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { companyAddress } from '../docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

export const LINE = '#111111';
// 표 · 상자 테두리 색 — 글자(LINE)보다 한 단계 옅게 둔다. 테두리까지 거의 검정이면
// 서류 전체가 너무 찐하게 보인다는 피드백이 있었다.
export const BORDER = '#555555';
export const THIN = 0.5;
export const THICK = 1.0;
/** 격자 한 줄 높이 — 표 · 라벨 칸이 모두 이 높이를 쓴다 */
export const ROW_H = 17;

let fontRegistered = false;
export function registerPdfFont() {
  if (fontRegistered) return;
  Font.register({
    family: 'NotoSansKR',
    fonts: [
      { src: '/fonts/NotoSansKR-Regular.subset.ttf', fontWeight: 400 },
      { src: '/fonts/NotoSansKR-Bold.subset.ttf', fontWeight: 700 },
    ],
  });
  // 한글은 음절 단위로 줄을 바꾸면 되므로 하이픈 분리를 끈다.
  // 다만 띄어쓰기 없는 긴 영문 · 숫자 나열은 칸을 뚫고 나가므로 글자 단위로 끊는다.
  // (한글은 끊으면 하이픈이 붙어 어색하므로 그대로 둔다 — 한글은 보통 띄어쓰기가 있다)
  Font.registerHyphenationCallback((word) =>
    word.length <= 10 || /[가-힣]/.test(word) ? [word] : word.split('')
  );
  fontRegistered = true;
}

export const base = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 30,
    paddingHorizontal: 36,
    fontFamily: 'NotoSansKR',
    fontSize: 9,
    color: LINE,
  },
  row: { flexDirection: 'row' },
});

/** 양식(styleKey)에 따라 달라지는 색 — 기본(0)은 회색 라벨 · 검정 머리, 나머지는 팔레트 색 */
export function formColors(p: DocPalette, styleKey: string) {
  const plain = styleKey === '0';
  return {
    label: plain ? '#EEEEEE' : p.accent, // 라벨 칸 배경
    headBg: plain ? '#EEEEEE' : p.primary, // 표 머리 배경
    headFg: plain ? LINE : '#FFFFFF', // 표 머리 글자
    strong: plain ? LINE : p.primary, // 합계 숫자 강조색
  };
}

// ── 격자 ───────────────────────────────────────────────────────

type CellProps = {
  children?: ReactNode;
  /** 고정 폭(pt). 없으면 남은 폭을 나눠 가진다 */
  w?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  bg?: string;
  color?: string;
  size?: number;
  /** 줄의 마지막 칸 — 오른쪽 선을 긋지 않는다(외곽선이 대신 긋는다) */
  last?: boolean;
  /** 격자의 마지막 줄 — 아래 선을 긋지 않는다 */
  bottom?: boolean;
  h?: number;
  pad?: number;
  /** 글자 사이 벌림(라벨용) */
  spacing?: number;
};

/** 격자 한 칸. 글자는 세로 가운데. */
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
  h = ROW_H,
  pad = 4,
  spacing,
}: CellProps) {
  return (
    <View
      style={{
        width: w,
        flex: w === undefined ? (flex ?? 1) : undefined,
        minHeight: h,
        borderRightWidth: last ? 0 : THIN,
        borderBottomWidth: bottom ? 0 : THIN,
        borderColor: BORDER,
        backgroundColor: bg,
        justifyContent: 'center',
        paddingHorizontal: pad,
        paddingVertical: 1,
      }}
    >
      <Text
        style={{
          fontSize: size,
          fontWeight: bold ? 700 : 400,
          textAlign: align,
          color,
          letterSpacing: spacing,
        }}
      >
        {children ?? ' '}
      </Text>
    </View>
  );
}

/** 라벨 칸 — 배경색 · 가운데. 굵게는 표 머리처럼 꼭 필요한 곳에서만 켠다 */
export function Label({ children, w, bg, last, bottom, h, spacing = 1, bold = false }: CellProps) {
  return (
    <Cell w={w} bg={bg} bold={bold} align="center" last={last} bottom={bottom} h={h} spacing={spacing}>
      {children}
    </Cell>
  );
}

/** 굵은 외곽선 상자 — 안에 Row/Cell 을 넣는다 */
export function Box({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={{ borderWidth: THICK, borderColor: BORDER, ...style }}>{children}</View>;
}

export function Row({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
  return (
    <View style={base.row} wrap={wrap}>
      {children}
    </View>
  );
}

// ── 제목 ───────────────────────────────────────────────────────

/**
 * 문서 제목 — 양식별로 인상이 다르다.
 *   0 기본 · 3 토프 : 가운데 큰 제목 + 이중 밑줄(굵은 선 + 가는 선). 관공서 서식 느낌.
 *   1 슬레이트 · 4 세이지 : 색 띠 안에 흰 제목.
 *   2 차콜 : 위 굵은 색 선, 왼쪽 정렬 제목.
 */
export function TitleBlock({
  title,
  data,
  p,
  styleKey,
  dateLabel = '작성일자',
}: {
  title: string;
  data: DocData;
  p: DocPalette;
  styleKey: string;
  dateLabel?: string;
}) {
  const c = data.company;
  const spaced = title.split('').join(' ');
  const metaRight = (color = LINE) => (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 8.5, color }}>No. {data.meta.docNumber}</Text>
      <Text style={{ fontSize: 8.5, color, marginTop: 2 }}>
        {dateLabel} {data.meta.today}
      </Text>
    </View>
  );

  if (styleKey === '1' || styleKey === '4') {
    return (
      <View style={{ backgroundColor: p.primary, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
        {c?.logo ? (
          <View style={{ backgroundColor: '#fff', padding: 2, marginRight: 12 }}>
            <Image src={c.logo} style={{ width: 26, height: 26 }} />
          </View>
        ) : null}
        <Text style={{ flex: 1, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 10 }}>{spaced}</Text>
        {metaRight('#FFFFFF')}
      </View>
    );
  }

  if (styleKey === '2') {
    return (
      <View>
        <View style={{ height: 5, backgroundColor: p.primary }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {c?.logo ? <Image src={c.logo} style={{ width: 30, height: 30, marginRight: 10 }} /> : null}
            <Text style={{ fontSize: 24, fontWeight: 700, letterSpacing: 9 }}>{spaced}</Text>
          </View>
          {metaRight()}
        </View>
        <View style={{ height: THIN, backgroundColor: BORDER, marginTop: 8 }} />
      </View>
    );
  }

  // 0 · 3 — 가운데 제목 + 이중 밑줄
  const rule = styleKey === '3' ? p.primary : BORDER;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ width: 150, flexDirection: 'row', alignItems: 'center', paddingTop: 6 }}>
        {c?.logo ? <Image src={c.logo} style={{ width: 30, height: 30, marginRight: 6 }} /> : null}
        <Text style={{ fontSize: 9, fontWeight: 700 }}>{c?.name ?? ''}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ borderBottomWidth: 2, borderColor: rule, paddingBottom: 3, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 27, fontWeight: 700, letterSpacing: 16, marginLeft: 16 }}>{spaced}</Text>
        </View>
        <View style={{ width: 190, height: THIN, backgroundColor: rule, marginTop: 1.5 }} />
      </View>
      <View style={{ width: 150, alignItems: 'flex-end', paddingTop: 6 }}>{metaRight()}</View>
    </View>
  );
}

// ── 공급자 ─────────────────────────────────────────────────────

/**
 * 공급자 격자 — 사업자등록증 항목을 그대로 쓴다.
 * 도장은 성명 칸 위에 **칸을 넘어** 찍는다: 격자 다음에 절대 위치로 올려 선 위에 보이게 한다.
 */
export function SupplierGrid({ data, label }: { data: DocData; label: string }) {
  const c = data.company;
  const rows: ReactNode[] = [
    <Row key="r0">
      <Label w={54} bg={label}>등록번호</Label>
      <Cell last>{formatBizNoLoose(c?.bizno)}</Cell>
    </Row>,
    <Row key="r1">
      <Label w={54} bg={label}>상 호</Label>
      <Cell>{c?.name ?? ''}</Cell>
      <Label w={36} bg={label}>성 명</Label>
      <Cell w={92} last>
        {c?.owner ?? ''}
        <Text style={{ color: '#666' }}>{'   '}(인)</Text>
      </Cell>
    </Row>,
    <Row key="r2">
      <Label w={54} bg={label}>주 소</Label>
      <Cell last size={8}>{companyAddress(c)}</Cell>
    </Row>,
    <Row key="r3">
      <Label w={54} bg={label}>업 태</Label>
      <Cell>{c?.type ?? ''}</Cell>
      <Label w={36} bg={label}>종 목</Label>
      <Cell w={92} last>{c?.kind ?? ''}</Cell>
    </Row>,
    <Row key="r4">
      <Label w={54} bg={label} bottom>전 화</Label>
      <Cell bottom>{c?.phone ?? ''}</Cell>
      <Label w={36} bg={label} bottom>팩 스</Label>
      <Cell w={92} last bottom>{c?.fax ?? ''}</Cell>
    </Row>,
  ];
  return (
    <View style={{ flexDirection: 'row', borderWidth: THICK, borderColor: BORDER, position: 'relative' }}>
      <View
        style={{
          width: 18,
          backgroundColor: label,
          borderRightWidth: THIN,
          borderColor: BORDER,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {['공', '급', '자'].map((ch) => (
          <Text key={ch} style={{ fontSize: 8.5, lineHeight: 1.6 }}>
            {ch}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1 }}>{rows}</View>
      <Stamp src={c?.stamp} top={ROW_H * 1 + ROW_H / 2} right={22} size={38} />
    </View>
  );
}

/**
 * 인감 — 실물처럼 칸보다 크게, 살짝 기울여, 글자 위에 찍는다.
 * top 은 도장 중심의 세로 위치(격자 안 좌표), right 는 중심에서 오른쪽 가장자리까지 거리.
 */
export function Stamp({ src, top, right, size = 38 }: { src?: string | null; top: number; right: number; size?: number }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      style={{
        position: 'absolute',
        top: top - size / 2,
        right: right - size / 2,
        width: size,
        height: size,
        opacity: 0.88,
        transform: 'rotate(-6deg)',
      }}
    />
  );
}

// ── 금액 ───────────────────────────────────────────────────────

/** 합계금액 상자 — "一金 ○○원整" 과 숫자를 나란히. 외곽선을 굵게 해 눈이 먼저 가게 한다 */
export function AmountBox({
  title,
  sub,
  kor,
  amount,
  note,
  label,
  strong,
}: {
  title: string;
  sub?: string;
  kor: string;
  amount: string;
  note?: string;
  label: string;
  strong: string;
}) {
  // 억 단위처럼 한글이 길어지면 글자를 줄인다 — 그래도 넘치면 줄이 바뀐다(숫자와 겹치지 않는다)
  const korSize = kor.length <= 12 ? 13 : kor.length <= 16 ? 11.5 : 10;
  return (
    <Box style={{ flexDirection: 'row', minHeight: 34 }}>
      <View
        style={{
          width: 86,
          backgroundColor: label,
          borderRightWidth: THIN,
          borderColor: BORDER,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 6.5, color: '#444', marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: korSize, fontWeight: 700, letterSpacing: 0.5 }}>一金 {kor}整</Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: 700, color: strong, flexShrink: 0 }}>₩ {amount}</Text>
      </View>
      {note ? (
        <View
          style={{
            width: 60,
            borderLeftWidth: THIN,
            borderColor: BORDER,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: label,
          }}
        >
          <Text style={{ fontSize: 7.5 }}>{note}</Text>
        </View>
      ) : null}
    </Box>
  );
}

// ── 항목 표 ─────────────────────────────────────────────────────

export type Column = {
  head: string;
  w?: number;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
};

/**
 * 항목 표 — 머리, 항목 줄, 빈 줄(minRows 까지), 합계 줄.
 * 빈 줄에도 번호만 옅게 찍어 "칸이 준비된 서식" 으로 보이게 한다.
 */
export function ItemTable({
  columns,
  rows,
  minRows,
  footer,
  headBg,
  headFg,
  label,
}: {
  columns: Column[];
  rows: string[][];
  minRows: number;
  /** 합계 줄 — 첫 칸(합계 라벨)이 차지할 칸 수와 나머지 값들 */
  footer: { span: number; values: string[] };
  headBg: string;
  headFg: string;
  label: string;
}) {
  const lastIdx = columns.length - 1;
  const blanks = Math.max(0, minRows - rows.length);
  const spanWidth = columns.slice(0, footer.span).reduce((acc, col) => acc + (col.w ?? 0), 0);
  const spanHasFlex = columns.slice(0, footer.span).some((col) => col.w === undefined);

  return (
    <Box>
      <Row>
        {columns.map((col, i) => (
          <Label key={col.head} w={col.w} bg={headBg} last={i === lastIdx} spacing={2} bold>
            <Text style={{ color: headFg }}>{col.head}</Text>
          </Label>
        ))}
      </Row>
      {rows.map((r, ri) => (
        <Row key={`r${ri}`}>
          {columns.map((col, i) => (
            <Cell key={i} w={col.w} align={col.align} bold={col.bold} last={i === lastIdx}>
              {r[i] ?? ''}
            </Cell>
          ))}
        </Row>
      ))}
      {Array.from({ length: blanks }).map((_, bi) => (
        <Row key={`b${bi}`}>
          {columns.map((col, i) => (
            <Cell key={i} w={col.w} align="center" color="#C4C4C4" last={i === lastIdx}>
              {i === 0 ? String(rows.length + bi + 1) : ' '}
            </Cell>
          ))}
        </Row>
      ))}
      <Row>
        <Cell w={spanHasFlex ? undefined : spanWidth} bg={label} bold align="center" spacing={6} bottom>
          합 계
        </Cell>
        {columns.slice(footer.span).map((col, i) => (
          <Cell
            key={i}
            w={col.w}
            bg={label}
            bold
            align={col.align}
            bottom
            last={footer.span + i === lastIdx}
          >
            {footer.values[i] ?? ''}
          </Cell>
        ))}
      </Row>
    </Box>
  );
}
