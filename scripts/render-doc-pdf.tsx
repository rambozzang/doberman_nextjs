// 문서 PDF 를 로컬에서 바로 뽑아 눈으로 확인하기 위한 도구 (브라우저 없이)
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToFile } from '@react-pdf/renderer';
import EstimatePdf, { registerPdfFont } from '@/components/boss/print/pdf/EstimatePdf';
import ReceiptPdf from '@/components/boss/print/pdf/ReceiptPdf';
import { ESTIMATE_STYLES, RECEIPT_STYLES, type DocData } from '@/components/boss/print/docTypes';
import { buildDocMeta } from '@/lib/boss/docMeta';
import { toKoreanAmountApp } from '@/lib/boss/koreanAmount';

const items = [
  { id: 1, itemName: '실크 도배', itemSpec: '광폭 합지', unit: '롤', quantity: 12, unitPrice: 38000, supplyAmount: 414545, vatAmount: 41455, totalAmount: 456000, isTaxFree: 'N' as const, memo: '' },
  { id: 2, itemName: '천장 도배', itemSpec: '실크', unit: '평', quantity: 24, unitPrice: 15000, supplyAmount: 327272, vatAmount: 32728, totalAmount: 360000, isTaxFree: 'N' as const, memo: '' },
  { id: 3, itemName: '기존 벽지 제거', itemSpec: '', unit: '식', quantity: 1, unitPrice: 120000, supplyAmount: 120000, vatAmount: 0, totalAmount: 120000, isTaxFree: 'Y' as const, memo: '비과세' },
  { id: 4, itemName: '부자재 · 초배지', itemSpec: '', unit: '식', quantity: 1, unitPrice: 85000, supplyAmount: 77272, vatAmount: 7728, totalAmount: 85000, isTaxFree: 'N' as const, memo: '' },
];
const totals = items.reduce(
  (a, it) => ({
    totalItems: a.totalItems + 1,
    totalQuantity: a.totalQuantity + it.quantity,
    supplyAmount: a.supplyAmount + it.supplyAmount,
    vatAmount: a.vatAmount + it.vatAmount,
    totalAmount: a.totalAmount + it.totalAmount,
  }),
  { totalItems: 0, totalQuantity: 0, supplyAmount: 0, vatAmount: 0, totalAmount: 0 }
);

const data: DocData = {
  company: {
    name: '에이스인테리어', owner: '홍정수', bizno: '1234567815',
    address1: '서울 동작구 관악로30길 27', address2: '2층',
    phone: '010-2468-7272', fax: '02-585-1234', email: 'ace@example.com',
    type: '건설업', kind: '실내건축공사', bigo: '입금계좌: 국민은행 123456-04-567890 (예금주 홍정수)\n잔금은 시공 완료 후 3일 이내 입금 부탁드립니다.',
  },
  customer: { id: 1016, name: '김철수', phone: '010-4455-4464', address1: '서울 관악구 봉천로 123', address2: '101동 1203호' },
  user: { userId: 'irambo7', name: '홍정수', phone: '010-2468-7272' },
  items,
  totals,
  meta: buildDocMeta(),
  hasTaxFree: true,
  totalAmountKor: toKoreanAmountApp(totals.totalAmount),
};

async function main() {
  registerPdfFont();
  const out = process.env.OUT_DIR || '/tmp/docpdf';
  fs.mkdirSync(out, { recursive: true });
  const only = process.env.ONLY_STYLE;
  for (const st of ESTIMATE_STYLES) {
    if (only && st.key !== only) continue;
    await renderToFile(<EstimatePdf data={data} p={st.palette} styleKey={st.key} />, path.join(out, `견적서-${st.key}-${st.name}.pdf`));
  }
  for (const st of RECEIPT_STYLES) {
    if (only && st.key !== only) continue;
    await renderToFile(<ReceiptPdf data={data} p={st.palette} styleKey={st.key} />, path.join(out, `영수증-${st.key}-${st.name}.pdf`));
  }
  console.log('done', out);
}
main().catch((e) => { console.error(e); process.exit(1); });
