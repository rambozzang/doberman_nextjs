'use client';

// 영수증 문서 5종 — 앱 lib/app/estimate/pdf/receipt_print_page*.dart 와 같은 구성
//
//   0 기본    국세청 영수증 서식 모양(테두리 격자, 공급자 칸, 품목 표)
//   1 심플    아래 굵은 선 제목 + 받는 분 / 총 금액 / 품목 내역 / 공급자
//   2 클래식  갈색 이중 테두리, "위 금액을 정히 영수함."
//   3 카드    파란 카드, 총 금액을 크게
//   4 컬러    세이지 카드 + 색 강조 바
//
// 문구는 앱 그대로다: "위 금액을 정히 영수합니다." / "위 금액을 정히 영수함." / "{회사명} 드림"

import type { DocData, DocPalette } from './docTypes';
import { money, companyAddress } from './docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const FONT = "'Pretendard', sans-serif";
const RECEIPT_SENTENCE = '위 금액을 정히 영수합니다.';

/** 품목 표 — 앱 영수증의 4열 (품목 · 수량 · 단가 · 금액) */
function ItemTable({ data, p, headerBg, headerColor }: { data: DocData; p: DocPalette; headerBg: string; headerColor: string }) {
  const th: React.CSSProperties = {
    padding: '7px 8px',
    fontSize: 10,
    fontWeight: 700,
    color: headerColor,
    background: headerBg,
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '7px 8px',
    fontSize: 10.5,
    color: p.textDark,
    borderBottom: `1px solid ${p.border}`,
  };
  const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
      <thead>
        <tr>
          <th style={{ ...th, textAlign: 'left' }}>품목</th>
          <th style={{ ...th, textAlign: 'right', width: 60 }}>수량</th>
          <th style={{ ...th, textAlign: 'right', width: 90 }}>단가</th>
          <th style={{ ...th, textAlign: 'right', width: 110 }}>금액</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((it, i) => (
          <tr key={it.id ?? i}>
            <td style={{ ...td, fontWeight: 600 }}>
              {it.itemName ?? ''}
              {it.itemSpec ? <span style={{ color: p.textLight, fontWeight: 400 }}> · {it.itemSpec}</span> : null}
            </td>
            <td style={num}>{money(it.quantity)}</td>
            <td style={num}>{money(it.unitPrice)}</td>
            <td style={{ ...num, fontWeight: 700 }}>{money(it.totalAmount)}</td>
          </tr>
        ))}
        {Array.from({ length: Math.max(0, 6 - data.items.length) }).map((_, i) => (
          <tr key={`b-${i}`}>
            <td style={{ ...td, height: 24 }} colSpan={4} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stamp({ url }: { url?: string | null }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />;
}

/** 공급자 칸 */
function Supplier({ data, p, boxed = true }: { data: DocData; p: DocPalette; boxed?: boolean }) {
  const c = data.company;
  const row = (label: string, value?: string | null) =>
    value ? (
      <div style={{ display: 'flex', gap: 8, fontSize: 9.5, lineHeight: 1.7 }}>
        <span style={{ width: 62, flexShrink: 0, color: p.textLight }}>{label}</span>
        <span style={{ color: p.textDark }}>{value}</span>
      </div>
    ) : null;
  return (
    <div style={boxed ? { border: `1px solid ${p.border}`, padding: 12 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: p.textDark, margin: 0 }}>공급자</p>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 4px' }}>{c?.name ?? ''}</p>
        </div>
        <Stamp url={c?.stamp} />
      </div>
      {row('대표', c?.owner)}
      {row('사업자등록번호', formatBizNoLoose(c?.bizno))}
      {row('주소', companyAddress(c))}
      {row('업태/종목', [c?.type, c?.kind].filter(Boolean).join(' / '))}
      {row('연락처', c?.phone)}
    </div>
  );
}

function Closing({ data, p, sentence = RECEIPT_SENTENCE }: { data: DocData; p: DocPalette; sentence?: string }) {
  return (
    <div style={{ marginTop: 18, textAlign: 'center' }}>
      <p style={{ fontSize: 11, color: p.textLight, margin: 0 }}>{sentence}</p>
      <p style={{ fontSize: 12, fontWeight: 700, color: p.textDark, margin: '10px 0 0' }}>
        {data.company?.name ?? ''} 드림
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 0 기본 — 국세청 영수증 서식 모양
// ═══════════════════════════════════════════════
function Style0({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  const cell: React.CSSProperties = { border: '1px solid #111', padding: '6px 8px', fontSize: 10.5 };
  const label: React.CSSProperties = { ...cell, background: '#F3F4F6', width: 92, fontWeight: 600, whiteSpace: 'nowrap' };
  return (
    <div style={{ fontFamily: FONT, color: '#111' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.5em', textAlign: 'center', margin: '0 0 4px' }}>
        영수증
      </h1>
      <p style={{ textAlign: 'center', fontSize: 10.5, color: '#555', margin: '0 0 14px' }}>
        No. {data.meta.docNumber} · {data.meta.today}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={label}>성명(상호)</td>
            <td style={{ ...cell, fontWeight: 700 }} colSpan={3}>
              {data.customer?.name ?? ''} 귀하
            </td>
          </tr>
          <tr>
            <td style={label}>금액</td>
            <td style={{ ...cell, fontWeight: 800, fontSize: 14 }} colSpan={3}>
              ₩ {money(data.totals.totalAmount)} 원 (일금 {data.totalAmountKor})
            </td>
          </tr>
          <tr>
            <td style={label}>등록번호</td>
            <td style={cell}>{formatBizNoLoose(c?.bizno)}</td>
            <td style={label}>상호</td>
            <td style={cell}>{c?.name ?? ''}</td>
          </tr>
          <tr>
            <td style={label}>대표자</td>
            <td style={cell}>{c?.owner ?? ''}</td>
            <td style={label}>연락처</td>
            <td style={cell}>{c?.phone ?? ''}</td>
          </tr>
          <tr>
            <td style={label}>사업장 주소</td>
            <td style={cell} colSpan={3}>
              {companyAddress(c)}
            </td>
          </tr>
          <tr>
            <td style={label}>업태 / 종목</td>
            <td style={cell} colSpan={3}>
              {[c?.type, c?.kind].filter(Boolean).join(' / ')}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ border: '1px solid #111' }}>
        <ItemTable data={data} p={{ ...p, border: '#111' }} headerBg="#F3F4F6" headerColor="#111" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 12, fontSize: 11 }}>
        <span style={{ color: '#555' }}>공급가액 {money(data.totals.supplyAmount)}원</span>
        <span style={{ color: '#555' }}>세액 {money(data.totals.vatAmount)}원</span>
        <span style={{ fontWeight: 800 }}>합계 {money(data.totals.totalAmount)}원</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22 }}>
        <p style={{ fontSize: 12, margin: 0 }}>{RECEIPT_SENTENCE}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{c?.name ?? ''} 드림</span>
          <Stamp url={c?.stamp} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 1 심플
// ═══════════════════════════════════════════════
function StyleSimple({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div
        style={{
          borderBottom: `2px solid ${p.primary}`,
          paddingBottom: 10,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, color: p.primary, letterSpacing: '0.2em', margin: 0 }}>영 수 증</h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>No. {data.meta.docNumber}</p>
          <p style={{ fontSize: 10, color: p.textLight, margin: '4px 0 0' }}>{data.meta.today}</p>
        </div>
      </div>

      <div style={{ background: p.accent, padding: '12px 14px', marginTop: 26, display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span style={{ fontSize: 11, color: p.textLight }}>받는 분</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{data.customer?.name ?? ''}</span>
        <span style={{ fontSize: 12 }}>귀하</span>
      </div>

      <div
        style={{
          border: `1px solid ${p.border}`,
          padding: '14px 16px',
          marginTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: p.textLight }}>총 금액</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: p.primary }}>{money(data.totals.totalAmount)}원</span>
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, margin: '26px 0 10px' }}>품목 내역</p>
      <ItemTable data={data} p={p} headerBg={p.accent} headerColor={p.textDark} />

      <div style={{ marginTop: 34 }}>
        <Supplier data={data} p={p} />
      </div>
      <Closing data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// 2 클래식 — 갈색 이중 테두리
// ═══════════════════════════════════════════════
function StyleClassic({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div style={{ fontFamily: FONT, color: p.textDark, background: p.accent, padding: 6 }}>
      <div style={{ border: `2px solid ${p.primary}`, padding: 4 }}>
        <div style={{ border: `1px solid ${p.border}`, padding: 20, background: '#fff' }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: p.primary,
              letterSpacing: '0.4em',
              textAlign: 'center',
              margin: 0,
            }}
          >
            영 수 증
          </h1>
          <p style={{ textAlign: 'center', fontSize: 10, color: p.textLight, margin: '6px 0 20px' }}>
            No. {data.meta.docNumber} · {data.meta.today}
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, borderBottom: `1px solid ${p.border}`, paddingBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{data.customer?.name ?? ''}</span>
            <span style={{ fontSize: 12 }}>귀하</span>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p style={{ fontSize: 11, color: p.textLight, margin: 0 }}>금 액</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: p.primary, margin: '6px 0 2px' }}>
              {money(data.totals.totalAmount)} 원
            </p>
            <p style={{ fontSize: 11, color: p.textLight, margin: 0 }}>(일금 {data.totalAmountKor})</p>
          </div>

          <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />

          <p style={{ fontSize: 12, textAlign: 'center', margin: '22px 0 0', color: p.textDark }}>
            위 금액을 정히 영수함.
          </p>

          <div style={{ marginTop: 18 }}>
            <Supplier data={data} p={p} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 3 카드 — 파란 카드
// ═══════════════════════════════════════════════
function StyleBlueCard({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div style={{ background: p.primary, borderRadius: 10, padding: '18px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>영 수 증</h1>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, margin: 0, opacity: 0.85 }}>No. {data.meta.docNumber}</p>
            <p style={{ fontSize: 10, margin: '2px 0 0', opacity: 0.85 }}>{data.meta.today}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <div style={{ flex: 1, background: p.accent, borderRadius: 8, padding: 14 }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>받는 분</p>
          <p style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 0' }}>{data.customer?.name ?? ''} 귀하</p>
        </div>
        <div style={{ flex: 1, background: p.accent, borderRadius: 8, padding: 14, textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>총 금액</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: p.primary, margin: '4px 0 0' }}>
            {money(data.totals.totalAmount)}원
          </p>
          <p style={{ fontSize: 9.5, color: p.textLight, margin: '2px 0 0' }}>{data.totalAmountKor}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, margin: '22px 0 10px' }}>품목 내역</p>
      <div style={{ border: `1px solid ${p.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <ItemTable data={data} p={p} headerBg={p.secondary} headerColor="#FFFFFF" />
      </div>

      <div style={{ marginTop: 26 }}>
        <Supplier data={data} p={p} />
      </div>
      <Closing data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// 4 컬러 — 세이지
// ═══════════════════════════════════════════════
function StyleColor({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 6, height: 30, background: p.primary, borderRadius: 3, display: 'inline-block' }} />
        <h1 style={{ fontSize: 26, fontWeight: 800, color: p.primary, letterSpacing: '0.2em', margin: 0 }}>영 수 증</h1>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>No. {data.meta.docNumber}</p>
          <p style={{ fontSize: 10, color: p.textLight, margin: '2px 0 0' }}>{data.meta.today}</p>
        </div>
      </div>

      <div style={{ background: p.accent, borderRadius: 8, padding: 14, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontSize: 10, color: p.textLight }}>받는 분</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{data.customer?.name ?? ''} 귀하</span>
          <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 800, color: p.primary }}>
            {money(data.totals.totalAmount)}원
          </span>
        </div>
        <p style={{ fontSize: 9.5, color: p.textLight, textAlign: 'right', margin: '2px 0 0' }}>{data.totalAmountKor}</p>
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, margin: '22px 0 10px' }}>품목 내역</p>
      <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />

      <div style={{ marginTop: 26 }}>
        <Supplier data={data} p={p} />
      </div>
      <Closing data={data} p={p} />
    </div>
  );
}

export default function ReceiptDoc({ styleKey, data, palette }: { styleKey: string; data: DocData; palette: DocPalette }) {
  switch (styleKey) {
    case '1':
      return <StyleSimple data={data} p={palette} />;
    case '2':
      return <StyleClassic data={data} p={palette} />;
    case '3':
      return <StyleBlueCard data={data} p={palette} />;
    case '4':
      return <StyleColor data={data} p={palette} />;
    default:
      return <Style0 data={data} p={palette} />;
  }
}
