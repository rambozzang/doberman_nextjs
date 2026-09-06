'use client';

// 체크리스트 인쇄 — Industry 패턴 (인쇄용: 흰 종이 · 검정 글자 · 사각)
//   셸(레일 · 헤더) 밖에서 단독 렌더링된다(BossChrome isPrintPath). 화면 전용 헤더는 no-print.
//   프린트 미디어 쿼리로 실제 출력 시 화면 UI(헤더/버튼) 를 숨긴다.
// Flutter `lib/app/check_list/checklist_print_page.dart` 포팅 — URL [id] 는 customerId, GET /checklist/{id}.
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import { PrintActions } from '@/components/boss/print/PrintActions';
import type { BossCustomerData } from '@/types/boss-customer';
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
import { Button, AlertBanner, EmptyState, Skeleton } from '@/components/boss/ui';

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

// 라벨/값 행 — 참조 프로필 화면의 dl 표(라벨 칸은 면색)
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex border-b border-boss-border print:border-black">
      <div className="w-40 shrink-0 bg-boss-inset px-3 py-2 text-[12px] font-semibold text-boss-text-secondary print:bg-white">
        {label}
      </div>
      <div className="flex-1 px-3 py-2 text-[13.5px] text-boss-text">{value || '-'}</div>
    </div>
  );
}

// 섹션 제목 — 인쇄물의 ■ 머리글
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-boss-head text-[15px] font-semibold tracking-[0.01em] text-boss-text">
      ■ {children}
    </h3>
  );
}

const CELL = 'border border-boss-border px-2 py-1.5 print:border-black';

export default function BossChecklistPrintPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = decodeURIComponent(params?.id ?? '');
  const [data, setData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 고객 이름 · 전화 — 공유 문구와 문자 버튼에 쓴다. 못 읽어도 인쇄는 그대로.
  const [customer, setCustomer] = useState<BossCustomerData | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    bossCustomersApi
      .get(customerId)
      .then((res) => {
        if (!cancelled && res.success !== false && res.data) setCustomer(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customerId]);

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

  const customerLabel = customer?.name ? `${customer.name}님` : `고객 ${customerId}`;
  const fileName = `체크리스트_${customer?.name ?? customerId}_${new Date().toISOString().slice(0, 10)}`;
  const shareText = data
    ? `${customerLabel} 시공 체크리스트입니다. 총액 ${fmtMoney(data.totalPrice)}원 (도배 ${fmtMoney(
        data.artWallPrice
      )} · 장판 ${fmtMoney(data.floorPrice)}). 도배르만`
    : `${customerLabel} 시공 체크리스트입니다.`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 print:max-w-full print:p-0">
      {/* 인쇄용 글로벌 스타일 — 흰 종이 · 검정 글자 */}
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
          /* 화면에서는 레일 · 헤더를 두되, 종이에는 문서만 나가게 한다 */
          .boss-shell > aside,
          .boss-shell-main > header,
          .boss-shell nav[aria-label='주요 메뉴'] {
            display: none !important;
          }
          .boss-shell {
            display: block !important;
          }
          .boss-shell-main {
            padding: 0 !important;
          }
          .boss-shell-main > div {
            max-width: none !important;
            padding: 0 !important;
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

      {/* 화면 전용 헤더 — 셸 밖이라 여기서 그린다 */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => router.back()}>
            돌아가기
          </Button>
          <div>
            <p className="boss-mono-label">체크리스트</p>
            <h1 className="font-boss-head text-[22px] font-semibold leading-tight tracking-[-0.01em] text-boss-text">
              인쇄 미리보기
            </h1>
          </div>
        </div>
        <PrintActions
          targetRef={paperRef}
          fileName={fileName}
          shareTitle={`${customerLabel} 시공 체크리스트`}
          shareText={shareText}
          smsPhone={customer?.phone}
          disabled={!data}
        />
      </div>

      {error && (
        <div className="no-print mb-4">
          <AlertBanner tone="bad">{error}</AlertBanner>
        </div>
      )}

      {loading && !data ? (
        <Skeleton className="no-print h-96" />
      ) : data ? (
        <div ref={paperRef} className="print-area boss-card bg-white p-8 print:border-0 print:p-0 print:shadow-none">
          {/* 인쇄용 타이틀 */}
          <div className="mb-6 border-b-2 border-boss-text pb-4 text-center print:border-black">
            <h2 className="font-boss-head text-[26px] font-semibold tracking-[-0.01em] text-boss-text">
              시공 체크리스트
            </h2>
            <p className="mt-1 text-[12px] text-boss-text-secondary">
              고객 ID {data.customerId || customerId}
            </p>
          </div>

          {/* 기본 정보 */}
          <SectionTitle>기본 정보</SectionTitle>
          <div className="mb-5 border-t border-boss-border print:border-black">
            <Row label="주거 형태" value={labelOfSingle(CHIP_HOUSING_TYPE, data.housingType)} />
            <Row label="면적 기준" value={labelOfSingle(CHIP_AREA, data.areaType)} />
            <Row label="면적" value={data.areaText ? `${data.areaText} ㎡` : '-'} />
            <Row label="짐 유무" value={labelOfSingle(CHIP_ZIM_YN, data.zimYn)} />
            <Row label="짐 유무 메모(거실)" value={data.livingRoomText} />
          </div>

          {/* 방 정보 */}
          <SectionTitle>방 정보</SectionTitle>
          <table className="mb-3 w-full border-collapse border border-boss-border text-[13.5px] print:border-black">
            <thead>
              <tr className="bg-boss-inset print:bg-white">
                <th className={`${CELL} text-[12px] font-semibold`}>구분</th>
                <th className={`${CELL} text-[12px] font-semibold`}>정사이즈</th>
                <th className={`${CELL} text-[12px] font-semibold`}>천장</th>
                <th className={`${CELL} text-[12px] font-semibold`}>벽</th>
              </tr>
            </thead>
            <tbody>
              {data.roomsInfo.map((r, i) => (
                <tr key={i}>
                  <td className={`${CELL} text-center text-[12px]`}>{i === 0 ? '거실' : `방 ${i}`}</td>
                  <td className={`${CELL} text-center font-boss-head tabular-nums`}>{r.defSize || '-'}</td>
                  <td className={`${CELL} text-center font-boss-head tabular-nums`}>{r.skySize || '-'}</td>
                  <td className={`${CELL} text-center font-boss-head tabular-nums`}>{r.wallSize || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-5 border-t border-boss-border print:border-black">
            <Row label="층고(방)" value={data.roomHeight} />
            <Row label="층고(거실)" value={data.livingRoomHeight} />
          </div>

          {/* 벽지 / 확장 */}
          <SectionTitle>벽지 / 확장</SectionTitle>
          <div className="mb-5 border-t border-boss-border print:border-black">
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
          <SectionTitle>상태 점검</SectionTitle>
          <div className="mb-5 border-t border-boss-border print:border-black">
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
          <SectionTitle>장판</SectionTitle>
          <div className="mb-5 border-t border-boss-border print:border-black">
            <Row label="장판 품번" value={data.floorPage} />
            <Row label="장판 총길이" value={data.floorPageLength} />
          </div>

          {/* 금액 */}
          <SectionTitle>금액</SectionTitle>
          <div className="mb-5 border-t border-boss-border print:border-black">
            <Row label="도배 금액" value={`${fmtMoney(data.artWallPrice)} 원`} />
            <Row label="장판 금액" value={`${fmtMoney(data.floorPrice)} 원`} />
            <Row label="총액" value={`${fmtMoney(data.totalPrice)} 원`} />
            <Row label="선금" value={`${fmtMoney(data.prePayment)} 원`} />
            <Row label="잔금" value={`${fmtMoney(data.balance)} 원`} />
          </div>

          {/* 비고 */}
          <SectionTitle>비고</SectionTitle>
          <div className="min-h-[80px] whitespace-pre-wrap border border-boss-border p-3 text-[13.5px] leading-relaxed text-boss-text print:border-black">
            {data.bigo || '-'}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="no-print">
            <EmptyState
              icon={FileText}
              title="인쇄할 체크리스트가 없습니다"
              description="아직 작성하지 않았거나 삭제된 체크리스트입니다. 먼저 작성한 뒤 다시 열어 주세요."
              action={
                <Button variant="primary" size="sm" onClick={() => router.push('/boss/checklist/new')}>
                  체크리스트 작성하기
                </Button>
              }
            />
          </div>
        )
      )}
    </div>
  );
}
