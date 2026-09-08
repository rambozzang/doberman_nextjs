'use client';

// 견적서 PDF — 한국 실무 견적서 서식을 벡터로 그린다.
//
//   제목 → 수신(왼쪽) · 공급자(오른쪽) → 합계금액 → 항목 표(페이지 바닥까지) → 비고 · 조건
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
  BORDER,
  THIN,
  ROW_H,
  type Column,
} from './form';

export { registerPdfFont };

/** 항목 표가 이 줄 수까지 빈 칸을 채운다 — A4 한 장이 꽉 차는 수 */
const MIN_ROWS = 23;

const COLUMNS: Column[] = [
  { head: 'No', w: 24, align: 'center' },
  { head: '품 명', align: 'left' },
  { head: '규 격', w: 60, align: 'center' },
  { head: '단위', w: 30, align: 'center' },
  { head: '수 량', w: 38, align: 'right' },
  { head: '단 가', w: 58, align: 'right' },
  { head: '공급가액', w: 66, align: 'right' },
  { head: '세 액', w: 54, align: 'right' },
  { head: '비 고', w: 52, align: 'left' },
];

/** 수신 — 왼쪽 라벨 격자. 공급자 격자와 높이를 맞춘다(5줄) */
function Recipient({ data, label }: { data: DocData; label: string }) {
  const cu = data.customer;
  const addr = customerAddress(cu);
  return (
    <Box style={{ flex: 1 }}>
      <Row>
        <Label w={52} bg={label}>수 신</Label>
        <Cell last size={10}>
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
        <Cell last size={8}>{addr}</Cell>
      </Row>
      <Row>
        <Label w={52} bg={label}>견적일자</Label>
        <Cell last>{data.meta.today}</Cell>
      </Row>
      <Row>
        <Label w={52} bg={label} bottom>유효기간</Label>
        <Cell last bottom>{data.meta.validDate} 까지</Cell>
      </Row>
    </Box>
  );
}

export default function EstimatePdf({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const colors = formColors(p, styleKey);
  const c = data.company;

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
    <Document title={`견적서_${data.customer?.name ?? ''}`}>
      <Page size="A4" style={base.page}>
        <TitleBlock title="견적서" data={data} p={p} styleKey={styleKey} dateLabel="견적일자" />

        {/* 수신 · 공급자 */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Recipient data={data} label={colors.label} />
          <View style={{ width: 8 }} />
          <View style={{ width: 300 }}>
            <SupplierGrid data={data} label={colors.label} />
          </View>
        </View>

        <Text style={{ fontSize: 9, marginTop: 8, marginBottom: 6 }}>아래와 같이 견적합니다.</Text>

        <AmountBox
          title="합계금액"
          sub="(공급가액 + 세액)"
          kor={data.totalAmountKor}
          amount={money(data.totals.totalAmount)}
          note={data.hasTaxFree ? 'VAT 별도' : 'VAT 포함'}
          label={colors.label}
          strong={colors.strong}
        />

        <View style={{ height: 8 }} />

        <ItemTable
          columns={COLUMNS}
          rows={rows}
          minRows={MIN_ROWS}
          footer={{
            span: 6,
            values: [money(data.totals.supplyAmount), money(data.totals.vatAmount), ''],
          }}
          headBg={colors.headBg}
          headFg={colors.headFg}
          label={colors.label}
        />

        {/* 비고 · 조건 */}
        <View style={{ marginTop: 8 }}>
          <Box>
            <Row>
              <Label w={52} bg={colors.label} h={ROW_H * 2}>비 고</Label>
              <Cell last h={ROW_H * 2} size={8}>
                {c?.bigo ?? ''}
              </Cell>
            </Row>
            <Row>
              <Label w={52} bg={colors.label} bottom>결제조건</Label>
              <Cell bottom>{data.meta.paymentCondition}</Cell>
              <Label w={52} bg={colors.label} bottom>납 기 일</Label>
              <Cell bottom>{data.meta.dueDate}</Cell>
              <Label w={52} bg={colors.label} bottom>참 조</Label>
              <Cell last bottom>{data.meta.reference}</Cell>
            </Row>
          </Box>
        </View>

        <Text style={{ fontSize: 7.5, color: '#444', marginTop: 5 }}>
          {data.hasTaxFree ? '* 표시는 비과세 항목입니다.   ' : ''}본 견적서는 {data.meta.validDate} 까지 유효하며, 현장 상황에
          따라 금액이 조정될 수 있습니다.
        </Text>

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
            borderColor: BORDER,
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
