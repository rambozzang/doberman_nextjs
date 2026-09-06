'use client';
/* eslint-disable jsx-a11y/alt-text -- 여기 <Image> 는 HTML img 가 아니라 @react-pdf/renderer 의 PDF 요소다 */

// 영수증 PDF — 화면(ReceiptDoc)과 같은 한국 실무 영수증 서식을 벡터로.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { money, companyAddress } from '../docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const LINE = '#111111';
const ROWS = 8;

const s = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 38, paddingHorizontal: 40, fontFamily: 'NotoSansKR', fontSize: 9, color: '#111' },
  row: { flexDirection: 'row' },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

const cell = (extra: object = {}) => ({
  borderRight: `1px solid ${LINE}`,
  borderBottom: `1px solid ${LINE}`,
  paddingVertical: 4,
  paddingHorizontal: 5,
  fontSize: 8.5,
  ...extra,
});

function SupplierGrid({ data, accent }: { data: DocData; accent: string }) {
  const c = data.company;
  const label = (t: string, w: number) => (
    <Text style={cell({ width: w, backgroundColor: accent, fontWeight: 700, textAlign: 'center' })}>{t}</Text>
  );
  return (
    <View style={{ borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}`, marginTop: 12 }}>
      <View style={s.row}>
        <View
          style={{
            width: 22,
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
            {label('등록번호', 66)}
            <Text style={cell({ flex: 1 })}>{formatBizNoLoose(c?.bizno)}</Text>
          </View>
          <View style={s.row}>
            {label('상 호', 66)}
            <Text style={cell({ flex: 1, fontWeight: 700 })}>{c?.name ?? ''}</Text>
            {label('성 명', 44)}
            <View style={cell({ width: 100, position: 'relative' })}>
              <Text style={{ fontSize: 8.5 }}>
                {c?.owner ?? ''} <Text style={{ color: '#555' }}>(인)</Text>
              </Text>
              {c?.stamp ? (
                <Image src={c.stamp} style={{ position: 'absolute', right: 3, top: -4, width: 30, height: 30 }} />
              ) : null}
            </View>
          </View>
          <View style={s.row}>
            {label('사업장주소', 66)}
            <Text style={cell({ flex: 1 })}>{companyAddress(c)}</Text>
          </View>
          <View style={s.row}>
            {label('업 태', 66)}
            <Text style={cell({ flex: 1 })}>{c?.type ?? ''}</Text>
            {label('종 목', 44)}
            <Text style={cell({ width: 100 })}>{c?.kind ?? ''}</Text>
          </View>
          <View style={s.row}>
            {label('전 화', 66)}
            <Text style={cell({ flex: 1 })}>{c?.phone ?? ''}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ItemGrid({ data, accent, headerBg, headerColor }: { data: DocData; accent: string; headerBg: string; headerColor: string }) {
  const w = [26, 0, 74, 44, 74, 88];
  const heads = ['No', '품 명', '규 격', '수량', '단 가', '금 액'];
  const align: ('left' | 'center' | 'right')[] = ['center', 'left', 'center', 'right', 'right', 'right'];
  const c = (i: number, extra: object = {}) =>
    cell({ width: w[i] === 0 ? undefined : w[i], flex: w[i] === 0 ? 1 : undefined, textAlign: align[i], ...extra });

  const rows = data.items.map((it, i) => [
    String(i + 1),
    it.itemName ?? '',
    [it.itemSpec, it.unit].filter(Boolean).join(' / '),
    money(it.quantity),
    money(it.unitPrice),
    money(it.totalAmount),
  ]);

  return (
    <View style={{ borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}`, marginTop: 10 }}>
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
            <Text key={i} style={c(i, { minHeight: 16, fontWeight: i === 1 || i === 5 ? 700 : 400 })}>
              {v}
            </Text>
          ))}
        </View>
      ))}
      {Array.from({ length: Math.max(0, ROWS - rows.length) }).map((_, bi) => (
        <View key={`b${bi}`} style={s.row}>
          {heads.map((_h, i) => (
            <Text key={i} style={c(i, { minHeight: 16, color: '#BBB' })}>
              {i === 0 ? String(rows.length + bi + 1) : ' '}
            </Text>
          ))}
        </View>
      ))}
      <View style={s.row}>
        <Text style={cell({ flex: 1, backgroundColor: accent, fontWeight: 700, textAlign: 'center', letterSpacing: 4 })}>
          합 계
        </Text>
        <Text style={cell({ width: w[5], backgroundColor: accent, fontWeight: 700, textAlign: 'right', fontSize: 10 })}>
          {money(data.totals.totalAmount)}
        </Text>
      </View>
    </View>
  );
}

export default function ReceiptPdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const accent = styleKey === '0' ? '#EFEFEF' : p.accent;
  const headerBg = styleKey === '0' ? '#EFEFEF' : p.primary;
  const headerColor = styleKey === '0' ? '#111' : '#FFFFFF';
  const sentence = styleKey === '2' ? '위 금액을 정히 영수함.' : '위 금액을 정히 영수합니다.';

  const title = () => {
    if (styleKey === '3' || styleKey === '4')
      return (
        <View style={{ backgroundColor: p.primary, padding: 11, flexDirection: 'row', alignItems: 'center' }}>
          {c?.logo ? (
            <View style={{ backgroundColor: '#fff', padding: 3, marginRight: 12 }}>
              <Image src={c.logo} style={{ width: 26, height: 26 }} />
            </View>
          ) : null}
          <Text style={{ flex: 1, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 9 }}>영 수 증</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8.5, color: '#fff' }}>발행일자 {data.meta.today}</Text>
            <Text style={{ fontSize: 8.5, color: '#fff', marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
          </View>
        </View>
      );
    if (styleKey === '1')
      return (
        <View>
          <View style={{ ...s.spread, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {c?.logo ? <Image src={c.logo} style={{ width: 30, height: 30, marginRight: 10 }} /> : null}
              <Text style={{ fontSize: 22, fontWeight: 700, letterSpacing: 8 }}>영 수 증</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8.5 }}>발행일자 {data.meta.today}</Text>
              <Text style={{ fontSize: 8.5, marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
            </View>
          </View>
          <View style={{ height: 3, backgroundColor: p.primary, marginTop: 8 }} />
        </View>
      );
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 92 }}>{c?.logo ? <Image src={c.logo} style={{ width: 34, height: 34 }} /> : null}</View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 25, fontWeight: 700, letterSpacing: 14, color: styleKey === '2' ? p.primary : '#111' }}>
            영 수 증
          </Text>
          <View
            style={{
              width: 142,
              height: styleKey === '2' ? 3 : 2,
              backgroundColor: styleKey === '2' ? p.primary : LINE,
              marginTop: 6,
            }}
          />
        </View>
        <View style={{ width: 92, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 8.5 }}>발행일자 {data.meta.today}</Text>
          <Text style={{ fontSize: 8.5, marginTop: 2 }}>문서번호 {data.meta.docNumber}</Text>
        </View>
      </View>
    );
  };

  return (
    <Document title={`영수증_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={s.page}>
        {title()}

        {/* 받는 분 */}
        <View style={{ flexDirection: 'row', border: `1px solid ${LINE}`, marginTop: 12 }}>
          <View
            style={{
              width: 84,
              backgroundColor: accent,
              borderRight: `1px solid ${LINE}`,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 8.5, fontWeight: 700 }}>받는 분</Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', padding: 7 }}>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>{data.customer?.name ?? ''}</Text>
            <Text style={{ fontSize: 10, marginLeft: 6 }}>귀하</Text>
            {data.customer?.phone ? (
              <Text style={{ fontSize: 8, color: '#555', marginLeft: 10 }}>{data.customer.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* 금액 */}
        <View style={{ flexDirection: 'row', border: `2px solid ${LINE}`, borderTopWidth: 0 }}>
          <View
            style={{
              width: 84,
              backgroundColor: accent,
              borderRight: `1px solid ${LINE}`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 8.5, fontWeight: 700 }}>금 액</Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>一金 {data.totalAmountKor}整</Text>
            <Text style={{ fontSize: 16, fontWeight: 700, color: p.primary }}>₩ {money(data.totals.totalAmount)}</Text>
          </View>
        </View>

        <SupplierGrid data={data} accent={accent} />
        <ItemGrid data={data} accent={accent} headerBg={headerBg} headerColor={headerColor} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
          <Text style={{ fontSize: 8, color: '#444', marginRight: 12 }}>공급가액 {money(data.totals.supplyAmount)}원</Text>
          <Text style={{ fontSize: 8, color: '#444' }}>세액 {money(data.totals.vatAmount)}원</Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <Text style={{ fontSize: 11 }}>{sentence}</Text>
          <Text style={{ fontSize: 9, color: '#444', marginTop: 9 }}>{data.meta.today}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, marginRight: 6 }}>{c?.name ?? ''}</Text>
            <Text style={{ fontSize: 10, marginRight: 4 }}>{c?.owner ?? ''}</Text>
            <Text style={{ fontSize: 9, color: '#555', marginRight: 4 }}>(인)</Text>
            {c?.stamp ? <Image src={c.stamp} style={{ width: 30, height: 30 }} /> : null}
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 16, right: 40, fontSize: 6, color: '#BDBDBD' }}>
          Made by 도배르만
        </Text>
      </Page>
    </Document>
  );
}
