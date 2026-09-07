'use client';

// 목록 첫 칸 — 등록일
//
// 사장님 요청: "모든 리스트는 등록일이 맨앞에 와야 한다. 기본적인 거다."
// 어느 목록에서나 같은 모양으로 보이도록 이 부품 하나만 쓴다.
//
//   09.07 14:20  [NEW]
//   3시간 전 · #1124
//
// 오늘 들어온 건은 NEW 로 표시한다.

import { Badge } from '@/components/boss/ui';
import { formatReceivedAt, isToday, timeAgo } from '@/lib/boss/requestFormat';

export default function ListDateCell({
  at,
  id,
  showNew = true,
}: {
  /** 등록 일시 (ISO 또는 "2026-09-04 18:18:03.0") */
  at?: string | null;
  /** 번호 — 함께 작게 보여 준다 */
  id?: number | string | null;
  showNew?: boolean;
}) {
  const fresh = showNew && isToday(at);
  return (
    <div className="whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <span className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-text">
          {formatReceivedAt(at)}
        </span>
        {fresh && <Badge tone="emerald">NEW</Badge>}
      </div>
      <span className="font-boss-head text-[11px] tabular-nums text-boss-text-muted">
        {[timeAgo(at), id != null ? `#${id}` : null].filter(Boolean).join(' · ')}
      </span>
    </div>
  );
}
