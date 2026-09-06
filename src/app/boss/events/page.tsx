'use client';

// 이벤트 — Industry 패턴 (agent.opentohome.com)
//
// 필터 줄(검색 + 우측 전체 n건 · 새로고침)
// → 표(이벤트 · 상태 · 기간 · 설명 · 보기) — 상시 이벤트(정적) + 공지 API 이벤트를 한 표에
// 화면 제목은 셸 헤더가 그린다. 첫 조회 실패와 0건은 문구를 다르게 낸다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { bossNotificationsApi } from '@/lib/api/boss/notifications';
import type {
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';
import {
  SearchInput,
  Button,
  ButtonLink,
  DataTable,
  StatusPill,
  EmptyState,
  AlertBanner,
  ContentCard,
  RowSkeleton,
  type StatusTone,
} from '@/components/boss/ui';

// 표 한 행을 표현하는 통합 모델 (정적 이벤트 + API 이벤트 공통)
interface EventRow {
  key: string;
  name: string;
  period: string; // 기간(정적) 또는 등록일(API)
  statusLabel: string;
  statusTone: StatusTone;
  summary: string;
  href: string;
  actionLabel: string;
  actionVariant: 'primary' | 'secondary';
}

// 상시 운영되는 정적 이벤트 (상세: /boss/events/coffee)
const STATIC_EVENTS: EventRow[] = [
  {
    key: 'static-coffee',
    name: '커피 쿠폰 이벤트',
    period: '2024.01.01 ~ 2024.12.31',
    statusLabel: '진행 중',
    statusTone: 'ok',
    summary: '참여하신 모든 사장님께 추첨을 통해 스타벅스 아메리카노 쿠폰을 드립니다.',
    href: '/boss/events/coffee',
    actionLabel: '참여',
    actionVariant: 'primary',
  },
];

function pickList(
  data: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list ?? data.content ?? [];
}

function formatDate(s?: string): string {
  if (!s) return '-';
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s;
}

function stripHtml(s?: string): string {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default function BossEventsPage() {
  const router = useRouter();
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossNotificationsApi.list({
        typeCd: 'NOTI',
        typeDtCd: 'AD',
        pageNum: 0,
        pageSize: 30,
        sortDesc: 'crtDtm',
      });
      if (res.success) {
        setItems(pickList(res.data));
      } else {
        setError(res.message ?? '이벤트를 불러오지 못했습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '이벤트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 정적 이벤트 + API 이벤트를 하나의 행 모델로 병합
  const rows = useMemo<EventRow[]>(() => {
    const apiRows: EventRow[] = items.map((item, idx) => ({
      key: `noti-${item.boardId ?? idx}`,
      name: item.subject ?? '제목 없음',
      period: formatDate(item.crtDtm),
      statusLabel: '공지',
      statusTone: 'info',
      summary: stripHtml(item.contents),
      href: `/boss/notifications/${item.boardId ?? ''}`,
      actionLabel: '보기',
      actionVariant: 'secondary',
    }));
    return [...STATIC_EVENTS, ...apiRows];
  }, [items]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) =>
      [r.name, r.summary, r.period].some((v) => v.toLowerCase().includes(k)),
    );
  }, [rows, keyword]);

  const isFiltering = keyword.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 필터 줄 ───── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이벤트명 · 설명"
          className="w-56"
          hint={false}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : isFiltering ? `${filtered.length}건 · 전체 ${rows.length}건` : `전체 ${rows.length}건`}
          </span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
            새로고침
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => void load()}>
              다시 시도
            </Button>
          }
        >
          {error} 상시 이벤트는 아래에 그대로 보입니다.
        </AlertBanner>
      )}

      {/* ───── 표 ───── */}
      {loading && items.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={4} />
        </ContentCard>
      ) : filtered.length === 0 ? (
        isFiltering ? (
          <EmptyState
            title={`'${keyword.trim()}' 에 맞는 이벤트가 없습니다`}
            description="이벤트명과 설명에서 찾습니다. 검색어를 바꿔 보세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => setKeyword('')}>
                검색 지우기
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="진행 중인 이벤트가 없습니다"
            description="새 이벤트가 열리면 알림으로 알려드립니다. 알림 설정에서 수신을 켜 두세요."
            action={
              <ButtonLink href="/boss/settings/alarm" variant="secondary" size="sm">
                알림 설정
              </ButtonLink>
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이벤트</th>
              <th>상태</th>
              <th>기간</th>
              <th>설명</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.key} className="cursor-pointer" onClick={() => router.push(row.href)}>
                <td className="font-semibold">{row.name}</td>
                <td>
                  <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                </td>
                <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                  {row.period}
                </td>
                <td className="wrap max-w-[460px] text-boss-text-secondary">
                  <span className="line-clamp-1">{row.summary || '—'}</span>
                </td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <ButtonLink href={row.href} variant={row.actionVariant} size="sm">
                    {row.actionLabel}
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
