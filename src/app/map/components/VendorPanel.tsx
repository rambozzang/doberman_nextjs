"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Search,
  Star,
} from "lucide-react";
import { VendorDetail, VendorMarker } from "@/types/vendor";
import { VendorService } from "@/services/vendorService";
import { SOCIAL_PLATFORMS, buildSearchQuery } from "../socialLinks";

interface VendorPanelProps {
  markers: VendorMarker[];
  total: number;
  truncated: boolean;
  zoomedOut: boolean;
  loading: boolean;
  selectedId: number | null;
  keyword: string;
  onKeywordChange: (v: string) => void;
  onSelect: (vendorId: number | null) => void;
  onRequestQuote: (vendor: VendorDetail) => void;
}

export default function VendorPanel({
  markers,
  total,
  truncated,
  zoomedOut,
  loading,
  selectedId,
  keyword,
  onKeywordChange,
  onSelect,
  onRequestQuote,
}: VendorPanelProps) {
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    VendorService.getDetail(selectedId)
      .then((res) => {
        if (!cancelled && res.success && res.data) setDetail(res.data);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // 상세 화면
  if (selectedId != null) {
    return (
      <div className="flex h-full flex-col bg-slate-900">
        <button
          onClick={() => onSelect(null)}
          className="flex items-center gap-2 border-b border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>

        {detailLoading && (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!detailLoading && detail && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-1 flex items-start gap-2">
              <h2 className="text-lg font-bold text-white">{detail.name}</h2>
              {(detail.memberYn === "Y" || detail.adTier > 0) && (
                <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-3 w-3" /> 도베르만 회원사
                </span>
              )}
            </div>
            {detail.bizCategory && (
              <p className="mb-3 text-xs text-slate-400">{detail.bizCategory}</p>
            )}

            <div className="space-y-2 text-sm text-slate-300">
              {detail.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span>{detail.address}</span>
                </p>
              )}
              {detail.phone && (
                <a href={`tel:${detail.phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                  {detail.phone}
                </a>
              )}
              {detail.homepage && (
                <a
                  href={detail.homepage}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-2 break-all hover:text-white"
                >
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
                  홈페이지
                </a>
              )}
            </div>

            {detail.intro && (
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
                {detail.intro}
              </p>
            )}

            {/* SNS/플랫폼 — 수집·등록된 실제 계정이 있으면 그것을, 없으면 검색으로 대체 */}
            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                채널
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PLATFORMS.map((p) => {
                  const found = (detail.links ?? []).find((l) => l.platform === p.key);
                  const href = found?.url ?? p.searchUrl(buildSearchQuery(detail.name, detail.sigungu));
                  return (
                    <a
                      key={p.key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={found?.title ?? undefined}
                      className={`${p.color} relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-[11px] font-semibold text-white transition hover:opacity-90 ${
                        found ? "" : "opacity-70"
                      }`}
                    >
                      {found && (
                        <CheckCircle2 className="absolute right-1 top-1 h-3 w-3 text-white drop-shadow" />
                      )}
                      <span>{p.label}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {found ? (found.verified ? "공식" : "채널") : "검색"}
                      </span>
                    </a>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                체크 표시는 업체 홈페이지·공식 API 에서 확인된 채널입니다. 표시가 없으면 해당
                플랫폼의 검색 결과로 이동하며, 업체의 공식 계정이 아닐 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => onRequestQuote(detail)}
              className="mt-5 w-full rounded-lg bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              이 업체에 견적 요청하기
            </button>
          </div>
        )}
      </div>
    );
  }

  // 목록 화면
  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="border-b border-slate-700 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="업체명 검색"
            className="w-full rounded-lg bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400">
        <span>
          {loading ? "불러오는 중…" : zoomedOut ? "지도를 확대해 주세요" : `${total.toLocaleString()}개 업체`}
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>

      {truncated && !zoomedOut && (
        <p className="mx-3 mb-2 rounded bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
          이 영역에 {total.toLocaleString()}개가 있어 {markers.length}개만 표시했습니다. 지도를 더
          확대하면 정확히 볼 수 있습니다.
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {!loading && !zoomedOut && markers.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            이 영역에는 등록된 업체가 없습니다.
          </p>
        )}
        {zoomedOut && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            지도의 지역 버블을 클릭하면 해당 지역 업체가 표시됩니다.
          </p>
        )}
        <ul className="divide-y divide-slate-800">
          {markers.map((m) => (
            <li key={m.vendorId}>
              <button
                onClick={() => onSelect(m.vendorId)}
                className="w-full px-4 py-3 text-left transition hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-white">{m.name}</span>
                  {(m.memberYn === "Y" || m.adTier > 0) && (
                    <Star className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                  {m.sigungu && <span>{m.sigungu}</span>}
                  {m.phone && <span className="truncate">{m.phone}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
