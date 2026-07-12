'use client';

// 사장님 견적서 목록 페이지 — B2B 데이터 그리드 패턴
// - 고객 ID 로 해당 고객의 견적서(헤더) 목록을 조회 (GET /estimates/customer/{customerId})
// - 각 행 클릭 시 인쇄 화면으로 이동, 액션으로 인쇄/영수증 출력
// - 새 견적서 생성 (POST /estimates)
// 참고: [id] 라우트 파라미터는 customerId 이다 (print/receipt 페이지 동일).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Printer, Receipt, FileText } from 'lucide-react';
import { bossEstimatesApi } from '@/lib/api/boss/estimates';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import type { BossEstimate, BossEstimateCreateRequest } from '@/types/boss-estimate';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="견적서 목록"
        description="고객별 견적서를 조회하고 견적서·거래명세서를 출력합니다."
      />

      <Toolbar>
        <form onSubmit={onApplyCustomerId} className="flex items-center gap-2">
          <input
            value={customerIdInput}
            onChange={(e) => setCustomerIdInput(e.target.value)}
            placeholder="고객 ID"
            inputMode="numeric"
            className="h-8 w-32 rounded-md border border-boss-border bg-boss-bg px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
          />
          <Button type="submit" variant="secondary" size="sm">
            조회
          </Button>
        </form>

        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="고객명·메모 검색"
          className="w-full max-w-xs"
        />

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
          className="sm:ml-auto"
        >
          새 견적서
        </Button>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {!customerId ? (
        <EmptyState
          icon={FileText}
          title="고객 ID를 먼저 입력하세요"
          description="상단 입력란에 고객 ID를 넣고 조회 버튼을 누르면 해당 고객의 견적서가 표시됩니다."
        />
      ) : loading && estimates.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="표시할 견적서가 없습니다"
          description="‘새 견적서’ 버튼으로 견적서를 생성하거나 검색 조건을 변경하세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>고객/현장</th>
              <th className="whitespace-nowrap text-right">금액</th>
              <th>상태</th>
              <th className="whitespace-nowrap">작성일</th>
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
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">#{e.id}</td>
                  <td>
                    <span className="font-medium text-boss-text">
                      {e.customerName || '고객 미지정'}
                    </span>
                    {e.memo ? (
                      <span className="ml-1 text-xs text-boss-text-muted">· {e.memo}</span>
                    ) : null}
                    {typeof e.totalItems === 'number' && e.totalItems > 0 ? (
                      <span className="ml-1 text-xs text-boss-text-muted">/ 품목 {e.totalItems}건</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap text-right font-medium tabular-nums text-boss-text">
                    {fmtMoney(e.totalAmount)}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">
                    {fmtDate(e.estimateDate ?? e.createdDt)}
                  </td>
                  <td
                    className="whitespace-nowrap text-right"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => router.push(`/boss/estimate/${cid}/print`)}
                      >
                        인쇄
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Receipt}
                        onClick={() => router.push(`/boss/estimate/${cid}/receipt`)}
                      >
                        영수증
                      </Button>
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
