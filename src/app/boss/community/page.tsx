'use client';

// 사장님 커뮤니티 게시글 목록
import Link from 'next/link';
import { CommunityList } from '@/components/boss/community/CommunityList';
import { PageHeader, Button } from '@/components/boss/ui';
import { PenSquare, User as UserIcon, ShieldOff } from 'lucide-react';

export default function BossCommunityListPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="사장님 커뮤니티"
        description="도배 사장님들과 정보를 공유하는 커뮤니티입니다."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/boss/community/my"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
            >
              <UserIcon size={13} /> 내 글
            </Link>
            <Link
              href="/boss/community/blocks"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
            >
              <ShieldOff size={13} /> 차단 관리
            </Link>
            <Link
              href="/boss/community/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-medium text-boss-primary-foreground transition-colors hover:bg-boss-primary-hover"
            >
              <PenSquare size={13} /> 글쓰기
            </Link>
          </div>
        }
      />

      <CommunityList />
    </div>
  );
}
