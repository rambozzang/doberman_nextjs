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

const CATEGORY_META: Record<
  string,
  { label: string; tone: 'amber' | 'emerald' | 'sky'; Icon: LucideIcon; iconClass: string }
> = {
  AD: {
    label: '광고',
    tone: 'amber',
    Icon: Megaphone,
    iconClass:
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  NOTI: {
    label: '공지',
    tone: 'emerald',
    Icon: BellRing,
    iconClass:
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  UPDATE: {
    label: '업데이트',
    tone: 'sky',
    Icon: Sparkles,
    iconClass:
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
};

function categoryMeta(code?: string) {
  return CATEGORY_META[code ?? ''] ?? CATEGORY_META.NOTI;
}

function formatDateTime(input?: string): string {
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

function authorName(item: BossNotificationItem): string {
  if (item.userNm && item.nickNm) return `${item.userNm} (${item.nickNm})`;
  return item.userNm || item.nickNm || '-';
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

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="알림 상세"
          breadcrumbs={[
            { label: '알림', href: '/boss/notifications' },
            { label: '상세' },
          ]}
        />
        <Card className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="알림 상세"
          breadcrumbs={[
            { label: '알림', href: '/boss/notifications' },
            { label: '상세' },
          ]}
        />
        <div className="flex items-start gap-2 rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error || '알림을 찾을 수 없습니다.'}</span>
        </div>
        <Link
          href="/boss/notifications"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 알림 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { Icon, tone, label, iconClass } = categoryMeta(item.typeDtCd);
  const isHtml = hasHtml(item.contents);

  return (
    <div className="space-y-5">
      <PageHeader
        title="알림 상세"
        description="공지·광고·업데이트 알림의 상세 내용을 확인하세요."
        breadcrumbs={[
          { label: '알림', href: '/boss/notifications' },
          { label: '상세' },
        ]}
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

      {/* 헤더 정보 카드 */}
      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={iconClass}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={tone}>{label}</Badge>
            </div>
            <h1 className="text-xl font-bold text-white md:text-2xl">
              {item.subject ?? '(제목 없음)'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <User size={14} className="text-slate-500" />
                {authorName(item)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                {formatDateTime(item.crtDtm)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={14} className="text-slate-500" />
                {item.viewCnt ?? 0}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 본문 */}
      {isHtml ? (
        <Card>
          <div
            className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200"
            dangerouslySetInnerHTML={{ __html: item.contents ?? '' }}
          />
        </Card>
      ) : (
        <Card>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {item.contents ?? '내용이 없습니다.'}
          </p>
        </Card>
      )}
    </div>
  );
}
