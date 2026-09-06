'use client';

// 영수증 문서 5종 — 한국 실무 영수증 서식
//
// 견적서와 같은 원칙: 실제 거래에 쓰는 영수증은 격자 서식이다.
//   제목(영 수 증) · 발행일 · 문서번호
//   받는 분(귀하) 칸
//   금액 칸 : 一金 …원整 (₩ …)  ← 가장 크게
//   공급자 격자 : 등록번호 · 상호 · 성명(인) · 사업장주소 · 업태/종목 · 전화
//   품목 격자표 : No · 품 명 · 규격 · 수량 · 단가 · 금 액 (+ 합계 행)
//   "위 금액을 정히 영수합니다." · 발행일 · 상호 · 대표자(인)
//
// 양식(색)마다 다른 것은 제목 줄과 강조색뿐이다.
//   0 기본 · 1 심플 · 2 클래식 · 3 카드 · 4 컬러

import type { DocData, DocPalette } from './docTypes';
import { money, companyAddress } from './docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const FONT = "'Pretendard', sans-serif";
const LINE = '#111111';
const ROWS = 8;

function Stamp({ url, size = 40 }: { url?: string | null; size?: number }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain', mixBlendMode: 'multiply' }} />
  );
}

function Logo({ url, size }: { url?: string | null; size: number }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
}

function SupplierGrid({ data, accent }: { data: DocData; accent: string }) {
  const c = data.company;
  const td: React.CSSProperties = { border: `1px solid ${LINE}`, padding: '4px 7px', fontSize: 10.5, lineHeight: 1.5 };
  const th: React.CSSProperties = {
    ...td,
    background: accent,
    fontWeight: 700,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    width: 74,
  };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
      <tbody>
        <tr>
          <td
            rowSpan={5}
            style={{
              ...td,
              width: 28,
              background: accent,
              fontWeight: 700,
              textAlign: 'center',
              verticalAlign: 'middle',
              letterSpacing: '0.4em',
              writingMode: 'vertical-rl',
              padding: '10px 2px',
            }}
          >
            공급자
          </td>
          <td style={th}>등록번호</td>
          <td style={{ ...td, letterSpacing: '0.08em' }} colSpan={3}>
            {formatBizNoLoose(c?.bizno)}
          </td>
        </tr>
        <tr>
          <td style={th}>상 호</td>
          <td style={{ ...td, fontWeight: 700 }}>{c?.name ?? ''}</td>
          <td style={{ ...th, width: 48 }}>성 명</td>
          <td style={{ ...td, position: 'relative', width: 104 }}>
            <span>{c?.owner ?? ''}</span>
            <span style={{ color: '#555', marginLeft: 3 }}>(인)</span>
            {c?.stamp ? (
              <span style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', opacity: 0.85 }}>
                <Stamp url={c.stamp} />
              </span>
            ) : null}
          </td>
        </tr>
        <tr>
          <td style={th}>사업장주소</td>
          <td style={td} colSpan={3}>
            {companyAddress(c)}
          </td>
        </tr>
        <tr>
          <td style={th}>업 태</td>
          <td style={td}>{c?.type ?? ''}</td>
          <td style={{ ...th, width: 48 }}>종 목</td>
          <td style={td}>{c?.kind ?? ''}</td>
        </tr>
        <tr>
          <td style={th}>전 화</td>
          <td style={td} colSpan={3}>
            {c?.phone ?? ''}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ItemGrid({ data, accent, headerBg, headerColor }: { data: DocData; accent: string; headerBg: string; headerColor: string }) {
  const th: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    padding: '5px 4px',
    fontSize: 10.5,
    fontWeight: 700,
    textAlign: 'center',
    background: headerBg,
    color: headerColor,
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = { border: `1px solid ${LINE}`, padding: '5px 6px', fontSize: 10.5, height: 24 };
  const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const blanks = Math.max(0, ROWS - data.items.length);
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', marginTop: 10 }}>
      <colgroup>
        <col style={{ width: 32 }} />
        <col />
        <col style={{ width: 82 }} />
        <col style={{ width: 50 }} />
        <col style={{ width: 82 }} />
        <col style={{ width: 100 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={th}>No</th>
          <th style={th}>품 명</th>
          <th style={th}>규 격</th>
          <th style={th}>수량</th>
          <th style={th}>단 가</th>
          <th style={th}>금 액</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((it, i) => (
          <tr key={it.id ?? i}>
            <td style={{ ...td, textAlign: 'center', color: '#555' }}>{i + 1}</td>
            <td style={{ ...td, fontWeight: 600 }}>{it.itemName ?? ''}</td>
            <td style={{ ...td, textAlign: 'center' }}>{[it.itemSpec, it.unit].filter(Boolean).join(' / ')}</td>
            <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(it.quantity)}</td>
            <td style={num}>{money(it.unitPrice)}</td>
            <td style={{ ...num, fontWeight: 700 }}>{money(it.totalAmount)}</td>
          </tr>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <tr key={`b-${i}`}>
            <td style={{ ...td, textAlign: 'center', color: '#BBB' }}>{data.items.length + i + 1}</td>
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
          </tr>
        ))}
        <tr>
          <td colSpan={5} style={{ ...td, background: accent, textAlign: 'center', fontWeight: 700, letterSpacing: '0.4em' }}>
            합 계
          </td>
          <td style={{ ...num, background: accent, fontWeight: 800, fontSize: 12 }}>{money(data.totals.totalAmount)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Title({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const meta = (
    <div style={{ textAlign: 'right', fontSize: 10.5, lineHeight: 1.7 }}>
      <div>
        <span style={{ color: '#555' }}>발행일자 </span>
        {data.meta.today}
      </div>
      <div>
        <span style={{ color: '#555' }}>문서번호 </span>
        {data.meta.docNumber}
      </div>
    </div>
  );

  if (styleKey === '3' || styleKey === '4')
    return (
      <div
        style={{
          background: p.primary,
          color: '#fff',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderRadius: styleKey === '4' ? 6 : 0,
        }}
      >
        {c?.logo ? (
          <span style={{ background: '#fff', padding: 4, lineHeight: 0, borderRadius: 3 }}>
            <Logo url={c.logo} size={32} />
          </span>
        ) : null}
        <h1 style={{ flex: 1, fontSize: 25, fontWeight: 800, letterSpacing: '0.4em', margin: 0 }}>영 수 증</h1>
        <div style={{ textAlign: 'right', fontSize: 10.5, lineHeight: 1.7 }}>
          <div>발행일자 {data.meta.today}</div>
          <div>문서번호 {data.meta.docNumber}</div>
        </div>
      </div>
    );

  if (styleKey === '1')
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {c?.logo ? <Logo url={c.logo} size={38} /> : null}
            <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '0.35em', margin: 0, color: p.textDark }}>
              영 수 증
            </h1>
          </div>
          {meta}
        </div>
        <div style={{ height: 3, background: p.primary, marginTop: 8 }} />
      </div>
    );

  // 0 기본 · 2 클래식 — 가운데 큰 제목
  return (
    <div style={{ position: 'relative', paddingBottom: 8 }}>
      <div style={{ position: 'absolute', left: 0, top: 0 }}>
        <Logo url={c?.logo} size={42} />
      </div>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '0.6em',
          textAlign: 'center',
          margin: 0,
          textIndent: '0.6em',
          color: styleKey === '2' ? p.primary : '#111',
        }}
      >
        영 수 증
      </h1>
      <div
        style={{
          width: 160,
          height: styleKey === '2' ? 3 : 2,
          background: styleKey === '2' ? p.primary : '#111',
          margin: '7px auto 0',
        }}
      />
      <div style={{ position: 'absolute', right: 0, top: 0 }}>{meta}</div>
    </div>
  );
}

export default function ReceiptDoc({ styleKey, data, palette }: { styleKey: string; data: DocData; palette: DocPalette }) {
  const p = palette;
  const accent = styleKey === '0' ? '#EFEFEF' : p.accent;
  const headerBg = styleKey === '0' ? '#EFEFEF' : p.primary;
  const headerColor = styleKey === '0' ? '#111' : '#FFFFFF';
  const sentence = styleKey === '2' ? '위 금액을 정히 영수함.' : '위 금액을 정히 영수합니다.';
  const c = data.company;

  return (
    <div style={{ fontFamily: FONT, color: '#111', fontSize: 11, lineHeight: 1.5 }}>
      <Title data={data} p={p} styleKey={styleKey} />

      {/* 받는 분 */}
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', marginTop: 12 }}>
        <tbody>
          <tr>
            <td
              style={{
                border: `1px solid ${LINE}`,
                background: accent,
                width: 90,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 10.5,
                padding: '6px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              받는 분
            </td>
            <td style={{ border: `1px solid ${LINE}`, padding: '6px 10px' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{data.customer?.name ?? ''}</span>
              <span style={{ fontSize: 12, marginLeft: 6 }}>귀하</span>
              {data.customer?.phone ? (
                <span style={{ fontSize: 10, color: '#555', marginLeft: 10 }}>{data.customer.phone}</span>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 금액 — 서식에서 가장 큰 글자 */}
      <div style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${LINE}`, borderTop: 'none' }}>
        <div
          style={{
            width: 90,
            background: accent,
            borderRight: `1px solid ${LINE}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          금 액
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>一金 {data.totalAmountKor}整</span>
          <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: p.primary }}>
            ₩ {money(data.totals.totalAmount)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SupplierGrid data={data} accent={accent} />
      </div>

      <ItemGrid data={data} accent={accent} headerBg={headerBg} headerColor={headerColor} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 6, fontSize: 10, color: '#444' }}>
        <span>공급가액 {money(data.totals.supplyAmount)}원</span>
        <span>세액 {money(data.totals.vatAmount)}원</span>
      </div>

      {/* 영수 확인 */}
      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <p style={{ fontSize: 13, margin: 0 }}>{sentence}</p>
        <p style={{ fontSize: 11, color: '#444', margin: '10px 0 0' }}>{data.meta.today}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{c?.name ?? ''}</span>
          <span style={{ fontSize: 12 }}>{c?.owner ?? ''}</span>
          <span style={{ fontSize: 11, color: '#555' }}>(인)</span>
          <Stamp url={c?.stamp} size={36} />
        </div>
      </div>
    </div>
  );
}
