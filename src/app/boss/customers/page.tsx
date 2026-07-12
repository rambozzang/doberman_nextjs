'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Pagination,
  Skeleton,
} from '@/components/boss/ui';
import { bossCustomersApi } from '@/lib/api/boss/customers';
import type { BossCustomerData } from '@/types/boss-customer';
import { RefreshCw, Users, Phone, Mail } from 'lucide-react';

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

export default function BossCustomerListPage() {
  const [items, setItems] = useState<BossCustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="고객 관리"
        description="등록된 고객 정보를 조회하고 연락합니다."
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이름·연락처·이메일 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => load()}
          disabled={loading}
        >
          새로고침
        </Button>
        <div className="ml-auto">
          <span className="rounded-md bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-muted">
            총 {filtered.length.toLocaleString()}명
          </span>
        </div>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="표시할 고객이 없습니다"
          description="검색 조건을 변경하거나 새로고침하세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이름</th>
              <th className="whitespace-nowrap">연락처</th>
              <th>이메일</th>
              <th>주소</th>
              <th className="whitespace-nowrap">견적일</th>
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
                  <td className="font-medium text-boss-text">{item.name ?? '-'}</td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {item.phone ?? '-'}
                  </td>
                  <td className="max-w-[200px]">
                    <span className="block truncate text-boss-text-secondary">
                      {item.email || '-'}
                    </span>
                  </td>
                  <td className="max-w-[240px]">
                    <span className="block truncate text-boss-text-secondary">
                      {fullAddr || '-'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-boss-text-secondary">
                    {formatDate(item.estimateDate ?? item.workDate)}
                  </td>
                  <td>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : <span className="text-boss-text-muted">-</span>}</td>
                  <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-boss-text-secondary transition-colors hover:bg-boss-elevated hover:text-boss-text"
                          title="전화"
                        >
                          <Phone size={14} />
                        </a>
                      ) : null}
                      {item.email ? (
                        <a
                          href={`mailto:${item.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-boss-text-secondary transition-colors hover:bg-boss-elevated hover:text-boss-text"
                          title="이메일"
                        >
                          <Mail size={14} />
                        </a>
                      ) : null}
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
    </div>
  );
}
