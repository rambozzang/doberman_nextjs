'use client';

// 견적서 목록 — Industry 패턴 (참조 leads 표)
// - 고객 ID 로 해당 고객의 견적서(헤더) 목록을 조회 (GET /estimates/customer/{customerId})
// - 각 행 클릭 시 인쇄 화면으로 이동, 행 액션으로 인쇄 / 영수증 출력
// - 새 견적서 생성 (POST /estimates)
// 참고: [id] 라우트 파라미터는 customerId 이다 (print/receipt 페이지 동일).
// 화면 제목 · 부제는 셸 헤더(nav.ts PAGE_META)가 담당한다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import { bossEstimatesApi } from '@/lib/api/boss/estimates';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import type { BossEstimate, BossEstimateCreateRequest } from '@/types/boss-estimate';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  AlertBanner,
} from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'rose';

const PAGE_SIZE = 20;

// 천단위 콤마 포매팅
const fmtMoney = (v?: number | string | null): string => {
  if (v === null || v === undefined || v === '') return '0';
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : v;
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('ko-KR');
};

// 날짜(작성일) 표시 — 'YYYY-MM-DD' 또는 ISO datetime 모두 대응
const fmtDate = (v?: string | null): string => {
  if (!v) return '-';
  return v.length > 10 ? v.slice(0, 10) : v;
};

// 견적서 상태 뱃지 (deletedDt 유무로 판단)
function statusBadge(e: BossEstimate): { label: string; tone: BadgeTone } {
  if (e.deletedDt) return { label: '삭제', tone: 'rose' };
  return { label: '정상', tone: 'emerald' };
}

export default function BossEstimateListPage() {
  const router = useRouter();

  const [customerIdInput, setCustomerIdInput] = useState('');
  const [customerId, setCustomerId] = useState('');

  const [estimates, setEstimates] = useState<BossEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 고객별 견적서 목록 조회
  const load = useCallback(async (cid: string) => {
    if (!cid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossEstimatesApi.listByCustomer(cid);
      if (res.success !== false && res.data) {
        setEstimates(Array.isArray(res.data) ? res.data : []);
      } else if (res.success === false) {
        setError(res.message || '견적서 목록을 불러오지 못했습니다.');
        setEstimates([]);
      } else {
        setEstimates([]);
      }
    } catch {
      setError('네트워크 오류로 견적서 목록을 불러오지 못했습니다.');
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customerId) void load(customerId);
  }, [customerId, load]);

  // 검색/고객 변경 시 첫 페이지로
  useEffect(() => {
    setPage(1);
  }, [keyword, customerId]);

  // 고객 ID 적용
  const onApplyCustomerId = (e: React.FormEvent) => {
    e.preventDefault();
    const v = customerIdInput.trim();
    if (!v) {
      toast.error('고객 ID를 입력하세요.');
      return;
    }
    setCustomerId(v);
  };

  // 새 견적서 생성
  const onCreate = async () => {
    if (!customerId) {
      toast.error('먼저 고객 ID를 입력하세요.');
      return;
    }
    setCreating(true);
    try {
      const customerRes = await bossCustomersApi.get(customerId);
      const customerName =
        (customerRes.success && customerRes.data && customerRes.data.name) || `고객 ${customerId}`;
      const payload: BossEstimateCreateRequest = {
        customerId: Number(customerId),
        customerName,
        estimateDate: new Date().toISOString().slice(0, 10),
        memo: '웹에서 생성',
      };
      const res = await bossEstimatesApi.create(payload);
      if (!res.success || !res.data?.id) {
        toast.error(res.message || '견적서 생성에 실패했습니다.');
        return;
      }
      toast.success('견적서가 생성되었습니다.');
      await load(customerId);
    } catch {
      toast.error('견적서 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // 클라이언트 검색(고객명·메모)
  const filtered = useMemo(() => {
    if (!keyword.trim()) return estimates;
    const k = keyword.toLowerCase();
    return estimates.filter((e) =>
      [e.customerName, e.memo, String(e.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [estimates, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 한 줄 — 고객 ID 조회 · 검색 · 우측 건수 · 새 견적서 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form onSubmit={onApplyCustomerId} className="flex items-center gap-1.5">
          <div className="w-[120px]">
            <input
              value={customerIdInput}
              onChange={(e) => setCustomerIdInput(e.target.value)}
              placeholder="고객 ID"
              inputMode="numeric"
              aria-label="고객 ID"
              className="boss-input font-boss-head tabular-nums"
            />
          </div>
          <Button type="submit" variant="secondary">
            조회
          </Button>
        </form>

        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="고객명 · 메모"
          hint={false}
          className="w-full sm:w-[220px]"
        />

        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {!customerId
            ? '고객을 고르면 건수가 보입니다'
            : loading
              ? '불러오는 중…'
              : isFiltering
                ? `${filtered.length}건 일치 · 전체 ${estimates.length.toLocaleString('ko-KR')}건`
                : `전체 ${estimates.length.toLocaleString('ko-KR')}건`}
        </span>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => customerId && load(customerId)}
          disabled={!customerId || loading}
        >
          새로고침
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onCreate}
          disabled={!customerId || creating}
        >
          {creating ? '생성 중…' : '새 견적서'}
        </Button>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => customerId && load(customerId)}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {!customerId ? (
        <EmptyState
          title="고객 ID를 먼저 입력하세요"
          description="견적서는 고객별로 보관됩니다. 위 입력란에 고객 ID를 넣고 조회하면 그 고객의 견적서가 표시됩니다. 고객 ID 는 고객 관리 화면에서 확인할 수 있습니다."
          action={
            <ButtonLink href="/boss/customers" variant="secondary" size="sm">
              고객 관리에서 찾기
            </ButtonLink>
          }
        />
      ) : loading && estimates.length === 0 ? (
        <div className="boss-card-content">
          <RowSkeleton rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="견적서를 불러오지 못했습니다"
            description="고객 ID 가 맞는지 확인하고 다시 시도하세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => load(customerId)}>
                다시 시도
              </Button>
            }
          />
        ) : isFiltering ? (
          <EmptyState
            title="검색어에 맞는 견적서가 없습니다"
            description="고객명 · 메모 · 번호로만 찾습니다. 검색어를 지우면 전체가 보입니다."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색어 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="이 고객의 견적서가 아직 없습니다"
            description="새 견적서를 만들면 품목을 넣고 견적서 · 거래명세서로 출력할 수 있습니다."
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={onCreate} disabled={creating}>
                {creating ? '생성 중…' : '새 견적서'}
              </Button>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>번호</th>
              <th>고객 · 메모</th>
              <th className="text-right">품목</th>
              <th className="text-right">금액</th>
              <th>상태</th>
              <th>작성일</th>
              <th className="text-right">출력</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((e) => {
              const badge = statusBadge(e);
              const cid = e.customerId ?? customerId;
              return (
                <tr
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/estimate/${cid}/print`)}
                >
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {e.id}
                  </td>
                  <td className="wrap max-w-[320px]">
                    <span className="font-semibold text-boss-text">
                      {e.customerName || '고객 미지정'}
                    </span>
                    {e.memo ? (
                      <span className="ml-1.5 text-[12px] text-boss-text-secondary">· {e.memo}</span>
                    ) : null}
                  </td>
                  <td className="num text-boss-text-secondary">
                    {typeof e.totalItems === 'number' && e.totalItems > 0 ? e.totalItems : '-'}
                  </td>
                  <td className="num font-semibold text-boss-text">{fmtMoney(e.totalAmount)}</td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                    {fmtDate(e.estimateDate ?? e.createdDt)}
                  </td>
                  <td className="text-right" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        className="boss-btn boss-btn-sm boss-btn-ghost"
                        onClick={() => router.push(`/boss/estimate/${cid}/print`)}
                      >
                        인쇄
                      </button>
                      <button
                        type="button"
                        className="boss-btn boss-btn-sm boss-btn-ghost"
                        onClick={() => router.push(`/boss/estimate/${cid}/receipt`)}
                      >
                        영수증
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {customerId && totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      ) : null}
    </div>
  );
}
