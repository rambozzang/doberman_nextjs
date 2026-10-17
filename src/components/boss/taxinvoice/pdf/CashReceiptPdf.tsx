'use client';

// 현금영수증 PDF — 세금계산서 서식에 제목만 바꾼 것이 아니라 실제 영수증 모양으로 따로 조판한다.
//
//   A4 가운데 영수증 한 장(폭 약 113mm): 제목 · 용도 → 상태 띠 → 가맹점(공급자) → 거래 정보(거래일자 · 거래 구분 ·
//   용도 · 가린 식별번호 · 고객명 · 과세 구분 · 승인번호) → 품목 · 수량 · 금액 → 공급가액 · 부가세 · 봉사료 · 합계
//   → 취소 정보(있을 때) → 문의 안내
//
// 식별번호는 종이에 끝자리만 남긴다(휴대폰 010-****-5678 · 사업자 123-45-***90). 승인번호는 실제 받은 번호만 찍는다.
// 품목이 많으면 다음 쪽으로 넘어가고 품목 머리글 · 상태 띠 · 쪽 바닥이 반복된다.

import type { ReactNode } from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { formatBizNoLoose } from '@/lib/boss/docMeta';
import { formatPhone } from '@/lib/boss/format';
import {
  approvalText,
  cashIdentityLine,
  cashItemNameOf,
  ntsLabel,
  ntsSentence,
  cashTaxationOf,
  fmtNum,
  paperItems,
  tradeDateOf,
  tradeDateText,
} from '@/lib/boss/taxInvoiceDocument';
import { CASH_USAGE_LONG_LABEL, PROVIDER_CANCEL_STATUS_LABEL } from '@/types/boss-taxinvoice';
import { cashFieldsOf } from '@/lib/boss/taxInvoiceCash';
import { BORDER, FAINT, HAIR, INK, MUTED, PageFooter, PaperText, RULE, StatusBand, TONE_COLOR, Watermark, type PaperModel } from './paper';

/** 영수증 폭 — A4 가운데 */
const SLIP = 320;
/** 한 줄 값 칸 폭 — 영수증 폭 − 좌우 여백 32 − 라벨 72 */
const LINE_VALUE_W = SLIP - 32 - 72 - 2;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 8 }} wrap={false}>
      <Text style={{ fontSize: 7.5, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 3 }}>{title}</Text>
      {children}
    </View>
  );
}

function Line({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 1.6 }}>
      <Text style={{ width: 72, fontSize: 8, color: MUTED }}>{label}</Text>
      <View style={{ flex: 1 }}>
        <PaperText text={value || '-'} size={strong ? 9.5 : 8.5} bold={strong} align="right" color={color} maxWidth={LINE_VALUE_W} />
      </View>
    </View>
  );
}

function Dashed() {
  return <View style={{ borderBottomWidth: HAIR, borderColor: BORDER, borderStyle: 'dashed', marginTop: 7 }} />;
}

export default function CashReceiptPdf({ model }: { model: PaperModel }) {
  const inv = model.invoice;
  const s = model.supplier;
  const id = cashIdentityLine(inv);
  const usage = cashFieldsOf(inv).usage;
  const items = paperItems(inv);
  const approval = approvalText(inv);
  const canceled = inv.providerCancelStatus === 'CANCELED';
  const cancelTried = inv.providerCancelStatus != null;
  const electronic = inv.provider != null;
  // 팝빌로 보내는(보낸) 70자 품목명. 발급한 문서인데 서버 값이 없으면 예상값임을 밝힌다
  const cashItem = cashItemNameOf(inv);
  const itemName = cashItem.estimated && electronic ? `${cashItem.name} (예상)` : cashItem.name;
  // 거래 구분 — 승인되지 않은 문서를 "승인 거래"라고 쓰지 않는다
  const tradeKind = electronic
    ? canceled
      ? '승인 후 전액 취소'
      : inv.providerStatus === 'ISSUED'
        ? '승인 거래'
        : '결과 확인 필요'
    : inv.status === 'ISSUED'
      ? '승인 거래 (홈택스 발급 기록)'
      : inv.status === 'CANCELED'
        ? '취소로 기록'
        : '발급 전';
  const footerLeft = `현금영수증 · ${id.usage} ${id.masked} · 거래일자 ${tradeDateOf(inv) || '미정'} · 합계 ${fmtNum(inv.totalAmount)}원`;

  return (
    <Document title={`현금영수증_${tradeDateOf(inv)}`} author="도배르만" creator="도배르만" producer="도배르만">
      <Page
        size="A4"
        style={{ paddingTop: 24, paddingBottom: 40, paddingHorizontal: 28, fontFamily: model.fontFamily, fontSize: 8.5, color: INK }}
      >
        <Watermark text={model.state.watermark} />
        <StatusBand state={model.state} width={SLIP + 120} />

        <View style={{ width: SLIP, alignSelf: 'center', borderWidth: RULE, borderColor: BORDER, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
          {/* 제목 · 용도 */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, letterSpacing: 8, marginLeft: 8 }}>현금영수증</Text>
            <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 3 }}>
              ({CASH_USAGE_LONG_LABEL[usage]}){canceled ? ' · 취소 거래' : ''}
            </Text>
          </View>
          <View style={{ borderBottomWidth: RULE, borderColor: INK, marginTop: 8 }} />

          {/* 가맹점 = 공급자 */}
          <Section title="가맹점 정보">
            {s ? (
              <>
                <Line label="상호" value={s.name} strong />
                <Line label="사업자번호" value={formatBizNoLoose(s.bizNo)} />
                <Line label="대표자" value={s.ceo} />
                <Line label="주소" value={s.address} />
                <Line label="전화" value={s.phone ? formatPhone(s.phone) : ''} />
              </>
            ) : (
              <Text style={{ fontSize: 8.5, color: TONE_COLOR.bad }}>
                {model.supplierNote ?? '공급자 정보 없음'}
              </Text>
            )}
          </Section>
          <Dashed />

          {/* 거래 정보 */}
          <Section title="거래 정보">
            <Line label="거래일자" value={tradeDateText(inv)} />
            <Line label="거래 구분" value={tradeKind} />
            <Line label="용도" value={id.usage} />
            <Line label={`식별번호(${id.kind})`} value={id.masked} />
            {inv.buyerName?.trim() ? <Line label="고객명" value={inv.buyerName.trim()} /> : null}
            <Line label="과세 구분" value={cashTaxationOf(inv)} />
            <Line label={electronic ? '전송 품목명' : '품목명'} value={itemName} />
            <Line
              label="승인번호"
              value={approval}
              strong={approval === inv.approvalNo}
              color={approval === inv.approvalNo ? INK : TONE_COLOR.warn}
            />
            {electronic ? (
              <Line
                label={cancelTried ? '원거래 국세청 전송' : '국세청 전송'}
                value={ntsLabel(inv.ntsStatus)}
                color={inv.ntsStatus === 'SENT' ? INK : TONE_COLOR.warn}
              />
            ) : null}
          </Section>
          <Dashed />

          {/* 품목 — 머리글은 쪽마다 반복 */}
          <View style={{ marginTop: 8 }}>
            <View fixed style={{ flexDirection: 'row', borderBottomWidth: HAIR, borderColor: BORDER, paddingBottom: 2 }}>
              <Text style={{ flex: 1, fontSize: 7.5, fontWeight: 700, color: MUTED }}>품목</Text>
              <Text style={{ width: 40, fontSize: 7.5, fontWeight: 700, color: MUTED, textAlign: 'right' }}>수량</Text>
              <Text style={{ width: 84, fontSize: 7.5, fontWeight: 700, color: MUTED, textAlign: 'right' }}>금액</Text>
            </View>
            {items.map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }} wrap={false}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <PaperText text={it.name || '-'} size={8.5} maxWidth={SLIP - 32 - 124 - 6} />
                  {it.spec ? <PaperText text={it.spec} size={7} color={FAINT} maxWidth={SLIP - 32 - 124 - 6} /> : null}
                </View>
                <Text style={{ width: 40, fontSize: 8.5, textAlign: 'right' }}>{fmtNum(it.qty)}</Text>
                <Text style={{ width: 84, fontSize: 8.5, textAlign: 'right' }}>{fmtNum(it.total)}</Text>
              </View>
            ))}
          </View>
          <Dashed />

          {/* 금액 */}
          <View style={{ marginTop: 6 }} wrap={false}>
            <Line label="공급가액" value={fmtNum(inv.supplyAmount)} />
            <Line label="부가세" value={fmtNum(inv.vatAmount)} />
            <Line label="봉사료" value="0" />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, paddingTop: 4, borderTopWidth: RULE, borderColor: INK }}>
              <Text style={{ width: 72, fontSize: 9.5, fontWeight: 700 }}>합계</Text>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{fmtNum(inv.totalAmount)}원</Text>
            </View>
          </View>

          {/* 취소 정보 */}
          {cancelTried ? (
            <>
              <Dashed />
              <Section title="취소 정보">
                <Line
                  label="취소 상태"
                  value={PROVIDER_CANCEL_STATUS_LABEL[inv.providerCancelStatus!]}
                  color={canceled ? TONE_COLOR.bad : TONE_COLOR.warn}
                  strong
                />
                <Line label="취소 승인번호" value={inv.providerCancelApprovalNo?.trim() || (canceled ? '미수신' : '확정 전')} />
                <Line
                  label="취소 국세청 전송"
                  value={ntsLabel(inv.providerCancelNtsStatus)}
                  color={inv.providerCancelNtsStatus === 'SENT' ? INK : TONE_COLOR.warn}
                />
                <Line label="원 승인번호" value={approval === inv.approvalNo ? approval : '-'} />
                <Line label="원 거래일자" value={tradeDateOf(inv)} />
              </Section>
            </>
          ) : null}

          <Dashed />
          <View style={{ marginTop: 6 }} wrap={false}>
            {/* 홈택스 조회 가능 여부는 국세청 전송이 확인된 뒤에만 말한다 */}
            <Text style={{ fontSize: 7, color: MUTED, lineHeight: 1.45 }}>
              {electronic && !canceled ? ntsSentence(inv.ntsStatus) : model.state.note}
            </Text>
            <Text style={{ fontSize: 7, color: FAINT, lineHeight: 1.45, marginTop: 2 }}>
              이 출력물은 확인용입니다. 효력은 국세청에 등록된 발급 내역을 따릅니다. 현금영수증 문의: 국세청 126
            </Text>
          </View>
        </View>

        <PageFooter left={footerLeft} printedAt={model.printedAt} />
      </Page>
    </Document>
  );
}
