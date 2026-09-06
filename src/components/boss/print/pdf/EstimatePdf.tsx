'use client';
/* eslint-disable jsx-a11y/alt-text -- 여기 <Image> 는 HTML img 가 아니라 @react-pdf/renderer 의 PDF 요소다 */

// 견적서 PDF — 진짜 벡터 PDF (@react-pdf/renderer)
//
// 예전에는 화면을 html2canvas 로 캡처해 이미지로 넣었다. 글자가 이미지라 흐릿하고,
// 확대하면 깨지고, 복사도 안 됐다. 앱은 pdf 패키지로 벡터 PDF 를 만든다.
// 여기서도 같은 방식으로 문서를 그린다 — 글자는 글자로, 선은 선으로 들어간다.
//
// 한글은 NotoSansKR 서브셋(KS X 1001 상용 2,350자)을 /public/fonts 에서 불러 넣는다.
// 앱 PDF 도 NotoSansKR 을 쓴다.

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { money, taxText, companyAddress, customerAddress } from '../docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

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
  // 한글은 단어 단위로 끊어야 줄바꿈이 자연스럽다
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 34, fontFamily: 'NotoSansKR', fontSize: 9 },
  row: { flexDirection: 'row' },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bold: { fontWeight: 700 },
});

function InfoLine({ label, value, p, w = 54 }: { label: string; value?: string | null; p: DocPalette; w?: number }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
      <Text style={{ width: w, color: p.textLight, fontSize: 8 }}>{label}</Text>
      <Text style={{ flex: 1, color: p.textDark, fontSize: 8 }}>{value}</Text>
    </View>
  );
}

/** 품목 표 (9열) */
function ItemTable({ data, p, headerBg, headerColor }: { data: DocData; p: DocPalette; headerBg: string; headerColor: string }) {
  const cols = [22, 0, 62, 32, 36, 54, 62, 50, 66]; // 0 = 남는 폭
  const head = ['No.', '품명', '규격', '단위', '수량', '단가', '공급가액', '세액', '합계'];
  const align: ('left' | 'center' | 'right')[] = ['center', 'left', 'left', 'center', 'right', 'right', 'right', 'right', 'right'];

  const cell = (i: number, isHeader: boolean) => ({
    width: cols[i] === 0 ? undefined : cols[i],
    flex: cols[i] === 0 ? 1 : undefined,
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: isHeader ? 8 : 8.5,
    textAlign: align[i],
    color: isHeader ? headerColor : p.textDark,
    fontWeight: (isHeader ? 700 : 400) as 400 | 700,
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
    money(it.totalAmount),
  ]);
  const blanks = Math.max(0, 8 - rows.length);

  return (
    <View style={{ borderTop: `1px solid ${p.border}` }}>
      <View style={{ flexDirection: 'row', backgroundColor: headerBg }}>
        {head.map((h, i) => (
          <Text key={h} style={cell(i, true)}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={{ flexDirection: 'row', borderBottom: `0.5px solid ${p.border}` }}>
          {r.map((v, i) => (
            <Text key={i} style={{ ...cell(i, false), fontWeight: i === 8 ? 700 : 400 }}>
              {v}
            </Text>
          ))}
        </View>
      ))}
      {Array.from({ length: blanks }).map((_, i) => (
        <View key={`b${i}`} style={{ flexDirection: 'row', borderBottom: `0.5px solid ${p.border}`, height: 17 }}>
          <Text style={{ fontSize: 8 }}> </Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ data, p }: { data: DocData; p: DocPalette }) {
  const line = (label: string, value: string, first = false) => (
    <View style={{ flexDirection: 'row', borderTop: first ? undefined : `1px solid ${p.border}` }}>
      <Text style={{ width: 64, padding: 4, fontSize: 8, color: p.textLight, backgroundColor: p.accent }}>{label}</Text>
      <Text style={{ flex: 1, padding: 4, fontSize: 8, color: p.textDark }}>{value}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        {data.hasTaxFree ? (
          <Text style={{ fontSize: 7.5, color: p.textLight, marginBottom: 4 }}>* 표시는 비과세 항목입니다.</Text>
        ) : null}
        <Text style={{ fontSize: 8.5, fontWeight: 700, color: p.textDark, marginBottom: 2 }}>비고</Text>
        <Text style={{ fontSize: 8, color: p.textLight }}>{data.company?.bigo ?? ''}</Text>
      </View>
      <View style={{ width: 170, border: `1px solid ${p.border}` }}>
        {line('유효기간', data.meta.validDate, true)}
        {line('결제조건', data.meta.paymentCondition)}
        {line('참조', data.meta.reference)}
      </View>
    </View>
  );
}

function Supplier({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <>
      <InfoLine label="대표" value={c?.owner} p={p} />
      <InfoLine label="사업자번호" value={formatBizNoLoose(c?.bizno)} p={p} />
      <InfoLine label="주소" value={companyAddress(c)} p={p} />
      <InfoLine label="업태 / 종목" value={[c?.type, c?.kind].filter(Boolean).join(' / ')} p={p} />
      <InfoLine label="연락처" value={c?.phone} p={p} />
      <InfoLine label="담당" value={[data.user?.name, data.user?.phone].filter(Boolean).join(' ')} p={p} />
    </>
  );
}

function AmountBar({ data, p, variant }: { data: DocData; p: DocPalette; variant: 'rule' | 'box' | 'left' | 'soft' }) {
  const inner = (
    <>
      <Text style={{ fontSize: 9.5, color: p.textDark }}>{taxText(data.hasTaxFree)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ fontSize: 8.5, color: p.textLight, marginRight: 6 }}>{data.totalAmountKor}</Text>
        <Text style={{ fontSize: 14, fontWeight: 700, color: p.primary }}>₩ {money(data.totals.totalAmount)}</Text>
      </View>
    </>
  );
  const base = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 8, marginTop: 12 };
  if (variant === 'rule')
    return <View style={{ ...base, borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>{inner}</View>;
  if (variant === 'box') return <View style={{ ...base, border: `2px solid ${p.primary}` }}>{inner}</View>;
  if (variant === 'left')
    return <View style={{ ...base, backgroundColor: p.accent, borderLeft: `4px solid ${p.primary}` }}>{inner}</View>;
  return <View style={{ ...base, backgroundColor: p.accent }}>{inner}</View>;
}

export default function EstimatePdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const logo = c?.logo || undefined;
  const stamp = c?.stamp || undefined;

  // 양식별 머리 부분
  const header = () => {
    if (styleKey === '1')
      return (
        <View style={{ backgroundColor: p.primary, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
          {logo ? <Image src={logo} style={{ width: 34, height: 34, marginRight: 12 }} /> : null}
          <Text style={{ flex: 1, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 4 }}>견 적 서</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: '#fff' }}>No. {data.meta.docNumber}</Text>
            <Text style={{ fontSize: 8.5, color: p.accent, marginTop: 3 }}>{data.meta.today}</Text>
          </View>
        </View>
      );
    if (styleKey === '2')
      return (
        <View>
          <View style={{ height: 3, backgroundColor: p.primary }} />
          <View style={{ ...s.spread, marginTop: 12, alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontSize: 8, color: p.textLight, letterSpacing: 3 }}>ESTIMATE</Text>
              <Text style={{ fontSize: 25, fontWeight: 700, color: p.textDark, letterSpacing: 3, marginTop: 2 }}>견 적 서</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {logo ? <Image src={logo} style={{ width: 34, height: 34, marginRight: 10 }} /> : null}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8.5, color: p.textLight }}>No. {data.meta.docNumber}</Text>
                <Text style={{ fontSize: 8.5, color: p.textDark, marginTop: 2 }}>{data.meta.today}</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: p.border, marginTop: 10 }} />
        </View>
      );
    if (styleKey === '4')
      return (
        <View style={{ backgroundColor: p.primary, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: '#fff', letterSpacing: 3 }}>QUOTATION</Text>
            <Text style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: 3, marginTop: 2 }}>견 적 서</Text>
          </View>
          {logo ? <Image src={logo} style={{ width: 30, height: 30, marginRight: 12 }} /> : null}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8.5, color: '#fff' }}>No. {data.meta.docNumber}</Text>
            <Text style={{ fontSize: 8.5, color: '#CCFBF1', marginTop: 2 }}>{data.meta.today}</Text>
          </View>
        </View>
      );
    // 0 기본 · 3 토프 — 가운데 제목
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 80 }}>{logo ? <Image src={logo} style={{ width: 40, height: 40 }} /> : null}</View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 700, letterSpacing: 6, color: p.textDark }}>견 적 서</Text>
          {styleKey === '3' ? <View style={{ height: 2, width: 84, backgroundColor: p.primary, marginTop: 5 }} /> : null}
        </View>
        <View style={{ width: 110, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9.5, color: p.textDark }}>No. {data.meta.docNumber}</Text>
          <Text style={{ fontSize: 8.5, color: p.textLight, marginTop: 2 }}>{data.meta.today}</Text>
          {styleKey === '0' ? <View style={{ height: 1, width: 110, backgroundColor: '#000', marginTop: 2 }} /> : null}
        </View>
      </View>
    );
  };

  const parties = () => (
    <View style={{ flexDirection: 'row', marginTop: 14 }}>
      <View
        style={{
          flex: 1,
          marginRight: 10,
          padding: 10,
          border: styleKey === '2' ? undefined : `1px solid ${p.border}`,
          backgroundColor: styleKey === '4' ? p.accent : undefined,
        }}
      >
        <Text style={{ fontSize: 8, color: p.textLight }}>{styleKey === '2' ? 'TO' : '수 신'}</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: p.textDark, marginTop: 5 }}>
          {data.customer?.name ?? ''} {styleKey === '0' ? '귀중' : '귀하'}
        </Text>
        <Text style={{ fontSize: 8, color: p.textLight, marginTop: 3 }}>{customerAddress(data.customer)}</Text>
        <Text style={{ fontSize: 8, color: p.textLight }}>{data.customer?.phone ?? ''}</Text>
      </View>
      <View
        style={{
          flex: 1,
          padding: 10,
          border: styleKey === '2' ? undefined : `1px solid ${p.border}`,
          backgroundColor: styleKey === '1' || styleKey === '3' ? p.accent : undefined,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 8, color: p.textLight }}>{styleKey === '2' ? 'FROM' : '공급자'}</Text>
          {stamp ? <Image src={stamp} style={{ width: 28, height: 28 }} /> : null}
        </View>
        <Text style={{ fontSize: 11, fontWeight: 700, color: p.textDark, marginTop: 3, marginBottom: 4 }}>{c?.name ?? ''}</Text>
        <Supplier data={data} p={p} />
      </View>
    </View>
  );

  const barVariant = styleKey === '0' ? 'rule' : styleKey === '1' ? 'box' : styleKey === '2' ? 'left' : 'soft';

  return (
    <Document title={`견적서_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={s.page}>
        {header()}
        {parties()}
        {styleKey === '0' ? (
          <Text style={{ fontSize: 11, marginTop: 12 }}>아래와 같이 견적합니다.</Text>
        ) : null}
        <AmountBar data={data} p={p} variant={barVariant as 'rule' | 'box' | 'left' | 'soft'} />
        <View style={{ marginTop: 10 }}>
          <ItemTable data={data} p={p} headerBg={styleKey === '2' ? p.textDark : p.primary} headerColor="#FFFFFF" />
        </View>
        <Footer data={data} p={p} />
        <Text style={{ position: 'absolute', bottom: 14, right: 34, fontSize: 6, color: '#BDBDBD' }}>
          Made by 도배르만
        </Text>
      </Page>
    </Document>
  );
}
