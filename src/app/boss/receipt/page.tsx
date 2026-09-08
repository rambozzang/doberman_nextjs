'use client';

// 영수증 관리 — 월별 지출 목록 (Industry 패턴)
//   필터 줄(월 이동 + 검색 + 새로고침 + 우측 n건 · 합계) → 좌 표(DataTable) + 우 월 요약(합계 · 카테고리별 Bar).
//   화면 제목은 셸 헤더가 그린다. 첫 조회 실패와 0건을 구분해 말한다. 삭제는 ConfirmDialog.
//   월 요약(totalAmount · byCategory)은 API 응답을 그대로 쓴다 — 없는 지표는 만들지 않는다.
// Flutter receipt_home_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RefreshCw, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossReceiptApi } from '@/lib/api/boss/receipt';
import type { MonthlySummary, ReceiptData } from '@/types/boss-receipt';
import { categoryLabel, paymentLabel } from '@/types/boss-receipt';
import {
  SearchInput,
  Button,
  DataTable,
  ContentCard,
  Panel,
  MetricBox,
  Bar,
  StatusPill,
  EmptyState,
  AlertBanner,
  RowSkeleton,
  Skeleton,
  RowActions,
  ConfirmDialog,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';

function formatWon(n?: number): string {
  if (n == null) return '-';
  return `₩${n.toLocaleString('ko-KR')}`;
}

function ymLabel(ym: string): string {
  if (ym.length === 6) return `${ym.substring(0, 4)}.${ym.substring(4, 6)}`;
  return ym;
}

function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftYm(ym: string, delta: number): string {
  const y = Number(ym.substring(0, 4));
  const m = Number(ym.substring(4, 6));
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BossReceiptListPage() {
  const router = useRouter();
  const [ym, setYm] = useState(currentYm());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async (targetYm: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossReceiptApi.monthly(targetYm);
      if (res.success !== false && res.data) {
        setSummary(res.data);
      } else {
        setSummary(null);
        if (res.success === false) {
          setError(res.message || '영수증을 불러오지 못했습니다.');
        }
      }
    } catch {
      setError('네트워크 오류로 영수증을 불러오지 못했습니다.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(ym);
  }, [ym, load]);

  const receipts = useMemo(() => summary?.receipts ?? [], [summary]);

  const [pendingDelete, setPendingDelete] = useState<ReceiptData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 영수증 삭제 (확인 모달 → API → 월별 목록 새로고침)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (target?.id == null) return;
    setDeleting(true);
    try {
      const res = await bossReceiptApi.remove(target.id);
      if (res.success) {
        toast.success('영수증을 삭제했습니다.');
        setPendingDelete(null);
        await load(ym);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!keyword.trim()) return receipts;
    const k = keyword.toLowerCase();
    return receipts.filter((it) =>
      [it.vendorName, categoryLabel(it.category), it.category, paymentLabel(it.paymentMethod)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [receipts, keyword]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0),
    [filtered],
  );

  // 카테고리별 요약 — 금액 큰 순, 최대 금액 기준 막대
  const byCategory = useMemo(() => {
    const list = [...(summary?.byCategory ?? [])].sort((a, b) => b.amount - a.amount);
    const max = Math.max(...list.map((c) => c.amount), 1);
    return list.map((c) => ({ ...c, pct: (c.amount / max) * 100 }));
  }, [summary]);

  const monthTotal = summary?.totalAmount ?? filteredTotal;
  const isCurrentMonth = ym === currentYm();

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 — 월 이동 · 검색 · 새로고침 · 우측 n건 · 합계 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center border border-boss-border">
          <button
            type="button"
            onClick={() => setYm(shiftYm(ym, -1))}
            disabled={loading}
            className="flex h-[34px] w-9 items-center justify-center text-boss-text-dim transition-colors hover:bg-boss-hover disabled:opacity-45"
            aria-label="이전 달"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
          </button>
          <span className="min-w-[88px] border-x border-boss-border px-3 text-center font-boss-head text-[15px] font-semibold tabular-nums text-boss-text">
            {ymLabel(ym)}
          </span>
          <button
            type="button"
            onClick={() => setYm(shiftYm(ym, 1))}
            disabled={loading}
            className="flex h-[34px] w-9 items-center justify-center text-boss-text-dim transition-colors hover:bg-boss-hover disabled:opacity-45"
            aria-label="다음 달"
          >
            <ChevronRight size={15} strokeWidth={1.75} />
          </button>
        </div>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" onClick={() => setYm(currentYm())} disabled={loading}>
            이번 달
          </Button>
        )}
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="거래처 · 카테고리 · 결제수단 검색"
          className="w-full sm:w-72"
          hint={false}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => load(ym)}
          disabled={loading}
        >
          새로고침
        </Button>
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading && !summary ? (
            '불러오는 중…'
          ) : (
            <>
              전체 {filtered.length}건 ·{' '}
              <span className="font-semibold text-boss-text">합계 {formatWon(filteredTotal)}</span>
            </>
          )}
        </span>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button size="sm" variant="secondary" onClick={() => load(ym)} disabled={loading}>
              다시 불러오기
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── 좌: 표 ── */}
        <div className="min-w-0">
          {loading && !summary ? (
            <ContentCard>
              <RowSkeleton rows={6} />
            </ContentCard>
          ) : error && receipts.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="영수증을 불러오지 못했습니다"
              description="네트워크 상태를 확인한 뒤 다시 불러와 주세요. 저장된 영수증이 사라진 것은 아닙니다."
            />
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={`${ymLabel(ym)} 에 등록된 영수증이 없습니다`}
              description="영수증은 모바일 앱에서 촬영하면 자동으로 읽혀 여기에 쌓입니다. 다른 달을 보려면 위 월 이동을 쓰세요."
              action={
                !isCurrentMonth ? (
                  <Button size="sm" variant="secondary" onClick={() => setYm(currentYm())}>
                    이번 달로 이동
                  </Button>
                ) : undefined
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="검색어와 맞는 영수증이 없습니다"
              description="거래처 · 카테고리 · 결제수단에서 찾습니다. 검색어를 바꿔 보세요."
              action={
                <Button size="sm" variant="secondary" onClick={() => setKeyword('')}>
                  검색 지우기
                </Button>
              }
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>거래처</th>
                  <th>카테고리</th>
                  <th className="text-right">금액</th>
                  <th>결제</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const id = item.id;
                  const goDetail = () => id != null && router.push(`/boss/receipt/${id}`);
                  return (
                    <tr
                      key={id ?? idx}
                      className={id != null ? 'cursor-pointer' : ''}
                      onClick={goDetail}
                    >
                      <td>
                        <ListDateCell at={item.txDate} id={id} />
                      </td>
                      <td className="wrap max-w-[320px]">
                        <span className="font-medium text-boss-text">{item.vendorName ?? '상호 없음'}</span>
                      </td>
                      <td>
                        <StatusPill tone="neutral">{categoryLabel(item.category)}</StatusPill>
                      </td>
                      <td className="num font-semibold text-boss-text">{formatWon(item.totalAmount)}</td>
                      <td>
                        {item.paymentMethod ? (
                          <StatusPill tone="info">{paymentLabel(item.paymentMethod)}</StatusPill>
                        ) : (
                          <span className="text-boss-text-ghost">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <RowActions
                          editLabel="상세"
                          onEdit={id != null ? goDetail : undefined}
                          onDelete={id != null ? () => setPendingDelete(item) : undefined}
                          deleting={deleting && pendingDelete?.id === item.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    className="border-t border-boss-border bg-boss-inset px-3 py-2.5 text-[12.5px] text-boss-text-secondary"
                  >
                    {ymLabel(ym)} · {filtered.length.toLocaleString()}건
                    {keyword.trim() ? ' (검색 결과)' : ''}
                  </td>
                  <td className="border-t border-boss-border bg-boss-inset px-3 py-2.5 text-right font-boss-head text-[14px] font-semibold tabular-nums text-boss-text">
                    {formatWon(filteredTotal)}
                  </td>
                  <td colSpan={2} className="border-t border-boss-border bg-boss-inset" />
                </tr>
              </tfoot>
            </DataTable>
          )}
        </div>

        {/* ── 우: 월 요약 ── */}
        <div className="flex flex-col gap-4">
          <Panel title={`${ymLabel(ym)} 지출`} kicker="MONTHLY">
            {loading && !summary ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="합계" value={formatWon(monthTotal)} />
                <MetricBox label="건수" value={`${receipts.length.toLocaleString()}건`} />
              </div>
            )}
          </Panel>

          <Panel title="카테고리별" kicker="BY CATEGORY">
            {loading && !summary ? (
              <Skeleton className="h-32" />
            ) : byCategory.length === 0 ? (
              <p className="text-[13px] text-boss-text-secondary">이 달에는 집계할 지출이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byCategory.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-boss-text">
                        {c.label || categoryLabel(c.category)}
                        <span className="ml-1.5 font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                          {c.count}건
                        </span>
                      </span>
                      <span className="font-boss-head font-semibold tabular-nums text-boss-text">
                        {formatWon(c.amount)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Bar pct={c.pct} height={4} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* 모아 두면 어디에 쓰는지 — 사장님이 등록할 이유를 한눈에 */}
          <Panel kicker="안내" title="모아 두면 이렇게 씁니다">
            <ul className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-boss-text-secondary">
              <li>
                · 5월 종합소득세 신고 때 <strong className="font-semibold text-boss-text">경비</strong>로
                넣습니다. 자재비 · 인건비 · 유류비가 빠지면 그만큼 세금을 더 냅니다.
              </li>
              <li>
                · 부가세 신고 때 <strong className="font-semibold text-boss-text">매입세액</strong> 자료가
                됩니다. 세무사에게는 월별 · 카테고리별 합계를 그대로 넘기면 됩니다.
              </li>
              <li>· 자재비가 실제로 얼마나 나갔는지 보고 다음 견적 단가를 다시 잡습니다.</li>
              <li>
                · 등록은 앱에서 합니다. 영수증을 찍으면 상호 · 날짜 · 금액이 자동으로 읽혀 여기에 쌓이고,
                웹에서는 고치고 지웁니다.
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="영수증 삭제"
        description={`'${pendingDelete?.vendorName ?? '선택한 영수증'}' 영수증을 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
