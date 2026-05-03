'use client';

// 사장님 체크리스트 인쇄 페이지
// Flutter `lib/app/check_list/checklist_print_page.dart` 의 React 포팅 버전
// - URL [id] 는 customerId
// - GET /checklist/{id} 로 데이터 불러와 인쇄용 레이아웃으로 표시
// - 프린트 미디어 쿼리로 실제 출력 시 화면 UI(헤더/버튼) 숨김
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, Printer } from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import {
  type CheckData,
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
  type ChipItem,
} from '@/types/boss-checklist';

// type 코드 -> 라벨
const labelOfSingle = (items: ChipItem[], type?: string) => {
  if (!type) return '-';
  return items.find((i) => i.type === type)?.title ?? '-';
};
const labelOfMulti = (items: ChipItem[], types: string[]) => {
  if (!types || types.length === 0) return '-';
  return (
    types
      .map((t) => items.find((i) => i.type === t)?.title)
      .filter(Boolean)
      .join(', ') || '-'
  );
};
const fmtMoney = (v?: string) => {
  if (!v) return '0';
  const n = Number(String(v).replace(/,/g, ''));
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('ko-KR');
};

// 라벨/값 행
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex border-b border-slate-300 print:border-black">
      <div className="w-40 shrink-0 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 print:bg-white">
        {label}
      </div>
      <div className="flex-1 px-3 py-2 text-sm text-slate-900">{value || '-'}</div>
    </div>
  );
}

export default function BossChecklistPrintPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = decodeURIComponent(params?.id ?? '');
  const [data, setData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!customerId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await bossChecklistApi.get(customerId);
        if (cancelled) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || '체크리스트를 찾을 수 없습니다.');
        }
      } catch {
        if (!cancelled) setError('체크리스트를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      toast.error('인쇄를 사용할 수 없습니다.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 인쇄용 글로벌 스타일 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-area * {
            color: #000000 !important;
          }
        }
      `}</style>

      {/* 화면 전용 헤더 */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white">체크리스트 인쇄</h1>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Printer size={14} /> 인쇄하기
        </button>
      </div>

      {error && (
        <div className="no-print rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="no-print h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      ) : data ? (
        <div className="print-area mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl print:max-w-full print:rounded-none print:p-0 print:shadow-none">
          {/* 인쇄용 타이틀 */}
          <div className="mb-6 border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900">시공 체크리스트</h2>
            <p className="mt-1 text-xs text-slate-600">고객 ID: {data.customerId || customerId}</p>
          </div>

          {/* 기본 정보 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 기본 정보</h3>
          <div className="mb-4 border-t border-slate-300">
            <Row label="주거 형태" value={labelOfSingle(CHIP_HOUSING_TYPE, data.housingType)} />
            <Row label="면적 기준" value={labelOfSingle(CHIP_AREA, data.areaType)} />
            <Row label="면적" value={data.areaText ? `${data.areaText} ㎡` : '-'} />
            <Row label="짐 유무" value={labelOfSingle(CHIP_ZIM_YN, data.zimYn)} />
            <Row label="짐 유무 텍스트" value={data.livingRoomText} />
          </div>

          {/* 방 정보 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 방 정보</h3>
          <table className="mb-4 w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-white">
                <th className="border border-slate-300 px-2 py-1 text-xs font-semibold">구분</th>
                <th className="border border-slate-300 px-2 py-1 text-xs font-semibold">정사이즈</th>
                <th className="border border-slate-300 px-2 py-1 text-xs font-semibold">천장</th>
                <th className="border border-slate-300 px-2 py-1 text-xs font-semibold">벽</th>
              </tr>
            </thead>
            <tbody>
              {data.roomsInfo.map((r, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 px-2 py-1 text-center text-xs">
                    {i === 0 ? '거실' : `방 ${i}`}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{r.defSize || '-'}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{r.skySize || '-'}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{r.wallSize || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-4 border-t border-slate-300">
            <Row label="층고(방)" value={data.roomHeight} />
            <Row label="층고(거실)" value={data.livingRoomHeight} />
          </div>

          {/* 벽지 / 확장 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 벽지 / 확장</h3>
          <div className="mb-4 border-t border-slate-300">
            <Row label="기존 벽지" value={labelOfMulti(CHIP_OLD_WALL_PAGE, data.oldWallPage)} />
            <Row label="확장 종류" value={labelOfMulti(CHIP_EXTEND_TYPE, data.extendTypes)} />
            <Row label="아트월" value={labelOfSingle(CHIP_ART_WALL_TYPE, data.artWallType)} />
            <Row label="우물천장 종류" value={labelOfMulti(CHIP_UMUL_SKY, data.umulSky)} />
            <Row label="발코니 확장" value={labelOfMulti(CHIP_BALCONY, data.balconyTypes)} />
            <Row label="시스템" value={labelOfMulti(CHIP_SYSTEM, data.systemTypes)} />
            <Row label="벽지" value={data.wallPage} />
            <Row label="천장 품번" value={data.ceilingPage} />
            <Row label="벽 품번" value={data.wallPageNum} />
          </div>

          {/* 상태 점검 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 상태 점검</h3>
          <div className="mb-4 border-t border-slate-300">
            <Row
              label="곰팡이/결로/누수"
              value={`${labelOfSingle(CHIP_VIRUS, data.virusStatus)} ${data.virusText || ''}`.trim()}
            />
            <Row
              label="걸레받이/몰딩"
              value={`${labelOfSingle(CHIP_MOLDING, data.moldingStatus)} ${data.moldingText || ''}`.trim()}
            />
            <Row
              label="천장 등기구"
              value={`${labelOfSingle(CHIP_LIGHT, data.lightStatus)} ${data.lightText || ''}`.trim()}
            />
            <Row
              label="콘센트 커버 손상"
              value={labelOfMulti(CHIP_CONCENT_COVER, data.concentCoverTypes)}
            />
          </div>

          {/* 장판 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 장판</h3>
          <div className="mb-4 border-t border-slate-300">
            <Row label="장판 품번" value={data.floorPage} />
            <Row label="장판 총길이" value={data.floorPageLength} />
          </div>

          {/* 금액 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 금액</h3>
          <div className="mb-4 border-t border-slate-300">
            <Row label="도배 금액" value={`${fmtMoney(data.artWallPrice)} 원`} />
            <Row label="장판 금액" value={`${fmtMoney(data.floorPrice)} 원`} />
            <Row label="총액" value={`${fmtMoney(data.totalPrice)} 원`} />
            <Row label="선금" value={`${fmtMoney(data.prePayment)} 원`} />
            <Row label="잔금" value={`${fmtMoney(data.balance)} 원`} />
          </div>

          {/* 비고 */}
          <h3 className="mb-2 text-sm font-bold text-slate-900">■ 비고</h3>
          <div className="min-h-[80px] whitespace-pre-wrap rounded border border-slate-300 p-3 text-sm text-slate-900">
            {data.bigo || '-'}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="no-print rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center text-sm text-slate-400">
            데이터가 없습니다.
          </div>
        )
      )}
    </div>
  );
}
