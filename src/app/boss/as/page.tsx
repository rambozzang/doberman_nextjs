'use client';

// AS 요청 목록 페이지
// Flutter: as_request_list_page.dart 포팅
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Link2,
  Phone,
  Wrench,
} from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListTabs,
  PageHeader,
  SearchInput,
  Skeleton,
  Toolbar,
  RowList,
  RowItem,
  RowThumb,
  RowAction,
  RowChevron,
} from '@/components/boss/ui';

type StatusFilter = '' | '접수' | '진행중' | '완료';
type SortType = 'CREATED_DT' | 'REQUEST_DATE';

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

function statusBadgeTone(status: string): Parameters<typeof Badge>[0]['tone'] {
  switch (status) {
    case '접수':
      return 'sky';
    case '진행중':
      return 'amber';
    case '완료':
      return 'emerald';
    case '취소':
      return 'default';
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
      const text = [
        item.title,
        item.customerName,
        item.customerPhone,
        item.address,
      ]
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
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 새로고침
            </Button>
          </>
        }
      />

      <ListTabs
        tabs={STATUS_OPTIONS.map((opt) => ({ key: opt.value, label: opt.label, count: statusCounts[opt.value] }))}
        active={statusFilter}
        onChange={(key) => setStatusFilter(key)}
      />

      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="제목, 고객, 주소 검색"
          className="w-full max-w-xs"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={sortType === 'CREATED_DT' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortType('CREATED_DT')}
          >
            등록일
          </Button>
          <Button
            variant={sortType === 'REQUEST_DATE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortType('REQUEST_DATE')}
          >
            요청일
          </Button>
        </div>
      </Toolbar>

      {error && (
        <Card padded className="rounded-lg border-boss-error/30 bg-boss-error/10 text-sm text-boss-error">
          {error}
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : displayedItems.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={statusFilter || query ? '검색/필터 결과가 없습니다' : '등록된 AS 요청이 없습니다'}
          description="신규 AS 요청을 등록하거나 필터를 변경해 보세요."
          action={
            <Link
              href="/boss/as/new"
              className="boss-btn boss-btn-primary inline-flex items-center gap-1.5"
            >
              <Plus size={13} /> AS 요청 등록
            </Link>
          }
        />
      ) : (
        <RowList>
          {displayedItems.map((item) => {
            const defectCount = item.images?.filter((i) => i.imageType === 'DEFECT').length ?? 0;
            const repairCount = item.images?.filter((i) => i.imageType === 'REPAIR').length ?? 0;
            const tags = (
              <>
                <Badge tone={statusBadgeTone(item.status)}>{item.status}</Badge>
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
                {defectCount > 0 && (
                  <Badge tone="rose">
                    <ImageIcon size={10} /> 하자 {defectCount}
                  </Badge>
                )}
                {repairCount > 0 && (
                  <Badge tone="emerald">
                    <CheckCircle2 size={10} /> 수리 {repairCount}
                  </Badge>
                )}
              </>
            );
            const meta = (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {formatDate(item.createdAt)}
              </span>
            );
            const actions = (
              <>
                {item.customerPhone ? (
                  <RowAction icon={Phone} label="연락" href={`tel:${item.customerPhone}`} />
                ) : null}
                <Link href={`/boss/as/${item.id}`}>
                  <RowChevron />
                </Link>
              </>
            );
            return (
              <RowItem
                key={item.id}
                href={`/boss/as/${item.id}`}
                leading={<RowThumb icon={Wrench} />}
                title={item.title}
                subtitle={[item.customerName, item.address].filter(Boolean).join(' · ')}
                tags={tags}
                meta={meta}
                actions={actions}
              />
            );
          })}
        </RowList>
      )}
    </div>
  );
}
