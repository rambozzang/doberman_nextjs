'use client';

// 체크리스트 작성/수정 — Industry 패턴 (참조 ListingForm 조판)
//   좌: 패널 섹션(기본 정보 · 방 정보 · 벽지/확장 · 상태 점검 · 장판 · 금액 · 비고) + 하단 액션 패널
//   우: 금액 요약(DescRow) · 안내 패널. 화면 제목은 셸 헤더(PAGE_META)가 그린다.
// Flutter `lib/app/check_list/check_add_page.dart` 포팅 —
//   칩 선택(단일/멀티), 텍스트/금액 입력, 방 정보(4세트). 도배+장판 → 총액, 총액-선금 → 잔금 자동 계산. 저장 POST /checklist.
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
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
import {
  Panel,
  FieldLabel,
  TextareaField,
  MetricBox,
  DescRow,
  Button,
  ButtonLink,
  Skeleton,
} from '@/components/boss/ui';

// 칩 그룹 — 참조 Chip : 사각, 선택 = accent 테두리 + accent-100 배경
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
    <div>
      <FieldLabel>
        {label}
        {multi && <span className="ml-1 text-boss-text-faint">(복수 선택)</span>}
      </FieldLabel>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {items.map((it) => {
          const active = selected.includes(it.type);
          return (
            <button
              key={it.type}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(it.type)}
              className={`border px-2.5 py-[5px] text-[12.5px] transition-colors duration-[120ms] ease-out ${
                active
                  ? 'border-boss-primary bg-boss-elevated font-semibold text-boss-pill-info-fg'
                  : 'border-boss-border bg-boss-bg text-boss-text-dim hover:bg-boss-hover'
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

// 텍스트 입력 — boss-label + boss-input. 단위는 입력창 안 우측
function TextField({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
  suffix,
  ariaLabel,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  suffix?: string;
  ariaLabel?: string;
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            const v = numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
            onChange(v);
          }}
          placeholder={placeholder}
          inputMode={numeric ? 'numeric' : 'text'}
          aria-label={ariaLabel ?? label}
          className={`boss-input ${numeric ? 'font-boss-head tabular-nums' : ''} ${suffix ? 'pr-12' : ''}`}
          maxLength={100}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[12.5px] text-boss-text-muted">
            {suffix}
          </span>
        )}
      </div>
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

  const won = (n: number) => `${n.toLocaleString('ko-KR')} 원`;

  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ── 좌: 폼 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* 기본 정보 */}
        <Panel title="기본 정보" kicker={isEdit ? 'EDIT' : 'NEW'}>
          <div className="flex flex-col gap-4">
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
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="면적"
                value={data.areaText}
                onChange={(v) => patch({ areaText: v })}
                placeholder="예: 84"
                numeric
                suffix="㎡"
              />
              <TextField
                label="짐 유무 메모(거실)"
                value={data.livingRoomText}
                onChange={(v) => patch({ livingRoomText: v })}
                placeholder="예: 소파 · 장식장 남아 있음"
              />
            </div>
            <ChipGroup
              label="짐 유무"
              items={CHIP_ZIM_YN}
              selected={singleVal(data.zimYn)}
              onChange={(next) => patch({ zimYn: next[0] ?? '' })}
            />
          </div>
        </Panel>

        {/* 방 정보 */}
        <Panel title="방 정보" kicker="ROOMS">
          <p className="mb-3 text-[12px] text-boss-text-secondary">
            거실과 방 3개의 정사이즈 · 천장 · 벽 실측값을 적습니다. 비워 두면 인쇄물에 &ldquo;-&rdquo; 로 나옵니다.
          </p>
          <div className="flex flex-col gap-2">
            <div className="hidden grid-cols-[72px_1fr_1fr_1fr] gap-2 sm:grid">
              <span />
              <span className="boss-mono-label">정사이즈</span>
              <span className="boss-mono-label">천장</span>
              <span className="boss-mono-label">벽</span>
            </div>
            {data.roomsInfo.map((room, i) => {
              const name = i === 0 ? '거실' : `방 ${i}`;
              return (
                <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[72px_1fr_1fr_1fr]">
                  <div className="flex items-center text-[13px] font-semibold text-boss-text">{name}</div>
                  <TextField
                    value={room.defSize}
                    onChange={(v) => updateRoom(i, 'defSize', v)}
                    placeholder="정사이즈"
                    ariaLabel={`${name} 정사이즈`}
                    numeric
                  />
                  <TextField
                    value={room.skySize}
                    onChange={(v) => updateRoom(i, 'skySize', v)}
                    placeholder="천장"
                    ariaLabel={`${name} 천장`}
                    numeric
                  />
                  <TextField
                    value={room.wallSize}
                    onChange={(v) => updateRoom(i, 'wallSize', v)}
                    placeholder="벽"
                    ariaLabel={`${name} 벽`}
                    numeric
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        </Panel>

        {/* 벽지 / 확장 */}
        <Panel title="벽지 / 확장" kicker="WALLPAPER">
          <div className="flex flex-col gap-4">
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
            <div className="grid gap-4 md:grid-cols-3">
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
          </div>
        </Panel>

        {/* 상태 점검 */}
        <Panel title="상태 점검" kicker="CONDITION">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
              <ChipGroup
                label="곰팡이 / 결로 / 누수"
                items={CHIP_VIRUS}
                selected={singleVal(data.virusStatus)}
                onChange={(next) => patch({ virusStatus: next[0] ?? '' })}
              />
              <TextField
                value={data.virusText}
                onChange={(v) => patch({ virusText: v })}
                placeholder="상세 내용 (위치 · 범위)"
                ariaLabel="곰팡이 / 결로 / 누수 상세"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
              <ChipGroup
                label="걸레받이 / 몰딩"
                items={CHIP_MOLDING}
                selected={singleVal(data.moldingStatus)}
                onChange={(next) => patch({ moldingStatus: next[0] ?? '' })}
              />
              <TextField
                value={data.moldingText}
                onChange={(v) => patch({ moldingText: v })}
                placeholder="상세 내용"
                ariaLabel="걸레받이 / 몰딩 상세"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
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
                ariaLabel="천장 등기구 상세"
              />
            </div>
            <ChipGroup
              label="콘센트 커버 손상"
              items={CHIP_CONCENT_COVER}
              selected={data.concentCoverTypes}
              onChange={(next) => patch({ concentCoverTypes: next })}
              multi
            />
          </div>
        </Panel>

        {/* 장판 */}
        <Panel title="장판" kicker="FLOOR">
          <div className="grid gap-4 md:grid-cols-2">
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
        </Panel>

        {/* 금액 */}
        <Panel title="금액" kicker="PRICE">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="도배 금액"
              value={fmtMoney(data.artWallPrice)}
              onChange={(v) => patch({ artWallPrice: stripMoney(v) })}
              numeric
              suffix="원"
            />
            <TextField
              label="장판 금액"
              value={fmtMoney(data.floorPrice)}
              onChange={(v) => patch({ floorPrice: stripMoney(v) })}
              numeric
              suffix="원"
            />
            <TextField
              label="선금"
              value={fmtMoney(data.prePayment)}
              onChange={(v) => patch({ prePayment: stripMoney(v) })}
              numeric
              suffix="원"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricBox label="총액 (도배 + 장판)" value={won(totalPriceCalc)} />
            <MetricBox label="잔금 (총액 − 선금)" value={won(balanceCalc)} />
          </div>
        </Panel>

        {/* 비고 */}
        <Panel title="비고" kicker="NOTE">
          <TextareaField
            id="bigo"
            label="메모"
            value={data.bigo}
            onChange={(e) => patch({ bigo: e.target.value })}
            rows={4}
            placeholder="고객과 확인한 특이사항 · 약속 · 주의점을 적어 두세요. 인쇄물 맨 아래에 나옵니다."
            maxLength={2000}
          />
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          <span className="text-[12.5px] text-boss-text-secondary">
            저장하면 기존 체크리스트를 덮어씁니다.
          </span>
          <ButtonLink href="/boss/checklist" variant="secondary" className="ml-auto">
            취소
          </ButtonLink>
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? '저장 중…' : isEdit ? '수정 저장' : '저장'}
          </Button>
        </div>
      </div>

      {/* ── 우: 요약 · 안내 ── */}
      <div className="flex flex-col gap-4">
        <Panel title="금액 요약" kicker="SUMMARY">
          <dl>
            <DescRow
              label="도배"
              value={<span className="font-boss-head tabular-nums">{won(Number(stripMoney(data.artWallPrice || '0')) || 0)}</span>}
            />
            <DescRow
              label="장판"
              value={<span className="font-boss-head tabular-nums">{won(Number(stripMoney(data.floorPrice || '0')) || 0)}</span>}
            />
            <DescRow
              label="총액"
              value={<span className="font-boss-head tabular-nums text-boss-primary">{won(totalPriceCalc)}</span>}
            />
            <DescRow
              label="선금"
              value={<span className="font-boss-head tabular-nums">{won(Number(stripMoney(data.prePayment || '0')) || 0)}</span>}
            />
            <DescRow
              label="잔금"
              value={
                <span className={`font-boss-head tabular-nums ${balanceCalc < 0 ? 'text-boss-error' : ''}`}>
                  {won(balanceCalc)}
                </span>
              }
            />
          </dl>
          {balanceCalc < 0 && (
            <p className="mt-2 text-[12px] text-boss-error">선금이 총액보다 큽니다. 금액을 확인해 주세요.</p>
          )}
        </Panel>

        <Panel kicker="안내">
          <p className="text-[12.5px] leading-[1.7] text-boss-text-soft">
            체크리스트는 계정당 <strong className="font-semibold">한 장</strong>입니다. 저장하면 이전 내용을
            덮어쓰고, 목록의 <strong className="font-semibold">인쇄</strong>에서 A4 한 장으로 출력됩니다.
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-boss-text-soft">
            총액과 잔금은 자동 계산되며 직접 고칠 수 없습니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}

export default function BossChecklistNewPage() {
  // useSearchParams 사용 시 Suspense 경계 필요
  return (
    <Suspense
      fallback={
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      }
    >
      <BossChecklistNewForm />
    </Suspense>
  );
}
