'use client';
/* eslint-disable jsx-a11y/alt-text -- 여기 <Image> 는 HTML img 가 아니라 @react-pdf/renderer 의 PDF 요소다 */

// 견적서 PDF — 화면과 같은 한국 실무 견적서 서식을 벡터로 그린다.
// 격자(칸)가 살아 있어야 실제 서류로 보인다. 화면(EstimateDoc)과 구조를 1:1로 맞춘다.

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { money, taxText, companyAddress, customerAddress } from '../docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const LINE = '#111111';
const ROWS = 12;

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
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 34, paddingHorizontal: 32, fontFamily: 'NotoSansKR', fontSize: 9, color: '#111' },
  row: { flexDirection: 'row' },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

/** 격자 한 칸 */
const cell = (extra: object = {}) => ({
  borderRight: `1px solid ${LINE}`,
  borderBottom: `1px solid ${LINE}`,
  paddingVertical: 3,
  paddingHorizontal: 4,
  fontSize: 8.5,
  ...extra,
});

function SupplierGrid({ data, accent }: { data: DocData; accent: string }) {
  const c = data.company;
  const label = (t: string, w: number) => (
    <Text style={cell({ width: w, backgroundColor: accent, fontWeight: 700, textAlign: 'center' })}>{t}</Text>
  );
  return (
    <View style={{ borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}` }}>
      <View style={s.row}>
        <View
          style={{
            width: 20,
            backgroundColor: accent,
            borderRight: `1px solid ${LINE}`,
            borderBottom: `1px solid ${LINE}`,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: 700 }}>공</Text>
          <Text style={{ fontSize: 8, fontWeight: 700 }}>급</Text>
          <Text style={{ fontSize: 8, fontWeight: 700 }}>자</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.row}>
            {label('등록번호', 58)}
            <Text style={cell({ flex: 1 })}>{formatBizNoLoose(c?.bizno)}</Text>
          </View>
          <View style={s.row}>
            {label('상 호', 58)}
            <Text style={cell({ flex: 1, fontWeight: 700 })}>{c?.name ?? ''}</Text>
            {label('성 명', 40)}
            <View style={cell({ width: 96, position: 'relative' })}>
              <Text style={{ fontSize: 8.5 }}>
                {c?.owner ?? ''} <Text style={{ color: '#555' }}>(인)</Text>
              </Text>
              {c?.stamp ? (
                <Image src={c.stamp} style={{ position: 'absolute', right: 3, top: -4, width: 30, height: 30 }} />
              ) : null}
            </View>
          </View>
          <View style={s.row}>
            {label('사업장주소', 58)}
            <Text style={cell({ flex: 1 })}>{companyAddress(c)}</Text>
          </View>
          <View style={s.row}>
            {label('업 태', 58)}
            <Text style={cell({ flex: 1 })}>{c?.type ?? ''}</Text>
            {label('종 목', 40)}
            <Text style={cell({ width: 96 })}>{c?.kind ?? ''}</Text>
          </View>
          <View style={s.row}>
            {label('전 화', 58)}
            <Text style={cell({ flex: 1 })}>
              {[c?.phone, c?.fax ? `FAX ${c.fax}` : null].filter(Boolean).join('   ')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ItemGrid({ data, accent, headerBg, headerColor }: { data: DocData; accent: string; headerBg: string; headerColor: string }) {
  const w = [24, 0, 62, 34, 38, 58, 66, 54, 52];
  const heads = ['No', '품 명', '규 격', '단위', '수량', '단 가', '공급가액', '세 액', '비 고'];
  const align: ('left' | 'center' | 'right')[] = ['center', 'left', 'center', 'center', 'right', 'right', 'right', 'right', 'left'];

  const c = (i: number, extra: object = {}) =>
    cell({
      width: w[i] === 0 ? undefined : w[i],
      flex: w[i] === 0 ? 1 : undefined,
      textAlign: align[i],
      ...extra,
    });

  const rows = data.items.map((it, i) => [
    String(i + 1),
    `${it.itemName ?? ''}${it.isTaxFree === 'Y' ? ' *' : ''}`,
    it.itemSpec ?? '',
    it.unit ?? '',
    money(it.quantity),
    money(it.unitPrice),
    money(it.supplyAmount),
    money(it.vatAmount),
    it.memo ?? '',
  ]);

  return (
    <View style={{ borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}`, marginTop: 8 }}>
      <View style={s.row}>
        {heads.map((h, i) => (
          <Text key={h} style={c(i, { backgroundColor: headerBg, color: headerColor, fontWeight: 700, textAlign: 'center' })}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.row}>
          {r.map((v, i) => (
            <Text key={i} style={c(i, { minHeight: 15, fontWeight: i === 1 ? 700 : 400 })}>
              {v}
            </Text>
          ))}
        </View>
      ))}
      {Array.from({ length: Math.max(0, ROWS - rows.length) }).map((_, bi) => (
        <View key={`b${bi}`} style={s.row}>
          {heads.map((_h, i) => (
            <Text key={i} style={c(i, { minHeight: 15, color: '#BBB' })}>
              {i === 0 ? String(rows.length + bi + 1) : ' '}
            </Text>
          ))}
        </View>
      ))}
      <View style={s.row}>
        <Text
          style={cell({
            flex: 1,
            backgroundColor: accent,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: 4,
          })}
        >
          합 계
        </Text>
        <Text style={cell({ width: w[6], backgroundColor: accent, fontWeight: 700, textAlign: 'right' })}>
          {money(data.totals.supplyAmount)}
        </Text>
        <Text style={cell({ width: w[7], backgroundColor: accent, fontWeight: 700, textAlign: 'right' })}>
          {money(data.totals.vatAmount)}
        </Text>
        <Text style={cell({ width: w[8], backgroundColor: accent })}> </Text>
      </View>
    </View>
  );
}

function Conditions({ data, accent }: { data: DocData; accent: string }) {
  const label = (t: string) => (
    <Text style={cell({ width: 58, backgroundColor: accent, fontWeight: 700, textAlign: 'center' })}>{t}</Text>
  );
  return (
    <View style={{ borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}`, marginTop: 10 }}>
      <View style={s.row}>
        {label('유효기간')}
        <Text style={cell({ flex: 1 })}>{data.meta.validDate} 까지</Text>
        {label('납 기 일')}
        <Text style={cell({ flex: 1 })}>{data.meta.dueDate}</Text>
        {label('결제조건')}
        <Text style={cell({ flex: 1 })}>{data.meta.paymentCondition}</Text>
      </View>
      <View style={s.row}>
        {label('비 고')}
        <Text style={cell({ flex: 1, minHeight: 34 })}>{data.company?.bigo ?? ''}</Text>
      </View>
    </View>
  );
}

export default function EstimatePdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const accent = styleKey === '0' ? '#EFEFEF' : p.accent;
  const headerBg = styleKey === '0' ? '#EFEFEF' : p.primary;
  const headerColor = styleKey === '0' ? '#111' : '#FFFFFF';

  const title = () => {
    if (styleKey === '1' || styleKey === '4')
      return (
        <View style={{ backgroundColor: p.primary, padding: 11, flexDirection: 'row', alignItems: 'center' }}>
          {c?.logo ? (
            <View style={{ backgroundColor: '#fff', padding: 3, marginRight: 12 }}>
              <Image src={c.logo} style={{ width: 28, height: 28 }} />
            </View>
          ) : null}
          <Text style={{ flex: 1, fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: 8 }}>견 적 서</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8.5, color: '#fff' }}>견적일자 {data.meta.today}</Text>
            <Text style={{ fontSize: 8.5, color: '#fff', marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
          </View>
        </View>
      );
    if (styleKey === '2')
      return (
        <View>
          <View style={{ height: 4, backgroundColor: p.primary }} />
          <View style={{ ...s.spread, marginTop: 10, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {c?.logo ? <Image src={c.logo} style={{ width: 32, height: 32, marginRight: 10 }} /> : null}
              <Text style={{ fontSize: 23, fontWeight: 700, letterSpacing: 7 }}>견 적 서</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8.5 }}>견적일자 {data.meta.today}</Text>
              <Text style={{ fontSize: 8.5, marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: LINE, marginTop: 8 }} />
        </View>
      );
    // 0 · 3 — 가운데 제목
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 90 }}>{c?.logo ? <Image src={c.logo} style={{ width: 36, height: 36 }} /> : null}</View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 25, fontWeight: 700, letterSpacing: 13 }}>견 적 서</Text>
            <View
              style={{
                width: 150,
                height: styleKey === '3' ? 3 : 2,
                backgroundColor: styleKey === '3' ? p.primary : LINE,
                marginTop: 6,
              }}
            />
          </View>
          <View style={{ width: 90, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8.5 }}>견적일자 {data.meta.today}</Text>
            <Text style={{ fontSize: 8.5, marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Document title={`견적서_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={s.page}>
        {title()}

        {/* 수신 · 공급자 */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ width: 190, border: `1px solid ${LINE}`, padding: 9, marginRight: 8 }}>
            <Text style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 4 }}>수 신</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>
              {data.customer?.name ?? ''} <Text style={{ fontSize: 10, fontWeight: 400 }}>귀하</Text>
            </Text>
            {customerAddress(data.customer) ? (
              <Text style={{ fontSize: 8, color: '#444', marginTop: 3 }}>{customerAddress(data.customer)}</Text>
            ) : null}
            {data.customer?.phone ? (
              <Text style={{ fontSize: 8, color: '#444', marginTop: 1 }}>{data.customer.phone}</Text>
            ) : null}
            <Text style={{ fontSize: 9, marginTop: 8 }}>아래와 같이 견적합니다.</Text>
          </View>
          <View style={{ flex: 1 }}>
            <SupplierGrid data={data} accent={accent} />
          </View>
        </View>

        {/* 합계금액 */}
        <View style={{ flexDirection: 'row', border: `2px solid ${LINE}`, marginTop: 12 }}>
          <View
            style={{
              width: 104,
              backgroundColor: accent,
              borderRight: `1px solid ${LINE}`,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 8.5, fontWeight: 700 }}>합계금액</Text>
            <Text style={{ fontSize: 7, marginTop: 1 }}>(공급가액 + 세액)</Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>一金 {data.totalAmountKor}整</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: p.primary }}>₩ {money(data.totals.totalAmount)}</Text>
          </View>
        </View>

        <View style={{ ...s.spread, marginTop: 9 }}>
          <Text style={{ fontSize: 8.5, color: '#333' }}>{taxText(data.hasTaxFree)}</Text>
          <Text style={{ fontSize: 8, color: '#666' }}>
            총 {data.totals.totalItems}개 품목 · 수량 {money(data.totals.totalQuantity)}
          </Text>
        </View>

        <ItemGrid data={data} accent={accent} headerBg={headerBg} headerColor={headerColor} />
        <Conditions data={data} accent={accent} />

        <Text style={{ fontSize: 8, color: '#555', marginTop: 6 }}>
          {data.hasTaxFree ? '* 표시는 비과세 항목입니다.   ' : ''}본 견적서는 {data.meta.validDate} 까지 유효하며, 현장
          상황에 따라 금액이 조정될 수 있습니다.
        </Text>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>
            {c?.name ?? ''}
            {c?.phone ? <Text style={{ fontWeight: 400, color: '#444' }}>   {c.phone}</Text> : null}
          </Text>
        </View>

        <Text style={{ position: 'absolute', bottom: 14, right: 32, fontSize: 6, color: '#BDBDBD' }}>
          Made by 도배르만
        </Text>
      </Page>
    </Document>
  );
}
