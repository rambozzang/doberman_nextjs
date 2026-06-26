'use client';

// 사장님 커뮤니티 게시글 수정
// Flutter `bbs_modify_page.dart` 를 Next.js 로 포팅.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import RichEditor from '@/components/boss/RichEditor';
import { Button, Card, PageHeader } from '@/components/boss/ui';

export default function BossCommunityEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = params?.id;

  const [subject, setSubject] = useState('');
  const [contents, setContents] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
          setSubject(res.data.subject ?? '');
          setContents(res.data.contents ?? '');
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

  const submit = async () => {
    if (!boardId) return;
    const plain = contents.replace(/<[^>]*>/g, '').trim();
    if (!subject.trim() || !plain) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bossCommunityApi.update({
        boardId: String(boardId),
        subject: subject.trim(),
        contents: contents.trim(),
        typeCd: 'BBS',
        typeDtCd: 'FREE',
        depthNo: '1',
        parentId: 0,
        fileListData: [],
      });
      if (res.success !== false) {
        toast.success('수정되었습니다.');
        router.push(`/boss/community/${boardId}`);
      } else {
        toast.error(res.message || '수정 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Community"
        title="게시글 수정"
        breadcrumbs={[
          { label: '커뮤니티', href: '/boss/community' },
          { label: '상세', href: `/boss/community/${boardId}` },
          { label: '수정' },
        ]}
        actions={
          <Link
            href={`/boss/community/${boardId}`}
            className="inline-flex items-center gap-1 text-xs text-boss-text-muted hover:text-boss-text"
          >
            <ArrowLeft size={12} /> 돌아가기
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-boss-error/20 bg-boss-error/100/[0.06] px-3 py-2 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-96 animate-pulse rounded-xl border border-boss-border bg-boss-elevated" />
      ) : (
        <Card padded>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-boss-text-muted">
                제목
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 w-full rounded-md border border-boss-border bg-boss-elevated px-3 text-sm text-boss-text focus:border-boss-primary/50 focus:bg-boss-elevated focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-boss-text-muted">
                내용
              </label>
              <RichEditor
                value={contents}
                onChange={setContents}
                placeholder="내용을 수정하세요"
                minHeight={280}
              />
            </div>
            <div className="flex justify-end border-t border-boss-border pt-4">
              <Button
                variant="primary"
                size="md"
                icon={Save}
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? '수정 중…' : '수정 완료'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
