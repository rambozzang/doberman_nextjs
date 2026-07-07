'use client';

// 시공 기록 목록 페이지 (boss B2B)
// Flutter `construction_record_list_page.dart` 포팅
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  ImageIcon,
  Link2,
  Calendar,
  Inbox,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Card,
  Badge,
  EmptyState,
  Skeleton,
  ViewToggle,
} from '@/components/boss/ui';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';

type ViewMode = 'grid' | 'list';
type SortType = 'CREATED_DT' | 'CONSTRUCTION_DATE';
type StatusFilter = 'all' | '진행중' | '완료';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function totalImageCount(item: ConstructionRecord): number {
  return item.beforeImages.length + item.duringImages.length + item.afterImages.length;
}

function thumbnail(item: ConstructionRecord): string | null {
  if (item.afterImages.length > 0) return item.afterImages[0];
  if (item.duringImages.length > 0) return item.duringImages[0];
  if (item.beforeImages.length > 0) return item.beforeImages[0];
  return null;
}

export default function BossConstructionListPage() {
  const [items, setItems] = useState<ConstructionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('CREATED_DT');
  const [statusTab, setStatusTab] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<ViewMode>('grid');

  const load = async () => {
    const payload = BossAuthManager.getJwtPayload();
    const custId = payload?.sub;
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossConstructionApi.list(custId);
      if (res.success && res.data) {
        const list = (res.data as unknown[]).map((r) => normalizeConstructionRecord(r));
        setItems(list);
      } else {
        setError(res.message || '시공 기록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 시공 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusTab !== 'all') {
      list = list.filter((it) => it.status === statusTab);
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((it) =>
        [it.title, it.description ?? '']
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    if (sort === 'CONSTRUCTION_DATE') {
      list.sort((a, b) => (b.constructionDate || '').localeCompare(a.constructionDate || ''));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [items, statusTab, keyword, sort]);

  const counts = useMemo(() => {
    const c = { all: items.length, 진행중: 0, 완료: 0 };
    items.forEach((it) => {
      if (it.status === '완료') c['완료']++;
      else c['진행중']++;
    });
    return c;
  }, [items]);

  const totalImages = useMemo(
    () => items.reduce((sum, it) => sum + totalImageCount(it), 0),
    [items],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="시공 기록"
        description="시공 내역과 전/중/후 사진을 관리합니다."
        actions={
          <Link
            href="/boss/construction/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-medium text-boss-primary-foreground transition-colors hover:bg-boss-primary-hover"
          >
            <Plus size={13} /> 시공 기록 등록
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-boss-text-muted">전체</p>
          <p className="mt-1 text-xl font-semibold text-boss-text">{counts.all}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <Clock3 size={12} /> 진행중
          </p>
          <p className="mt-1 text-xl font-semibold text-boss-warning">{counts['진행중']}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <CheckCircle2 size={12} /> 완료
          </p>
          <p className="mt-1 text-xl font-semibold text-boss-primary">{counts['완료']}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-boss-text-muted">
            <ImageIcon size={12} /> 등록 사진
          </p>
          <p className="mt-1 text-xl font-semibold text-boss-info">{totalImages}</p>
        </Card>
      </div>

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·설명 검색"
          className="w-56"
        />
        <div className="flex items-center rounded-md border border-boss-border bg-boss-bg p-0.5">
          <Button
            variant={sort === 'CREATED_DT' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSort('CREATED_DT')}
          >
            등록일순
          </Button>
          <Button
            variant={sort === 'CONSTRUCTION_DATE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSort('CONSTRUCTION_DATE')}
          >
            시공일순
          </Button>
        </div>
        <Button
          icon={RefreshCw}
          size="sm"
          onClick={load}
          disabled={loading}
          className={loading ? '[&>svg]:animate-spin' : ''}
        >
          새로고침
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </Toolbar>

      <ListTabs
        tabs={STATUS_TABS.map((t) => ({
          ...t,
          count: t.key === 'all' ? counts.all : counts[t.key],
        }))}
        active={statusTab}
        onChange={setStatusTab}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} padded={false} className="h-28">
                <Skeleton className="h-full w-full rounded-lg" />
              </Card>
            ))}
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>#</th>
                <th>시공 정보</th>
                <th>상태</th>
                <th>시공일</th>
                <th>사진</th>
                <th>주문</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 시공 기록이 없습니다"
          description="시공 기록을 등록하거나 필터를 변경하세요."
          action={
            <Link
              href="/boss/construction/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-medium text-boss-primary-foreground transition-colors hover:bg-boss-primary-hover"
            >
              <Plus size={13} /> 시공 기록 등록
            </Link>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const thumb = thumbnail(item);
            const total = totalImageCount(item);
            const isDone = item.status === '완료';
            return (
              <Link key={String(item.id)} href={`/boss/construction/${item.id}`}>
                <Card padded={false} interactive className="h-full">
                  <div className="flex gap-3 p-3">
                    <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-boss-bg">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={24} className="text-boss-text-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge tone={isDone ? 'emerald' : 'amber'}>
                          {isDone ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
                          {item.status}
                        </Badge>
                        <span className="ml-auto text-[11px] text-boss-text-muted">
                          #{String(item.id)}
                        </span>
                      </div>
                      <h3 className="line-clamp-1 text-sm font-semibold text-boss-text">
                        {item.title || '제목 없음'}
                      </h3>
                      <p className="line-clamp-1 text-xs text-boss-text-muted">
                        {item.description || '설명 없음'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-boss-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(item.constructionDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon size={11} />
                          {total}
                        </span>
                        {item.orderId ? (
                          <span className="inline-flex items-center gap-1 text-boss-info">
                            <Link2 size={11} />#{item.orderId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-boss-border px-3 py-2 text-xs">
                    <div className="text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 전</p>
                      <p className="font-medium text-boss-text">{item.beforeImages.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 중</p>
                      <p className="font-medium text-boss-text">{item.duringImages.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-boss-text-muted">시공 후</p>
                      <p className="font-medium text-boss-text">{item.afterImages.length}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>#</th>
              <th>시공 정보</th>
              <th>상태</th>
              <th>시공일</th>
              <th>사진</th>
              <th>주문</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const total = totalImageCount(item);
              const isDone = item.status === '완료';
              return (
                <tr key={String(item.id)}>
                  <td className="text-xs text-boss-text-muted">#{String(item.id)}</td>
                  <td>
                    <Link href={`/boss/construction/${item.id}`} className="block">
                      <p className="text-sm font-medium text-boss-text">
                        {item.title || '제목 없음'}
                      </p>
                      <p className="line-clamp-1 text-xs text-boss-text-muted">
                        {item.description || '설명 없음'}
                      </p>
                    </Link>
                  </td>
                  <td>
                    <Badge tone={isDone ? 'emerald' : 'amber'}>
                      {isDone ? <CheckCircle2 size={10} /> : <Clock3 size={10} />}
                      {item.status}
                    </Badge>
                  </td>
                  <td className="text-sm text-boss-text-secondary">
                    {formatDate(item.constructionDate)}
                  </td>
                  <td className="text-sm text-boss-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon size={12} />
                      {total}
                    </span>
                  </td>
                  <td className="text-sm text-boss-text-secondary">
                    {item.orderId ? (
                      <span className="inline-flex items-center gap-1 text-boss-info">
                        <Link2 size={12} />#{item.orderId}
                      </span>
                    ) : (
                      '-'
                    )}
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
