"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { List, Map as MapIcon, FileText } from "lucide-react";
import { MapBounds, VendorCluster, VendorDetail, VendorMarker } from "@/types/vendor";
import { VendorService } from "@/services/vendorService";
import VendorMap, { MARKER_ZOOM } from "./components/VendorMap";
import VendorPanel from "./components/VendorPanel";
import QuotePanel from "./components/QuotePanel";
import StoryPanel from "./components/StoryPanel";
import AdSlot from "./components/AdSlot";

const MARKER_LIMIT = 500;
const FETCH_DEBOUNCE_MS = 300;

type MobileTab = "list" | "map" | "quote";
type LeftTab = "vendor" | "story";

/** 화면에 보이는 업체들의 지역 중 가장 많은 곳 — 광고 타겟 기준으로 쓴다. */
function dominantRegion(markers: VendorMarker[]): { sido?: string | null; sigungu?: string | null } {
  if (markers.length === 0) return {};
  const counts = new Map<string, number>();
  markers.forEach((m) => {
    if (!m.sigungu) return;
    const key = `${m.sido ?? ""}|${m.sigungu}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((c, k) => {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  });
  if (!best) return {};
  const [sido, sigungu] = (best as string).split("|");
  return { sido: sido || null, sigungu: sigungu || null };
}

export default function MapPage() {
  const [markers, setMarkers] = useState<VendorMarker[]>([]);
  const [total, setTotal] = useState(0);
  const [clusters, setClusters] = useState<VendorCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomedOut, setZoomedOut] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quoteVendor, setQuoteVendor] = useState<VendorDetail | null>(null);
  const [keyword, setKeyword] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [leftTab, setLeftTab] = useState<LeftTab>("vendor");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  // 응답이 뒤늦게 도착해 최신 결과를 덮어쓰지 않도록 요청 순번을 센다.
  const reqSeqRef = useRef(0);

  // 시군구 집계는 한 번만 받아두고 축소 상태에서 재사용한다.
  useEffect(() => {
    VendorService.getClusters().then((res) => {
      if (res.success && res.data) setClusters(res.data);
    });
  }, []);

  const fetchMarkers = useCallback(
    async (bounds: MapBounds, kw: string) => {
      const seq = ++reqSeqRef.current;
      setLoading(true);
      try {
        const res = await VendorService.getInBounds({ ...bounds, keyword: kw, limit: MARKER_LIMIT });
        if (seq !== reqSeqRef.current) return; // 더 최신 요청이 있으면 버린다
        if (res.success && res.data) {
          setMarkers(res.data.markers ?? []);
          setTotal(res.data.total ?? 0);
        }
      } finally {
        if (seq === reqSeqRef.current) setLoading(false);
      }
    },
    [],
  );

  const handleBoundsChange = useCallback(
    (bounds: MapBounds, zoom: number) => {
      lastBoundsRef.current = bounds;
      const out = zoom < MARKER_ZOOM;
      setZoomedOut(out);
      if (out) {
        setMarkers([]);
        setTotal(0);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchMarkers(bounds, keyword), FETCH_DEBOUNCE_MS);
    },
    [fetchMarkers, keyword],
  );

  // 검색어가 바뀌면 현재 영역으로 다시 조회
  useEffect(() => {
    if (zoomedOut || !lastBoundsRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchMarkers(lastBoundsRef.current!, keyword),
      FETCH_DEBOUNCE_MS,
    );
  }, [keyword, zoomedOut, fetchMarkers]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleRequestQuote = useCallback((vendor: VendorDetail) => {
    setQuoteVendor(vendor);
    setMobileTab("quote");
  }, []);

  const handleSelect = useCallback((vendorId: number) => {
    setSelectedId(vendorId);
    setMobileTab("list");
  }, []);

  const truncated = total > markers.length;
  const selectedMarker = markers.find((m) => m.vendorId === selectedId) ?? null;
  // 업체를 골랐으면 그 업체 지역, 아니면 화면에서 가장 많이 보이는 지역으로 광고를 타겟한다
  const adRegion = selectedMarker
    ? { sido: selectedMarker.sido, sigungu: selectedMarker.sigungu }
    : dominantRegion(markers);

  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-[560px] flex-col lg:h-[calc(100dvh-80px)]">
      {/* 모바일 탭 — 3분할이 들어가지 않으므로 화면을 전환한다 */}
      <div className="flex border-b border-slate-700 bg-slate-900 lg:hidden">
        {(
          [
            { key: "list", label: "업체", icon: List },
            { key: "map", label: "지도", icon: MapIcon },
            { key: "quote", label: "견적", icon: FileText },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
              mobileTab === key
                ? "border-b-2 border-orange-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 좌측 — 업체 목록/상세 */}
        <aside
          className={`w-full shrink-0 flex-col border-r border-slate-700 bg-slate-900 lg:flex lg:w-80 xl:w-96 ${
            mobileTab === "list" ? "flex" : "hidden"
          }`}
        >
          <AdSlot sido={adRegion.sido} sigungu={adRegion.sigungu} onSelectVendor={setSelectedId} />

          <div className="flex border-b border-slate-700">
            {(
              [
                { key: "vendor", label: "업체" },
                { key: "story", label: "이야기" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLeftTab(key)}
                className={`flex-1 py-2 text-xs font-semibold transition ${
                  leftTab === key
                    ? "border-b-2 border-blue-500 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1">
            {leftTab === "vendor" ? (
              <VendorPanel
                markers={markers}
                total={total}
                truncated={truncated}
                zoomedOut={zoomedOut}
                loading={loading}
                selectedId={selectedId}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSelect={setSelectedId}
                onRequestQuote={handleRequestQuote}
              />
            ) : (
              <StoryPanel vendorId={selectedId} vendorName={selectedMarker?.name} />
            )}
          </div>
        </aside>

        {/* 중앙 — 지도 */}
        <div className={`min-w-0 flex-1 lg:block ${mobileTab === "map" ? "block" : "hidden"}`}>
          <VendorMap
            markers={markers}
            clusters={clusters}
            selectedId={selectedId}
            onBoundsChange={handleBoundsChange}
            onSelect={handleSelect}
          />
        </div>

        {/* 우측 — 견적 요청 */}
        <aside
          className={`w-full shrink-0 border-l border-slate-700 lg:block lg:w-80 xl:w-96 ${
            mobileTab === "quote" ? "block" : "hidden"
          }`}
        >
          <QuotePanel vendor={quoteVendor} onClear={() => setQuoteVendor(null)} />
        </aside>
      </div>
    </div>
  );
}
