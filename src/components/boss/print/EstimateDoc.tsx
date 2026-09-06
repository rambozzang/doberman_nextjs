'use client';

// 견적서 문서 5종 — 한국 실무 견적서 서식
//
// 서식의 뼈대는 5종이 모두 같다. 실제 거래에 쓰이는 견적서는 생김새가 정해져 있고,
// 그 틀을 벗어나면 "진짜 서류" 로 보이지 않는다. 그래서 아래 구조는 고정한다.
//
//   제목(견 적 서) · 견적일자 · 문서번호
//   수신칸 | 공급자칸(등록번호 · 상호 · 성명(인) · 사업장주소 · 업태 · 종목 · 전화)  ← 격자 표
//   합계금액 띠 : 一金 …원整 (₩ …)
//   품목 격자표 : No · 품명 · 규격 · 단위 · 수량 · 단가 · 공급가액 · 세액 · 비고
//                 (빈 줄까지 칸이 그려지고, 마지막 줄은 합 계)
//   하단 안내 : 유효기간 · 납기일 · 결제조건 · 참조 + 비고
//
// 양식(색)마다 다른 것은 제목 줄의 생김새와 강조색뿐이다.
//   0 기본 · 1 슬레이트 · 2 차콜 · 3 토프 · 4 세이지

import type { DocData, DocPalette } from './docTypes';
import { money, taxText, companyAddress, customerAddress } from './docTypes';
import { formatBizNoLoose } from '@/lib/boss/docMeta';

const FONT = "'Pretendard', sans-serif";
/** 서식 선은 얇고 진하게 — 흐린 회색 선은 인쇄물에서 '가짜' 로 보인다 */
const LINE = '#111111';

const ROWS = 12; // 품목 칸 수 (앱 서식 기준 최소 줄)

function Stamp({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      style={{ width: 30, height: 30, objectFit: 'contain', mixBlendMode: 'multiply' }}
    />
  );
}

function Logo({ url, size }: { url?: string | null; size: number }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
}

/** 공급자 격자 — 등록번호 · 상호 · 성명(인) · 주소 · 업태/종목 · 전화 */
function SupplierGrid({ data, accent }: { data: DocData; accent: string }) {
  const c = data.company;
  const td: React.CSSProperties = { border: `1px solid ${LINE}`, padding: '3px 6px', fontSize: 10.5, lineHeight: 1.5 };
  const th: React.CSSProperties = {
    ...td,
    background: accent,
    fontWeight: 700,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    width: 62,
  };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
      <tbody>
        <tr>
          <td
            rowSpan={5}
            style={{
              ...td,
              width: 26,
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
          <td style={{ ...th, width: 44 }}>성 명</td>
          <td style={{ ...td, position: 'relative', width: 96 }}>
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
          <td style={{ ...th, width: 44 }}>종 목</td>
          <td style={td}>{c?.kind ?? ''}</td>
        </tr>
        <tr>
          <td style={th}>전 화</td>
          <td style={td} colSpan={3}>
            {[c?.phone, c?.fax ? `FAX ${c.fax}` : null].filter(Boolean).join('   ')}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** 품목 격자표 — 빈 칸까지 선을 그린다 */
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
  const td: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    padding: '4px 5px',
    fontSize: 10.5,
    height: 22,
    lineHeight: 1.4,
  };
  const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const blanks = Math.max(0, ROWS - data.items.length);

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', marginTop: 8 }}>
      <colgroup>
        <col style={{ width: 30 }} />
        <col />
        <col style={{ width: 74 }} />
        <col style={{ width: 40 }} />
        <col style={{ width: 44 }} />
        <col style={{ width: 68 }} />
        <col style={{ width: 78 }} />
        <col style={{ width: 62 }} />
        <col style={{ width: 62 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={th}>No</th>
          <th style={th}>품 명</th>
          <th style={th}>규 격</th>
          <th style={th}>단위</th>
          <th style={th}>수량</th>
          <th style={th}>단 가</th>
          <th style={th}>공급가액</th>
          <th style={th}>세 액</th>
          <th style={th}>비 고</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((it, i) => (
          <tr key={it.id ?? i}>
            <td style={{ ...td, textAlign: 'center', color: '#555' }}>{i + 1}</td>
            <td style={{ ...td, fontWeight: 600 }}>
              {it.itemName ?? ''}
              {it.isTaxFree === 'Y' ? ' *' : ''}
            </td>
            <td style={{ ...td, textAlign: 'center' }}>{it.itemSpec ?? ''}</td>
            <td style={{ ...td, textAlign: 'center' }}>{it.unit ?? ''}</td>
            <td style={num}>{money(it.quantity)}</td>
            <td style={num}>{money(it.unitPrice)}</td>
            <td style={num}>{money(it.supplyAmount)}</td>
            <td style={num}>{money(it.vatAmount)}</td>
            <td style={{ ...td, fontSize: 9.5, color: '#555' }}>{it.memo ?? ''}</td>
          </tr>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <tr key={`blank-${i}`}>
            <td style={{ ...td, textAlign: 'center', color: '#BBB' }}>{data.items.length + i + 1}</td>
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
            <td style={td} />
          </tr>
        ))}
        <tr>
          <td
            colSpan={6}
            style={{ ...td, background: accent, textAlign: 'center', fontWeight: 700, letterSpacing: '0.4em' }}
          >
            합 계
          </td>
          <td style={{ ...num, background: accent, fontWeight: 700 }}>{money(data.totals.supplyAmount)}</td>
          <td style={{ ...num, background: accent, fontWeight: 700 }}>{money(data.totals.vatAmount)}</td>
          <td style={{ ...td, background: accent }} />
        </tr>
      </tbody>
    </table>
  );
}

/** 수신 · 공급자 두 칸 */
function Parties({ data, accent }: { data: DocData; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginTop: 12 }}>
      <div style={{ width: 238, border: `1px solid ${LINE}`, padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, margin: 0, letterSpacing: '0.3em' }}>수 신</p>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 0' }}>
          {data.customer?.name ?? ''} <span style={{ fontSize: 12, fontWeight: 400 }}>귀하</span>
        </p>
        {customerAddress(data.customer) ? (
          <p style={{ fontSize: 10, color: '#444', margin: '4px 0 0' }}>{customerAddress(data.customer)}</p>
        ) : null}
        {data.customer?.phone ? (
          <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>{data.customer.phone}</p>
        ) : null}
        <p style={{ fontSize: 11, margin: 'auto 0 0', paddingTop: 10 }}>아래와 같이 견적합니다.</p>
      </div>
      <div style={{ flex: 1 }}>
        <SupplierGrid data={data} accent={accent} />
      </div>
    </div>
  );
}

/** 합계금액 띠 — 한글 금액을 크게 (서식의 신뢰도는 여기서 난다) */
function TotalBar({ data, p }: { data: DocData; p: DocPalette }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: `2px solid ${LINE}`,
        marginTop: 12,
      }}
    >
      <div
        style={{
          width: 128,
          background: p.accent,
          borderRight: `1px solid ${LINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10.5,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.3,
          padding: '6px 4px',
        }}
      >
        합계금액
        <br />
        <span style={{ fontWeight: 400, fontSize: 9 }}>(공급가액 + 세액)</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.02em' }}>
          一金 {data.totalAmountKor}整
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: p.primary }}>
          ₩ {money(data.totals.totalAmount)}
        </span>
      </div>
    </div>
  );
}

/** 하단 조건 · 비고 */
function Conditions({ data, accent }: { data: DocData; accent: string }) {
  const td: React.CSSProperties = { border: `1px solid ${LINE}`, padding: '4px 8px', fontSize: 10 };
  const th: React.CSSProperties = { ...td, background: accent, fontWeight: 700, textAlign: 'center', width: 66, whiteSpace: 'nowrap' };
  return (
    <div style={{ marginTop: 10 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={th}>유효기간</td>
            <td style={td}>{data.meta.validDate} 까지</td>
            <td style={th}>납 기 일</td>
            <td style={td}>{data.meta.dueDate}</td>
            <td style={th}>결제조건</td>
            <td style={td}>{data.meta.paymentCondition}</td>
          </tr>
          <tr>
            <td style={th}>비 고</td>
            <td style={{ ...td, height: 40, verticalAlign: 'top', whiteSpace: 'pre-wrap' }} colSpan={5}>
              {data.company?.bigo ?? ''}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 9.5, color: '#555', margin: '6px 0 0' }}>
        {data.hasTaxFree ? '* 표시는 비과세 항목입니다.  ' : ''}
        본 견적서는 견적일로부터 {data.meta.validDate} 까지 유효하며, 현장 상황에 따라 금액이 조정될 수 있습니다.
      </p>
    </div>
  );
}

/** 양식별 제목 줄 */
function Title({ data, p, styleKey }: { data: DocData; p: DocPalette; styleKey: string }) {
  const c = data.company;
  const meta = (
    <div style={{ textAlign: 'right', fontSize: 10.5, lineHeight: 1.7 }}>
      <div>
        <span style={{ color: '#555' }}>견적일자 </span>
        {data.meta.today}
      </div>
      <div>
        <span style={{ color: '#555' }}>문서번호 </span>
        {data.meta.docNumber}
      </div>
    </div>
  );

  if (styleKey === '1' || styleKey === '4')
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
            <Logo url={c.logo} size={34} />
          </span>
        ) : null}
        <h1 style={{ flex: 1, fontSize: 26, fontWeight: 800, letterSpacing: '0.35em', margin: 0 }}>견 적 서</h1>
        <div style={{ textAlign: 'right', fontSize: 10.5, lineHeight: 1.7 }}>
          <div>견적일자 {data.meta.today}</div>
          <div>문서번호 {data.meta.docNumber}</div>
        </div>
      </div>
    );

  if (styleKey === '2')
    return (
      <div>
        <div style={{ height: 4, background: p.primary }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {c?.logo ? <Logo url={c.logo} size={40} /> : null}
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.3em', margin: 0, color: p.textDark }}>
              견 적 서
            </h1>
          </div>
          {meta}
        </div>
        <div style={{ height: 1, background: LINE, marginTop: 8 }} />
      </div>
    );

  // 0 기본 · 3 토프 — 가운데 큰 제목 (가장 전통적인 서식)
  return (
    <div style={{ position: 'relative', paddingBottom: 8 }}>
      <div style={{ position: 'absolute', left: 0, top: 0 }}>
        <Logo url={c?.logo} size={44} />
      </div>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '0.55em',
          textAlign: 'center',
          margin: 0,
          textIndent: '0.55em',
          color: styleKey === '3' ? p.textDark : '#111',
        }}
      >
        견 적 서
      </h1>
      <div
        style={{
          width: 168,
          height: styleKey === '3' ? 3 : 2,
          background: styleKey === '3' ? p.primary : '#111',
          margin: '7px auto 0',
        }}
      />
      <div style={{ position: 'absolute', right: 0, top: 0 }}>{meta}</div>
    </div>
  );
}

export default function EstimateDoc({ styleKey, data, palette }: { styleKey: string; data: DocData; palette: DocPalette }) {
  const p = palette;
  // 표 머리 · 라벨 칸 색 — 기본은 회색, 색 양식은 자기 색을 옅게 쓴다
  const accent = styleKey === '0' ? '#EFEFEF' : p.accent;
  const headerBg = styleKey === '0' ? '#EFEFEF' : p.primary;
  const headerColor = styleKey === '0' ? '#111' : '#FFFFFF';

  return (
    <div style={{ fontFamily: FONT, color: '#111', fontSize: 11, lineHeight: 1.5 }}>
      <Title data={data} p={p} styleKey={styleKey} />
      <Parties data={data} accent={accent} />
      <TotalBar data={data} p={p} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
        <span style={{ fontSize: 10.5, color: '#333' }}>{taxText(data.hasTaxFree)}</span>
        <span style={{ fontSize: 10, color: '#666' }}>
          총 {data.totals.totalItems}개 품목 · 수량 {money(data.totals.totalQuantity)}
        </span>
      </div>
      <ItemGrid data={data} accent={accent} headerBg={headerBg} headerColor={headerColor} />
      <Conditions data={data} accent={accent} />
      <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, margin: '16px 0 0' }}>
        {data.company?.name ?? ''}
        {data.company?.phone ? <span style={{ fontWeight: 400, color: '#444' }}>  {data.company.phone}</span> : null}
      </p>
    </div>
  );
}
