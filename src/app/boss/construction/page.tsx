'use client';

// 시공 기록 목록 — Industry 패턴
//   필터 줄(상태 Seg + 검색 + 정렬 + 우측 전체 n건) → 표(DataTable). 화면 제목은 셸 헤더(PAGE_META)가 그린다.
//   첫 조회 실패와 0건을 구분해 말한다. 삭제는 ConfirmDialog.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Inbox } from 'lucide-react';
import {
  SearchInput,
  Button,
  ButtonLink,
  ListTabs,
  Segmented,
  DataTable,
  ContentCard,
  StatusPill,
  EmptyState,
  AlertBanner,
  RowSkeleton,
  RowActions,
  ConfirmDialog,
} from '@/components/boss/ui';
import { bossConstructionApi, normalizeConstructionRecord } from '@/lib/api/boss/construction';
import { BossAuthManager } from '@/lib/bossAuth';
import type { ConstructionRecord } from '@/types/boss-construction';
import toast from 'react-hot-toast';

type SortType = 'CREATED_DT' | 'CONSTRUCTION_DATE';
type StatusFilter = 'all' | '진행중' | '완료';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '진행중', label: '진행중' },
  { key: '완료', label: '완료' },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'CREATED_DT', label: '등록일순' },
  { key: 'CONSTRUCTION_DATE', label: '시공일순' },
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
  const [pendingDelete, setPendingDelete] = useState<ConstructionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 시공 기록 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (!target) return;
    const custId = BossAuthManager.getJwtPayload()?.sub;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossConstructionApi.remove(target.id, custId);
      if (res.success) {
        toast.success('시공 기록을 삭제했습니다.');
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

  // 빈 상태 — 첫 조회 실패 / 0건 / 필터 결과 0건을 구분한다
  const isFiltered = statusTab !== 'all' || keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={STATUS_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.key === 'all' ? counts.all : counts[t.key],
          }))}
          active={statusTab}
          onChange={setStatusTab}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="제목 · 설명 검색"
          className="w-full sm:w-64"
          hint={false}
        />
        <Segmented ariaLabel="정렬" options={SORT_OPTIONS} value={sort} onChange={setSort} />
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
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading && items.length === 0 ? '불러오는 중…' : `전체 ${filtered.length}건`}
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
          title="시공 기록을 불러오지 못했습니다"
          description="네트워크 상태를 확인한 뒤 다시 불러와 주세요. 등록된 기록이 사라진 것은 아닙니다."
        />
      ) : filtered.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Inbox}
            title="조건에 맞는 시공 기록이 없습니다"
            description="상태 탭이나 검색어를 바꿔 보세요."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setStatusTab('all');
                  setKeyword('');
                }}
              >
                필터 초기화
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="아직 등록된 시공 기록이 없습니다"
            description="현장 사진(전 · 중 · 후)과 시공일을 남겨 두면 포트폴리오와 AS 대응에 그대로 쓸 수 있습니다."
            action={
              <ButtonLink href="/boss/construction/new" variant="primary" size="sm" icon={Plus}>
                첫 시공 기록 남기기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>상태</th>
              <th>시공일</th>
              <th className="text-right">사진</th>
              <th>주문</th>
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
                  <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
                    {String(item.id)}
                  </td>
                  <td className="wrap max-w-[420px]">
                    <span className="font-medium text-boss-text">{item.title || '제목 없음'}</span>
                    {item.description ? (
                      <span className="ml-1.5 text-[12px] text-boss-text-muted">
                        {item.description.length > 40
                          ? `${item.description.substring(0, 40)}…`
                          : item.description}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <StatusPill tone={isDone ? 'ok' : 'warn'}>{item.status}</StatusPill>
                  </td>
                  <td className="font-boss-head tabular-nums text-boss-text-secondary">
                    {formatDate(item.constructionDate)}
                  </td>
                  <td className="num text-boss-text-secondary">{total > 0 ? `${total}장` : '—'}</td>
                  <td className="font-boss-head tabular-nums">
                    {item.orderId ? (
                      <span className="text-boss-primary">#{item.orderId}</span>
                    ) : (
                      <span className="text-boss-text-ghost">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <RowActions
                      onEdit={() => router.push(`/boss/construction/${item.id}`)}
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
        title="시공 기록 삭제"
        description={`'${pendingDelete?.title ?? '선택한 시공 기록'}'을(를) 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
