'use client';

// AS 요청 목록 페이지 (B2B 데이터 그리드)
// Flutter: as_request_list_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Inbox, AlertTriangle, Link2 } from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

type StatusFilter = '' | '접수' | '진행중' | '완료';
type SortType = 'CREATED_DT' | 'REQUEST_DATE';
type BadgeTone = Parameters<typeof Badge>[0]['tone'];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '접수', label: '접수' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
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

function statusBadgeTone(status: string): BadgeTone {
  switch (status) {
    case '접수':
      return 'sky';
    case '진행중':
      return 'amber';
    case '완료':
      return 'emerald';
    default:
      return 'default';
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="AS 요청"
        description="하자보수 AS 요청을 관리하고 처리 상태를 확인합니다."
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push('/boss/as/new')}
            >
              등록
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={load}
              disabled={loading}
            >
              새로고침
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="제목·고객·주소·연락처 검색"
          className="w-full max-w-xs"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={sortType === 'CREATED_DT' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortType('CREATED_DT')}
          >
            등록일순
          </Button>
          <Button
            variant={sortType === 'REQUEST_DATE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortType('REQUEST_DATE')}
          >
            요청일순
          </Button>
        </div>
      </Toolbar>

      <ListTabs
        tabs={STATUS_OPTIONS.map((opt) => ({
          key: opt.value,
          label: opt.label,
          count: statusCounts[opt.value],
        }))}
        active={statusFilter}
        onChange={(key) => setStatusFilter(key)}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : displayedItems.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={statusFilter || query ? '검색/필터 결과가 없습니다' : '등록된 AS 요청이 없습니다'}
          description="신규 AS 요청을 등록하거나 필터를 변경해 보세요."
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push('/boss/as/new')}
            >
              AS 요청 등록
            </Button>
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>제목 / 고객</th>
              <th>상태</th>
              <th>지역 / 연락처</th>
              <th className="text-center whitespace-nowrap">사진</th>
              <th className="whitespace-nowrap">요청일</th>
              <th className="whitespace-nowrap">접수</th>
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
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">#{item.id}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-boss-text">{item.title}</span>
                      {item.priority === '긴급' && (
                        <Badge tone="rose">
                          <AlertTriangle size={10} /> 긴급
                        </Badge>
                      )}
                      {item.orderId != null && (
                        <Badge tone="violet">
                          <Link2 size={10} /> 주문
                        </Badge>
                      )}
                    </div>
                    {item.customerName ? (
                      <span className="text-xs text-boss-text-muted">{item.customerName}</span>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone={statusBadgeTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="text-boss-text-secondary">
                    <div>{item.customerPhone || '-'}</div>
                    {item.address ? (
                      <span className="text-xs text-boss-text-muted">{item.address}</span>
                    ) : null}
                  </td>
                  <td className="text-center whitespace-nowrap text-xs text-boss-text-secondary">
                    {hasPhotos
                      ? [defectCount > 0 ? `하자 ${defectCount}` : null, repairCount > 0 ? `수리 ${repairCount}` : null]
                          .filter(Boolean)
                          .join(' · ')
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {formatDate(item.requestDate)}
                  </td>
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">
                    {relativeTime(item.createdAt)}
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/boss/as/${item.id}`)}
                    >
                      상세
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
