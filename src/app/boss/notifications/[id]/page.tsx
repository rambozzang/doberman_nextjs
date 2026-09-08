'use client';

// 사장님 알림 상세 — Industry 패턴 (agent.opentohome.com)
// Flutter 참조:
//   - lib/app/setting/noti_view_page.dart : BBS detail 호출
//   - lib/repo/bbs/bbs_repo.dart : detail / delete / viewCount
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용한다.
//
//   좌 본문 패널 : kicker(유형) + 제목 + 본문(HTML 은 sanitize 후 렌더) + 첨부 링크
//   우 요약 패널 : DescRow(유형 · 작성자 · 등록일 · 조회수 · 첨부) + 액션(목록 · 삭제)
//   삭제는 ConfirmDialog. 첫 조회 실패는 AlertBanner + 목록으로.
//
// 화면 제목("알림")과 ← 알림 링크는 셸 헤더(PAGE_META)가 그린다.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, ExternalLink } from 'lucide-react';
import {
  Panel,
  Button,
  ButtonLink,
  Tag,
  Skeleton,
  DescRow,
  AlertBanner,
  ConfirmDialog,
  type StatusTone,
} from '@/components/boss/ui';
import {
  bossNotificationsApi,
  bossNotificationsReadStore,
} from '@/lib/api/boss/notifications';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import type { BossNotificationItem } from '@/types/boss-notifications';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

const CATEGORY_META: Record<string, { label: string; tone: StatusTone }> = {
  AD: { label: '광고', tone: 'warn' },
  NOTI: { label: '공지', tone: 'ok' },
  UPDATE: { label: '업데이트', tone: 'info' },
};

function categoryMeta(code?: string) {
  return CATEGORY_META[code ?? ''] ?? CATEGORY_META.NOTI;
}

// 서버 HTML 본문 — typography 플러그인이 없으므로 필요한 요소만 직접 조판한다
const HTML_BODY_CLS =
  'text-[13.5px] leading-[1.75] text-boss-text [&_p]:my-2 [&_a]:text-boss-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_h1]:mt-4 [&_h1]:text-[18px] [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-[14.5px] [&_h3]:font-semibold ' +
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-boss-primary [&_blockquote]:pl-3 [&_blockquote]:text-boss-text-secondary ' +
  '[&_img]:my-2 [&_img]:max-w-full [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-boss-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-boss-border [&_th]:bg-boss-inset [&_th]:px-2 [&_th]:py-1';

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hasHtml(input?: string): boolean {
  return /<[^>]+>/.test(input ?? '');
}

function authorName(item: BossNotificationItem): string | undefined {
  if (item.userNm && item.nickNm) return `${item.userNm} (${item.nickNm})`;
  return item.userNm || item.nickNm || undefined;
}

export default function BossNotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id;
  const boardId = rawId ? Number(rawId) : NaN;

  const [item, setItem] = useState<BossNotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (Number.isNaN(boardId)) {
      setError('잘못된 알림 ID입니다.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      // 로컬 + 서버 읽음 처리
      bossNotificationsReadStore.markRead(boardId);
      bossNotificationsApi.markRead(boardId).catch(() => {});

      try {
        const res = await bossNotificationsApi.detail(boardId);
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setItem(res.data);
        } else {
          setError(res.message || '알림을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) {
          setError('네트워크 오류로 알림을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const handleDelete = async () => {
    if (Number.isNaN(boardId)) return;

    setDeleting(true);
    try {
      const res = await bossNotificationsApi.remove(boardId);
      if (res.success !== false) {
        toast.success('알림이 삭제되었습니다.');
        markListDirty(LIST_KEYS.notifications);
        router.push('/boss/notifications');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  // 로딩
  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-6 w-2/3" />
          <Skeleton className="mt-5 h-32 w-full" />
        </Panel>
        <Panel>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/3" />
        </Panel>
      </div>
    );
  }

  // 에러 / 미존재
  if (error || !item) {
    return (
      <div className="flex flex-col gap-4">
        <AlertBanner
          tone="bad"
          action={
            <ButtonLink href="/boss/notifications" variant="secondary" size="sm">
              알림 목록으로
            </ButtonLink>
          }
        >
          {error || '알림을 찾을 수 없습니다. 이미 삭제됐거나 주소가 잘못됐을 수 있습니다.'}
        </AlertBanner>
      </div>
    );
  }

  const { tone, label } = categoryMeta(item.typeDtCd);
  const isHtml = hasHtml(item.contents);
  const author = authorName(item);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* 본문 패널 */}
      <Panel kicker={label} title={item.subject ?? '(제목 없음)'}>
        <p className="mb-4 font-boss-head text-[12.5px] tabular-nums text-boss-text-muted">
          {formatDate(item.crtDtm)}
          {author ? ` · ${author}` : ''}
        </p>
        {isHtml ? (
          <div
            className={HTML_BODY_CLS}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.contents) }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-boss-text">
            {item.contents ?? '내용이 없습니다.'}
          </p>
        )}

        {item.filePath && (
          <div className="mt-5 border-t border-boss-border pt-4">
            <a
              href={item.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="boss-btn boss-btn-sm boss-btn-secondary"
            >
              <ExternalLink size={13} strokeWidth={1.75} /> 첨부파일 보기
            </a>
          </div>
        )}
      </Panel>

      {/* 요약 패널 */}
      <Panel kicker="요약" title="알림 정보">
        <dl>
          <DescRow label="유형" value={<Tag tone={tone}>{label}</Tag>} />
          {author && <DescRow label="작성자" value={author} />}
          <DescRow
            label="등록일"
            value={<span className="font-boss-head tabular-nums">{formatDate(item.crtDtm)}</span>}
          />
          <DescRow
            label="조회수"
            value={<span className="font-boss-head tabular-nums">{item.viewCnt ?? 0}</span>}
          />
          {item.fileCnt ? (
            <DescRow
              label="첨부"
              value={<span className="font-boss-head tabular-nums">{item.fileCnt}개</span>}
            />
          ) : null}
          {typeof item.boardId === 'number' && (
            <DescRow
              label="번호"
              value={<span className="font-boss-head tabular-nums">#{item.boardId}</span>}
            />
          )}
        </dl>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-boss-border pt-4">
          <ButtonLink href="/boss/notifications" variant="secondary" size="sm">
            목록
          </ButtonLink>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="!text-boss-text-muted hover:!text-boss-error"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            삭제
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="이 알림을 삭제할까요?"
        description={`'${item.subject ?? '(제목 없음)'}' — 삭제한 알림은 되돌릴 수 없습니다.`}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
