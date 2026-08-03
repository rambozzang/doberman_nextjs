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
import {
  Button,
  ButtonLink,
  StatCard,
  StatusPill,
  Chip,
  chipToneOf,
  MetricBox,
  DashedCta,
  AlertBanner,
  RowSkeleton,
} from "@/components/boss/ui";

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

  // 집계 — 실데이터에서만 파생한다
  const totals = ads.reduce(
    (s, a) => ({ imp: s.imp + a.impCnt, click: s.click + a.clickCnt, live: s.live + (a.serving ? 1 : 0) }),
    { imp: 0, click: 0, live: 0 }
  );
  const ctr = totals.imp > 0 ? (totals.click / totals.imp) * 100 : 0;

  return (
    <div className="flex flex-col gap-3.5">
      {/* ───── 최상단 배너 — 실패/차단은 숨기지 않는다 (시안 TRUST) ───── */}
      {!loading && vendorId == null && (
        <AlertBanner
          tone="bad"
          action={
            <ButtonLink href="/boss/me/company" variant="primary" size="sm">
              업체 등록
            </ButtonLink>
          }
        >
          지도에 등록된 업체가 없어 광고를 집행할 수 없습니다. 회사 주소를 등록하면 지도에
          표시되고 그때부터 광고를 낼 수 있습니다.
        </AlertBanner>
      )}

      {/* ───── KPI 4장 ───── */}
      {vendorId != null && (
        <section className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
          <StatCard
            label="총 노출"
            value={totals.imp.toLocaleString()}
            delta={totals.live > 0 ? `노출 중 ${totals.live}` : undefined}
            deltaTone="ok"
            hint="집행 중인 광고 합계"
            loading={loading}
          />
          <StatCard
            label="총 클릭"
            value={totals.click.toLocaleString()}
            hint="지도에서 업체를 누른 횟수"
            loading={loading}
          />
          <StatCard
            label="클릭률"
            value={`${ctr.toFixed(1)}%`}
            delta={ctr >= 2 ? '양호' : ctr > 0 ? '개선 여지' : undefined}
            deltaTone={ctr >= 2 ? 'ok' : 'warn'}
            hint="클릭 ÷ 노출"
            loading={loading}
          />
          <StatCard
            label="집행 중"
            value={String(totals.live)}
            delta={`전체 ${ads.length}`}
            deltaTone="neutral"
            hint="현재 노출되는 광고"
            loading={loading}
          />
        </section>
      )}

      {/* ───── 섹션 헤더 ───── */}
      {vendorId != null && (
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[13px] font-bold text-boss-text">집행 광고 {ads.length}</h2>
          <p className="text-[11.5px] text-boss-text-muted">
            등급이 높을수록 지도 마커와 광고 슬롯에서 앞에 노출됩니다
            {vendorName && ` · ${vendorName}`}
          </p>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setShowForm((v) => !v)}
          >
            광고 등록
          </Button>
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

      {/* ───── 광고 카드 그리드 — 시안 채널 카드 ───── */}
      {loading ? (
        <div className="boss-card-content">
          <RowSkeleton rows={4} />
        </div>
      ) : vendorId != null ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-[11px]">
          {ads.map((ad) => {
            const tier = TIERS.find((t) => t.value === ad.tier)?.label ?? String(ad.tier);
            const region = ad.regionSido
              ? `${ad.regionSido}${ad.regionSigungu ? " " + ad.regionSigungu : ""}`
              : "전국";
            return (
              <div
                key={ad.adId}
                className="flex flex-col gap-[11px] rounded-frame border border-boss-border bg-boss-surface p-3.5 transition-colors duration-[120ms] ease-out hover:border-boss-border-card-hover"
              >
                <div className="flex items-start gap-2.5">
                  <Chip tone={chipToneOf(tier)}>{tier.charAt(0)}</Chip>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-boss-text">{ad.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-boss-text-muted">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {region}
                    </p>
                  </div>
                  <StatusPill tone={ad.serving ? "ok" : ad.status === "N" ? "bad" : "neutral"}>
                    {ad.serving ? "노출 중" : ad.status === "N" ? "중지" : "대기"}
                  </StatusPill>
                </div>

                {ad.body && (
                  <p className="line-clamp-2 text-[11.5px] leading-[1.55] text-boss-text-secondary">
                    {ad.body}
                  </p>
                )}

                {/* 3칸 지표 — 시안 채널 카드 stats */}
                <div className="grid grid-cols-3 gap-[7px]">
                  <MetricBox label="노출" value={ad.impCnt.toLocaleString()} />
                  <MetricBox label="클릭" value={ad.clickCnt.toLocaleString()} />
                  <MetricBox
                    label="클릭률"
                    value={ad.impCnt > 0 ? `${((ad.clickCnt / ad.impCnt) * 100).toFixed(1)}%` : "-"}
                  />
                </div>

                <div className="flex items-center gap-[7px] text-[11px] text-boss-text-muted">
                  <span className="min-w-0 flex-1 truncate font-boss-mono">
                    {ad.startDt} ~ {ad.endDt}
                  </span>
                  {ad.status === "Y" && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={StopCircle}
                      onClick={() => stop(ad.adId)}
                    >
                      중지
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* 마지막 점선 카드 — 시안 `+ 새 플랫폼 연결` */}
          <DashedCta
            onClick={() => setShowForm(true)}
            className="min-h-[148px] !rounded-frame"
          >
            <Plus className="h-3.5 w-3.5" /> 새 광고 등록
          </DashedCta>
        </div>
      ) : null}
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
    <div className="rounded-xl border border-boss-border bg-boss-elevated/60 p-4">
      <h2 className="mb-3 text-sm font-bold text-white">새 광고</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="광고 제목" required>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            placeholder="강남 도배 20년 경력"
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
        <Field label="노출 등급">
          <select
            value={form.tier}
            onChange={(e) => set("tier", Number(e.target.value))}
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white outline-none ring-boss-warning focus:ring-2"
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
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
        <Field label="노출 지역 (비우면 전국)">
          <select
            value={form.regionSido ?? ""}
            onChange={(e) => set("regionSido", e.target.value)}
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white outline-none ring-boss-warning focus:ring-2"
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
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-boss-warning focus:ring-2 disabled:opacity-50"
          />
        </Field>
        <Field label="게시 시작일">
          <input
            type="date"
            value={form.startDt}
            onChange={(e) => set("startDt", e.target.value)}
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
        <Field label="게시 종료일">
          <input
            type="date"
            value={form.endDt}
            onChange={(e) => set("endDt", e.target.value)}
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
        <Field label="이미지 URL (선택)">
          <input
            value={form.imageUrl ?? ""}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
        <Field label="클릭 시 이동 (비우면 업체 상세)">
          <input
            value={form.landingUrl ?? ""}
            onChange={(e) => set("landingUrl", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg bg-boss-inset px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-boss-warning focus:ring-2"
          />
        </Field>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-boss-warning px-4 py-2 text-sm font-bold text-white hover:bg-boss-warning disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} 등록
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-boss-border-strong px-4 py-2 text-sm text-boss-text-soft hover:bg-boss-elevated"
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
      <label className="mb-1 block text-[11px] font-medium text-boss-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-boss-warning">*</span>}
      </label>
      {children}
    </div>
  );
}
