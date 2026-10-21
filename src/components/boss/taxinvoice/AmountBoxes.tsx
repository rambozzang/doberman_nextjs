// 세금계산서 화면 금액 상자 — 작성 · 상세 · 목록이 같이 쓴다(2026-10-21 점검 N5)
//
// 공용 MetricBox 는 금액 글자가 22px 로 고정이라 휴대폰 세 칸(칸당 글자 자리 71px)에서 1천만 원부터 '원'이 내려가고
// 1억 원대는 끝자리가 가려졌다(123,456,78…). 공용 부품을 바꾸면 다른 화면도 바뀌므로 세금계산서 화면은 이 부품을 쓴다.
//   칸(기본): 칸 폭에 맞춰 금액 글자를 14~22px 로 줄인다. 제목은 12px · 진한 회색(대비 4.5 이상).
//   rowsOnPhone: 휴대폰(640px 미만)에서는 칸 대신 세로 줄 — 왼쪽 이름 · 오른쪽 금액.
// 모양은 boss-b2b.css 의 .boss-amount-* 가 정한다.

export interface AmountBoxItem {
  label: string;
  value: string;
}

export default function AmountBoxes({
  items,
  columns,
  rowsOnPhone = false,
}: {
  items: AmountBoxItem[];
  /** 칸 수 — Tailwind 격자 이름(예: 'grid-cols-2 sm:grid-cols-4', 'sm:grid-cols-3') */
  columns: string;
  rowsOnPhone?: boolean;
}) {
  return (
    <dl className={`boss-amount-grid ${rowsOnPhone ? 'boss-amount-rows' : ''} ${columns}`}>
      {items.map((it) => (
        <div key={it.label} className="boss-amount-box">
          <dt className="boss-amount-label">{it.label}</dt>
          <dd className="boss-amount-value">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
