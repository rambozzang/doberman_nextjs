'use client';

// 사장님 알림(Notifications) 상세 페이지
// Flutter 참조:
//   - lib/app/setting/noti_view_page.dart : BBS detail 호출
//   - lib/repo/bbs/bbs_repo.dart : detail / delete / viewCount
//
// 백엔드 알림은 BBS(`/bbs/...`) 의 typeCd='NOTI' 를 재사용한다.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BellRing,
  Megaphone,
  Sparkles,
  ArrowLeft,
  Trash2,
  Eye,
  Calendar,
  User,
  AlertCircle,
  Tag,
  Paperclip,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
} from '@/components/boss/ui';
import {
  bossNotificationsApi,
  bossNotificationsReadStore,
} from '@/lib/api/boss/notifications';
import type { BossNotificationItem } from '@/types/boss-notifications';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

const BREADCRUMBS = [
  { label: '알림', href: '/boss/notifications' },
  { label: '상세' },
];

const CATEGORY_META: Record<
  string,
  { label: string; tone: 'amber' | 'emerald' | 'sky'; Icon: LucideIcon }
> = {
  AD: { label: '광고', tone: 'amber', Icon: Megaphone },
  NOTI: { label: '공지', tone: 'emerald', Icon: BellRing },
  UPDATE: { label: '업데이트', tone: 'sky', Icon: Sparkles },
};

function categoryMeta(code?: string) {
  return CATEGORY_META[code ?? ''] ?? CATEGORY_META.NOTI;
}

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
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      const res = await bossNotificationsApi.remove(boardId);
      if (res.success !== false) {
        toast.success('알림이 삭제되었습니다.');
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
      <div className="space-y-5">
        <PageHeader title="알림 상세" breadcrumbs={BREADCRUMBS} />
        <Card className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  // 에러 / 미존재
  if (error || !item) {
    return (
      <div className="space-y-5">
        <PageHeader title="알림 상세" breadcrumbs={BREADCRUMBS} />
        <div className="flex items-start gap-2 rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error || '알림을 찾을 수 없습니다.'}</span>
        </div>
        <Link
          href="/boss/notifications"
          className="inline-flex items-center gap-1 text-sm text-boss-text-muted hover:text-boss-text"
        >
          <ArrowLeft size={14} /> 알림 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { Icon, tone, label } = categoryMeta(item.typeDtCd);
  const isHtml = hasHtml(item.contents);
  const author = authorName(item);

  return (
    <div className="space-y-5">
      <PageHeader
        title="알림 상세"
        description="공지·광고·업데이트 알림의 상세 내용을 확인하세요."
        breadcrumbs={BREADCRUMBS}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => router.push('/boss/notifications')}
            >
              목록
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        }
      />

      {/* 개요 카드 */}
      <Card className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tone}>
              <Icon size={11} />
              {label}
            </Badge>
            {typeof item.boardId === 'number' && (
              <span className="text-xs text-boss-text-muted">#{item.boardId}</span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-boss-text">
            {item.subject ?? '(제목 없음)'}
          </h2>
          <p className="mt-1 text-sm text-boss-text-muted">
            등록일: {formatDate(item.crtDtm)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-xs text-boss-text-muted">조회수</p>
            <p className="font-semibold text-boss-text">{item.viewCnt ?? 0}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 상세 정보 */}
        <Section title="상세 정보" icon={Tag}>
          <Info label="유형" value={label} icon={Tag} />
          <Info label="작성자" value={author} icon={User} />
          <Info label="등록일" value={formatDate(item.crtDtm)} icon={Calendar} />
          <Info label="조회수" value={item.viewCnt ?? 0} icon={Eye} />
          {item.fileCnt ? (
            <Info label="첨부파일" value={`${item.fileCnt}개`} icon={Paperclip} />
          ) : null}
        </Section>

        {/* 본문 */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-boss-text">
            <FileText size={15} className="text-boss-primary" />
            본문
          </h3>
          {isHtml ? (
            <div
              className="prose prose-invert max-w-none text-sm leading-relaxed text-boss-text"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.contents) }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-boss-text-secondary">
              {item.contents ?? '내용이 없습니다.'}
            </p>
          )}

          {item.filePath && (
            <div className="mt-4 border-t border-boss-border pt-4">
              <a href={item.filePath} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  첨부파일 보기
                </Button>
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
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

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon: LucideIcon;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="mt-0.5 text-boss-text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-boss-text-muted">{label}</p>
        <p className="text-boss-text">{value}</p>
      </div>
    </div>
  );
}
