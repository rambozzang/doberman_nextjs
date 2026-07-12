'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  Plus,
  Printer,
  Pencil,
  Trash2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { bossChecklistApi } from '@/lib/api/boss/checklist';
import { getBossCustId } from '@/lib/api/boss/as';
import type { CheckData } from '@/types/boss-checklist';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

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

function statusBadge(data: CheckData): { label: string; tone: BadgeTone } {
  if (hasMoney(data.totalPrice)) return { label: '견적완료', tone: 'violet' };
  return { label: '작성됨', tone: 'emerald' };
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

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!confirm('체크리스트를 삭제하시겠습니까?')) return;
    try {
      const res = await bossChecklistApi.remove(id);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        setData(null);
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="체크리스트"
        description="현장 실측 체크리스트를 작성하고 인쇄용으로 출력하세요."
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="주거형태·면적·고객 검색"
          className="w-full max-w-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={load}
          disabled={loading}
        >
          새로고침
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => router.push('/boss/checklist/new')}
          className="ml-auto"
        >
          새 체크리스트
        </Button>
      </Toolbar>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && !data ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="등록된 체크리스트가 없습니다"
          description="새 체크리스트를 작성해 보세요."
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push('/boss/checklist/new')}
            >
              새 체크리스트
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="검색 결과가 없습니다"
          description="검색어를 변경해 보세요."
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>제목 / 현장</th>
              <th className="whitespace-nowrap">항목수 / 진행</th>
              <th>상태</th>
              <th className="whitespace-nowrap">날짜</th>
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
                <tr
                  key={id}
                  className="cursor-pointer"
                  onClick={() => router.push(printHref)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-boss-text">
                        {item.housingType || '체크리스트'}
                      </span>
                      {item.areaText ? (
                        <span className="text-boss-text-secondary">· {item.areaText}㎡</span>
                      ) : null}
                    </div>
                    <span className="text-xs text-boss-text-muted">고객 ID: {id || '-'}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="text-boss-text-secondary">방 {filled}개</span>
                    <span className="ml-1 text-xs text-boss-text-muted">/ {pct}% 작성</span>
                    {hasMoney(item.totalPrice) ? (
                      <div className="text-[11px] text-boss-text-muted">
                        총액 {fmtMoney(item.totalPrice)}원
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone={badge.tone}>
                      <ClipboardCheck size={10} /> {badge.label}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap text-xs text-boss-text-muted">-</td>
                  <td
                    className="whitespace-nowrap text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() => router.push('/boss/checklist/new?edit=1')}
                      >
                        수정
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Printer}
                        onClick={() => router.push(printHref)}
                      >
                        인쇄
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(id)}
                        className="text-boss-error hover:bg-boss-error/10"
                      >
                        삭제
                      </Button>
                    </div>
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
