'use client';

import { useCallback, useState } from 'react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { auditActionLabel, auditTargetLabel } from '@/lib/boss/platformAdmin';
import type { PlatformAudit } from '@/types/boss-platform-admin';
import { AdminSearch, AdminTable, ListBar, ListBody, LoadFailure, When, useAdminQuery, type AdminColumn } from './AdminParts';

const columns: AdminColumn<PlatformAudit>[] = [
  { key: 'action', header: '변경 내용', card: 'title', cell: (row) => auditActionLabel(row.action), className: 'wrap' },
  { key: 'createdAt', header: '처리 시각', card: 'line', cell: (row) => <When value={row.createdAt} /> },
  { key: 'actor', header: '처리자', card: 'line', cell: (row) => row.actorUserId || '미기록', className: 'wrap break-all' },
  { key: 'target', header: '대상', card: 'line', cell: (row) => auditTargetLabel(row.targetType, row.targetId), className: 'wrap break-all' },
  { key: 'reason', header: '사유 · 메모', card: 'line', cell: (row) => row.reason || '미기록', className: 'wrap max-w-96 [overflow-wrap:anywhere]' },
];

export default function AdminAudit() {
  const [filter, setFilter] = useState({ q: '', page: 0 });
  const read = useCallback(() => platformAdminApi.audit({ ...filter, size: 20 }), [filter]);
  const { data, loading, error, reload } = useAdminQuery(`audit:${filter.q}:${filter.page}`, read);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-boss-text-secondary">회원 상태·공지·신고·문의 변경 내역을 확인합니다. 처리자와 사유가 함께 기록됩니다.</p>
      <ListBar total={data?.totalElements ?? null} loading={loading} onRefresh={() => void reload()}>
        <AdminSearch value={filter.q} onSearch={(q) => setFilter({ q, page: 0 })} placeholder="처리자 · 작업 · 대상 · 사유 검색" disabled={loading} />
      </ListBar>
      {error && <LoadFailure error={error} hasData={!!data} onRetry={() => void reload()} />}
      <ListBody data={data} loading={loading} emptyTitle={filter.q ? '검색에 맞는 변경 이력이 없습니다' : '아직 변경 이력이 없습니다'} emptyDescription={filter.q ? '다른 검색어로 찾아보세요.' : '운영 화면에서 내용을 변경하면 이곳에 기록됩니다.'} page={filter.page} onPage={(page) => setFilter((value) => ({ ...value, page }))}>
        {(rows) => <AdminTable rows={rows} rowKey={(row) => row.id} columns={columns} caption="운영 변경 이력" />}
      </ListBody>
    </div>
  );
}
