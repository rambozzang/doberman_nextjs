"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { CustomerRequestService } from "@/services/customerRequestService";
import { CreateCustomerRequestRequest } from "@/types/api";
import { AuthManager } from "@/lib/auth";
import { VendorDetail } from "@/types/vendor";

// 라벨 값은 기존 견적 요청(/quote-request)과 동일하게 맞춘다.
// 사장님 대시보드에서 같은 기준으로 필터되어야 하므로 임의 문구를 쓰면 안 된다.
const BUILDING_TYPES = ["아파트", "빌라", "오피스텔", "단독주택", "사무실", "상가", "기타"];
const SCOPES = ["전체", "거실", "방", "주방", "화장실"];
const WALLPAPERS = ["합지벽지", "실크벽지", "실크 + 합지", "천연벽지", "수입벽지"];

const PYEONG_TO_M2 = 3.3058;

interface QuotePanelProps {
  vendor: VendorDetail | null;
  onClear: () => void;
}

export default function QuotePanel({ vendor, onClear }: QuotePanelProps) {
  const [buildingType, setBuildingType] = useState("아파트");
  const [scope, setScope] = useState("전체");
  const [wallpaper, setWallpaper] = useState("실크벽지");
  const [pyeong, setPyeong] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [region, setRegion] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // 업체를 선택하면 지역을 자동 채워준다(사용자가 고칠 수 있음)
  useEffect(() => {
    if (vendor) {
      setRegion([vendor.sido, vendor.sigungu].filter(Boolean).join(" "));
      setDone(false);
    }
  }, [vendor]);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("이름과 연락처를 입력해 주세요.");
      return;
    }
    if (!region.trim()) {
      toast.error("시공 지역을 입력해 주세요.");
      return;
    }
    if (!agree) {
      toast.error("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    const py = Number(pyeong) || 0;
    // 지정 업체는 etc1 에 담아 보낸다. 별도 스키마 변경 없이 사장님이 확인할 수 있다.
    const vendorMemo = vendor ? `지정업체: ${vendor.name} (vendorId=${vendor.vendorId})` : "";

    const payload: CreateCustomerRequestRequest = {
      webCustomerId: 0,
      buildingType,
      constructionLocation: scope,
      roomCount: Number(roomCount) || 0,
      area: py,
      areaSize: Math.round(py * PYEONG_TO_M2 * 10) / 10,
      wallpaper,
      ceiling: "전체",
      specialInfo: "",
      specialInfoDetail: "",
      hasItems: "",
      preferredDate: visitDate,
      preferredDateDetail: visitDate ? "원하는 날짜가 있어요" : "",
      region: region.trim(),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim(),
      customerPassword: password,
      agreeTerms: agree,
      requestDate: new Date().toISOString(),
      status: "검토중",
      etc1: vendorMemo,
      etc2: "지도(/map)",
      etc3: "",
    };

    setSubmitting(true);
    try {
      const loggedIn = AuthManager.isTokenValid();
      const res = loggedIn
        ? await CustomerRequestService.createCustomerRequest(payload)
        : await CustomerRequestService.createCustomerRequestNonLogin(payload);

      if (res.success) {
        setDone(true);
        toast.success("견적 요청이 접수되었습니다.");
      } else {
        toast.error(res.message || res.error || "견적 요청에 실패했습니다.");
      }
    } catch {
      toast.error("견적 요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <p className="text-lg font-bold text-white">견적 요청 완료</p>
        <p className="text-sm text-slate-400">
          업체에서 확인 후 연락드립니다. 요청 내역은 마이페이지에서 확인할 수 있습니다.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
        >
          추가로 요청하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-bold text-white">무료 견적 요청</h2>
        {vendor ? (
          <div className="mt-1 flex items-center gap-2 text-xs text-orange-300">
            <span className="truncate">지정: {vendor.name}</span>
            <button onClick={onClear} className="shrink-0 text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-400">지역 업체들에게 한 번에 요청됩니다</p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Field label="건물 유형">
          <Select value={buildingType} onChange={setBuildingType} options={BUILDING_TYPES} />
        </Field>
        <Field label="시공 범위">
          <Select value={scope} onChange={setScope} options={SCOPES} />
        </Field>
        <Field label="벽지 종류">
          <Select value={wallpaper} onChange={setWallpaper} options={WALLPAPERS} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="평수">
            <Input value={pyeong} onChange={setPyeong} type="number" placeholder="24" />
          </Field>
          <Field label="방 개수">
            <Input value={roomCount} onChange={setRoomCount} type="number" placeholder="3" />
          </Field>
        </div>
        <Field label="시공 지역">
          <Input value={region} onChange={setRegion} placeholder="서울 강남구" />
        </Field>
        <Field label="방문 희망일">
          <Input value={visitDate} onChange={setVisitDate} type="date" />
        </Field>

        <div className="border-t border-slate-800 pt-3">
          <Field label="이름">
            <Input value={name} onChange={setName} placeholder="홍길동" />
          </Field>
          <Field label="연락처">
            <Input value={phone} onChange={setPhone} placeholder="010-0000-0000" />
          </Field>
          <Field label="이메일">
            <Input value={email} onChange={setEmail} type="email" placeholder="선택" />
          </Field>
          <Field label="비밀번호">
            <Input
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="요청 조회용 (선택)"
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
          />
          <span>견적 상담을 위한 개인정보(이름·연락처) 수집·이용에 동의합니다.</span>
        </label>
      </div>

      <div className="border-t border-slate-700 p-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "전송 중…" : "무료 견적 요청"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-[11px] font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-orange-500 focus:ring-2"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-orange-500 focus:ring-2"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
