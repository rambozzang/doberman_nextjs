'use client';

// 고객 서명 목록 — Industry 패턴
//   필터 줄(상태 Seg + 검색 + 새로고침 + 우측 전체 n건 · 서명 받기) → 표(DataTable). 화면 제목은 셸 헤더가 그린다.
//   PAGE_META 에 헤더 액션이 없어 "서명 받기" 는 필터 줄 우측에 둔다(참조 고객 화면과 같은 자리).
//   첫 조회 실패와 0건을 구분해 말한다. 삭제는 ConfirmDialog.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Plus, RefreshCw, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { LIST_KEYS, readListSnapshot, useSaveListSnapshot } from '@/lib/boss/listCache';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';
import {
  SearchInput,
  Button,
  ButtonLink,
  ListTabs,
  DataTable,
  ContentCard,
  RowThumb,
  StatusPill,
  TagPill,
  EmptyState,
  AlertBanner,
  RowSkeleton,
  RowActions,
  ConfirmDialog,
  type StatusTone,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';

type StatusFilter = 'all' | 'done' | 'pending';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'done', label: '서명 완료' },
  { key: 'pending', label: '미완료' },
];

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return phone;
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  return phone;
}

function isSigned(item: BossSignatureItem): boolean {
  return !!(item.confirmedAt || item.signatureImagePath);
}

function statusBadge(item: BossSignatureItem): { label: string; tone: StatusTone } {
  if (isSigned(item)) return { label: '서명 완료', tone: 'ok' };
  return { label: '미완료', tone: 'warn' };
}

type Filters = { keyword: string; statusTab: StatusFilter };
type Data = { items: BossSignatureItem[] };

export default function BossSignatureListPage() {
  const router = useRouter();
  // 상세를 다녀왔으면 보던 조회조건과 목록을 그대로 되살린다 (고친 게 있으면 null 이라 다시 부른다)
  const restored = useMemo(() => readListSnapshot<Filters, Data>(LIST_KEYS.signature), []);
  const [items, setItems] = useState<BossSignatureItem[]>(restored?.data.items ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(restored?.filters.keyword ?? '');
  const [statusTab, setStatusTab] = useState<StatusFilter>(restored?.filters.statusTab ?? 'all');
  const [loaded, setLoaded] = useState(restored != null);
  const [pendingDelete, setPendingDelete] = useState<BossSignatureItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      setError('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossSignatureApi.list(custId);
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a, b) => {
          const ad = new Date(a.createdDt ?? 0).getTime();
          const bd = new Date(b.createdDt ?? 0).getTime();
          return bd - ad;
        });
        setItems(sorted);
        setLoaded(true);
      } else if (res.success && res.data == null) {
        setItems([]);
        setLoaded(true);
      } else {
        setError(res.message || '서명 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restored) return; // 되살렸으면 다시 부르지 않는다
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSaveListSnapshot<Filters, Data>(
    LIST_KEYS.signature,
    { keyword, statusTab },
    { items },
    loaded
  );

  const counts = useMemo(() => {
    const done = items.filter(isSigned).length;
    return { all: items.length, done, pending: items.length - done };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusTab === 'done') list = list.filter(isSigned);
    else if (statusTab === 'pending') list = list.filter((it) => !isSigned(it));
    if (!keyword.trim()) return list;
    const k = keyword.toLowerCase();
    return list.filter((it) =>
      [it.customerName, it.customerPhone, it.memo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword, statusTab]);

  // 서명 기록 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (!target?.id) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossSignatureApi.remove(target.id, custId);
      if (res.success) {
        toast.success('삭제되었습니다.');
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

  // 빈 상태 — 첫 조회 실패 / 0건 / 필터 결과 0건을 구분한다
  const isFiltered = statusTab !== 'all' || keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] }))}
          active={statusTab}
          onChange={setStatusTab}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="고객명 · 연락처 · 메모 검색"
          className="w-full sm:w-64"
          hint={false}
        />
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
          새로고침
        </Button>
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading && items.length === 0 ? '불러오는 중…' : `전체 ${filtered.length}건`}
        </span>
        <ButtonLink href="/boss/signature/capture" variant="primary" icon={PenLine}>
          서명 받기
        </ButtonLink>
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
          title="서명 목록을 불러오지 못했습니다"
          description="네트워크 상태를 확인한 뒤 다시 불러와 주세요. 받아 둔 서명이 사라진 것은 아닙니다."
        />
      ) : filtered.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Inbox}
            title="조건에 맞는 서명이 없습니다"
            description="상태 탭이나 검색어를 바꿔 보세요. 고객명 · 연락처 · 메모에서 찾습니다."
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
            title="아직 받아 둔 서명이 없습니다"
            description="시공을 마치면 현장에서 고객 서명을 받아 두세요. 완료 확인 · 분쟁 대응 근거로 남습니다."
            action={
              <ButtonLink href="/boss/signature/capture" variant="primary" size="sm" icon={Plus}>
                첫 서명 받기
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>등록일</th>
              <th>고객</th>
              <th>상태</th>
              <th>연락처</th>
              <th>연결</th>
              <th>서명일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const badge = statusBadge(item);
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/boss/signature/${item.id}`)}
                >
                  <td>
                    <ListDateCell at={item.createdDt} id={item.id} />
                  </td>
                  <td className="wrap max-w-[360px]">
                    <div className="flex items-center gap-2.5">
                      {/* 서명 썸네일 — 캔버스 저장본이라 흰 배경 위에 그린다 */}
                      <RowThumb
                        src={item.signatureImagePath}
                        alt={item.customerName ?? 'signature'}
                        icon={PenLine}
                        className="h-9 w-9 !bg-white"
                      />
                      <div className="min-w-0">
                        <span className="block font-medium text-boss-text">
                          {item.customerName ?? '이름 없음'}
                        </span>
                        {item.memo ? (
                          <span className="block max-w-[16rem] truncate text-[12px] text-boss-text-muted">
                            {item.memo}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
                  </td>
                  <td className="font-boss-head tabular-nums text-boss-text-secondary">
                    {item.customerPhone ? (
                      maskPhone(item.customerPhone)
                    ) : (
                      <span className="text-boss-text-ghost">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1">
                      {item.orderId ? <TagPill>고객 #{item.orderId}</TagPill> : null}
                      {item.recordId ? <TagPill>시공 #{item.recordId}</TagPill> : null}
                      {!item.orderId && !item.recordId ? (
                        <span className="text-boss-text-ghost">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="font-boss-head tabular-nums text-boss-text-secondary">
                    {formatDate(item.confirmedAt ?? item.createdDt)}
                  </td>
                  <td className="text-right">
                    <RowActions
                      editLabel="상세"
                      onEdit={() => router.push(`/boss/signature/${item.id}`)}
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
        title="서명 기록 삭제"
        description={`'${pendingDelete?.customerName ?? '선택한 서명'}' 서명 기록을 삭제합니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
