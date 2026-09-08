'use client';

// 사장님 커뮤니티 게시글 수정 — Industry 패턴
// 폼 조판은 CommunityPostForm 이 담당한다. 여기서는 원본 조회와 저장만 잇는다.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import CommunityPostForm from '@/components/boss/community/CommunityPostForm';
import type { BbsData, BbsUpdateRequest } from '@/types/boss-community';
import { AlertBanner, ButtonLink, Skeleton } from '@/components/boss/ui';

export default function BossCommunityEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = params?.id;

  const [initial, setInitial] = useState<BbsData | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossCommunityApi.detail(boardId);
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setInitial(res.data);
        } else {
          setError(res.message || '게시글을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 게시글을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const handleSubmit = async (payload: BbsUpdateRequest) => {
    if (!boardId) return { success: false, message: '게시글 ID가 없습니다.' };
    const res = await bossCommunityApi.update({ ...payload, boardId });
    if (res.success !== false) {
      markListDirty(LIST_KEYS.community, LIST_KEYS.communityJob, LIST_KEYS.communityMy);
      router.push(`/boss/community/${boardId}`);
      return { success: true };
    }
    return { success: false, message: res.message || '수정에 실패했습니다.' };
  };

  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[220px]" />
          <Skeleton className="h-[420px]" />
        </div>
        <Skeleton className="h-[180px]" />
      </div>
    );
  }

  if (error || !initial) {
    return (
      <AlertBanner
        tone="bad"
        action={
          <ButtonLink
            href={boardId ? `/boss/community/${boardId}` : '/boss/community'}
            variant="secondary"
            size="sm"
          >
            돌아가기
          </ButtonLink>
        }
      >
        {error || '게시글을 찾을 수 없습니다. 삭제됐거나 주소가 잘못됐을 수 있습니다.'}
      </AlertBanner>
    );
  }

  return (
    <CommunityPostForm
      mode="edit"
      boardId={boardId}
      initial={initial}
      onSubmit={async (payload) => {
        const result = await handleSubmit(payload as BbsUpdateRequest);
        if (!result.success) toast.error(result.message || '수정에 실패했습니다.');
        return result;
      }}
    />
  );
}
