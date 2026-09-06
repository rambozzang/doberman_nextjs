'use client';

// 체크리스트 목록 — Industry 패턴
//   체크리스트는 고객(사장님) 1인당 1건이라 표는 0 / 1 행이다.
//   필터 줄(검색 + 새로고침 + 우측 전체 n건) → 표(DataTable). 화면 제목 · "새 체크리스트" 버튼은 셸 헤더가 그린다.
//   첫 조회 실패와 0건을 구분해 말한다. 삭제는 ConfirmDialog.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Printer, RefreshCw, Inbox } from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import { getBossCustId } from '@/lib/api/boss/as';
import type { CheckData } from '@/types/boss-checklist';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  ContentCard,
  StatusPill,
  Bar,
  EmptyState,
  AlertBanner,
  RowSkeleton,
  RowActions,
  ConfirmDialog,
  type StatusTone,
} from '@/components/boss/ui';

function fmtMoney(v?: string): string {
  if (!v) return '0';
  const n = Number(String(v).replace(/,/g, ''));
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('ko-KR');
}

function hasMoney(v?: string): boolean {
  if (!v) return false;
  const n = Number(String(v).replace(/,/g, ''));
  return !Number.isNaN(n) && n > 0;
}

// roomsInfo 중 실측값이 하나라도 입력된 방 수
function filledRooms(rooms: CheckData['roomsInfo']): number {
  return (rooms ?? []).filter((r) =>
    `${r.defSize ?? ''}${r.skySize ?? ''}${r.wallSize ?? ''}`.trim().length > 0,
  ).length;
}

function statusBadge(data: CheckData): { label: string; tone: StatusTone } {
  if (hasMoney(data.totalPrice)) return { label: '견적 완료', tone: 'info' };
  return { label: '작성됨', tone: 'ok' };
}

export default function BossChecklistPage() {
  const router = useRouter();
  const [data, setData] = useState<CheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    const cid = getBossCustId();
    setCustomerId(cid);
    if (!cid) {
      setError('로그인 정보가 없습니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossChecklistApi.get(cid);
      if (res.success) {
        setData(res.data ?? null);
      } else {
        setData(null);
      }
    } catch {
      setError('체크리스트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 체크리스트는 고객 1인당 1건 — 목록은 0/1행으로 표현
  const rows = useMemo<CheckData[]>(() => (data ? [data] : []), [data]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((it) =>
      [it.housingType, it.areaText, it.customerId || customerId, it.bigo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [rows, keyword, customerId]);

  const [pendingDelete, setPendingDelete] = useState<CheckData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 체크리스트 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const id = pendingDelete?.customerId || customerId;
    if (!id) return;
    setDeleting(true);
    try {
      const res = await bossChecklistApi.remove(id);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        setData(null);
        setPendingDelete(null);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="주거 형태 · 면적 · 비고 검색"
          className="w-full sm:w-72"
          hint={false}
        />
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
          새로고침
        </Button>
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading && !data ? '불러오는 중…' : `전체 ${filtered.length}건`}
        </span>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
              다시 불러오기
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && !data ? (
        <ContentCard>
          <RowSkeleton rows={2} />
        </ContentCard>
      ) : error && rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="체크리스트를 불러오지 못했습니다"
          description="네트워크 상태를 확인한 뒤 다시 불러와 주세요. 작성한 내용이 사라진 것은 아닙니다."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="아직 작성한 체크리스트가 없습니다"
          description="현장 실측값 · 벽지 품번 · 금액을 한 장에 정리해 두면 인쇄해서 고객과 바로 확인할 수 있습니다."
          action={
            <ButtonLink href="/boss/checklist/new" variant="primary" size="sm" icon={Plus}>
              체크리스트 작성하기
            </ButtonLink>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="검색어와 맞는 체크리스트가 없습니다"
          description="주거 형태 · 면적 · 비고에서 찾습니다. 검색어를 바꿔 보세요."
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
              <th>현장</th>
              <th>실측</th>
              <th className="text-right">총액</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const id = item.customerId || customerId;
              const badge = statusBadge(item);
              const filled = filledRooms(item.roomsInfo);
              const pct = Math.round((filled / 4) * 100);
              const printHref = `/boss/checklist/${encodeURIComponent(id)}/print`;
              return (
                <tr key={id} className="cursor-pointer" onClick={() => router.push(printHref)}>
                  <td className="wrap">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium text-boss-text">
                        {item.housingType || '체크리스트'}
                      </span>
                      {item.areaText ? (
                        <span className="font-boss-head tabular-nums text-boss-text-secondary">
                          {item.areaText}㎡
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[12px] text-boss-text-muted">고객 ID {id || '-'}</span>
                  </td>
                  <td className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="font-boss-head text-[13px] tabular-nums text-boss-text">
                        {filled} / 4 방
                      </span>
                      <span className="w-20">
                        <Bar pct={pct} height={4} />
                      </span>
                    </div>
                  </td>
                  <td className="num">
                    {hasMoney(item.totalPrice) ? (
                      `${fmtMoney(item.totalPrice)}원`
                    ) : (
                      <span className="text-boss-text-ghost">—</span>
                    )}
                  </td>
                  <td>
                    <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => router.push(printHref)}
                      >
                        인쇄
                      </Button>
                      <RowActions
                        onEdit={() => router.push('/boss/checklist/new?edit=1')}
                        onDelete={() => setPendingDelete(item)}
                        deleting={deleting && pendingDelete === item}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="체크리스트 삭제"
        description="등록된 체크리스트를 삭제합니다. 삭제 후 복구할 수 없습니다."
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
