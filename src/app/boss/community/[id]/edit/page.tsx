'use client';

// 사장님 커뮤니티 게시글 수정
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import CommunityPostForm from '@/components/boss/community/CommunityPostForm';
import type { BbsData, BbsUpdateRequest } from '@/types/boss-community';

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
      router.push(`/boss/community/${boardId}`);
      return { success: true };
    }
    return { success: false, message: res.message || '수정에 실패했습니다.' };
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-[32rem] animate-pulse rounded-lg border border-boss-border bg-boss-elevated" />
      </div>
    );
  }

  if (error || !initial) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-boss-error/20 bg-boss-error/10 p-4 text-sm text-boss-error">
        {error || '게시글을 찾을 수 없습니다.'}
      </div>
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
