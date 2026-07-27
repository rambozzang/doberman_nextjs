"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, AlertTriangle } from "lucide-react";
import { MapBounds, VendorCluster, VendorMarker } from "@/types/vendor";

declare global {
  interface Window {
    naver?: any;
  }
}

// NCP Maps 키. 신규 콘솔은 ncpKeyId, 구 콘솔 키는 ncpClientId 를 쓰므로 파라미터명도 환경변수로 둔다.
const MAP_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";
const MAP_AUTH_PARAM = process.env.NEXT_PUBLIC_NAVER_MAP_AUTH_PARAM ?? "ncpKeyId";

// 이 줌 이상이면 개별 업체 마커, 미만이면 시군구 집계 버블을 그린다.
// 전국을 개별 마커로 그리면 수만 개가 되어 브라우저가 멈춘다.
export const MARKER_ZOOM = 11;

const KOREA_CENTER = { lat: 36.5, lng: 127.8 };
const KOREA_ZOOM = 7;

let scriptPromise: Promise<void> | null = null;

/** 네이버 지도 SDK 를 한 번만 로드한다. */
function loadNaverMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.naver?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (!MAP_KEY) {
      reject(new Error("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 가 설정되지 않았습니다."));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${MAP_AUTH_PARAM}=${MAP_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("네이버 지도 SDK 로드에 실패했습니다."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface VendorMapProps {
  markers: VendorMarker[];
  clusters: VendorCluster[];
  selectedId: number | null;
  onBoundsChange: (bounds: MapBounds, zoom: number) => void;
  onSelect: (vendorId: number) => void;
}

export default function VendorMap({
  markers,
  clusters,
  selectedId,
  onBoundsChange,
  onSelect,
}: VendorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(KOREA_ZOOM);

  // 최신 콜백을 지도 이벤트 핸들러에서 쓰기 위한 ref (리스너를 재등록하지 않도록)
  const boundsCbRef = useRef(onBoundsChange);
  boundsCbRef.current = onBoundsChange;

  const emitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const sw = b.getSW();
    const ne = b.getNE();
    const z = map.getZoom();
    setZoom(z);
    boundsCbRef.current(
      { swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng() },
      z,
    );
  }, []);

  // 지도 초기화 (1회)
  useEffect(() => {
    let cancelled = false;
    loadNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const naver = window.naver;
        mapRef.current = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(KOREA_CENTER.lat, KOREA_CENTER.lng),
          zoom: KOREA_ZOOM,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
        });
        naver.maps.Event.addListener(mapRef.current, "idle", emitBounds);
        setReady(true);
        emitBounds();
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [emitBounds]);

  // 마커/버블 다시 그리기
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const naver = window.naver;
    const map = mapRef.current;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    if (zoom < MARKER_ZOOM) {
      // 축소 상태 — 시군구 집계 버블. 클릭하면 그 지역으로 확대한다.
      clusters.forEach((c) => {
        const size = c.cnt >= 100 ? 58 : c.cnt >= 30 ? 50 : 42;
        const overlay = new naver.maps.Marker({
          position: new naver.maps.LatLng(c.lat, c.lng),
          map,
          icon: {
            content: `<div style="width:${size}px;height:${size}px;border-radius:9999px;
              background:rgba(37,99,235,.88);color:#fff;display:flex;flex-direction:column;
              align-items:center;justify-content:center;font-weight:700;
              box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.9);cursor:pointer">
              <span style="font-size:13px;line-height:1">${c.cnt}</span>
              <span style="font-size:9px;opacity:.9;line-height:1.2">${c.sigungu ?? ""}</span>
            </div>`,
            anchor: new naver.maps.Point(size / 2, size / 2),
          },
        });
        naver.maps.Event.addListener(overlay, "click", () => {
          map.setCenter(new naver.maps.LatLng(c.lat, c.lng));
          map.setZoom(MARKER_ZOOM + 1);
        });
        overlaysRef.current.push(overlay);
      });
      return;
    }

    // 확대 상태 — 개별 업체 마커. 회원사/광고는 색으로 구분한다.
    markers.forEach((m) => {
      const selected = m.vendorId === selectedId;
      const isMember = m.memberYn === "Y" || m.adTier > 0;
      const bg = selected ? "#f97316" : isMember ? "#2563eb" : "#64748b";
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(m.lat, m.lng),
        map,
        title: m.name,
        icon: {
          content: `<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;
            border-radius:9999px;background:${bg};color:#fff;font-size:11px;font-weight:600;
            white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);
            border:${selected ? "2px solid #fff" : "1px solid rgba(255,255,255,.6)"};cursor:pointer">
            ${isMember ? "★ " : ""}${m.name.slice(0, 12)}
          </div>`,
          anchor: new naver.maps.Point(0, 12),
        },
      });
      naver.maps.Event.addListener(marker, "click", () => onSelect(m.vendorId));
      overlaysRef.current.push(marker);
    });
  }, [ready, markers, clusters, zoom, selectedId, onSelect]);

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-800 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400" />
        <p className="font-semibold text-slate-100">지도를 불러올 수 없습니다</p>
        <p className="max-w-md text-sm text-slate-400">{loadError}</p>
        <p className="max-w-md text-xs text-slate-500">
          네이버 클라우드 플랫폼에서 Maps(Web Dynamic Map) 키를 발급받아{" "}
          <code className="rounded bg-slate-700 px-1">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code> 에
          설정해 주세요. 구 콘솔 키라면{" "}
          <code className="rounded bg-slate-700 px-1">NEXT_PUBLIC_NAVER_MAP_AUTH_PARAM=ncpClientId</code>
          도 함께 지정합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/70">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4 animate-pulse" /> 지도를 불러오는 중…
          </div>
        </div>
      )}
      {ready && zoom < MARKER_ZOOM && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 text-xs text-slate-200 shadow-lg">
          지역 버블을 클릭하거나 확대하면 업체가 표시됩니다
        </div>
      )}
    </div>
  );
}
