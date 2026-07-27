"use client";

import { useEffect, useState } from "react";
import { Megaphone, Phone } from "lucide-react";
import { VendorAd } from "@/types/vendor";
import { VendorService } from "@/services/vendorService";

interface AdSlotProps {
  /** 지도에서 보고 있는 지역 — 이 지역을 타겟한 광고가 전국 광고보다 우선 노출된다 */
  sido?: string | null;
  sigungu?: string | null;
  onSelectVendor: (vendorId: number) => void;
}

export default function AdSlot({ sido, sigungu, onSelectVendor }: AdSlotProps) {
  const [ads, setAds] = useState<VendorAd[]>([]);

  // 지역이 바뀔 때만 다시 요청한다. 노출수는 서버에서 집계되므로
  // 지도를 조금 움직일 때마다 호출하면 노출수가 부풀려진다.
  useEffect(() => {
    let cancelled = false;
    VendorService.getAds({ sido, sigungu, limit: 2 }).then((res) => {
      if (!cancelled && res.success && res.data) setAds(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [sido, sigungu]);

  const handleClick = async (ad: VendorAd) => {
    // 클릭 집계 후 이동. 집계가 실패해도 사용자 이동은 막지 않는다.
    const res = await VendorService.clickAd(ad.adId).catch(() => null);
    const landing = res?.data?.landingUrl ?? ad.landingUrl;
    if (landing) {
      window.open(landing, "_blank", "noopener,noreferrer");
      return;
    }
    onSelectVendor(ad.vendorId);
  };

  if (ads.length === 0) return null;

  return (
    <div className="border-b border-slate-700 bg-slate-950/60 p-2">
      <div className="mb-1.5 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Megaphone className="h-3 w-3" />
        광고
      </div>
      <div className="space-y-1.5">
        {ads.map((ad) => (
          <button
            key={ad.adId}
            onClick={() => handleClick(ad)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-left transition hover:border-orange-500/60 hover:bg-slate-800"
          >
            {ad.imageUrl && (
              // 외부 광고 이미지는 도메인이 불특정이라 next/image 대신 img 를 쓴다
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.imageUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{ad.title}</p>
              {ad.body && <p className="truncate text-[11px] text-slate-400">{ad.body}</p>}
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="truncate">{ad.vendorName}</span>
                {ad.sigungu && <span>{ad.sigungu}</span>}
                {ad.phone && (
                  <span className="flex items-center gap-0.5">
                    <Phone className="h-2.5 w-2.5" />
                    {ad.phone}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">
              AD
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
