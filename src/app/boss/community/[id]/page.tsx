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
  Phone,
  X,
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

  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSending, setContactSending] = useState(false);

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

  const onContactRequest = async () => {
    if (!boardId) return;
    setContactSending(true);
    try {
      const res = await bossCommunityApi.contactJob(boardId, contactMsg.trim() || undefined);
      if (res.success !== false) {
        toast.success('연락 요청이 전송되었습니다. 작성자가 푸시를 받게 됩니다.');
        setContactOpen(false);
        setContactMsg('');
      } else {
        toast.error(res.message || '연락 요청에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 전송에 실패했습니다.');
    } finally {
      setContactSending(false);
    }
  };

  const isMine = post?.crtCustId && myUserId && post.crtCustId === myUserId;
  const isJobPost = post?.typeDtCd === 'JOB';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/community"
          className="inline-flex items-center gap-1.5 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 목록으로
        </Link>
        <div className="flex items-center gap-2">
          {isMine && (
            <>
              <Link
                href={`/boss/community/${boardId}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 py-1.5 text-xs text-boss-text-secondary hover:border-boss-border hover:text-boss-text"
              >
                <Pencil size={12} /> 수정
              </Link>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 py-1.5 text-xs text-boss-text-secondary hover:border-rose-700 hover:text-boss-error"
              >
                <Trash2 size={12} /> 삭제
              </button>
            </>
          )}
          {!isMine && post && (
            <Link
              href={`/boss/community/${boardId}/report`}
              className="inline-flex items-center gap-1 rounded-lg border border-boss-border bg-boss-surface px-3 py-1.5 text-xs text-boss-text-secondary hover:border-amber-700 hover:text-boss-warning"
            >
              <Flag size={12} /> 신고
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading || !post ? (
        <div className="h-64 animate-pulse rounded-2xl border border-boss-border bg-boss-surface" />
      ) : (
        <article className="rounded-2xl border border-boss-border bg-boss-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-xs text-boss-text-muted">
            {post.typeDtNm && (
              <span className="rounded-full bg-boss-elevated px-2 py-0.5 text-[10px] text-boss-text-secondary">
                {post.typeDtNm}
              </span>
            )}
            <span>{post.anonyYn === 'Y' ? '익명' : post.nickNm ?? post.userNm ?? '사용자'}</span>
            <span>·</span>
            <span>{formatDate(post.crtDtm)}</span>
          </div>
          <h1 className="mb-3 text-xl font-bold text-boss-text">{post.subject ?? '(제목 없음)'}</h1>
          {looksLikePlainText(post.contents) ? (
            <div className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-boss-text">
              {post.contents ?? ''}
            </div>
          ) : (
            <div
              className="prose prose-invert prose-sm mb-4 max-w-none prose-p:my-2 prose-headings:text-boss-text prose-strong:text-boss-text prose-a:text-boss-primary prose-blockquote:border-l-emerald-500"
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
                  className="h-32 w-full rounded-lg border border-boss-border object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-boss-border pt-3 text-xs text-boss-text-muted">
            <button
              type="button"
              onClick={onToggleLike}
              disabled={likePending}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
                post.likeYn === 'Y'
                  ? 'bg-boss-error/20 text-boss-error'
                  : 'bg-boss-elevated text-boss-text-secondary hover:bg-boss-elevated'
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

      {/* 구인구직 연락 요청 */}
      {post && isJobPost && !isMine && (
        <section className="rounded-xl border border-boss-border bg-boss-surface p-4">
          {!contactOpen ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-boss-text">작성자에게 연락 요청</h3>
                <p className="text-xs text-boss-text-muted">버튼을 누르면 작성자에게 푸시 알림이 전송됩니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-boss-text hover:bg-boss-primary-hover"
              >
                <Phone size={14} /> 연락 요청
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-boss-text">연락 요청 메시지</h3>
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="전달할 메시지를 입력하세요. (선택, 예: 오전에 통화 가능합니다)"
                rows={3}
                maxLength={200}
                className="w-full resize-none rounded-lg border border-boss-border bg-boss-bg/40 p-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-boss-text-muted">{contactMsg.length}/200</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactOpen(false)}
                    className="inline-flex h-8 items-center rounded-lg border border-boss-border bg-boss-surface px-3 text-xs text-boss-text-secondary hover:text-boss-text"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={onContactRequest}
                    disabled={contactSending}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-xs font-semibold text-boss-text hover:bg-boss-primary-hover disabled:opacity-60"
                  >
                    <Send size={13} /> {contactSending ? '전송 중…' : '보내기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 댓글 영역 */}
      <section className="space-y-3 rounded-2xl border border-boss-border bg-boss-surface/30 p-5">
        <h2 className="text-sm font-semibold text-boss-text">댓글 {comments.length}</h2>

        <div className="flex items-start gap-2">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-boss-border bg-boss-bg/40 p-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
          />
          <button
            type="button"
            onClick={onSubmitComment}
            disabled={submittingComment}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-semibold text-boss-text hover:bg-boss-primary-hover disabled:opacity-50"
          >
            <Send size={14} /> 등록
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-boss-text-muted">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {comments.map((c) => {
              const cMine = c.crtCustId && myUserId && c.crtCustId === myUserId;
              return (
                <li key={c.boardId} className="py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-boss-text-muted">
                      <span className="font-semibold text-boss-text-secondary">
                        {c.anonyYn === 'Y' ? '익명' : c.nickNm ?? c.userNm ?? '사용자'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(c.crtDtm)}</span>
                    </div>
                    {cMine && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(c.boardId)}
                        className="text-xs text-boss-text-muted hover:text-boss-error"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-boss-text">{c.contents ?? ''}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
