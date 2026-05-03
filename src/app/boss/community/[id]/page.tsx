'use client';

// 사장님 커뮤니티 게시글 상세 + 댓글 + 좋아요
// Flutter `bbs_view_page.dart` 를 Next.js 로 포팅.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Eye,
  MessageCircle,
  Send,
  Trash2,
  Pencil,
  Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { bossCommentApi } from '@/lib/api/boss/comment';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData } from '@/types/boss-community';

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString('ko-KR');
}

export default function BossCommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = params?.id;

  const [post, setPost] = useState<BbsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<BbsData[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const myUserId = BossAuthManager.getUserInfo()?.userId ?? '';

  const loadDetail = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      // 조회수 증가는 별도로 호출 (실패 무시)
      bossCommunityApi.viewCount(boardId).catch(() => {});
      const res = await bossCommunityApi.detail(boardId);
      if (res.success !== false && res.data) {
        setPost(res.data);
      } else {
        setError(res.message || '게시글을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const loadComments = useCallback(async () => {
    if (!boardId) return;
    try {
      const res = await bossCommentApi.list({
        pageNum: 1,
        pageSize: 100,
        boardId: Number(boardId),
        sortDesc: 'crtDtm',
      });
      if (res.success !== false && res.data) {
        setComments(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // 댓글 로드 실패는 토스트만
      toast.error('댓글을 불러오지 못했습니다.');
    }
  }, [boardId]);

  useEffect(() => {
    loadDetail();
    loadComments();
  }, [loadDetail, loadComments]);

  const onToggleLike = async () => {
    if (!boardId || !post || likePending) return;
    setLikePending(true);
    const liked = post.likeYn === 'Y';
    try {
      const res = liked
        ? await bossCommunityApi.unlike(boardId)
        : await bossCommunityApi.like(boardId);
      if (res.success !== false) {
        setPost({
          ...post,
          likeYn: liked ? 'N' : 'Y',
          likeCnt: (post.likeCnt ?? 0) + (liked ? -1 : 1),
        });
      } else {
        toast.error(res.message || '처리 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setLikePending(false);
    }
  };

  const onDelete = async () => {
    if (!boardId) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await bossCommunityApi.remove(boardId);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        router.push('/boss/community');
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    }
  };

  const onSubmitComment = async () => {
    if (!boardId) return;
    const text = commentInput.trim();
    if (!text) {
      toast.error('댓글을 입력해주세요.');
      return;
    }
    setSubmittingComment(true);
    try {
      const res = await bossCommentApi.create({
        boardId: Number(boardId),
        contents: text,
        typeCd: 'BBS',
        typeDtCd: 'COMMENT',
        depthNo: '2',
        parentId: boardId,
      });
      if (res.success !== false) {
        setCommentInput('');
        await loadComments();
      } else {
        toast.error(res.message || '댓글 등록 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setSubmittingComment(false);
    }
  };

  const onDeleteComment = async (cBoardId?: number) => {
    if (!cBoardId) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await bossCommentApi.remove(cBoardId);
      if (res.success !== false) {
        await loadComments();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    }
  };

  const isMine = post?.crtCustId && myUserId && post.crtCustId === myUserId;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/community"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록으로
        </Link>
        <div className="flex items-center gap-2">
          {isMine && (
            <>
              <Link
                href={`/boss/community/${boardId}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
              >
                <Pencil size={12} /> 수정
              </Link>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-300"
              >
                <Trash2 size={12} /> 삭제
              </button>
            </>
          )}
          {!isMine && post && (
            <Link
              href={`/boss/community/${boardId}/report`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-700 hover:text-amber-300"
            >
              <Flag size={12} /> 신고
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading || !post ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      ) : (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            {post.typeDtNm && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                {post.typeDtNm}
              </span>
            )}
            <span>{post.anonyYn === 'Y' ? '익명' : post.nickNm ?? post.userNm ?? '사용자'}</span>
            <span>·</span>
            <span>{formatDate(post.crtDtm)}</span>
          </div>
          <h1 className="mb-3 text-xl font-bold text-white">{post.subject ?? '(제목 없음)'}</h1>
          {looksLikePlainText(post.contents) ? (
            <div className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {post.contents ?? ''}
            </div>
          ) : (
            <div
              className="prose prose-invert prose-sm mb-4 max-w-none prose-p:my-2 prose-headings:text-white prose-strong:text-white prose-a:text-emerald-400 prose-blockquote:border-l-emerald-500"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contents) }}
            />
          )}

          {post.fileList && post.fileList.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {post.fileList.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.filePath ?? ''}
                  alt={f.fileNm ?? ''}
                  className="h-32 w-full rounded-lg border border-slate-800 object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={onToggleLike}
              disabled={likePending}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                post.likeYn === 'Y'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Heart size={12} className={post.likeYn === 'Y' ? 'fill-rose-300' : ''} />
              좋아요 {post.likeCnt ?? 0}
            </button>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {post.viewCnt ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} /> {comments.length}
            </span>
          </div>
        </article>
      )}

      {/* 댓글 영역 */}
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="text-sm font-semibold text-white">댓글 {comments.length}</h2>

        <div className="flex items-start gap-2">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={submittingComment}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            <Send size={14} /> 등록
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {comments.map((c) => {
              const cMine = c.crtCustId && myUserId && c.crtCustId === myUserId;
              return (
                <li key={c.boardId} className="py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-300">
                        {c.anonyYn === 'Y' ? '익명' : c.nickNm ?? c.userNm ?? '사용자'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(c.crtDtm)}</span>
                    </div>
                    {cMine && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(c.boardId)}
                        className="text-xs text-slate-500 hover:text-rose-300"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{c.contents ?? ''}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
