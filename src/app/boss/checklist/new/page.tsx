'use client';

// 사장님 체크리스트 작성 페이지
// Flutter `lib/app/check_list/check_add_page.dart` 의 React 포팅 버전
// - 칩 선택(단일/멀티), 텍스트/금액 입력, 방 정보(4세트) 입력
// - 도배+장판 합산 → 총액, 총액-선금 → 잔금 자동 계산
// - 저장 시 POST /checklist
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import { getBossCustId } from '@/lib/api/boss/as';
import {
  type CheckData,
  type ChipItem,
  type RoomInfo,
  createEmptyCheckData,
  CHIP_HOUSING_TYPE,
  CHIP_OLD_WALL_PAGE,
  CHIP_AREA,
  CHIP_EXTEND_TYPE,
  CHIP_ART_WALL_TYPE,
  CHIP_ZIM_YN,
  CHIP_UMUL_SKY,
  CHIP_BALCONY,
  CHIP_SYSTEM,
  CHIP_VIRUS,
  CHIP_MOLDING,
  CHIP_LIGHT,
  CHIP_CONCENT_COVER,
} from '@/types/boss-checklist';

// 칩 컴포넌트
function ChipGroup({
  label,
  items,
  selected,
  onChange,
  multi = false,
}: {
  label: string;
  items: ChipItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  const toggle = (type: string) => {
    if (!multi) {
      onChange(selected.includes(type) ? [] : [type]);
      return;
    }
    // 멀티: '99'(없음)이 선택되면 다른건 모두 해제, 다른게 선택되면 '99' 해제
    if (type === '99') {
      onChange(selected.includes('99') ? [] : ['99']);
      return;
    }
    const without99 = selected.filter((s) => s !== '99');
    if (without99.includes(type)) {
      onChange(without99.filter((s) => s !== type));
    } else {
      onChange([...without99, type]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = selected.includes(it.type);
          return (
            <button
              key={it.type}
              type="button"
              onClick={() => toggle(it.type)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
              }`}
            >
              {it.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 텍스트 입력
function TextField({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-slate-400">{label}</div>}
      <input
        value={value}
        onChange={(e) => {
          const v = numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
          onChange(v);
        }}
        placeholder={placeholder}
        inputMode={numeric ? 'numeric' : 'text'}
        className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
      />
    </div>
  );
}

// 천 단위 콤마
const fmtMoney = (v: string): string => {
  if (!v) return '';
  const n = Number(v.replace(/,/g, ''));
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('ko-KR');
};
const stripMoney = (v: string): string => v.replace(/,/g, '');

function BossChecklistNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const [data, setData] = useState<CheckData>(createEmptyCheckData());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState('');

  // 초기 로드: 기존 데이터 있으면 채움
  const loadExisting = useCallback(async () => {
    const cid = getBossCustId();
    setCustomerId(cid);
    if (!cid) return;
    setLoading(true);
    try {
      const res = await bossChecklistApi.get(cid);
      if (res.success && res.data) {
        // 방 정보 4개 보장
        const rooms: RoomInfo[] = [...(res.data.roomsInfo ?? [])];
        while (rooms.length < 4) {
          rooms.push({ defSize: '', skySize: '', wallSize: '' });
        }
        setData({ ...res.data, roomsInfo: rooms.slice(0, 4), customerId: cid });
      } else {
        setData((prev) => ({ ...prev, customerId: cid }));
      }
    } catch {
      setData((prev) => ({ ...prev, customerId: cid }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // 패치 헬퍼
  const patch = (next: Partial<CheckData>) => setData((prev) => ({ ...prev, ...next }));

  // 단일 칩 선택값을 string으로 변환
  const singleVal = (s: string) => (s ? [s] : []);

  // 도배 + 장판 합산 → 총액, 총액 - 선금 → 잔금 (자동 계산)
  const totalPriceCalc = useMemo(() => {
    const a = Number(stripMoney(data.artWallPrice || '0')) || 0;
    const f = Number(stripMoney(data.floorPrice || '0')) || 0;
    return a + f;
  }, [data.artWallPrice, data.floorPrice]);

  const balanceCalc = useMemo(() => {
    const t = totalPriceCalc;
    const p = Number(stripMoney(data.prePayment || '0')) || 0;
    return t - p;
  }, [totalPriceCalc, data.prePayment]);

  // 방 정보 업데이트
  const updateRoom = (idx: number, key: keyof RoomInfo, value: string) => {
    setData((prev) => {
      const rooms = prev.roomsInfo.map((r, i) =>
        i === idx ? { ...r, [key]: value.replace(/,/g, '') } : r,
      );
      return { ...prev, roomsInfo: rooms };
    });
  };

  // 저장
  const handleSave = async () => {
    if (!customerId) {
      toast.error('로그인 정보가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const payload: CheckData = {
        ...data,
        customerId,
        artWallPrice: stripMoney(data.artWallPrice),
        floorPrice: stripMoney(data.floorPrice),
        totalPrice: String(totalPriceCalc),
        prePayment: stripMoney(data.prePayment),
        balance: String(balanceCalc),
      };
      const res = await bossChecklistApi.save(payload);
      if (res.success !== false) {
        toast.success('저장되었습니다.');
        router.push('/boss/checklist');
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/boss/checklist"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {isEdit ? '체크리스트 수정' : '체크리스트 작성'}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          저장
        </button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      ) : (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">기본 정보</h2>
            <ChipGroup
              label="주거 형태"
              items={CHIP_HOUSING_TYPE}
              selected={singleVal(data.housingType)}
              onChange={(next) => patch({ housingType: next[0] ?? '' })}
            />
            <ChipGroup
              label="면적 기준"
              items={CHIP_AREA}
              selected={singleVal(data.areaType)}
              onChange={(next) => patch({ areaType: next[0] ?? '' })}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="면적(㎡)"
                value={data.areaText}
                onChange={(v) => patch({ areaText: v })}
                placeholder="예: 84"
                numeric
              />
              <TextField
                label="짐 유무 텍스트(거실)"
                value={data.livingRoomText}
                onChange={(v) => patch({ livingRoomText: v })}
              />
            </div>
            <ChipGroup
              label="짐 유무"
              items={CHIP_ZIM_YN}
              selected={singleVal(data.zimYn)}
              onChange={(next) => patch({ zimYn: next[0] ?? '' })}
            />
          </section>

          {/* 방 정보 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">방 정보 (정사이즈 / 천장 / 벽)</h2>
            <div className="space-y-2">
              {data.roomsInfo.map((room, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="flex items-center text-xs font-semibold text-slate-400">
                    {i === 0 ? '거실' : `방 ${i}`}
                  </div>
                  <TextField
                    value={room.defSize}
                    onChange={(v) => updateRoom(i, 'defSize', v)}
                    placeholder="정사이즈"
                    numeric
                  />
                  <TextField
                    value={room.skySize}
                    onChange={(v) => updateRoom(i, 'skySize', v)}
                    placeholder="천장"
                    numeric
                  />
                  <TextField
                    value={room.wallSize}
                    onChange={(v) => updateRoom(i, 'wallSize', v)}
                    placeholder="벽"
                    numeric
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="층고(방)"
                value={data.roomHeight}
                onChange={(v) => patch({ roomHeight: v })}
                numeric
              />
              <TextField
                label="층고(거실)"
                value={data.livingRoomHeight}
                onChange={(v) => patch({ livingRoomHeight: v })}
                numeric
              />
            </div>
          </section>

          {/* 벽지/확장 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">벽지 / 확장</h2>
            <ChipGroup
              label="기존 벽지"
              items={CHIP_OLD_WALL_PAGE}
              selected={data.oldWallPage}
              onChange={(next) => patch({ oldWallPage: next })}
              multi
            />
            <ChipGroup
              label="확장 종류"
              items={CHIP_EXTEND_TYPE}
              selected={data.extendTypes}
              onChange={(next) => patch({ extendTypes: next })}
              multi
            />
            <ChipGroup
              label="아트월"
              items={CHIP_ART_WALL_TYPE}
              selected={singleVal(data.artWallType)}
              onChange={(next) => patch({ artWallType: next[0] ?? '' })}
            />
            <ChipGroup
              label="우물천장 종류"
              items={CHIP_UMUL_SKY}
              selected={data.umulSky}
              onChange={(next) => patch({ umulSky: next })}
              multi
            />
            <ChipGroup
              label="발코니 확장"
              items={CHIP_BALCONY}
              selected={data.balconyTypes}
              onChange={(next) => patch({ balconyTypes: next })}
              multi
            />
            <ChipGroup
              label="시스템"
              items={CHIP_SYSTEM}
              selected={data.systemTypes}
              onChange={(next) => patch({ systemTypes: next })}
              multi
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label="벽지"
                value={data.wallPage}
                onChange={(v) => patch({ wallPage: v })}
              />
              <TextField
                label="천장 품번"
                value={data.ceilingPage}
                onChange={(v) => patch({ ceilingPage: v })}
              />
              <TextField
                label="벽 품번"
                value={data.wallPageNum}
                onChange={(v) => patch({ wallPageNum: v })}
              />
            </div>
          </section>

          {/* 상태 점검 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">상태 점검</h2>
            <ChipGroup
              label="곰팡이/결로/누수"
              items={CHIP_VIRUS}
              selected={singleVal(data.virusStatus)}
              onChange={(next) => patch({ virusStatus: next[0] ?? '' })}
            />
            <TextField
              value={data.virusText}
              onChange={(v) => patch({ virusText: v })}
              placeholder="상세 내용"
            />
            <ChipGroup
              label="걸레받이/몰딩"
              items={CHIP_MOLDING}
              selected={singleVal(data.moldingStatus)}
              onChange={(next) => patch({ moldingStatus: next[0] ?? '' })}
            />
            <TextField
              value={data.moldingText}
              onChange={(v) => patch({ moldingText: v })}
              placeholder="상세 내용"
            />
            <ChipGroup
              label="천장 등기구"
              items={CHIP_LIGHT}
              selected={singleVal(data.lightStatus)}
              onChange={(next) => patch({ lightStatus: next[0] ?? '' })}
            />
            <TextField
              value={data.lightText}
              onChange={(v) => patch({ lightText: v })}
              placeholder="상세 내용"
            />
            <ChipGroup
              label="콘센트 커버 손상"
              items={CHIP_CONCENT_COVER}
              selected={data.concentCoverTypes}
              onChange={(next) => patch({ concentCoverTypes: next })}
              multi
            />
          </section>

          {/* 장판 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">장판</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="장판 품번"
                value={data.floorPage}
                onChange={(v) => patch({ floorPage: v })}
              />
              <TextField
                label="장판 총길이"
                value={data.floorPageLength}
                onChange={(v) => patch({ floorPageLength: v })}
              />
            </div>
          </section>

          {/* 금액 */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">금액</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="도배 금액"
                value={fmtMoney(data.artWallPrice)}
                onChange={(v) => patch({ artWallPrice: stripMoney(v) })}
                numeric
              />
              <TextField
                label="장판 금액"
                value={fmtMoney(data.floorPrice)}
                onChange={(v) => patch({ floorPrice: stripMoney(v) })}
                numeric
              />
              <div className="space-y-1">
                <div className="text-xs text-slate-400">총액 (자동)</div>
                <div className="flex h-9 items-center rounded-lg border border-slate-800 bg-slate-950/40 px-3 text-sm font-semibold text-emerald-300">
                  {totalPriceCalc.toLocaleString('ko-KR')} 원
                </div>
              </div>
              <TextField
                label="선금"
                value={fmtMoney(data.prePayment)}
                onChange={(v) => patch({ prePayment: stripMoney(v) })}
                numeric
              />
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-slate-400">잔금 (자동)</div>
                <div className="flex h-9 items-center rounded-lg border border-slate-800 bg-slate-950/40 px-3 text-sm font-semibold text-emerald-300">
                  {balanceCalc.toLocaleString('ko-KR')} 원
                </div>
              </div>
            </div>
          </section>

          {/* 비고 */}
          <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-bold text-white">비고</h2>
            <textarea
              value={data.bigo}
              onChange={(e) => patch({ bigo: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              placeholder="추가 메모를 입력하세요"
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default function BossChecklistNewPage() {
  // useSearchParams 사용 시 Suspense 경계 필요
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      }
    >
      <BossChecklistNewForm />
    </Suspense>
  );
}
