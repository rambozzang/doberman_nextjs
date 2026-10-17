'use client';

// 신고 처리 — 커뮤니티 신고(TB_BOARD_SINGO) 목록(검색 · 상태 · 쪽) → 기각 또는 글 숨김
//
//   글 숨김(HIDE_POST)은 대상 글 숨김과 처리 기록을 서버가 한 번에 남긴다. 글 · 신고는 지우지 않는다.
//   이미 처리된 신고는 서버가 409 로 거절한다. 신고한 회원 아이디는 이 운영 화면에만 보인다.

import { useCallback, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { CASE_STATUS_VIEW, resolutionLabel } from '@/lib/boss/platformAdmin';
import type { CaseStatusFilter, PlatformReport, ReportDecision } from '@/types/boss-platform-admin';
import { Button, DescRow, Segmented } from '@/components/boss/ui';
import {
  AdminSearch,
  AdminTable,
  ListBar,
  ListBody,
  LoadFailure,
  Note,
  PlainText,
  StatusTag,
  When,
  useAdminQuery,
  type AdminColumn,
} from './AdminParts';
import CaseResolveDialog, { type CaseDecision } from './CaseResolveDialog';

const PAGE_SIZE = 20;

const FILTERS: { key: CaseStatusFilter; label: string }[] = [
  { key: 'OPEN', label: '미처리' },
  { key: 'RESOLVED', label: '처리 완료' },
  { key: 'ALL', label: '전체' },
];

const DECISIONS: CaseDecision<ReportDecision>[] = [
  { key: 'DISMISS', label: '문제 없음(기각)', note: '글은 그대로 두고 신고만 처리 완료로 바꿉니다.' },
  {
    key: 'HIDE_POST',
    label: '글 숨김',
    note: '대상 글을 커뮤니티 · 앱에서 숨깁니다. 글 · 신고는 지우지 않습니다. 글을 찾지 못하면 서버가 거절하니 그때는 기각으로 처리하세요.',
    danger: true,
  },
];

const postTitle = (r: PlatformReport) => r.title || (r.boardId ? `글 #${r.boardId}` : '(글 정보 없음)');

const COLUMNS: AdminColumn<PlatformReport>[] = [
  {
    key: 'post',
    header: '신고된 글',
    card: 'title',
    className: 'wrap min-w-[200px]',
    cell: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold text-boss-text [overflow-wrap:anywhere]">{postTitle(r)}</span>
        {r.boardId && <span className="text-[12px] font-normal text-boss-text-muted">글 #{r.boardId}</span>}
      </span>
    ),
  },
  { key: 'status', header: '상태', card: 'badge', cell: (r) => <StatusTag status={r.status} view={CASE_STATUS_VIEW} /> },
  { key: 'reason', header: '신고 사유', card: 'line', className: 'wrap min-w-[180px]', cell: (r) => r.reason || '-' },
  { key: 'reporter', header: '신고한 회원', card: 'line', cell: (r) => r.reporterUserId || '-' },
  { key: 'target', header: '글쓴이', card: 'line', cell: (r) => r.targetUserId || '-' },
  { key: 'created', header: '신고 시각', card: 'line', cell: (r) => <When value={r.createdAt} /> },
  { key: 'resolution', header: '처리 결과', card: 'line', cell: (r) => resolutionLabel(r.resolution) ?? '-' },
];

function ReportDetails(r: PlatformReport) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
        <DescRow label="신고된 글" value={postTitle(r)} />
        <DescRow label="글쓴이" value={r.targetUserId || '-'} />
        <DescRow label="신고한 회원" value={r.reporterUserId || '-'} />
        <DescRow label="신고 시각" value={<When value={r.createdAt} />} />
        <DescRow label="상태" value={<StatusTag status={r.status} view={CASE_STATUS_VIEW} />} />
        {r.status === 'RESOLVED' && (
          <>
            <DescRow label="처리 결과" value={resolutionLabel(r.resolution) ?? '-'} />
            <DescRow label="처리 시각" value={<When value={r.handledAt} />} />
            <DescRow label="처리자" value={r.handledBy || '-'} />
          </>
        )}
      </dl>
      <div className="border border-boss-border bg-boss-bg px-3 py-2.5">
        <p className="text-[12px] text-boss-text-muted">신고 사유</p>
        <PlainText className="mt-1 text-[13px] leading-relaxed text-boss-text">{r.reason || '(사유 없음)'}</PlainText>
      </div>
      {r.operatorNote && (
        <div className="border border-boss-border bg-boss-bg px-3 py-2.5">
          <p className="text-[12px] text-boss-text-muted">처리 사유(운영 기록)</p>
          <PlainText className="mt-1 text-[13px] leading-relaxed text-boss-text">{r.operatorNote}</PlainText>
        </div>
      )}
      {r.boardId && (
        <a
          href={`/boss/community/${r.boardId}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-boss-primary hover:underline"
        >
          커뮤니티에서 글 보기 <ExternalLink size={12} aria-hidden />
          <span className="sr-only">(새 창)</span>
        </a>
      )}
      {r.boardId && <p className="text-[12px] text-boss-text-muted">숨긴 글은 커뮤니티 화면에서 열리지 않을 수 있습니다.</p>}
    </div>
  );
}

export default function AdminReports() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CaseStatusFilter>('OPEN');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlatformReport | null>(null);

  const fetch = useCallback(() => platformAdminApi.reports({ q, status, page, size: PAGE_SIZE }), [q, status, page]);
  const { data, loading, error, reload } = useAdminQuery(`${q}\u0000${status}`, fetch);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <AdminSearch
          value={q}
          disabled={loading}
          placeholder="글 제목 · 신고 사유 · 회원 아이디"
          onSearch={(v) => {
            setQ(v);
            setPage(0);
            setNotice(null);
          }}
        />
      </div>
      <ListBar total={data?.totalElements ?? null} loading={loading} onRefresh={() => void reload()}>
        <Segmented
          ariaLabel="처리 상태"
          value={status}
          options={FILTERS}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
            setNotice(null);
          }}
        />
      </ListBar>

      {notice && (
        <Note tone="ok" live>
          {notice}
        </Note>
      )}
      {error && <LoadFailure error={error} hasData={!!data} onRetry={() => void reload()} />}

      <ListBody
        data={data}
        loading={loading}
        page={page}
        onPage={setPage}
        emptyTitle={q ? '검색 결과가 없습니다' : status === 'OPEN' ? '처리를 기다리는 신고가 없습니다' : status === 'RESOLVED' ? '처리한 신고가 없습니다' : '신고가 없습니다'}
        emptyDescription={q ? '검색어나 상태 조건을 바꿔 보세요.' : undefined}
      >
        {(items) => (
          <AdminTable
            caption="신고 목록"
            rows={items}
            rowKey={(r) => r.id}
            columns={COLUMNS}
            action={(r) => (
              <Button variant={r.status === 'OPEN' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelected(r)}>
                {r.status === 'OPEN' ? '처리' : '보기'}
              </Button>
            )}
          />
        )}
      </ListBody>

      {selected && (
        <CaseResolveDialog<PlatformReport, ReportDecision>
          title="신고 처리"
          row={selected}
          details={ReportDetails}
          decisions={DECISIONS}
          reasonLabel="처리 사유"
          reasonPlaceholder="예: 광고성 글 반복 게시로 숨김 / 신고 내용과 다르게 문제없는 글"
          reasonHint="신고한 회원 · 글쓴이에게 보내지 않습니다. 개인정보는 적지 마세요."
          confirmText={(r, d) =>
            d === 'HIDE_POST'
              ? `「${postTitle(r)}」 글을 숨기고 신고를 처리 완료로 바꿉니다.`
              : `「${postTitle(r)}」 신고를 문제 없음으로 처리합니다.`
          }
          sendLabel={(d) => (d === 'HIDE_POST' ? '글 숨기고 처리' : d === 'DISMISS' ? '기각으로 처리' : '처리하기')}
          submit={(r, d, reason) => platformAdminApi.resolveReport(r.id, { decision: d ?? 'DISMISS', reason, expectedStatus: 'OPEN' })}
          reload={async () => {
            const fresh = await reload();
            return fresh ? fresh.items.find((x) => x.id === selected.id) ?? 'gone' : null;
          }}
          onClose={() => setSelected(null)}
          onDone={(r, confirmed) => {
            const how = resolutionLabel(r.resolution) ?? '처리 완료';
            setNotice(`「${postTitle(r)}」 신고를 ${confirmed ? '처리한 것을 확인했습니다' : '처리했습니다'}(결과: ${how}). 감사 이력에 남았습니다.`);
            setSelected(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}
