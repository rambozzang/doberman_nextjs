'use client';

// 사장님 이벤트 / 프로모션 목록
// Flutter 원본: lib/app/alert/ad_page.dart, lib/app/setting/noti_page.dart (typeDtCd='AD')
// bossNotificationsApi.list 를 typeDtCd='AD' 로 호출하여 이벤트 카테고리만 노출.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { bossNotificationsApi } from '@/lib/api/boss/notifications';
import type {
  BossNotificationItem,
  BossNotificationListResponse,
} from '@/types/boss-notifications';

function pickList(
  data: BossNotificationListResponse | BossNotificationItem[] | undefined,
): BossNotificationItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list ?? data.content ?? [];
}

function formatDate(s?: string): string {
  if (!s) return '';
  // 'YYYY-MM-DD HH:mm:ss' / 'YYYYMMDD...' 등 다양한 포맷 지원
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s;
}

export default function BossEventsPage() {
  const [items, setItems] = useState<BossNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossNotificationsApi.list({
          typeCd: 'NOTI',
          typeDtCd: 'AD',
          pageNum: 0,
          pageSize: 30,
          sortDesc: 'crtDtm',
        });
        if (!alive) return;
        if (res.success) {
          setItems(pickList(res.data));
        } else {
          setError(res.message ?? '이벤트를 불러오지 못했습니다.');
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '이벤트를 불러오지 못했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/boss"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 홈
        </Link>
        <h1 className="text-xl font-bold text-white">이벤트</h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-white">진행 중인 이벤트</h2>
            <p className="mt-1 text-sm text-slate-300">
              도베르만이 준비한 다양한 프로모션과 이벤트를 확인해보세요.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> 이벤트를 불러오는 중...
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <Sparkles size={32} className="mx-auto text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">진행 중인 이벤트가 없습니다.</p>
          <p className="mt-1 text-xs text-slate-500">새로운 이벤트가 등록되면 알려드릴게요.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.boardId ?? item.subject}>
              <Link
                href={`/boss/notifications/${item.boardId ?? ''}`}
                className="group block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <Sparkles size={10} /> EVENT
                    </div>
                    <h3 className="mt-2 truncate text-sm font-bold text-white">
                      {item.subject ?? '제목 없음'}
                    </h3>
                    {item.contents && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {item.contents.replace(/<[^>]+>/g, '')}
                      </p>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar size={11} />
                      {formatDate(item.crtDtm)}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
