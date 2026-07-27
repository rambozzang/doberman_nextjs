"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  MapPin,
  Megaphone,
  MousePointerClick,
  Plus,
  StopCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { bossAdsApi } from "@/lib/api/boss/ads";
import type { BossAd, BossAdCreateRequest } from "@/types/boss-ad";

const SIDO_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시",
  "울산광역시", "세종특별자치시", "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

// 등급이 높으면 지도 마커와 광고 슬롯에서 더 앞에 노출된다
const TIERS = [
  { value: 1, label: "기본" },
  { value: 2, label: "우선" },
  { value: 3, label: "최우선" },
];

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function BossAdsPage() {
  const [ads, setAds] = useState<BossAd[]>([]);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await bossAdsApi.myList();
    if (res.success && res.data) {
      setAds(res.data.ads ?? []);
      setVendorName(res.data.vendorName);
      setVendorId(res.data.vendorId);
    } else {
      toast.error(res.message || res.error || "광고 목록을 불러오지 못했습니다.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stop = async (adId: number) => {
    if (!confirm("이 광고 게시를 중지하시겠습니까?")) return;
    const res = await bossAdsApi.stop(adId);
    if (res.success) {
      toast.success("게시를 중지했습니다.");
      load();
    } else {
      toast.error(res.message || res.error || "중지에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Megaphone className="h-5 w-5 text-orange-400" /> 지도 광고
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            도배업체 지도(/map)에서 우리 업체를 우선 노출합니다.
            {vendorName && <span className="ml-1 text-slate-300">· {vendorName}</span>}
          </p>
        </div>
        {vendorId != null && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" /> 광고 등록
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && vendorId == null && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200">
          <p className="font-semibold">아직 지도에 등록된 업체가 없습니다.</p>
          <p className="mt-1 text-amber-200/80">
            설정에서 회사 주소를 등록하면 지도에 표시되고, 그 후 광고를 집행할 수 있습니다.
          </p>
        </div>
      )}

      {!loading && vendorId != null && showForm && (
        <AdForm
          onCancel={() => setShowForm(false)}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {!loading && vendorId != null && (
        <div className="mt-5 space-y-3">
          {ads.length === 0 && (
            <p className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-sm text-slate-400">
              집행 중인 광고가 없습니다.
            </p>
          )}
          {ads.map((ad) => (
            <div
              key={ad.adId}
              className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-white">{ad.title}</h3>
                    {ad.serving ? (
                      <span className="shrink-0 rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        노출중
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-600/40 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {ad.status === "N" ? "중지" : "대기/종료"}
                      </span>
                    )}
                    <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {TIERS.find((t) => t.value === ad.tier)?.label ?? ad.tier}
                    </span>
                  </div>
                  {ad.body && <p className="mt-1 truncate text-sm text-slate-400">{ad.body}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ad.regionSido
                        ? `${ad.regionSido}${ad.regionSigungu ? " " + ad.regionSigungu : ""}`
                        : "전국"}
                    </span>
                    <span>
                      {ad.startDt} ~ {ad.endDt}
                    </span>
                  </div>
                </div>
                {ad.status === "Y" && (
                  <button
                    onClick={() => stop(ad.adId)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-slate-300 hover:border-red-500 hover:text-red-400"
                  >
                    <StopCircle className="h-3.5 w-3.5" /> 중지
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-700 pt-3">
                <Stat icon={BarChart3} label="노출" value={ad.impCnt} />
                <Stat icon={MousePointerClick} label="클릭" value={ad.clickCnt} />
                <Stat
                  icon={BarChart3}
                  label="클릭률"
                  value={ad.impCnt > 0 ? `${((ad.clickCnt / ad.impCnt) * 100).toFixed(1)}%` : "-"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number | string;
}) {
  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function AdForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [form, setForm] = useState<BossAdCreateRequest>({
    tier: 1,
    title: "",
    body: "",
    landingUrl: "",
    imageUrl: "",
    regionSido: "",
    regionSigungu: "",
    startDt: today(),
    endDt: today(30),
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BossAdCreateRequest>(key: K, value: BossAdCreateRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("광고 제목을 입력해 주세요.");
      return;
    }
    if (form.endDt < form.startDt) {
      toast.error("종료일이 시작일보다 앞설 수 없습니다.");
      return;
    }
    setSaving(true);
    const res = await bossAdsApi.create({
      ...form,
      title: form.title.trim(),
      body: form.body?.trim() || undefined,
      landingUrl: form.landingUrl?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
      regionSido: form.regionSido || undefined,
      regionSigungu: form.regionSigungu?.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success("광고를 등록했습니다.");
      onDone();
    } else {
      toast.error(res.message || res.error || "등록에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-bold text-white">새 광고</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="광고 제목" required>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            placeholder="강남 도배 20년 경력"
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
        <Field label="노출 등급">
          <select
            value={form.tier}
            onChange={(e) => set("tier", Number(e.target.value))}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-orange-500 focus:ring-2"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="광고 문구" className="sm:col-span-2">
          <input
            value={form.body ?? ""}
            onChange={(e) => set("body", e.target.value)}
            maxLength={300}
            placeholder="합지·실크 전문, 당일 견적"
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
        <Field label="노출 지역 (비우면 전국)">
          <select
            value={form.regionSido ?? ""}
            onChange={(e) => set("regionSido", e.target.value)}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-orange-500 focus:ring-2"
          >
            <option value="">전국</option>
            {SIDO_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="시군구 (비우면 시도 전체)">
          <input
            value={form.regionSigungu ?? ""}
            onChange={(e) => set("regionSigungu", e.target.value)}
            placeholder="강남구"
            disabled={!form.regionSido}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2 disabled:opacity-50"
          />
        </Field>
        <Field label="게시 시작일">
          <input
            type="date"
            value={form.startDt}
            onChange={(e) => set("startDt", e.target.value)}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
        <Field label="게시 종료일">
          <input
            type="date"
            value={form.endDt}
            onChange={(e) => set("endDt", e.target.value)}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
        <Field label="이미지 URL (선택)">
          <input
            value={form.imageUrl ?? ""}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
        <Field label="클릭 시 이동 (비우면 업체 상세)">
          <input
            value={form.landingUrl ?? ""}
            onChange={(e) => set("landingUrl", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2"
          />
        </Field>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} 등록
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-orange-400">*</span>}
      </label>
      {children}
    </div>
  );
}
