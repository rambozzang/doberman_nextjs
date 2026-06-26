'use client';

// 사장님 커뮤니티 신고하기
// Flutter `bbs_sigo_page.dart` 를 Next.js 로 포팅.
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { BossAuthManager } from '@/lib/bossAuth';

const REASON_OPTIONS: { code: string; label: string }[] = [
  { code: 'SPAM', label: '스팸/광고성 게시물' },
  { code: 'ABUSE', label: '욕설/혐오/비방' },
  { code: 'PORN', label: '음란/선정적 내용' },
  { code: 'COPY', label: '저작권 침해' },
  { code: 'ETC', label: '기타' },
];

export default function BossCommunityReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = params?.id;

  const [reasonCd, setReasonCd] = useState<string>(REASON_OPTIONS[0].code);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!boardId) return;
    if (!reason.trim()) {
      toast.error('신고 사유를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const me = BossAuthManager.getUserInfo();
      const res = await bossCommunityApi.singo({
        boardId: String(boardId),
        reasonCd,
        userId: me?.userId ?? '',
        reason: reason.trim(),
      });
      if (res.success !== false) {
        toast.success('신고가 접수되었습니다.');
        router.push(`/boss/community/${boardId}`);
      } else {
        toast.error(res.message || '신고 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/boss/community/${boardId}`}
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-boss-text">게시글 신고</h1>
        <div className="w-20" />
      </div>

      <div className="space-y-4 rounded-2xl border border-boss-border bg-boss-surface p-5">
        <div>
          <label className="mb-2 block text-xs font-semibold text-boss-text-muted">신고 유형</label>
          <div className="space-y-2">
            {REASON_OPTIONS.map((opt) => (
              <label
                key={opt.code}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-boss-border bg-boss-bg/40 px-3 py-2 text-sm text-boss-text hover:border-boss-border"
              >
                <input
                  type="radio"
                  name="reasonCd"
                  value={opt.code}
                  checked={reasonCd === opt.code}
                  onChange={() => setReasonCd(opt.code)}
                  className="accent-emerald-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-boss-text-muted">상세 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            placeholder="신고 사유를 자세히 작성해주세요"
            className="w-full resize-y rounded-lg border border-boss-border bg-boss-bg/40 p-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-boss-text hover:bg-amber-400 disabled:opacity-50"
          >
            <Flag size={14} /> {submitting ? '신고 중…' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
