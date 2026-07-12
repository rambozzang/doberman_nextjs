'use client';

// 시공 기록 목록 — B2B 데이터 그리드
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  ImageIcon,
  Link2,
  Inbox,
} from 'lucide-react';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  Card,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';

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
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function totalImageCount(item: ConstructionRecord): number {
  return item.beforeImages.length + item.duringImages.length + item.afterImages.length;
}

export default function BossConstructionListPage() {
  const router = useRouter();
  const [items, setItems] = useState<ConstructionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('CREATED_DT');
  const [statusTab, setStatusTab] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');

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
        setItems((res.data as unknown[]).map((r) => normalizeConstructionRecord(r)));
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
    if (statusTab !== 'all') list = list.filter((it) => it.status === statusTab);
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="시공 기록"
        description="시공 내역과 전/중/후 사진을 관리합니다."
        actions={
          <Link href="/boss/construction/new">
            <Button variant="primary" size="sm" icon={Plus}>
              시공 등록
            </Button>
          </Link>
        }
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목·설명 검색"
          className="w-full max-w-xs"
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
          variant="secondary"
          icon={RefreshCw}
          size="sm"
          onClick={load}
          disabled={loading}
          className={loading ? '[&>svg]:animate-spin' : ''}
        >
          새로고침
        </Button>
      </Toolbar>

      <ListTabs
        tabs={STATUS_TABS.map((t) => ({
          key: t.key,
          label: t.label,
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
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 시공 기록이 없습니다"
          description="시공 기록을 등록하거나 필터를 변경하세요."
          action={
            <Link href="/boss/construction/new">
              <Button variant="primary" size="sm" icon={Plus}>
                시공 기록 등록
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th className="whitespace-nowrap">#</th>
              <th>제목</th>
              <th>상태</th>
              <th className="whitespace-nowrap">시공일</th>
              <th className="text-center whitespace-nowrap">사진</th>
              <th className="whitespace-nowrap">주문</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isDone = item.status === '완료';
              const total = totalImageCount(item);
              return (
                <tr
                  key={String(item.id)}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/construction/${item.id}`)}
                >
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">
                    #{String(item.id)}
                  </td>
                  <td>
                    <span className="font-medium text-boss-text">
                      {item.title || '제목 없음'}
                    </span>
                    {item.description ? (
                      <span className="ml-1 text-xs text-boss-text-muted">
                        — {item.description.length > 40
                          ? `${item.description.substring(0, 40)}…`
                          : item.description}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone={isDone ? 'emerald' : 'amber'}>{item.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {formatDate(item.constructionDate)}
                  </td>
                  <td className="text-center whitespace-nowrap">
                    {total > 0 ? (
                      <span className="inline-flex items-center gap-1 text-boss-text-secondary">
                        <ImageIcon size={12} /> {total}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {item.orderId ? (
                      <span className="inline-flex items-center gap-1 text-boss-info">
                        <Link2 size={12} /> #{item.orderId}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/boss/construction/${item.id}`)}
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
