'use client';

// 세금계산서 PDF — 국세청 전자세금계산서 출력 서식(공급받는자 보관용)을 A4 로 조판한다.
//
//   상태 띠(모든 쪽) → 제목 · 승인번호 → 공급자 | 공급받는자 격자(등록번호 · 상호 · 성명 · 사업장 주소 · 업태 · 종목 · 이메일)
//   → 작성일자 · 공급가액 · 세액 · 수정사유 / 비고 → 품목(월 · 일 · 품목 · 규격 · 수량 · 단가 · 공급가액 · 세액 · 비고)
//   → 합계금액 · 현금 · 수표 · 어음 · 외상미수금 · 이 금액을 (영수/청구) 함
//
// 품목이 많으면 다음 쪽으로 넘어가고 품목 머리글 · 상태 띠 · 쪽 바닥이 쪽마다 반복된다. 한 품목 줄은 쪽 사이에서 갈라지지 않는다.
// 화면 미리보기도 이 PDF 를 그대로 그림으로 구워 보여 주므로, 화면 · 저장 · 인쇄의 값이 같다.

import { Document, Page, Text, View } from '@react-pdf/renderer';
import { formatBizNoLoose } from '@/lib/boss/docMeta';
import { toKoreanAmountLabel } from '@/lib/boss/koreanAmount';
import {
  approvalText,
  docTitle,
  fmtNum,
  isoDateOf,
  paperItems,
} from '@/lib/boss/taxInvoiceDocument';
import { PAY_TYPE_LABEL } from '@/types/boss-taxinvoice';
import {
  BORDER,
  Cell,
  HAIR,
  INK,
  LABEL_BG,
  LabelCell,
  MUTED,
  PageFooter,
  RULE,
  StatusBand,
  TONE_COLOR,
  Watermark,
  type PaperModel,
} from './paper';

const SUPPLIER_RED = '#B42318';
/** 품목 표 최소 줄 수 — 서식 관례(4줄). 적으면 빈 줄로 채운다 */
const MIN_ITEM_ROWS = 4;

/** even: 값 두 칸을 같은 폭으로(업태 · 종목 — 종목이 길다) */
type PartyLine = { label: string; value: string; label2?: string; value2?: string; valueColor?: string; even?: boolean };

function partyLines(model: PaperModel): { supplier: PartyLine[]; buyer: PartyLine[] } {
  const s = model.supplier;
  const inv = model.invoice;
  const missing = model.supplierNote ?? '공급자 정보 없음';
  return {
    supplier: [
      { label: '등록번호', value: s ? formatBizNoLoose(s.bizNo) : '', label2: '종사업장', value2: '' },
      s
        ? { label: '상호(법인명)', value: s.name, label2: '성명', value2: s.ceo }
        : { label: '상호(법인명)', value: missing, valueColor: SUPPLIER_RED, label2: '성명', value2: '' },
      { label: '사업장 주소', value: s?.address ?? '' },
      { label: '업태', value: s?.bizType ?? '', label2: '종목', value2: s?.bizKind ?? '', even: true },
      { label: '이메일', value: s?.email ?? '' },
    ],
    buyer: [
      { label: '등록번호', value: inv.buyerBizNo ? formatBizNoLoose(inv.buyerBizNo) : '', label2: '종사업장', value2: '' },
      { label: '상호(법인명)', value: inv.buyerName ?? '', label2: '성명', value2: inv.buyerCeo ?? '' },
      { label: '사업장 주소', value: inv.buyerAddress ?? '' },
      { label: '업태', value: inv.buyerBizType ?? '', label2: '종목', value2: inv.buyerBizKind ?? '', even: true },
      { label: '이메일', value: inv.buyerEmail ?? '' },
    ],
  };
}

const VL = 16; // 세로 라벨(공급자 · 공급받는자) 폭
const L1 = 50;
const L2 = 40;
const V2 = 52;
/** 반쪽 격자에서 값 칸의 글자 폭 — A4(539pt) 절반 기준 */
const HALF = 269;
const VALUE_TW = HALF - VL - L1 - L2 - V2 - 9;
const SPAN_TW = HALF - VL - L1 - 9;
const EVEN_TW = (HALF - VL - L1 - L2) / 2 - 9;

function Half({ line, bottom, lastHalf }: { line: PartyLine; bottom: boolean; lastHalf: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* 세로 라벨 자리 — 위에 덮는 라벨 상자가 이 칸을 가린다 */}
      <View style={{ width: VL, borderRightWidth: HAIR, borderColor: BORDER }} />
      <LabelCell w={L1} bottom={bottom}>
        {line.label}
      </LabelCell>
      <Cell
        bottom={bottom}
        color={line.valueColor}
        last={lastHalf && !line.label2}
        tw={line.even ? EVEN_TW : line.label2 ? VALUE_TW : SPAN_TW}
      >
        {line.value}
      </Cell>
      {line.label2 ? (
        <>
          <LabelCell w={L2} bottom={bottom}>
            {line.label2}
          </LabelCell>
          <Cell w={line.even ? undefined : V2} tw={EVEN_TW} bottom={bottom} last={lastHalf}>
            {line.value2}
          </Cell>
        </>
      ) : null}
    </View>
  );
}

function VerticalLabel({ chars, left }: { chars: string[]; left: number | string }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left,
        width: VL,
        backgroundColor: LABEL_BG,
        borderRightWidth: HAIR,
        borderLeftWidth: left === 0 ? 0 : HAIR,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {chars.map((ch, i) => (
        <Text key={i} style={{ fontSize: 7.5, lineHeight: 1.45 }}>
          {ch}
        </Text>
      ))}
    </View>
  );
}

function Parties({ model }: { model: PaperModel }) {
  const { supplier, buyer } = partyLines(model);
  return (
    <View style={{ borderWidth: RULE, borderColor: BORDER, position: 'relative' }}>
      {supplier.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row' }} wrap={false}>
          <Half line={s} bottom={i === supplier.length - 1} lastHalf={false} />
          <Half line={buyer[i]} bottom={i === supplier.length - 1} lastHalf />
        </View>
      ))}
      <VerticalLabel chars={['공', '급', '자']} left={0} />
      <VerticalLabel chars={['공', '급', '받', '는', '자']} left="50%" />
    </View>
  );
}

const ITEM_COLUMNS: { head: string; w?: number; align: 'left' | 'center' | 'right' }[] = [
  { head: '월', w: 22, align: 'center' },
  { head: '일', w: 22, align: 'center' },
  { head: '품목', align: 'left' },
  { head: '규격', w: 60, align: 'center' },
  { head: '수량', w: 40, align: 'right' },
  { head: '단가', w: 64, align: 'right' },
  { head: '공급가액', w: 74, align: 'right' },
  { head: '세액', w: 62, align: 'right' },
  { head: '비고', w: 40, align: 'left' },
];

export default function TaxInvoicePdf({ model }: { model: PaperModel }) {
  const inv = model.invoice;
  const items = paperItems(inv);
  const blanks = Math.max(0, MIN_ITEM_ROWS - items.length);
  const issueDate = isoDateOf(inv.issueDate);
  const title = docTitle('TAX', inv);
  const approval = approvalText(inv);
  const lastCol = ITEM_COLUMNS.length - 1;
  const footerLeft = `${title} · 공급받는자 ${inv.buyerName || '-'} · 작성일자 ${issueDate || '미정'} · 합계 ${fmtNum(inv.totalAmount)}원`;

  return (
    <Document title={`${title}_${inv.buyerName ?? ''}_${issueDate}`} author="도배르만" creator="도배르만" producer="도배르만">
      <Page
        size="A4"
        style={{ paddingTop: 24, paddingBottom: 40, paddingHorizontal: 28, fontFamily: model.fontFamily, fontSize: 8.5, color: INK }}
      >
        <Watermark text={model.state.watermark} />
        <StatusBand state={model.state} />

        {/* 제목 · 승인번호 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 22, fontWeight: 700, letterSpacing: 9 }}>{title}</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginLeft: 8, marginBottom: 3 }}>(공급받는자 보관용)</Text>
          </View>
          <View style={{ flexDirection: 'row', borderWidth: RULE, borderColor: BORDER, width: 228 }}>
            <LabelCell w={56} bottom>
              승인번호
            </LabelCell>
            <Cell
              last
              bottom
              size={approval.length > 16 ? 7.5 : 8.5}
              color={inv.approvalNo && approval === inv.approvalNo ? INK : TONE_COLOR.warn}
            >
              {approval}
            </Cell>
          </View>
        </View>

        <Parties model={model} />

        {/* 작성일자 · 공급가액 · 세액 · 수정사유 / 비고 */}
        <View style={{ borderWidth: RULE, borderColor: BORDER, marginTop: 6 }} wrap={false}>
          <View style={{ flexDirection: 'row' }}>
            <LabelCell w={96}>작성일자</LabelCell>
            <LabelCell>공급가액</LabelCell>
            <LabelCell>세액</LabelCell>
            <LabelCell w={96} last>
              수정사유
            </LabelCell>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Cell w={96} align="center" size={9.5}>
              {issueDate || '미정'}
            </Cell>
            <Cell align="right" bold size={10}>
              {fmtNum(inv.supplyAmount)}
            </Cell>
            <Cell align="right" bold size={10}>
              {fmtNum(inv.vatAmount)}
            </Cell>
            <Cell w={96} last align="center" color={MUTED}>
              -
            </Cell>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <LabelCell w={96} bottom>
              비고
            </LabelCell>
            <Cell last bottom>
              {' '}
            </Cell>
          </View>
        </View>

        {/* 품목 — 머리글은 쪽마다 반복 */}
        <View style={{ borderWidth: RULE, borderColor: BORDER, marginTop: 6 }}>
          <View fixed style={{ flexDirection: 'row' }}>
            {ITEM_COLUMNS.map((c, i) => (
              <LabelCell key={c.head} w={c.w} last={i === lastCol}>
                {c.head}
              </LabelCell>
            ))}
          </View>
          {items.map((it, ri) => (
            <View key={`i${ri}`} style={{ flexDirection: 'row' }} wrap={false}>
              <Cell w={22} align="center">{it.month}</Cell>
              <Cell w={22} align="center">{it.day}</Cell>
              <Cell tw={146}>{it.name}</Cell>
              <Cell w={60} align="center" size={7.5}>
                {it.spec}
              </Cell>
              <Cell w={40} align="right">{fmtNum(it.qty)}</Cell>
              <Cell w={64} align="right">{fmtNum(it.unitPrice)}</Cell>
              <Cell w={74} align="right">{fmtNum(it.supply)}</Cell>
              <Cell w={62} align="right">{fmtNum(it.vat)}</Cell>
              <Cell w={40} last>
                {' '}
              </Cell>
            </View>
          ))}
          {Array.from({ length: blanks }).map((_, bi) => (
            <View key={`b${bi}`} style={{ flexDirection: 'row' }} wrap={false}>
              {ITEM_COLUMNS.map((c, i) => (
                <Cell key={c.head} w={c.w} last={i === lastCol} bottom={bi === blanks - 1}>
                  {' '}
                </Cell>
              ))}
            </View>
          ))}
        </View>

        {/* 합계 · 영수/청구 */}
        <View style={{ borderWidth: RULE, borderColor: BORDER, marginTop: 6, flexDirection: 'row' }} wrap={false}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <LabelCell flex={1.5}>합계금액</LabelCell>
              <LabelCell>현금</LabelCell>
              <LabelCell>수표</LabelCell>
              <LabelCell>어음</LabelCell>
              <LabelCell>외상미수금</LabelCell>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Cell flex={1.5} align="right" bold size={11} bottom>
                {fmtNum(inv.totalAmount)}
              </Cell>
              {/* 결제 수단은 기록하지 않으므로 비워 둔다. 청구(아직 안 받음)만 외상미수금으로 적는다 */}
              <Cell bottom> </Cell>
              <Cell bottom> </Cell>
              <Cell bottom> </Cell>
              <Cell align="right" bottom>
                {inv.payType === 'CLAIM' ? fmtNum(inv.totalAmount) : ' '}
              </Cell>
            </View>
          </View>
          <View
            style={{
              width: 118,
              borderLeftWidth: HAIR,
              borderColor: BORDER,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ fontSize: 9 }}>이 금액을 </Text>
            <Text style={{ fontSize: 10.5, fontWeight: 700 }}>({PAY_TYPE_LABEL[inv.payType]})</Text>
            <Text style={{ fontSize: 9 }}> 함</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: MUTED, textAlign: 'right', marginTop: 4 }}>
          합계 {toKoreanAmountLabel(inv.totalAmount)}
        </Text>

        <PageFooter left={footerLeft} printedAt={model.printedAt} />
      </Page>
    </Document>
  );
}
