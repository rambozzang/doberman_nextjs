'use client';

// 사장님 커뮤니티 글쓰기 — 카테고리 선택 + 구인/구직 양식 + 임시 저장
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import CommunityPostForm from '@/components/boss/community/CommunityPostForm';
import type { BbsCreateRequest } from '@/types/boss-community';

export default function BossCommunityNewPage() {
  const router = useRouter();

  const handleSubmit = async (payload: BbsCreateRequest) => {
    const res = await bossCommunityApi.create(payload);
    if (res.success !== false) {
      router.push('/boss/community');
      return { success: true };
    }
    return { success: false, message: res.message || '등록에 실패했습니다.' };
  };

  return (
    <CommunityPostForm
      mode="create"
      onSubmit={async (payload) => {
        const result = await handleSubmit(payload as BbsCreateRequest);
        if (!result.success) toast.error(result.message || '등록에 실패했습니다.');
        return result;
      }}
    />
  );
}
