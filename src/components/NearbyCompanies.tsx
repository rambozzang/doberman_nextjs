'use client';

import { MapPin, Phone } from 'lucide-react';
import { CustomerRequestService } from '@/services/customerRequestService';
import type { NearbyCompany } from '@/types/api';

interface Props {
  requestId?: number | null;
  companies?: NearbyCompany[] | null;
  /** 지도 옆 좁은 칸 */
  compact?: boolean;
  /** 바깥 여백(기본: 위쪽 여백) */
  className?: string;
}

/**
 * 견적 요청을 마친 고객에게 근처 사장님 연락처 소개(2026-10-23).
 * 서버가 요청 저장 응답에 실어 준 3곳만 보여 준다 — 연락처 공개에 동의한 사장님 중에서 돌아가며 고른다.
 * 소개할 곳이 없으면 아무것도 그리지 않는다.
 */
export default function NearbyCompanies({ requestId, companies, compact = false, className }: Props) {
  if (!requestId || !companies || companies.length === 0) return null;

  // 효과 측정용 기록 — 실패해도 전화는 그대로 걸린다
  const recordCall = (companyId: number) => {
    void CustomerRequestService.recordContactCall(requestId, companyId).catch(() => undefined);
  };

  return (
    <section
      className={`w-full break-keep text-left [overflow-wrap:anywhere] ${className ?? (compact ? 'mt-2' : 'mt-8')}`}
      aria-label="근처 도배 사장님"
    >
      <h3 className={`font-bold text-white ${compact ? 'text-sm' : 'text-lg'}`}>
        이 지역 도배 사장님께 바로 전화해 보세요
      </h3>
      <p className={`mt-1 text-slate-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        비교 견적은 그대로 계속 받습니다. 급하면 먼저 전화로 상담해 보세요.
      </p>

      <ul className={`mt-3 flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        {companies.map((c) => {
          const digits = c.phone.replace(/[^0-9]/g, '');
          return (
            <li
              key={c.companyId}
              className={`rounded-xl border border-slate-700 bg-slate-800/70 ${compact ? 'p-3' : 'p-4'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`line-clamp-2 font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {c.area}
                  </p>
                </div>
                {c.recentlyAnswered && (
                  <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    최근 견적 보냄
                  </span>
                )}
              </div>
              {c.intro && !compact && <p className="mt-2 line-clamp-2 text-sm text-slate-300">{c.intro}</p>}
              <a
                href={`tel:${digits}`}
                aria-label={`${c.name} ${c.phone} 전화하기`}
                onClick={() => recordCall(c.companyId)}
                className={`mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-500 font-bold text-slate-950 transition-colors hover:bg-emerald-400 ${
                  compact ? 'text-sm' : 'text-base'
                }`}
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{c.phone}</span>
                {/* 아주 좁은 화면(360px 미만)에서는 번호만 — 두 줄로 꺾이지 않게 */}
                <span className="hidden whitespace-nowrap min-[360px]:inline">전화하기</span>
              </a>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        연락처 공개에 동의한 도배르만 사장님 중에서 돌아가며 소개합니다.
      </p>
    </section>
  );
}
