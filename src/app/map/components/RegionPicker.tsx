"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { VendorCluster } from "@/types/vendor";

interface RegionPickerProps {
  clusters: VendorCluster[];
  selected: { sido?: string | null; sigungu?: string | null };
  onSelect: (sido: string | null, sigungu: string | null) => void;
  reason?: string | null;
}

/**
 * 지도를 못 띄웠을 때 지도 자리에 들어가는 지역 선택기.
 *
 * 지도가 없으면 bbox 를 얻을 수 없어 업체 목록이 영원히 비므로, 시도 → 시군구를
 * 직접 고르는 경로를 준다. 지도 키가 없어도 페이지가 제 역할을 하도록 하는 게 목적이다.
 */
export default function RegionPicker({
  clusters,
  selected,
  onSelect,
  reason,
}: RegionPickerProps) {
  const [openSido, setOpenSido] = useState<string | null>(selected.sido ?? null);

  // 시도별 업체 수 합계
  const sidoList = useMemo(() => {
    const map = new Map<string, number>();
    clusters.forEach((c) => {
      if (!c.sido) return;
      map.set(c.sido, (map.get(c.sido) ?? 0) + c.cnt);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [clusters]);

  const sigunguList = useMemo(
    () =>
      clusters
        .filter((c) => c.sido === openSido && c.sigungu)
        .sort((a, b) => b.cnt - a.cnt),
    [clusters, openSido],
  );

  const total = useMemo(() => clusters.reduce((s, c) => s + c.cnt, 0), [clusters]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-800/40 p-5">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <MapPin className="h-5 w-5 text-blue-400" /> 지역으로 찾기
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          지도를 표시할 수 없어 지역 선택으로 안내합니다. 전국 {total.toLocaleString()}곳
        </p>
        {reason && <p className="mt-1 text-[11px] text-slate-600">{reason}</p>}
      </div>

      {openSido == null ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {sidoList.map(([sido, cnt]) => (
            <button
              key={sido}
              onClick={() => {
                setOpenSido(sido);
                onSelect(sido, null);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 text-left transition hover:border-blue-500 hover:bg-slate-700"
            >
              <p className="truncate text-sm font-semibold text-white">{sido}</p>
              <p className="text-[11px] text-slate-400">{cnt.toLocaleString()}곳</p>
            </button>
          ))}
          {sidoList.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-500">
              아직 등록된 업체가 없습니다.
            </p>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              setOpenSido(null);
              onSelect(null, null);
            }}
            className="mb-3 flex items-center gap-1 self-start text-sm text-slate-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> 전체 지역
          </button>
          <p className="mb-2 text-sm font-semibold text-white">{openSido}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <button
              onClick={() => onSelect(openSido, null)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                !selected.sigungu
                  ? "border-blue-500 bg-blue-600/20"
                  : "border-slate-700 bg-slate-800 hover:border-blue-500"
              }`}
            >
              <p className="text-sm font-medium text-white">전체</p>
            </button>
            {sigunguList.map((c) => (
              <button
                key={`${c.sido}-${c.sigungu}`}
                onClick={() => onSelect(openSido, c.sigungu ?? null)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  selected.sigungu === c.sigungu
                    ? "border-blue-500 bg-blue-600/20"
                    : "border-slate-700 bg-slate-800 hover:border-blue-500"
                }`}
              >
                <p className="truncate text-sm font-medium text-white">{c.sigungu}</p>
                <p className="text-[11px] text-slate-400">{c.cnt.toLocaleString()}곳</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
