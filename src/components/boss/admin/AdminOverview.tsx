'use client';

// 운영 개요 — 서버 집계(GET /platform-admin/overview)만 보인다. 집계를 못 읽은 숫자는 "-"(0 이라고 쓰지 않는다).
// 구독 · 결제는 기록 저장소를 읽을 수 있는지만 말한다 — 읽을 수 없으면 0건이 아니라 "연동 안 됨"이다.
// 기존 운영 화면(전자 발급 운영 관리 · 도배 용품 관리)으로 가는 길도 여기 둔다.

import { useCallback } from 'react';
import { ArrowRight, FileCheck2, Newspaper, ShoppingBag, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { formatCount } from '@/lib/boss/platformAdmin';
import { formatOpsDateTime } from '@/lib/boss/taxInvoiceOps';
import { Panel, Skeleton, StatCard, Tag } from '@/components/boss/ui';
import { ListBar, LoadFailure, useAdminQuery } from './AdminParts';

export default function AdminOverview() {
  const fetch = useCallback(() => platformAdminApi.overview(), []);
  const { data, loading, error, reload } = useAdminQuery('overview', fetch);
  const checked = formatOpsDateTime(data?.checkedAt);

  return (
    <div className="flex flex-col gap-4">
      <ListBar total={null} loading={loading} onRefresh={() => void reload()}>
        <p className="text-[12.5px] text-boss-text-secondary">
          {data ? (checked ? `서버 집계 시각 ${checked}` : '서버 집계 시각을 받지 못했습니다') : ''}
        </p>
      </ListBar>
      {error && <LoadFailure error={error} hasData={!!data} onRetry={() => void reload()} />}

      {!data && loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px]" />
          ))}
        </div>
      ) : (
        data && (
          <>
            <section aria-label="회원 현황" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="전체 회원" value={formatCount(data.totalMembers)} hint="탈퇴 포함 앱 회원" href="/boss/admin/members" />
              <StatCard label="이용 중" value={formatCount(data.activeMembers)} href="/boss/admin/members" />
              <StatCard
                label="이용 정지"
                value={formatCount(data.suspendedMembers)}
                alert={(data.suspendedMembers ?? 0) > 0}
                href="/boss/admin/members"
              />
              <StatCard label="탈퇴" value={formatCount(data.deletedMembers)} href="/boss/admin/members" />
              <StatCard label="최근 7일 가입" value={formatCount(data.newMembers7d)} href="/boss/admin/members" />
              <StatCard label="공개 중 공지" value={formatCount(data.publishedNotices)} href="/boss/admin/notices" />
              <StatCard
                label="미처리 신고"
                value={formatCount(data.openReports)}
                alert={(data.openReports ?? 0) > 0}
                href="/boss/admin/reports"
              />
              <StatCard
                label="미처리 문의"
                value={formatCount(data.openInquiries)}
                alert={(data.openInquiries ?? 0) > 0}
                href="/boss/admin/inquiries"
              />
            </section>

            <Panel title="구독 · 결제 기록" kicker="읽기 전용">
              <ul className="flex flex-col">
                <SourceRow label="구독 기록" available={data.subscriptionsAvailable} href="/boss/admin/subscriptions" />
                <SourceRow label="결제 기록" available={data.paymentsAvailable} href="/boss/admin/payments" />
              </ul>
              <p className="mt-2 break-keep text-[12px] leading-relaxed text-boss-text-secondary">
                서버에 저장된 기록을 읽기만 합니다. 앱 스토어의 모든 결제를 실시간으로 모으고 있다는 뜻은 아니며, 결제 · 환불 · 해지는 이 화면에서 하지
                않습니다.
              </p>
            </Panel>
          </>
        )
      )}

      <Panel title="다른 운영 화면">
        <ul className="grid gap-2 sm:grid-cols-3">
          <OpsLink href="/boss/tax-invoice/admin" icon={FileCheck2} title="전자 발급 운영 관리" text="발급 권한 심사 · 문제 문서 · 처리 이력" />
          <OpsLink href="/boss/store" icon={ShoppingBag} title="도배 용품 관리" text="쿠팡 파트너스 상품 담기 · 순서" />
          <OpsLink href="/boss/notices" icon={Newspaper} title="공지사항 보기" text="회원에게 보이는 그대로 확인" />
        </ul>
      </Panel>
    </div>
  );
}

function SourceRow({ label, available, href }: { label: string; available: boolean; href: string }) {
  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-boss-border-row py-2.5 text-[13px] last:border-b-0">
      <span className="font-semibold text-boss-text">{label}</span>
      {available ? <Tag tone="ok">저장된 기록 조회 가능</Tag> : <Tag tone="neutral">연동 안 됨</Tag>}
      <span className="min-w-0 basis-full break-words text-[12px] text-boss-text-secondary sm:min-w-[160px] sm:flex-1 sm:basis-0">
        {available ? '저장된 기록이 없으면 목록이 비어 보입니다.' : '기록 저장소를 읽을 수 없습니다. 0건이라는 뜻이 아닙니다.'}
      </span>
      <Link href={href} prefetch={false} className="text-[12.5px] font-semibold text-boss-primary hover:underline">
        보기
      </Link>
    </li>
  );
}

function OpsLink({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="flex h-full items-start gap-2.5 border border-boss-border bg-boss-bg px-3.5 py-3 !text-boss-text transition-colors hover:border-boss-border-hover hover:bg-boss-hover"
      >
        <Icon size={16} strokeWidth={1.5} className="mt-[2px] shrink-0 text-boss-text-muted" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13.5px] font-semibold">{title}</span>
          <span className="break-keep text-[12px] leading-relaxed text-boss-text-secondary">{text}</span>
        </span>
        <ArrowRight size={14} className="mt-[3px] shrink-0 text-boss-text-muted" aria-hidden />
      </Link>
    </li>
  );
}
