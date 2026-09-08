'use client';

// 사장님 커뮤니티 게시글 상세 — Industry 패턴 (agent.opentohome.com)
// Flutter `bbs_view_page.dart` 를 Next.js 로 포팅.
//
// 구조: 2열 lg:grid-cols-[minmax(0,1fr)_320px]
//   좌 — 본문 패널(게시판 태그 · 제목 · 본문 · 첨부) → (구인구직) 연락 요청 패널 → 댓글 패널(입력 + 행 리스트)
//   우 — 정보 패널(DescRow: 작성자 · 게시판 · 작성일 · 조회 · 댓글 · 좋아요) + 좋아요 버튼
//        관리 패널(내 글: 수정 · 삭제 / 남의 글: 신고)
//
// 화면 제목과 «← 커뮤니티» 는 셸 헤더가 그린다. 삭제는 ConfirmDialog 를 거친다.

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Pencil, Trash2, Flag, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { bossCommentApi } from '@/lib/api/boss/comment';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData } from '@/types/boss-community';
import {
  ContentCard,
  CardHead,
  Panel,
  DescRow,
  Button,
  ButtonLink,
  StatusPill,
  AlertBanner,
  ConfirmDialog,
  Skeleton,
  type StatusTone,
  DetailActions,
} from '@/components/boss/ui';

const CATEGORY_TONE: Record<string, StatusTone> = {
  FREE: 'info',
  JOB: 'warn',
  ANON: 'neutral',
  NOTICE: 'ok',
};

// RichEditor(TipTap) 가 만든 HTML 본문 — 라이트 패널 위 기본 조판
const HTML_BODY_CLS =
  'text-[14px] leading-[1.7] text-boss-text ' +
  '[&_p]:my-2 [&_h1]:mt-4 [&_h1]:text-[20px] [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-[18px] [&_h2]:font-semibold ' +
  '[&_h3]:mt-3 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:font-semibold ' +
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-boss-primary [&_blockquote]:pl-3 [&_blockquote]:text-boss-text-secondary ' +
  '[&_a]:text-boss-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_code]:bg-boss-inset [&_code]:px-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:bg-boss-inset [&_pre]:p-3 ' +
  '[&_hr]:my-3 [&_hr]:border-boss-border [&_strong]:font-semibold';

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

  // 확인창 — 글 삭제 · 댓글 삭제
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentDeleteId, setCommentDeleteId] = useState<number | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);

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
      // 앱(bbs_comments_cntr.getReplyData)과 같은 파라미터로 부른다.
      //   - 글 ID 는 boardId 가 아니라 rootId 로 넘긴다. boardId 를 넘기면 백엔드가
      //     "그 글 한 건" 으로 좁혀 버리고, rootId 가 없으면 500(게시글 ID가 없습니다) 이 난다.
      //   - pageNum 은 0 부터다(백엔드 PageRequest.of).
      //   - 댓글은 SORT_NO 오름차순(ASC)이 대화 순서다.
      const res = await bossCommentApi.list({
        pageNum: 0,
        pageSize: 100,
        rootId: String(boardId),
        sortDesc: 'ASC',
      });
      if (res.success !== false && res.data) {
        // 배열이 아니라 Page 객체({content: [...]})로 온다
        const data = res.data as { content?: BbsData[] } | BbsData[];
        setComments(Array.isArray(data) ? data : (data.content ?? []));
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
    setDeleting(true);
    try {
      const res = await bossCommunityApi.remove(boardId);
      if (res.success !== false) {
        toast.success('삭제되었습니다.');
        markListDirty(LIST_KEYS.community, LIST_KEYS.communityJob);
        router.push('/boss/community');
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
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
      // 앱(bbs_comments_cntr.saveComment)과 같은 본문.
      //   최상위 댓글은 rootId = parentId = 글 ID, depthNo = '0'(백엔드가 +1 해서 1로 저장).
      //   rootId 가 없으면 백엔드가 NPE 로 500 을 낸다. 글 종류(typeCd/typeDtCd)는 원글을 따른다.
      const res = await bossCommentApi.create({
        contents: text,
        rootId: String(boardId),
        parentId: String(boardId),
        depthNo: '0',
        sortNo: '0',
        typeCd: post?.typeCd || 'BBS',
        typeDtCd: post?.typeDtCd || 'JOB',
      });
      if (res.success !== false) {
        setCommentInput('');
        markListDirty(LIST_KEYS.community, LIST_KEYS.communityJob); // 목록의 댓글 수가 바뀐다
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

  const onDeleteComment = async () => {
    const cBoardId = commentDeleteId;
    if (!cBoardId) return;
    setCommentDeleting(true);
    try {
      const res = await bossCommentApi.remove(cBoardId);
      if (res.success !== false) {
        markListDirty(LIST_KEYS.community, LIST_KEYS.communityJob);
        await loadComments();
      } else {
        toast.error(res.message || '삭제 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setCommentDeleting(false);
      setCommentDeleteId(null);
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
  const categoryTone: StatusTone = CATEGORY_TONE[post?.typeDtCd ?? ''] ?? 'neutral';
  const liked = post?.likeYn === 'Y';

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <AlertBanner
          tone="bad"
          action={
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => void loadDetail()}>
                다시 시도
              </Button>
              <ButtonLink href="/boss/community" variant="secondary" size="sm">
                목록으로
              </ButtonLink>
            </div>
          }
        >
          {error}
        </AlertBanner>
      )}

      {loading || !post ? (
        !error && (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[320px]" />
              <Skeleton className="h-[200px]" />
            </div>
            <Skeleton className="h-[260px]" />
          </div>
        )
      ) : (
        <>
        {/* 주요 행동은 화면 맨 위에 */}
        <DetailActions>
          {isMine ? (
            <>
              <ButtonLink href={`/boss/community/${boardId}/edit`} variant="secondary" size="sm" icon={Pencil}>
                수정
              </ButtonLink>
              <Button variant="secondary" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)} className="!text-boss-error">
                삭제
              </Button>
            </>
          ) : (
            <ButtonLink href={`/boss/community/${boardId}/report`} variant="secondary" size="sm">
              신고
            </ButtonLink>
          )}
          <ButtonLink href="/boss/community" variant="secondary" size="sm">
            목록
          </ButtonLink>
        </DetailActions>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ───── 좌: 본문 ───── */}
          <div className="flex min-w-0 flex-col gap-4">
            <ContentCard>
              <div className="border-b border-boss-border px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  {post.typeDtNm && <StatusPill tone={categoryTone}>{post.typeDtNm}</StatusPill>}
                  <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                    #{boardId}
                  </span>
                </div>
                <h2 className="mt-2 break-words font-boss-head text-[22px] font-semibold leading-tight tracking-[0.01em] text-boss-text">
                  {post.subject ?? '(제목 없음)'}
                </h2>
                <p className="mt-1.5 text-[12.5px] text-boss-text-secondary">
                  {displayName(post)}
                  <span className="mx-1.5 text-boss-text-ghost">·</span>
                  <span className="font-boss-head tabular-nums">{formatDate(post.crtDtm)}</span>
                </p>
              </div>

              <div className="px-5 py-5">
                {looksLikePlainText(post.contents) ? (
                  <div className="whitespace-pre-wrap text-[14px] leading-[1.7] text-boss-text">
                    {post.contents ?? ''}
                  </div>
                ) : (
                  <div
                    className={HTML_BODY_CLS}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contents) }}
                  />
                )}
              </div>

              {post.fileList && post.fileList.length > 0 && (
                <div className="border-t border-boss-border px-5 py-4">
                  <p className="boss-mono-label mb-2">첨부 {post.fileList.length}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {post.fileList.map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={f.id}
                        src={f.filePath ?? ''}
                        alt={f.fileNm ?? ''}
                        className="h-32 w-full border border-boss-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </ContentCard>

            {/* 구인구직 연락 요청 */}
            {isJobPost && !isMine && (
              <ContentCard>
                <CardHead title="작성자에게 연락 요청" meta="푸시 알림으로 전달됩니다" />
                <div className="px-5 py-4">
                  {!contactOpen ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[13px] text-boss-text-secondary">
                        버튼을 누르면 작성자에게 연락 요청 푸시가 갑니다. 연락처는 작성자가 직접
                        답할 때 공유됩니다.
                      </p>
                      <Button variant="primary" icon={Phone} onClick={() => setContactOpen(true)}>
                        연락 요청
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label htmlFor="contactMsg" className="boss-label">
                          전달할 메시지 (선택)
                        </label>
                        <textarea
                          id="contactMsg"
                          value={contactMsg}
                          onChange={(e) => setContactMsg(e.target.value)}
                          placeholder="예: 오전에 통화 가능합니다"
                          rows={3}
                          maxLength={200}
                          className="boss-input resize-none"
                        />
                        <p className="mt-1 text-right font-boss-head text-[11px] tabular-nums text-boss-text-muted">
                          {contactMsg.length} / 200
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" onClick={() => setContactOpen(false)}>
                          취소
                        </Button>
                        <Button variant="primary" onClick={onContactRequest} disabled={contactSending}>
                          {contactSending ? '전송 중…' : '보내기'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ContentCard>
            )}

            {/* 댓글 */}
            <ContentCard>
              <CardHead title="댓글" count={comments.length} countTone="muted" />
              <div className="flex items-start gap-2 border-b border-boss-border px-5 py-4">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글을 입력하세요"
                  rows={2}
                  aria-label="댓글 입력"
                  className="boss-input !min-h-[60px] flex-1 resize-none"
                  maxLength={1000}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={onSubmitComment}
                  disabled={submittingComment}
                  className="h-[60px]"
                >
                  {submittingComment ? '등록 중…' : '등록'}
                </Button>
              </div>

              {comments.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-boss-text-secondary">
                  아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.
                </p>
              ) : (
                <div>
                  {comments.map((c) => {
                    const cMine = !!(c.crtCustId && myUserId && c.crtCustId === myUserId);
                    return (
                      <div
                        key={c.boardId}
                        className="flex items-start gap-3 border-b border-boss-border-row px-5 py-3 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-boss-text-secondary">
                            <span className="font-semibold text-boss-text">{displayName(c)}</span>
                            <span className="mx-1.5 text-boss-text-ghost">·</span>
                            <span className="font-boss-head tabular-nums">{formatDate(c.crtDtm)}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.6] text-boss-text">
                            {c.contents ?? ''}
                          </p>
                        </div>
                        {cMine && (
                          <button
                            type="button"
                            onClick={() => setCommentDeleteId(c.boardId ?? null)}
                            className="boss-btn boss-btn-sm boss-btn-ghost -mr-2 !text-boss-text-muted hover:!text-boss-error"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ContentCard>
          </div>

          {/* ───── 우: 정보 · 관리 ───── */}
          <div className="flex flex-col gap-4">
            <Panel kicker="게시글" title="정보">
              <dl>
                <DescRow label="작성자" value={displayName(post)} />
                <DescRow
                  label="게시판"
                  value={post.typeDtNm ?? post.typeDtCd ?? '-'}
                />
                <DescRow
                  label="작성일"
                  value={<span className="font-boss-head tabular-nums">{formatDate(post.crtDtm)}</span>}
                />
                <DescRow
                  label="조회"
                  value={<span className="font-boss-head tabular-nums">{post.viewCnt ?? 0}</span>}
                />
                <DescRow
                  label="댓글"
                  value={<span className="font-boss-head tabular-nums">{comments.length}</span>}
                />
                <DescRow
                  label="좋아요"
                  value={<span className="font-boss-head tabular-nums">{post.likeCnt ?? 0}</span>}
                />
              </dl>
              <Button
                variant={liked ? 'primary' : 'secondary'}
                icon={Heart}
                onClick={onToggleLike}
                disabled={likePending}
                aria-pressed={liked}
                className="mt-4 w-full"
              >
                {liked ? '좋아요 취소' : '좋아요'}
              </Button>
            </Panel>

            <Panel kicker="관리" title={isMine ? '내 글' : '문제가 있는 글인가요?'}>
              {isMine ? (
                <div className="flex flex-col gap-2">
                  <ButtonLink
                    href={`/boss/community/${boardId}/edit`}
                    variant="secondary"
                    icon={Pencil}
                    className="w-full"
                  >
                    수정
                  </ButtonLink>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setDeleteOpen(true)}
                    className="w-full"
                  >
                    삭제
                  </Button>
                  <p className="text-[12px] leading-relaxed text-boss-text-secondary">
                    삭제한 글과 댓글은 되돌릴 수 없습니다.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <ButtonLink
                    href={`/boss/community/${boardId}/report`}
                    variant="secondary"
                    icon={Flag}
                    className="w-full"
                  >
                    신고
                  </ButtonLink>
                  <p className="text-[12px] leading-relaxed text-boss-text-secondary">
                    광고 · 욕설 · 개인정보 노출 등 규정 위반 글을 신고하면 운영팀이 확인합니다.
                  </p>
                </div>
              )}
            </Panel>
          </div>
        </div>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="이 글을 삭제할까요?"
        description="글과 달린 댓글이 함께 사라지며 되돌릴 수 없습니다."
        confirmLabel="삭제"
        loading={deleting}
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={commentDeleteId !== null}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        loading={commentDeleting}
        onConfirm={() => void onDeleteComment()}
        onCancel={() => setCommentDeleteId(null)}
      />
    </div>
  );
}
