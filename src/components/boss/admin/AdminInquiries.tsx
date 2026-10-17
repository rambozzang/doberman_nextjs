'use client';

// 문의 처리 — 접수된 문의 목록(검색 · 상태 · 쪽) → 내용 확인 → 운영 메모와 함께 처리 완료
//
//   새 문의부터 서버 DB 에 저장된다. 예전 이메일로만 받은 문의는 목록에 없을 수 있다(서버 안내 문장을 그대로 보인다).
//   이메일 회신 기능은 없다 — 회신은 따로 하고, 이 화면은 처리 완료 · 운영 메모만 남긴다.
//   문의 원문 · 연락처는 운영 화면에만 보인다.

import { useCallback, useState } from 'react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { CASE_STATUS_VIEW } from '@/lib/boss/platformAdmin';
import type { CaseStatusFilter, PlatformInquiry } from '@/types/boss-platform-admin';
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
import CaseResolveDialog from './CaseResolveDialog';

const PAGE_SIZE = 20;

const FILTERS: { key: CaseStatusFilter; label: string }[] = [
  { key: 'OPEN', label: '미처리' },
  { key: 'RESOLVED', label: '처리 완료' },
  { key: 'ALL', label: '전체' },
];

const subject = (q: PlatformInquiry) => q.title || '(제목 없음)';
const contact = (q: PlatformInquiry) => [q.email, q.phone].filter(Boolean).join(' · ') || '-';

const COLUMNS: AdminColumn<PlatformInquiry>[] = [
  {
    key: 'title',
    header: '문의',
    card: 'title',
    className: 'wrap min-w-[200px]',
    cell: (q) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold text-boss-text [overflow-wrap:anywhere]">{subject(q)}</span>
        {q.inquiryType && <span className="text-[12px] font-normal text-boss-text-muted">{q.inquiryType}</span>}
      </span>
    ),
  },
  { key: 'status', header: '상태', card: 'badge', cell: (q) => <StatusTag status={q.status} view={CASE_STATUS_VIEW} /> },
  { key: 'name', header: '보낸 사람', card: 'line', cell: (q) => q.name || '-' },
  { key: 'contact', header: '연락처', card: 'line', className: 'wrap', cell: contact },
  { key: 'created', header: '접수', card: 'line', cell: (q) => <When value={q.createdAt} /> },
  { key: 'handled', header: '처리', card: 'line', cell: (q) => <When value={q.handledAt} empty="-" /> },
];

function InquiryDetails(q: PlatformInquiry) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
        <DescRow label="제목" value={subject(q)} />
        <DescRow label="문의 종류" value={q.inquiryType || '-'} />
        <DescRow label="보낸 사람" value={q.name || '-'} />
        <DescRow label="이메일" value={q.email || '-'} />
        <DescRow label="연락처" value={q.phone || '-'} />
        <DescRow label="접수" value={<When value={q.createdAt} />} />
        <DescRow label="상태" value={<StatusTag status={q.status} view={CASE_STATUS_VIEW} />} />
        {q.status === 'RESOLVED' && (
          <>
            <DescRow label="처리 시각" value={<When value={q.handledAt} />} />
            <DescRow label="처리자" value={q.handledBy || '-'} />
          </>
        )}
      </dl>
      <div className="border border-boss-border bg-boss-bg px-3 py-2.5">
        <p className="text-[12px] text-boss-text-muted">문의 내용</p>
        <PlainText className="mt-1 text-[13.5px] leading-relaxed text-boss-text">{q.content || '(내용 없음)'}</PlainText>
      </div>
      {q.operatorNote && (
        <div className="border border-boss-border bg-boss-bg px-3 py-2.5">
          <p className="text-[12px] text-boss-text-muted">운영 메모</p>
          <PlainText className="mt-1 text-[13px] leading-relaxed text-boss-text">{q.operatorNote}</PlainText>
        </div>
      )}
      <Note tone="info">이 화면은 이메일 · 문자 회신을 보내지 않습니다. 회신이 필요하면 위 연락처로 따로 연락해 주세요.</Note>
    </div>
  );
}

export default function AdminInquiries() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CaseStatusFilter>('OPEN');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlatformInquiry | null>(null);

  const fetch = useCallback(() => platformAdminApi.inquiries({ q, status, page, size: PAGE_SIZE }), [q, status, page]);
  const { data, loading, error, reload } = useAdminQuery(`${q}\u0000${status}`, fetch);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <AdminSearch
          value={q}
          disabled={loading}
          placeholder="제목 · 내용 · 이름 · 연락처"
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

      {data?.explanation && <Note tone="info">{data.explanation}</Note>}
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
        emptyTitle={q ? '검색 결과가 없습니다' : status === 'OPEN' ? '처리를 기다리는 문의가 없습니다' : status === 'RESOLVED' ? '처리한 문의가 없습니다' : '저장된 문의가 없습니다'}
        emptyDescription={q ? '검색어나 상태 조건을 바꿔 보세요.' : '예전에 이메일로만 받은 문의는 이 목록에 없을 수 있습니다.'}
      >
        {(items) => (
          <AdminTable
            caption="문의 목록"
            rows={items}
            rowKey={(x) => x.id}
            columns={COLUMNS}
            action={(x) => (
              <Button variant={x.status === 'OPEN' ? 'primary' : 'secondary'} size="sm" onClick={() => setSelected(x)}>
                {x.status === 'OPEN' ? '처리' : '보기'}
              </Button>
            )}
          />
        )}
      </ListBody>

      {selected && (
        <CaseResolveDialog<PlatformInquiry, never>
          title="문의 처리"
          row={selected}
          details={InquiryDetails}
          reasonLabel="운영 메모"
          reasonPlaceholder="예: 전화로 안내 완료(10/17) / 사용법 문의 — 도움말 링크 안내"
          reasonHint="보낸 사람에게 보내지 않습니다. 처리 내용만 짧게 적고 개인정보는 다시 적지 마세요."
          confirmText={(x) => `「${subject(x)}」 문의를 처리 완료로 바꿉니다. 회신은 보내지 않습니다.`}
          sendLabel={() => '처리 완료'}
          submit={(x, _d, reason) => platformAdminApi.resolveInquiry(x.id, { reason, expectedStatus: 'OPEN' })}
          reload={async () => {
            const fresh = await reload();
            return fresh ? fresh.items.find((x) => x.id === selected.id) ?? 'gone' : null;
          }}
          onClose={() => setSelected(null)}
          onDone={(x, confirmed) => {
            setNotice(`「${subject(x)}」 문의를 ${confirmed ? '처리 완료한 것을 확인했습니다' : '처리 완료로 바꿨습니다'}. 감사 이력에 남았습니다.`);
            setSelected(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}
