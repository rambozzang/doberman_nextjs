'use client';

// 사장님 커뮤니티 게시글 상세 + 댓글 + 좋아요 (컴팩트 B2B 레이아웃)
// Flutter `bbs_view_page.dart` 를 Next.js 로 포팅.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Eye,
  MessageCircle,
  Send,
  Trash2,
  Pencil,
  Flag,
  Phone,
  X,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { bossCommentApi } from '@/lib/api/boss/comment';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData } from '@/types/boss-community';
import { PageHeader, Card, Button, Badge, EmptyState, Skeleton } from '@/components/boss/ui';

type BadgeTone = 'default' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';

const CATEGORY_TONE: Record<string, BadgeTone> = {
  FREE: 'emerald',
  JOB: 'sky',
  ANON: 'violet',
  NOTICE: 'amber',
};

function formatDate(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString('ko-KR');
}

function displayName(item: BbsData): string {
  if (item.anonyYn === 'Y') return '익명';
  return item.nickNm ?? item.userNm ?? '사용자';
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

  const isMine = !!(post?.crtCustId && myUserId && post.crtCustId === myUserId);
  const isJobPost = post?.typeDtCd === 'JOB';
  const categoryTone: BadgeTone = CATEGORY_TONE[post?.typeDtCd ?? ''] ?? 'default';

  return (
    <div className="space-y-5">
      <PageHeader
        title="커뮤니티 글 상세"
        breadcrumbs={[{ label: '커뮤니티', href: '/boss/community' }, { label: '상세' }]}
        actions={
          post && (
            <>
              {isMine ? (
                <>
                  <Link href={`/boss/community/${boardId}/edit`}>
                    <Button variant="secondary" icon={Pencil}>
                      수정
                    </Button>
                  </Link>
                  <Button variant="danger" icon={Trash2} onClick={onDelete}>
                    삭제
                  </Button>
                </>
              ) : (
                <Link href={`/boss/community/${boardId}/report`}>
                  <Button variant="secondary" icon={Flag}>
                    신고
                  </Button>
                </Link>
              )}
            </>
          )
        }
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading || !post ? (
        !error && (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )
      ) : (
        <>
          {/* 개요 카드 — 작성자 / 카테고리 / 작성일 / 조회 / 댓글 / 좋아요 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {post.typeDtNm && <Badge tone={categoryTone}>{post.typeDtNm}</Badge>}
                <span className="text-xs text-boss-text-muted">#{boardId}</span>
              </div>
              <h2 className="break-words text-lg font-semibold text-boss-text">
                {post.subject ?? '(제목 없음)'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-boss-text-muted">
                <span className="inline-flex items-center gap-1">
                  <User size={13} /> {displayName(post)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} /> {formatDate(post.crtDtm)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 text-sm">
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-boss-text-muted">
                  <Eye size={12} /> 조회
                </p>
                <p className="font-semibold text-boss-text">{post.viewCnt ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-boss-text-muted">
                  <MessageCircle size={12} /> 댓글
                </p>
                <p className="font-semibold text-boss-text">{comments.length}</p>
              </div>
              <button
                type="button"
                onClick={onToggleLike}
                disabled={likePending}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
                  post.likeYn === 'Y'
                    ? 'bg-boss-error/15 text-boss-error'
                    : 'bg-boss-elevated text-boss-text-secondary hover:text-boss-text'
                }`}
              >
                <Heart size={14} className={post.likeYn === 'Y' ? 'fill-current' : ''} />
                좋아요 {post.likeCnt ?? 0}
              </button>
            </div>
          </Card>

          {/* 본문 카드 */}
          <Card>
            {looksLikePlainText(post.contents) ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-boss-text">
                {post.contents ?? ''}
              </div>
            ) : (
              <div
                className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:text-boss-text prose-strong:text-boss-text prose-a:text-boss-primary prose-blockquote:border-l-emerald-500"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contents) }}
              />
            )}

            {post.fileList && post.fileList.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          </Card>

          {/* 구인구직 연락 요청 */}
          {isJobPost && !isMine && (
            <Section title="작성자에게 연락 요청" icon={Phone}>
              {!contactOpen ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-boss-text-muted">
                    버튼을 누르면 작성자에게 푸시 알림이 전송됩니다.
                  </p>
                  <Button variant="primary" icon={Phone} onClick={() => setContactOpen(true)}>
                    연락 요청
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-boss-text-secondary">연락 요청 메시지</span>
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
                      <Button variant="secondary" onClick={() => setContactOpen(false)}>
                        취소
                      </Button>
                      <Button
                        variant="primary"
                        icon={Send}
                        onClick={onContactRequest}
                        disabled={contactSending}
                      >
                        {contactSending ? '전송 중…' : '보내기'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* 댓글 영역 */}
          <Section title={`댓글 (${comments.length})`} icon={MessageCircle}>
            <div className="flex items-start gap-2">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-boss-border bg-boss-bg/40 p-3 text-sm text-boss-text placeholder:text-boss-text-muted focus:border-boss-primary/50 focus:outline-none focus:ring-2 focus:ring-boss-primary/10"
              />
              <Button
                variant="primary"
                size="md"
                icon={Send}
                onClick={onSubmitComment}
                disabled={submittingComment}
              >
                등록
              </Button>
            </div>

            {comments.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="아직 댓글이 없습니다"
                description="첫 번째 댓글을 남겨보세요."
              />
            ) : (
              <ul className="divide-y divide-boss-border">
                {comments.map((c) => {
                  const cMine = !!(c.crtCustId && myUserId && c.crtCustId === myUserId);
                  return (
                    <li key={c.boardId} className="py-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-boss-text-muted">
                          <span className="font-semibold text-boss-text-secondary">
                            {displayName(c)}
                          </span>
                          <span>·</span>
                          <span>{formatDate(c.crtDtm)}</span>
                        </div>
                        {cMine && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(c.boardId)}
                            className="inline-flex items-center gap-1 text-xs text-boss-text-muted hover:text-boss-error"
                          >
                            <Trash2 size={12} /> 삭제
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-boss-text">{c.contents ?? ''}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────
// 로컬 헬퍼: Section (아이콘 + 타이틀 카드)
// ───────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-boss-text">
        <Icon size={15} className="text-boss-primary" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}
