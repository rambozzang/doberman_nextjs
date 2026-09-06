'use client';

// 고객 관리 목록 — Industry 패턴 (참조 customers 표)
// 화면 제목 · 부제는 셸 헤더(nav.ts PAGE_META)가 담당한다.
// 필터 한 줄: 검색 + 우측 "전체 n명" + 고객 등록. 목록은 표, 삭제는 ConfirmDialog.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  RowSkeleton,
  RowActions,
  ConfirmDialog,
  AlertBanner,
} from '@/components/boss/ui';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import type { BossCustomerData } from '@/types/boss-customer';
import { RefreshCw, Phone, Mail, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

const PAGE_SIZE = 20;

// statusCd → 배지 라벨/톤 (알 수 없는 코드는 원문 그대로 표시)
function statusBadge(code?: string): { label: string; tone: BadgeTone } | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c === '00' || c.includes('NEW') || c.includes('대기')) return { label: '신규', tone: 'default' };
  if (c.includes('CONFIRM') || c.includes('확정')) return { label: '확정', tone: 'emerald' };
  if (c.includes('PROGRESS') || c.includes('진행')) return { label: '진행', tone: 'sky' };
  if (c.includes('DONE') || c.includes('완료')) return { label: '완료', tone: 'violet' };
  if (c.includes('CANCEL') || c.includes('취소')) return { label: '취소', tone: 'rose' };
  return { label: code, tone: 'default' };
}

// yyyyMMddHHmm → yyyy.MM.dd
function formatDate(input?: string): string {
  if (!input) return '-';
  const digits = input.replace(/\D/g, '');
  if (digits.length < 8) return input;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

// 행 안 아이콘 액션(전화 · 메일) — 사각 28px
const ICON_BTN =
  'inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted transition-colors duration-[120ms] ease-out hover:bg-boss-elevated hover:!text-boss-text';

export default function BossCustomerListPage() {
  const [items, setItems] = useState<BossCustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<BossCustomerData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 고객 삭제 (확인 모달 → API → 목록 반영)
  const handleDelete = async () => {
    const target = pendingDelete;
    if (!target?.id) return;
    setDeleting(true);
    try {
      const res = await bossCustomersApi.remove(target.id);
      if (res.success) {
        toast.success('고객을 삭제했습니다.');
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
    setLoading(true);
    setError(null);
    try {
      const res = await bossCustomersApi.list();
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.message || '고객 목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 고객 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((it) =>
      [it.name, it.phone, it.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 한 줄 — 검색 · 우측 건수 · 고객 등록 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이름 · 연락처 · 이메일"
          hint={false}
          className="w-full sm:w-[260px]"
        />
        <span
          className="ml-auto font-boss-head text-[13px] tabular-nums text-boss-text-secondary"
          aria-live="polite"
        >
          {loading
            ? '불러오는 중…'
            : isFiltering
              ? `${filtered.length.toLocaleString()}명 일치 · 전체 ${items.length.toLocaleString()}명`
              : `전체 ${items.length.toLocaleString()}명`}
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load()} disabled={loading}>
          새로고침
        </Button>
        <ButtonLink href="/boss/orders/quick" variant="primary" size="sm" icon={Plus}>
          주문과 함께 등록
        </ButtonLink>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading && items.length === 0 ? (
        <div className="boss-card-content">
          <RowSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        error ? (
          <EmptyState
            title="고객 목록을 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도하세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => load()}>
                다시 시도
              </Button>
            }
          />
        ) : isFiltering ? (
          <EmptyState
            title="검색어에 맞는 고객이 없습니다"
            description="이름 · 연락처 · 이메일로만 찾습니다. 검색어를 지우면 전체가 보입니다."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색어 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="아직 등록된 고객이 없습니다"
            description="주문을 등록하면 고객이 함께 만들어집니다. 첫 주문부터 시작해 보세요."
            action={
              <ButtonLink href="/boss/orders/quick" variant="primary" size="sm" icon={Plus}>
                주문과 함께 등록
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이름</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>주소</th>
              <th>견적일</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => {
              const badge = statusBadge(item.statusCd);
              const fullAddr = [item.address1, item.address2].filter(Boolean).join(' ');
              return (
                <tr key={item.id ?? `${item.phone}-${item.name}`}>
                  <td className="font-semibold text-boss-text">{item.name ?? '-'}</td>
                  <td className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
                    {item.phone ? (
                      <a href={`tel:${item.phone}`} aria-label={`${item.name ?? '고객'}에게 전화 ${item.phone}`}>
                        {item.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="max-w-[200px]">
                    <span className="block truncate text-boss-text-secondary">{item.email || '-'}</span>
                  </td>
                  <td className="max-w-[240px]">
                    <span className="block truncate text-boss-text-secondary">{fullAddr || '-'}</span>
                  </td>
                  <td className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
                    {formatDate(item.estimateDate ?? item.workDate)}
                  </td>
                  <td>
                    {badge ? (
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    ) : (
                      <span className="text-boss-text-muted">-</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {item.phone ? (
                        <a href={`tel:${item.phone}`} className={ICON_BTN} title="전화" aria-label="전화">
                          <Phone size={14} strokeWidth={1.75} />
                        </a>
                      ) : null}
                      {item.email ? (
                        <a href={`mailto:${item.email}`} className={ICON_BTN} title="이메일" aria-label="이메일">
                          <Mail size={14} strokeWidth={1.75} />
                        </a>
                      ) : null}
                      <RowActions
                        onDelete={() => setPendingDelete(item)}
                        deleting={deleting && pendingDelete?.id === item.id}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      )}

      {/* 삭제 확인 — 되돌릴 수 없는 액션 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="이 고객을 삭제할까요?"
        description={`'${pendingDelete?.name ?? '선택한 고객'}'의 정보가 지워집니다. 삭제 후 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
