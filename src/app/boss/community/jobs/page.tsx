'use client';

// 구인 / 구직 전용 메뉴
import Link from 'next/link';
import { CommunityList } from '@/components/boss/community/CommunityList';
import { PageHeader } from '@/components/boss/ui';
import { PenSquare, ArrowLeft } from 'lucide-react';

export default function BossCommunityJobsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="구인 / 구직"
        description="인력을 구하거나 일자리를 찾아보세요."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/boss/community"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
            >
              <ArrowLeft size={13} /> 커뮤니티
            </Link>
            <Link
              href="/boss/community/new?type=JOB"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-medium text-boss-primary-foreground transition-colors hover:bg-boss-primary-hover"
            >
              <PenSquare size={13} /> 구인/구직 등록
            </Link>
          </div>
        }
      />

      <CommunityList fixedCategory="JOB" />
    </div>
  );
}
