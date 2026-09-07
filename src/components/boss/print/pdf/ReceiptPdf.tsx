'use client';

// 영수증 PDF — 한국 실무 영수증(간이영수증) 서식을 벡터로 그린다.
//
//   제목 → 받는 분(왼쪽) · 공급자(오른쪽) → 금액 "一金 ○○원整 위 금액을 정히 영수함"
//   → 항목 표(페이지 바닥까지) → 결제 · 비고 → 영수 문구 · 날짜 · 도장
//
// 화면 미리보기도 이 PDF 를 그대로 띄우므로(PdfPreview) 여기가 유일한 원본이다.

import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { DocData, DocPalette } from '../docTypes';
import { money, customerAddress } from '../docTypes';
import { formatPhone } from '@/lib/boss/format';
import {
  base,
  formColors,
  registerPdfFont,
  TitleBlock,
  SupplierGrid,
  AmountBox,
  ItemTable,
  Box,
  Row,
  Cell,
  Label,
  Stamp,
  LINE,
  THIN,
  ROW_H,
  type Column,
} from './form';

export { registerPdfFont };

/** 항목 표가 이 줄 수까지 빈 칸을 채운다 — 영수증은 아래 영수 문구 자리가 필요해 견적서보다 적다 */
const MIN_ROWS = 21;

const COLUMNS: Column[] = [
  { head: 'No', w: 24, align: 'center' },
  { head: '품 명', align: 'left', bold: true },
  { head: '규 격', w: 60, align: 'center' },
  { head: '수 량', w: 40, align: 'right' },
  { head: '단 가', w: 62, align: 'right' },
  { head: '공급가액', w: 68, align: 'right' },
  { head: '세 액', w: 56, align: 'right' },
  { head: '비 고', w: 52, align: 'left' },
];

/** 받는 분 — 왼쪽 라벨 격자. 공급자 격자와 높이를 맞춘다(5줄) */
function Payer({ data, label }: { data: DocData; label: string }) {
  const cu = data.customer;
  return (
    <Box style={{ flex: 1 }}>
      <Row>
        <Label w={52} bg={label}>받는 분</Label>
        <Cell last bold size={10}>
          {cu?.name ?? ''}
          <Text style={{ fontSize: 8.5, fontWeight: 400 }}>{'  '}귀하</Text>
        </Cell>
      </Row>
      <Row>
        <Label w={52} bg={label}>연락처</Label>
        <Cell last>{cu?.phone ? formatPhone(cu.phone) : ''}</Cell>
      </Row>
      <Row>
        <Label w={52} bg={label}>현 장</Label>
        <Cell last size={8}>{customerAddress(cu)}</Cell>
      </Row>
      <Row>
        <Label w={52} bg={label}>영수일자</Label>
        <Cell last>{data.meta.today}</Cell>
      </Row>
      <Row>
        <Label w={52} bg={label} bottom>결제방법</Label>
        <Cell last bottom>{data.meta.paymentCondition}</Cell>
      </Row>
    </Box>
  );
}

export default function ReceiptPdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const colors = formColors(p, styleKey);
  const c = data.company;

  const rows = data.items.map((it, i) => [
    String(i + 1),
    `${it.itemName ?? ''}${it.isTaxFree === 'Y' ? ' *' : ''}`,
    it.itemSpec ?? '',
    money(it.quantity),
    money(it.unitPrice),
    money(it.supplyAmount),
    money(it.vatAmount),
    it.memo ?? '',
  ]);

  return (
    <Document title={`영수증_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={base.page}>
        <TitleBlock title="영수증" data={data} p={p} styleKey={styleKey} dateLabel="영수일자" />

        {/* 받는 분 · 공급자 */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Payer data={data} label={colors.label} />
          <View style={{ width: 8 }} />
          <View style={{ width: 300 }}>
            <SupplierGrid data={data} label={colors.label} />
          </View>
        </View>

        <View style={{ height: 10 }} />

        <AmountBox
          title="금 액"
          kor={data.totalAmountKor}
          amount={money(data.totals.totalAmount)}
          note={data.hasTaxFree ? 'VAT 별도' : 'VAT 포함'}
          label={colors.label}
          strong={colors.strong}
        />
        <Text style={{ fontSize: 9.5, fontWeight: 700, textAlign: 'center', marginTop: 6, marginBottom: 6, letterSpacing: 2 }}>
          위 금액을 정히 영수합니다.
        </Text>

        <ItemTable
          columns={COLUMNS}
          rows={rows}
          minRows={MIN_ROWS}
          footer={{
            span: 5,
            values: [money(data.totals.supplyAmount), money(data.totals.vatAmount), ''],
          }}
          headBg={colors.headBg}
          headFg={colors.headFg}
          label={colors.label}
        />

        {/* 비고 */}
        <View style={{ marginTop: 8 }}>
          <Box>
            <Row>
              <Label w={52} bg={colors.label} h={ROW_H * 2} bottom>비 고</Label>
              <Cell last h={ROW_H * 2} size={8} bottom>
                {c?.bigo ?? ''}
              </Cell>
            </Row>
          </Box>
        </View>

        {/* 영수 확인 — 날짜 · 공급자 · 도장. 실제 영수증의 맨 아래 자리 */}
        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, letterSpacing: 3 }}>{data.meta.today.replace(/\./g, ' . ')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, position: 'relative' }}>
            <Text style={{ fontSize: 8.5, color: '#444', marginRight: 10 }}>공급자</Text>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{c?.name ?? ''}</Text>
            <Text style={{ fontSize: 10, marginLeft: 10 }}>{c?.owner ?? ''}</Text>
            <Text style={{ fontSize: 8.5, color: '#666', marginLeft: 8 }}>(인)</Text>
            {/* 도장은 (인) 글자 위에 크게 */}
            <View style={{ width: 10 }} />
            <Stamp src={c?.stamp} top={7} right={10} size={40} />
          </View>
        </View>

        {/* 바닥 — 항목 수 · 발행처. 절대 위치라 표가 길어져도 자리를 지킨다 */}
        <View
          fixed
          style={{
            position: 'absolute',
            left: 36,
            right: 36,
            bottom: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopWidth: THIN,
            borderColor: LINE,
            paddingTop: 3,
          }}
        >
          <Text style={{ fontSize: 6.5, color: '#888' }}>
            총 {data.totals.totalItems}개 품목 · 수량 {money(data.totals.totalQuantity)}
          </Text>
          <Text style={{ fontSize: 6.5, color: '#888' }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={{ fontSize: 6.5, color: '#BBB' }}>Made by 도배르만</Text>
        </View>
      </Page>
    </Document>
  );
}
