'use client';
/* eslint-disable jsx-a11y/alt-text -- 여기 <Image> 는 HTML img 가 아니라 @react-pdf/renderer 의 PDF 요소다 */

// 영수증 PDF — 진짜 벡터 PDF (@react-pdf/renderer)
// 문구는 앱 그대로: "위 금액을 정히 영수합니다." / 클래식은 "위 금액을 정히 영수함." / "{회사명} 드림"

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { money, companyAddress } from '../docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 36, paddingHorizontal: 38, fontFamily: 'NotoSansKR', fontSize: 9 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

function ItemTable({ data, p, headerBg, headerColor }: { data: DocData; p: DocPalette; headerBg: string; headerColor: string }) {
  const head = ['품목', '수량', '단가', '금액'];
  const widths = [0, 52, 78, 92];
  const align: ('left' | 'right')[] = ['left', 'right', 'right', 'right'];
  const cell = (i: number, isHeader: boolean) => ({
    width: widths[i] === 0 ? undefined : widths[i],
    flex: widths[i] === 0 ? 1 : undefined,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: isHeader ? 8.5 : 9,
    textAlign: align[i],
    color: isHeader ? headerColor : p.textDark,
    fontWeight: (isHeader ? 700 : 400) as 400 | 700,
  });
  const rows = data.items.map((it) => [
    [it.itemName ?? '', it.itemSpec].filter(Boolean).join(' · '),
    money(it.quantity),
    money(it.unitPrice),
    money(it.totalAmount),
  ]);
  return (
    <View>
      <View style={{ flexDirection: 'row', backgroundColor: headerBg }}>
        {head.map((h, i) => (
          <Text key={h} style={cell(i, true)}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={{ flexDirection: 'row', borderBottom: `1px solid ${p.border}` }}>
          {r.map((v, i) => (
            <Text key={i} style={{ ...cell(i, false), fontWeight: i === 3 ? 700 : 400 }}>
              {v}
            </Text>
          ))}
        </View>
      ))}
      {Array.from({ length: Math.max(0, 6 - rows.length) }).map((_, i) => (
        <View key={`b${i}`} style={{ flexDirection: 'row', borderBottom: `1px solid ${p.border}`, height: 19 }}>
          <Text style={{ fontSize: 8 }}> </Text>
        </View>
      ))}
    </View>
  );
}

function Supplier({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  const line = (label: string, value?: string | null) =>
    value ? (
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        <Text style={{ width: 66, fontSize: 8, color: p.textLight }}>{label}</Text>
        <Text style={{ flex: 1, fontSize: 8, color: p.textDark }}>{value}</Text>
      </View>
    ) : null;
  return (
    <View style={{ border: `1px solid ${p.border}`, padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 9, fontWeight: 700, color: p.textDark }}>공급자</Text>
          <Text style={{ fontSize: 11, fontWeight: 700, color: p.textDark, marginTop: 4, marginBottom: 4 }}>
            {c?.name ?? ''}
          </Text>
        </View>
        {c?.stamp ? <Image src={c.stamp} style={{ width: 30, height: 30 }} /> : null}
      </View>
      {line('대표', c?.owner)}
      {line('사업자등록번호', formatBizNoLoose(c?.bizno))}
      {line('주소', companyAddress(c))}
      {line('업태/종목', [c?.type, c?.kind].filter(Boolean).join(' / '))}
      {line('연락처', c?.phone)}
    </View>
  );
}

export default function ReceiptPdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const sentence = styleKey === '2' ? '위 금액을 정히 영수함.' : '위 금액을 정히 영수합니다.';

  // 기본(0) — 국세청 영수증 서식 모양의 표
  if (styleKey === '0') {
    const cellBase = { border: '1px solid #111', paddingVertical: 5, paddingHorizontal: 6, fontSize: 9 };
    const label = { ...cellBase, width: 86, backgroundColor: '#F3F4F6', fontWeight: 700 as const };
    return (
      <Document title={`영수증_${data.customer?.name ?? ''}`}>
        <Page size="A4" style={s.page}>
          <Text style={{ fontSize: 26, fontWeight: 700, letterSpacing: 12, textAlign: 'center' }}>영 수 증</Text>
          <Text style={{ fontSize: 9, color: '#555', textAlign: 'center', marginTop: 4, marginBottom: 14 }}>
            No. {data.meta.docNumber} · {data.meta.today}
          </Text>

          <View style={{ flexDirection: 'row' }}>
            <Text style={label}>성명(상호)</Text>
            <Text style={{ ...cellBase, flex: 1, fontWeight: 700 }}>{data.customer?.name ?? ''} 귀하</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={label}>금액</Text>
            <Text style={{ ...cellBase, flex: 1, fontSize: 12, fontWeight: 700 }}>
              ₩ {money(data.totals.totalAmount)} 원 (일금 {data.totalAmountKor})
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={label}>등록번호</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{formatBizNoLoose(c?.bizno)}</Text>
            <Text style={label}>상호</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{c?.name ?? ''}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={label}>대표자</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{c?.owner ?? ''}</Text>
            <Text style={label}>연락처</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{c?.phone ?? ''}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={label}>사업장 주소</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{companyAddress(c)}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Text style={label}>업태 / 종목</Text>
            <Text style={{ ...cellBase, flex: 1 }}>{[c?.type, c?.kind].filter(Boolean).join(' / ')}</Text>
          </View>

          <View style={{ border: '1px solid #111' }}>
            <ItemTable data={data} p={{ ...p, border: '#111' }} headerBg="#F3F4F6" headerColor="#111" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <Text style={{ fontSize: 9, color: '#555', marginRight: 10 }}>공급가액 {money(data.totals.supplyAmount)}원</Text>
            <Text style={{ fontSize: 9, color: '#555', marginRight: 10 }}>세액 {money(data.totals.vatAmount)}원</Text>
            <Text style={{ fontSize: 9.5, fontWeight: 700 }}>합계 {money(data.totals.totalAmount)}원</Text>
          </View>

          <View style={{ ...s.spread, marginTop: 22, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10 }}>{sentence}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: 700, marginRight: 6 }}>{c?.name ?? ''} 드림</Text>
              {c?.stamp ? <Image src={c.stamp} style={{ width: 30, height: 30 }} /> : null}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  // 1 심플 · 2 클래식 · 3 카드 · 4 컬러
  const titleBlock = () => {
    if (styleKey === '3')
      return (
        <View style={{ backgroundColor: p.primary, padding: 14 }}>
          <View style={s.spread}>
            <Text style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: 5 }}>영 수 증</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8.5, color: '#fff' }}>No. {data.meta.docNumber}</Text>
              <Text style={{ fontSize: 8.5, color: '#fff', marginTop: 2 }}>{data.meta.today}</Text>
            </View>
          </View>
        </View>
      );
    if (styleKey === '2')
      return (
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: p.primary, letterSpacing: 10 }}>영 수 증</Text>
          <Text style={{ fontSize: 8.5, color: p.textLight, marginTop: 5 }}>
            No. {data.meta.docNumber} · {data.meta.today}
          </Text>
        </View>
      );
    return (
      <View
        style={{
          ...s.spread,
          alignItems: 'flex-end',
          borderBottom: `2px solid ${p.primary}`,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 700, color: p.primary, letterSpacing: 5 }}>영 수 증</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 8.5, color: p.textLight }}>No. {data.meta.docNumber}</Text>
          <Text style={{ fontSize: 8.5, color: p.textLight, marginTop: 2 }}>{data.meta.today}</Text>
        </View>
      </View>
    );
  };

  return (
    <Document title={`영수증_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={s.page}>
        {titleBlock()}

        <View style={{ ...s.spread, backgroundColor: p.accent, padding: 12, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 8.5, color: p.textLight, marginRight: 12 }}>받는 분</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, color: p.textDark }}>{data.customer?.name ?? ''} 귀하</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: p.primary }}>{money(data.totals.totalAmount)}원</Text>
            <Text style={{ fontSize: 8, color: p.textLight, marginTop: 2 }}>{data.totalAmountKor}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 20, marginBottom: 8, color: p.textDark }}>품목 내역</Text>
        <ItemTable data={data} p={p} headerBg={styleKey === '1' ? p.accent : p.primary} headerColor={styleKey === '1' ? p.textDark : '#FFFFFF'} />

        <View style={{ marginTop: 24 }}>
          <Supplier data={data} p={p} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ fontSize: 9.5, color: p.textLight }}>{sentence}</Text>
          <Text style={{ fontSize: 10.5, fontWeight: 700, color: p.textDark, marginTop: 8 }}>{c?.name ?? ''} 드림</Text>
        </View>

        <Text style={{ position: 'absolute', bottom: 16, right: 38, fontSize: 6, color: '#BDBDBD' }}>
          Made by 도배르만
        </Text>
      </Page>
    </Document>
  );
}
