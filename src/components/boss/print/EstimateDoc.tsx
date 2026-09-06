'use client';

// 견적서 문서 5종 — 앱 lib/app/estimate/pdf/estimate_print_page*.dart 와 같은 구성
//
//   0 기본     전통 서식. 가운데 "견 적 서", 일금 강조(연녹), 보라 표 머리
//   1 슬레이트 상단 색 띠에 흰 제목, 수신/공급자 두 상자
//   2 차콜     얇은 상단 선 + ESTIMATE/견 적 서 좌측 정렬, TO/FROM
//   3 토프     가운데 제목 + 밑줄, 둥근 카드 안에 수신/공급자
//   4 세이지   둥근 색 카드 헤더(QUOTATION), 좌측 색 바 강조
//
// 색·글자 크기·문구는 앱 파일에서 그대로 옮겼다. 인쇄(A4)와 화면 모두 이 마크업을 쓴다.

import type { DocData, DocPalette } from './docTypes';
import { money, taxText, companyAddress, customerAddress } from './docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const FONT = "'Pretendard', sans-serif";

/** 라벨 + 값 한 줄 (공급자 정보) */
function InfoRow({ label, value, p, w = 52 }: { label: string; value?: string | null; p: DocPalette; w?: number }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 9, lineHeight: 1.6 }}>
      <span style={{ width: w, flexShrink: 0, color: p.textLight }}>{label}</span>
      <span style={{ color: p.textDark, wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

/** 품목 표 — 앱 표와 같은 9열 */
function ItemTable({ data, p, headerBg, headerColor }: { data: DocData; p: DocPalette; headerBg: string; headerColor: string }) {
  const th: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: 10,
    fontWeight: 700,
    color: headerColor,
    background: headerBg,
    borderBottom: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: 10,
    color: p.textDark,
    borderBottom: `0.5px solid ${p.border}`,
  };
  const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
      <thead>
        <tr>
          <th style={{ ...th, width: 26, textAlign: 'center' }}>No.</th>
          <th style={{ ...th, textAlign: 'left' }}>품명</th>
          <th style={{ ...th, textAlign: 'left', width: 70 }}>규격</th>
          <th style={{ ...th, textAlign: 'center', width: 38 }}>단위</th>
          <th style={{ ...th, textAlign: 'right', width: 42 }}>수량</th>
          <th style={{ ...th, textAlign: 'right', width: 62 }}>단가</th>
          <th style={{ ...th, textAlign: 'right', width: 70 }}>공급가액</th>
          <th style={{ ...th, textAlign: 'right', width: 58 }}>세액</th>
          <th style={{ ...th, textAlign: 'right', width: 74 }}>합계</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((it, i) => (
          <tr key={it.id ?? i}>
            <td style={{ ...td, textAlign: 'center', color: p.textLight }}>{i + 1}</td>
            <td style={{ ...td, fontWeight: 600 }}>
              {it.itemName ?? ''}
              {it.isTaxFree === 'Y' ? ' *' : ''}
            </td>
            <td style={{ ...td, color: p.textLight }}>{it.itemSpec ?? ''}</td>
            <td style={{ ...td, textAlign: 'center', color: p.textLight }}>{it.unit ?? ''}</td>
            <td style={num}>{money(it.quantity)}</td>
            <td style={num}>{money(it.unitPrice)}</td>
            <td style={num}>{money(it.supplyAmount)}</td>
            <td style={num}>{money(it.vatAmount)}</td>
            <td style={{ ...num, fontWeight: 700 }}>{money(it.totalAmount)}</td>
          </tr>
        ))}
        {/* 서식이 비어 보이지 않도록 최소 8줄을 유지한다 (앱 서식과 같은 인상) */}
        {Array.from({ length: Math.max(0, 8 - data.items.length) }).map((_, i) => (
          <tr key={`blank-${i}`}>
            <td style={{ ...td, height: 22 }} colSpan={9} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 유효기간 · 결제조건 · 참조 + 비고 */
function DocFooter({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        {data.hasTaxFree && (
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>* 표시는 비과세 항목입니다.</p>
        )}
        <p style={{ fontSize: 10, fontWeight: 700, color: p.textDark, margin: '6px 0 2px' }}>비고</p>
        <p style={{ fontSize: 9.5, color: p.textLight, margin: 0, whiteSpace: 'pre-wrap', minHeight: 30 }}>
          {data.company?.bigo ?? ''}
        </p>
      </div>
      <div style={{ width: 190, border: `1px solid ${p.border}` }}>
        {[
          ['유효기간', data.meta.validDate],
          ['결제조건', data.meta.paymentCondition],
          ['참조', data.meta.reference],
        ].map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              fontSize: 9.5,
              borderTop: i === 0 ? 'none' : `1px solid ${p.border}`,
            }}
          >
            <span style={{ width: 72, padding: '5px 8px', color: p.textLight, background: p.accent }}>{label}</span>
            <span style={{ flex: 1, padding: '5px 8px', color: p.textDark }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stamp({ url }: { url?: string | null }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />;
}

function Logo({ url, size }: { url?: string | null; size: number }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
}

/** 공급자 정보 묶음 */
function SupplierLines({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <>
      <InfoRow label="대표" value={c?.owner} p={p} />
      <InfoRow label="사업자번호" value={formatBizNoLoose(c?.bizno)} p={p} />
      <InfoRow label="주소" value={companyAddress(c)} p={p} />
      <InfoRow label="업태 / 종목" value={[c?.type, c?.kind].filter(Boolean).join(' / ')} p={p} />
      <InfoRow label="연락처" value={c?.phone} p={p} />
      <InfoRow
        label="담당"
        value={[data.user?.name, data.user?.phone].filter(Boolean).join(' ')}
        p={p}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════
// 0 기본 — 전통 서식
// ═══════════════════════════════════════════════════
function Style0({ data }: { data: DocData }) {
  const p = { primary: '#6B21A8', secondary: '#4B5563', accent: '#DCFCE7', textDark: '#111111', textLight: '#666666', border: '#9E9E9E' };
  const c = data.company;
  return (
    <div style={{ fontFamily: FONT, color: p.textDark, padding: '4px 2px' }}>
      {/* 제목 줄 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 100 }}>
          <Logo url={c?.logo} size={50} />
        </div>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>
          견 적 서
        </h1>
        <div style={{ width: 130, textAlign: 'right' }}>
          <p style={{ fontSize: 12, margin: 0 }}>No. {data.meta.docNumber}</p>
          <div style={{ height: 1, background: '#000', marginTop: 2 }} />
        </div>
      </div>

      {/* 날짜 · 수신 / 공급자 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 20 }}>
        <div style={{ width: 240 }}>
          <p style={{ fontSize: 16, margin: 0 }}>{data.meta.today}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{data.customer?.name ?? ''}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>귀중</span>
          </div>
          <div style={{ height: 1, background: '#767676', marginTop: 5, width: 200 }} />
        </div>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <p style={{ fontSize: 9.5, color: p.textLight, textAlign: 'right', margin: '0 0 4px' }}>
            담당자 {data.user?.name ?? ''} {data.user?.phone ?? ''}
          </p>
          <div style={{ border: `1px solid ${p.border}`, padding: 8, position: 'relative' }}>
            <div style={{ position: 'absolute', right: 8, top: 8 }}>
              <Stamp url={c?.stamp} />
            </div>
            <InfoRow label="등록번호" value={formatBizNoLoose(c?.bizno)} p={p} w={58} />
            <InfoRow label="상 호" value={c?.name} p={p} w={58} />
            <InfoRow label="대 표" value={c?.owner} p={p} w={58} />
            <InfoRow label="주 소" value={companyAddress(c)} p={p} w={58} />
            <InfoRow label="업 태 / 종목" value={[c?.type, c?.kind].filter(Boolean).join(' / ')} p={p} w={58} />
            <InfoRow label="전 화" value={c?.phone} p={p} w={58} />
            <InfoRow label="팩 스" value={c?.fax} p={p} w={58} />
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, margin: '16px 0 5px' }}>아래와 같이 견적합니다.</p>

      {/* 합계 띠 */}
      <div
        style={{
          borderTop: '1px solid #000',
          borderBottom: '1px solid #000',
          padding: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12 }}>{taxText(data.hasTaxFree)}</span>
        <span style={{ background: p.accent, padding: '3px 8px', fontSize: 12 }}>
          일금 {data.totalAmountKor} (₩ {money(data.totals.totalAmount)}원)
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />
      </div>

      <DocFooter data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 1 슬레이트 — 색 띠 헤더
// ═══════════════════════════════════════════════════
function StyleBand({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div style={{ background: p.primary, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {c?.logo ? (
          <div style={{ background: '#fff', borderRadius: 4, padding: 4, lineHeight: 0 }}>
            <Logo url={c.logo} size={40} />
          </div>
        ) : (
          <div style={{ width: 48 }} />
        )}
        <h1 style={{ flex: 1, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', margin: 0 }}>
          견 적 서
        </h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#fff', margin: 0 }}>No. {data.meta.docNumber}</p>
          <p style={{ fontSize: 10, color: p.accent, margin: '4px 0 0' }}>{data.meta.today}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <div style={{ flex: 1, border: `1px solid ${p.border}`, padding: 12 }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>수 신</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{data.customer?.name ?? ''} 귀하</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>{customerAddress(data.customer)}</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: '2px 0 0' }}>{data.customer?.phone ?? ''}</p>
        </div>
        <div style={{ flex: 1, background: p.accent, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>공급자</p>
            <Stamp url={c?.stamp} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '4px 0' }}>{c?.name ?? ''}</p>
          <SupplierLines data={data} p={p} />
        </div>
      </div>

      <div
        style={{
          border: `2px solid ${p.primary}`,
          padding: '10px 12px',
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11 }}>{taxText(data.hasTaxFree)}</span>
        <span>
          <span style={{ fontSize: 11, color: p.textLight, marginRight: 8 }}>{data.totalAmountKor}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: p.primary }}>₩ {money(data.totals.totalAmount)}</span>
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />
      </div>

      <DocFooter data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 2 차콜 — 얇은 선 + TO / FROM
// ═══════════════════════════════════════════════════
function StyleRule({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div style={{ height: 3, background: p.primary }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
        <div>
          <p style={{ fontSize: 10, color: p.textLight, letterSpacing: '0.3em', margin: 0 }}>ESTIMATE</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: p.textDark, letterSpacing: '0.1em', margin: '2px 0 0' }}>
            견 적 서
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo url={c?.logo} size={48} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>No. {data.meta.docNumber}</p>
            <p style={{ fontSize: 10, margin: '2px 0 0' }}>{data.meta.today}</p>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: p.border, margin: '14px 0 16px' }} />

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: p.textLight, letterSpacing: '0.2em', margin: 0 }}>TO</p>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 4px' }}>{data.customer?.name ?? ''} 귀하</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>{data.customer?.address1 ?? ''}</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>{data.customer?.address2 ?? ''}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: p.textLight, letterSpacing: '0.2em', margin: 0 }}>FROM</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 4px' }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{c?.name ?? ''}</span>
            <Stamp url={c?.stamp} />
          </div>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>대표: {c?.owner ?? ''}</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>
            사업자번호: {formatBizNoLoose(c?.bizno)}
          </p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>Tel: {c?.phone ?? ''}</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>
            담당: {data.user?.name ?? ''} {data.user?.phone ?? ''}
          </p>
        </div>
      </div>

      <div
        style={{
          background: p.accent,
          borderLeft: `4px solid ${p.primary}`,
          padding: '10px 12px',
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 10, color: p.textLight }}>{taxText(data.hasTaxFree)}</span>
        <span>
          <span style={{ fontSize: 10, color: p.textLight, marginRight: 8 }}>{data.totalAmountKor}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: p.primary }}>₩ {money(data.totals.totalAmount)}</span>
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <ItemTable data={data} p={p} headerBg={p.textDark} headerColor="#FFFFFF" />
      </div>

      <DocFooter data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 3 토프 — 가운데 제목 + 둥근 카드
// ═══════════════════════════════════════════════════
function StyleCard({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 50 }}>
          <Logo url={c?.logo} size={50} />
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: p.textDark, letterSpacing: '0.18em', margin: 0 }}>
            견 적 서
          </h1>
          <div style={{ height: 2, width: 100, background: p.primary, margin: '6px auto 0' }} />
        </div>
        <div style={{ width: 110, textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: p.textLight, margin: 0 }}>No. {data.meta.docNumber}</p>
          <p style={{ fontSize: 10, margin: '2px 0 0' }}>{data.meta.today}</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'stretch',
          background: p.accent,
          border: `1px solid ${p.border}`,
          borderRadius: 8,
          padding: 14,
          marginTop: 18,
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ background: p.primary, color: '#fff', fontSize: 9, borderRadius: 4, padding: '2px 8px' }}>
            수 신
          </span>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{data.customer?.name ?? ''} 귀하</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>{data.customer?.address1 ?? ''}</p>
          <p style={{ fontSize: 9, color: p.textLight, margin: 0 }}>{data.customer?.address2 ?? ''}</p>
        </div>
        <div style={{ width: 1, background: p.border }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ background: p.secondary, color: '#fff', fontSize: 9, borderRadius: 4, padding: '2px 8px' }}>
              공급자
            </span>
            <Stamp url={c?.stamp} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, margin: '8px 0 4px' }}>{c?.name ?? ''}</p>
          <SupplierLines data={data} p={p} />
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${p.border}`,
          borderRadius: 8,
          background: '#fff',
          padding: '10px 14px',
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: p.textLight }}>{taxText(data.hasTaxFree)}</span>
        <span>
          <span style={{ fontSize: 10, color: p.textLight, marginRight: 8 }}>{data.totalAmountKor}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: p.primary }}>₩ {money(data.totals.totalAmount)}</span>
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />
      </div>

      <DocFooter data={data} p={p} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 4 세이지 — 둥근 색 카드 헤더
// ═══════════════════════════════════════════════════
function StyleRounded({ data, p }: { data: DocData; p: DocPalette }) {
  const c = data.company;
  return (
    <div style={{ fontFamily: FONT, color: p.textDark }}>
      <div
        style={{
          background: p.primary,
          borderRadius: 12,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: '#fff', letterSpacing: '0.3em', margin: 0, opacity: 0.85 }}>QUOTATION</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', margin: '2px 0 0' }}>
            견 적 서
          </h1>
        </div>
        {c?.logo ? (
          <div style={{ background: '#fff', borderRadius: 8, padding: 5, lineHeight: 0 }}>
            <Logo url={c.logo} size={36} />
          </div>
        ) : null}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: '#fff', margin: 0 }}>No. {data.meta.docNumber}</p>
          <p style={{ fontSize: 10, color: '#CCFBF1', margin: '2px 0 0' }}>{data.meta.today}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <div style={{ flex: 1, background: p.accent, borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 12, background: p.primary, borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: p.primary }}>수신</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{data.customer?.name ?? ''} 귀하</p>
          <p style={{ fontSize: 9, color: '#5B7B7A', margin: 0 }}>{customerAddress(data.customer)}</p>
        </div>
        <div style={{ flex: 1, border: `1px solid ${p.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: p.primary }}>공급자</span>
            <Stamp url={c?.stamp} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 4px' }}>{c?.name ?? ''}</p>
          <SupplierLines data={data} p={p} />
        </div>
      </div>

      <div
        style={{
          background: p.accent,
          borderRadius: 8,
          padding: '10px 14px',
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: p.textLight }}>{taxText(data.hasTaxFree)}</span>
        <span>
          <span style={{ fontSize: 10, color: p.textLight, marginRight: 8 }}>{data.totalAmountKor}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: p.primary }}>₩ {money(data.totals.totalAmount)}</span>
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <ItemTable data={data} p={p} headerBg={p.primary} headerColor="#FFFFFF" />
      </div>

      <DocFooter data={data} p={p} />
    </div>
  );
}

export default function EstimateDoc({ styleKey, data, palette }: { styleKey: string; data: DocData; palette: DocPalette }) {
  switch (styleKey) {
    case '1':
      return <StyleBand data={data} p={palette} />;
    case '2':
      return <StyleRule data={data} p={palette} />;
    case '3':
      return <StyleCard data={data} p={palette} />;
    case '4':
      return <StyleRounded data={data} p={palette} />;
    default:
      return <Style0 data={data} />;
  }
}
