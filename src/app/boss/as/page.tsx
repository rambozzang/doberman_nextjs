'use client';

// AS 요청 목록 — Industry 패턴
//   필터 줄(상태 Seg + 검색 + 정렬 + 우측 전체 n건) → 표(DataTable). 화면 제목 · "새 접수" 버튼은 셸 헤더가 그린다.
//   상태 탭은 API 재조회(기존 로직), 검색 · 정렬은 클라이언트. 첫 조회 실패와 0건을 구분해 말한다. 삭제는 ConfirmDialog.
// Flutter: as_request_list_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';
import {
  SearchInput,
  Button,
  ButtonLink,
  ListTabs,
  Segmented,
  DataTable,
  ContentCard,
  StatusPill,
  TagPill,
  EmptyState,
  AlertBanner,
  RowSkeleton,
  RowActions,
  ConfirmDialog,
  type StatusTone,
} from '@/components/boss/ui';

type StatusFilter = '' | '접수' | '진행중' | '완료';
type SortType = 'CREATED_DT' | 'REQUEST_DATE';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '접수', label: '접수' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'CREATED_DT', label: '등록일순' },
  { key: 'REQUEST_DATE', label: '요청일순' },
];

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function relativeTime(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

function statusTone(status: string): StatusTone {
  switch (status) {
    case '접수':
      return 'info';
    case '진행중':
      return 'warn';
    case '완료':
      return 'ok';
    default:
      return 'neutral';
  }
}

export default function BossAsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<AsRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [sortType, setSortType] = useState<SortType>('CREATED_DT');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AsRequestItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // AS 요청 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (!target) return;
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossAsApi.remove(target.id, custId);
      if (res.success !== false) {
        toast.success('AS 요청을 삭제했습니다.');
        setItems((prev) => prev.filter((it) => it.id !== target.id));
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

  const load = useCallback(async () => {
    const custId = getBossCustId();
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossAsApi.list(custId, statusFilter || undefined);
      if (res.success !== false && res.data) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || 'AS 요청 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // 최초 로드 + 상태 필터 변경 시 재조회
  useEffect(() => {
    load();
  }, [load, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      '': items.length,
      접수: 0,
      진행중: 0,
      완료: 0,
    };
    items.forEach((item) => {
      if (counts[item.status as StatusFilter] !== undefined) {
        counts[item.status as StatusFilter] += 1;
      }
    });
    return counts;
  }, [items]);

  const displayedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (!q) return true;
      const text = [item.title, item.customerName, item.customerPhone, item.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
    if (sortType === 'REQUEST_DATE') {
      list.sort((a, b) => (b.requestDate || '').localeCompare(a.requestDate || ''));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [items, query, sortType]);

  // 빈 상태 — 첫 조회 실패 / 0건 / 필터 결과 0건을 구분한다
  const isFiltered = statusFilter !== '' || query.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={STATUS_OPTIONS.map((opt) => ({
            key: opt.value,
            label: opt.label,
            // 상태 탭은 서버 필터라 선택된 탭만 정확한 건수를 안다 — 전체 탭일 때만 분포를 보여준다
            count: statusFilter === '' || opt.value === statusFilter ? statusCounts[opt.value] : undefined,
          }))}
          active={statusFilter}
          onChange={(key) => setStatusFilter(key)}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="제목 · 고객 · 주소 · 연락처 검색"
          className="w-full sm:w-72"
          hint={false}
        />
        <Segmented ariaLabel="정렬" options={SORT_OPTIONS} value={sortType} onChange={setSortType} />
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
          새로고침
        </Button>
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading && items.length === 0 ? '불러오는 중…' : `전체 ${displayedItems.length}건`}
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

      {loading && items.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={6} />
        </ContentCard>
      ) : error && items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="AS 요청을 불러오지 못했습니다"
          description="네트워크 상태를 확인한 뒤 다시 불러와 주세요. 접수한 내용이 사라진 것은 아닙니다."
        />
      ) : displayedItems.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Inbox}
            title="조건에 맞는 AS 요청이 없습니다"
            description={
              statusFilter
                ? `"${statusFilter}" 상태인 요청이 없습니다. 다른 탭을 보거나 검색어를 지워 보세요.`
                : '검색어를 바꿔 보세요. 제목 · 고객명 · 주소 · 연락처에서 찾습니다.'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setStatusFilter('');
                  setQuery('');
                }}
              >
                필터 초기화
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="아직 접수된 AS 요청이 없습니다"
            description="고객이 하자를 알려오면 여기에 접수해 두세요. 진행 · 완료 상태와 하자 · 수리 사진을 함께 남길 수 있습니다."
            action={
              <ButtonLink href="/boss/as/new" variant="primary" size="sm" icon={Plus}>
                첫 AS 접수하기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목 · 고객</th>
              <th>상태</th>
              <th>연락처 · 주소</th>
              <th>사진</th>
              <th>요청일</th>
              <th>접수</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item) => {
              const defectCount = item.images?.filter((i) => i.imageType === 'DEFECT').length ?? 0;
              const repairCount = item.images?.filter((i) => i.imageType === 'REPAIR').length ?? 0;
              const hasPhotos = defectCount > 0 || repairCount > 0;
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/as/${item.id}`)}
                >
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {item.id}
                  </td>
                  <td className="wrap max-w-[360px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-boss-text">{item.title}</span>
                      {item.priority === '긴급' && <StatusPill tone="bad">긴급</StatusPill>}
                      {item.orderId != null && <TagPill>고객 #{item.orderId}</TagPill>}
                    </div>
                    {item.customerName ? (
                      <span className="text-[12px] text-boss-text-muted">{item.customerName}</span>
                    ) : null}
                  </td>
                  <td>
                    <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
                  </td>
                  <td className="wrap max-w-[260px]">
                    <div className="font-boss-head tabular-nums text-boss-text">
                      {item.customerPhone || <span className="text-boss-text-ghost">—</span>}
                    </div>
                    {item.address ? (
                      <span className="text-[12px] text-boss-text-muted">{item.address}</span>
                    ) : null}
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                    {hasPhotos ? (
                      [defectCount > 0 ? `하자 ${defectCount}` : null, repairCount > 0 ? `수리 ${repairCount}` : null]
                        .filter(Boolean)
                        .join(' · ')
                    ) : (
                      <span className="text-boss-text-ghost">—</span>
                    )}
                  </td>
                  <td className="font-boss-head tabular-nums text-boss-text-secondary">
                    {formatDate(item.requestDate)}
                  </td>
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {relativeTime(item.createdAt)}
                  </td>
                  <td className="text-right">
                    <RowActions
                      onEdit={() => router.push(`/boss/as/${item.id}`)}
                      onDelete={() => setPendingDelete(item)}
                      deleting={deleting && pendingDelete?.id === item.id}
                    />
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
        title="AS 요청 삭제"
        description={`'${pendingDelete?.title ?? '선택한 AS 요청'}'을(를) 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
