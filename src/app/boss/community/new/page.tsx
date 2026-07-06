'use client';

// 사장님 커뮤니티 글쓰기 — RichEditor 투입
// Flutter `bbs_write_page.dart` 의 Next.js 포팅.
// 로직은 동일: POST /bbs with {typeCd:BBS, typeDtCd:FREE, subject, contents}
// 변경점: textarea → TipTap 기반 RichEditor (HTML 출력 저장)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import RichEditor from '@/components/boss/RichEditor';
import { Button, Card, PageHeader } from '@/components/boss/ui';

export default function BossCommunityNewPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [contents, setContents] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasContent = contents.replace(/<[^>]*>/g, '').trim().length > 0;

  const submit = async () => {
    if (!subject.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!hasContent) {
      toast.error('내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bossCommunityApi.create({
        typeCd: 'BBS',
        typeDtCd: 'FREE',
        depthNo: '1',
        boardId: '0',
        parentId: 0,
        subject: subject.trim(),
        contents: contents.trim(),
        fileListData: [],
      });
      if (res.success !== false) {
        toast.success('게시글이 등록되었습니다.');
        router.push('/boss/community');
      } else {
        toast.error(res.message || '등록에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Community"
        title="새 게시글"
        description="도배 사장님들과 노하우·팁을 공유하세요."
        breadcrumbs={[
          { label: '커뮤니티', href: '/boss/community' },
          { label: '새 글' },
        ]}
        actions={
          <Link
            href="/boss/community"
            className="inline-flex items-center gap-1 text-xs text-boss-text-muted hover:text-boss-text"
          >
            <ArrowLeft size={12} /> 목록으로
          </Link>
        }
      />

      <Card padded>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-boss-text-muted">
              제목
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="제목을 입력하세요"
              className="h-10 w-full rounded-md border border-boss-border bg-boss-elevated px-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:bg-boss-elevated focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-boss-text-muted">
              내용
            </label>
            <RichEditor
              value={contents}
              onChange={setContents}
              placeholder="자유롭게 작성하세요. 굵게, 목록, 인용, 링크 등을 사용할 수 있습니다."
              minHeight={280}
            />
            <p className="mt-1.5 text-[10px] text-boss-text-muted">
              Cmd/Ctrl + B 굵게 · Cmd/Ctrl + I 기울임 · 툴바에서 제목·목록·인용·링크 삽입
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-boss-text-secondary">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            익명 작성
          </label>

          <div className="flex justify-end border-t border-boss-border pt-4">
            <Button
              variant="primary"
              size="md"
              icon={Save}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? '등록 중…' : '게시글 등록'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
