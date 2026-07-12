'use client';

// 사장님 커뮤니티 글쓰기 — 카테고리 선택 + 구인/구직 양식 + 임시 저장
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import CommunityPostForm from '@/components/boss/community/CommunityPostForm';
import type { BbsCreateRequest } from '@/types/boss-community';
import type { CategoryCode } from '@/components/boss/community/CommunityList';

function CommunityNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const defaultCategory: CategoryCode | undefined =
    typeParam === 'JOB' || typeParam === 'ANON' ? typeParam : undefined;

  const handleSubmit = async (payload: BbsCreateRequest) => {
    const res = await bossCommunityApi.create(payload);
    if (res.success !== false) {
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
    <Suspense fallback={null}>
      <CommunityNewInner />
    </Suspense>
  );
}
