'use client';

// 사장님 커뮤니티 내 글 목록
// Flutter `bbs_my_list_page.dart` 를 Next.js 로 포팅.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BbsData, BbsListResponse } from '@/types/boss-community';
import { ArrowLeft, Eye, Heart, MessageCircle, Inbox } from 'lucide-react';

const PAGE_SIZE = 20;

function pickList(payload: BbsListResponse | BbsData[] | undefined): BbsData[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.list ?? payload.content ?? [];
}

function relativeTime(input?: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

export default function BossCommunityMyPage() {
  const [items, setItems] = useState<BbsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = BossAuthManager.getUserInfo();
        const userId = me?.userId ?? '';
        if (!userId) {
          if (!cancelled) setError('로그인이 필요합니다.');
          return;
        }
        const res = await bossCommunityApi.list({
          pageNum: 1,
          pageSize: PAGE_SIZE,
          searchCustId: userId,
          sortDesc: 'crtDtm',
        });
        if (cancelled) return;
        if (res.success !== false && res.data) {
          setItems(pickList(res.data));
        } else {
          setError(res.message || '내 글을 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 내 글을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/community"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록으로
        </Link>
        <h1 className="text-xl font-bold text-white">내가 쓴 글</h1>
        <div className="w-20" />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">아직 작성한 글이 없습니다</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
          {items.map((item) => (
            <li key={item.boardId}>
              <Link
                href={`/boss/community/${item.boardId}`}
                className="block p-4 transition-colors hover:bg-slate-800/40"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  {item.typeDtNm && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {item.typeDtNm}
                    </span>
                  )}
                  <span>{relativeTime(item.crtDtm)}</span>
                </div>
                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-white">
                  {item.subject ?? '(제목 없음)'}
                </h3>
                <p className="mb-2 line-clamp-2 text-xs text-slate-400">{item.contents ?? ''}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={11} /> {item.viewCnt ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart size={11} /> {item.likeCnt ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={11} /> {item.replyCnt ?? 0}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
