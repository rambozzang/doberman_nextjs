'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, RefreshCw } from 'lucide-react';
import { AlertBanner, Button, ButtonLink, EmptyState, Pagination, Skeleton } from '@/components/boss/ui';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import { getPublishedNotice, listPublishedNotices, NoticeReadError, type PublishedNotice, type PublishedNoticePage } from '@/lib/api/boss/notices';

function dateLabel(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10).replaceAll('-', '.') : '날짜 미등록';
}

function ReadFailure({ missing, retry }: { missing?: boolean; retry: () => void }) {
  return missing ? (
    <EmptyState title="게시가 종료되었거나 없는 공지사항입니다" action={<ButtonLink href="/boss/notices">공지사항 목록</ButtonLink>} />
  ) : (
    <AlertBanner action={<Button onClick={retry}>다시 확인</Button>}>공지사항을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</AlertBanner>
  );
}

/** 계정이 바뀌면 목록·본문을 바로 내려 이전 계정 응답을 쓰지 않는다. 공지는 공개된 항목만 읽는다. */
export default function PublicNotices({ id }: { id?: number }) {
  const scope = useBossScope();
  if (!scope) return <Skeleton className="h-48" />;
  return id == null ? <NoticeList key={scope} scope={scope} /> : <NoticeDetail key={`${scope}:${id}`} scope={scope} id={id} />;
}

function NoticeList({ scope }: { scope: string }) {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<PublishedNoticePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    setFailed(false);
    setData(null);
    listPublishedNotices(page, controller.signal)
      .then((value) => { if (alive && isCurrentScope(scope)) setData(value); })
      .catch(() => { if (alive && isCurrentScope(scope)) setFailed(true); })
      .finally(() => { if (alive && isCurrentScope(scope)) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [scope, page, revision]);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] leading-relaxed text-boss-text-secondary">도배르만의 새 소식과 이용 안내를 확인하세요.</p>
        <Button size="sm" icon={RefreshCw} disabled={loading} onClick={() => setRevision((n) => n + 1)}>새로고침</Button>
      </div>
      {loading ? <Skeleton className="h-48" /> : failed ? <ReadFailure retry={() => setRevision((n) => n + 1)} /> : data && (
        <>
          <section className="boss-card" aria-label="공지사항 목록">
            {data.items.length === 0 ? (
              <EmptyState icon={Megaphone} title="등록된 공지사항이 없습니다" description="새로운 소식이 올라오면 이곳에서 확인할 수 있어요." />
            ) : (
              <ul>
                {data.items.map((item) => (
                  <li key={item.id} className="border-b border-boss-border-row last:border-b-0">
                    <Link href={`/boss/notices/${item.id}`} className="flex min-w-0 items-center gap-4 px-5 py-4 transition-colors hover:bg-boss-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-boss-primary">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[15px] font-semibold leading-relaxed text-boss-text">{item.title}</p>
                        <time dateTime={item.createdAt ?? undefined} className="mt-1 block text-[12px] text-boss-text-secondary">{dateLabel(item.createdAt)}</time>
                      </div>
                      <ChevronRight aria-hidden size={18} className="flex-none text-boss-text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {data.totalElements > data.size && <Pagination page={page + 1} totalPages={Math.ceil(data.totalElements / data.size)} onChange={(p) => setPage(p - 1)} />}
        </>
      )}
    </div>
  );
}

function NoticeDetail({ scope, id }: { scope: string; id: number }) {
  const [data, setData] = useState<PublishedNotice | null>(null);
  const [failure, setFailure] = useState<'missing' | 'unavailable' | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    setData(null);
    setFailure(null);
    getPublishedNotice(id, controller.signal)
      .then((value) => { if (alive && isCurrentScope(scope)) setData(value); })
      .catch((error: unknown) => { if (alive && isCurrentScope(scope)) setFailure(error instanceof NoticeReadError ? error.kind : 'unavailable'); })
      .finally(() => { if (alive && isCurrentScope(scope)) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [scope, id, revision]);
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div><ButtonLink href="/boss/notices" size="sm">공지사항 목록</ButtonLink></div>
      {loading ? <Skeleton className="h-64" /> : failure ? <ReadFailure missing={failure === 'missing'} retry={() => setRevision((n) => n + 1)} /> : data && (
        <article className="boss-card p-5 sm:p-6">
          <h2 className="break-words text-[20px] font-semibold leading-relaxed text-boss-text sm:text-[22px]">{data.title}</h2>
          <time dateTime={data.createdAt ?? undefined} className="mt-2 block text-[12px] text-boss-text-secondary">{dateLabel(data.createdAt)}</time>
          <div className="mt-5 whitespace-pre-wrap break-words border-t border-boss-border pt-5 text-[15px] leading-[1.85] text-boss-text-soft">{data.content}</div>
        </article>
      )}
    </div>
  );
}
