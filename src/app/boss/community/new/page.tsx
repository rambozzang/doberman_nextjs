'use client';

// 사장님 커뮤니티 글쓰기 — Industry 패턴
// 폼 조판(게시판 Seg · 제목 · 구인/구직 양식 · 본문 · 임시 저장)은 CommunityPostForm 이 담당한다.
// ?type=JOB|ANON 으로 들어오면 그 게시판을 기본 선택한다.

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import CommunityPostForm from '@/components/boss/community/CommunityPostForm';
import type { BbsCreateRequest } from '@/types/boss-community';
import type { CategoryCode } from '@/components/boss/community/CommunityList';
import { Skeleton } from '@/components/boss/ui';

function CommunityNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const defaultCategory: CategoryCode | undefined =
    typeParam === 'JOB' || typeParam === 'ANON' ? typeParam : undefined;

  const handleSubmit = async (payload: BbsCreateRequest) => {
    const res = await bossCommunityApi.create(payload);
    if (res.success !== false) {
      markListDirty(LIST_KEYS.community, LIST_KEYS.communityJob, LIST_KEYS.communityMy);
      const back = defaultCategory === 'JOB' ? '/boss/community/jobs' : '/boss/community';
      router.push(back);
      return { success: true };
    }
    return { success: false, message: res.message || '등록에 실패했습니다.' };
  };

  return (
    <CommunityPostForm
      mode="create"
      defaultCategory={defaultCategory}
      onSubmit={async (payload) => {
        const result = await handleSubmit(payload as BbsCreateRequest);
        if (!result.success) toast.error(result.message || '등록에 실패했습니다.');
        return result;
      }}
    />
  );
}

export default function BossCommunityNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[220px]" />
          <Skeleton className="h-[420px]" />
        </div>
      }
    >
      <CommunityNewInner />
    </Suspense>
  );
}
