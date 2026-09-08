'use client';

// 사장님 포트폴리오 상세 — Industry 패턴
// - 공개/비공개 토글 (PUT /portfolios/{id}/toggle-public)
// - 삭제 (DELETE /portfolios/{id}) — 되돌릴 수 없으므로 ConfirmDialog 를 거친다
//
// 좌 본문(사진 · 설명 · 외부 링크 패널) + 우 요약 패널(DescRow + 액션) 2열.
// 화면 제목은 셸 헤더(← 포트폴리오)가 그리므로 본문에는 사례 제목만 둔다.

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem, PortfolioExternalLink } from '@/types/boss-portfolio';
import {
  AlertBanner,
  Button,
  ButtonLink,
  ConfirmDialog,
  DescRow,
  EmptyState,
  ListTabs,
  Panel,
  Skeleton,
  StatusPill,
  TagPill,
  DetailActions,
} from '@/components/boss/ui';
import { Eye, EyeOff, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react';

function normalizeIsPublic(v: BossPortfolioItem['isPublic']): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toUpperCase() === 'Y';
  return true;
}

function splitImages(item: BossPortfolioItem): { before: string[]; after: string[] } {
  if (item.images && item.images.length > 0) {
    const sorted = [...item.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return {
      before: sorted.filter((i) => i.imageType === 'BEFORE').map((i) => i.filePath),
      after: sorted.filter((i) => i.imageType === 'AFTER').map((i) => i.filePath),
    };
  }
  return {
    before: item.beforeImages ?? [],
    after: item.afterImages ?? [],
  };
}

function moneyFormat(n?: number | null): string {
  if (n == null) return '-';
  return n.toLocaleString('ko-KR') + '원';
}

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR');
}

type Tab = 'before' | 'after';

export default function BossPortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [item, setItem] = useState<BossPortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('after');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bossPortfolioApi.detail(custId, id);
        if (cancelled) return;
        if (res.success && res.data) {
          setItem(res.data);
        } else {
          setError(res.message || '포트폴리오를 찾을 수 없습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 포트폴리오를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isPublic = item ? normalizeIsPublic(item.isPublic) : true;
  const { before, after } = useMemo(
    () => (item ? splitImages(item) : { before: [], after: [] }),
    [item],
  );
  const links: PortfolioExternalLink[] = useMemo(
    () => item?.links ?? item?.externalLinks ?? [],
    [item],
  );

  const handleToggle = async () => {
    if (!item) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setToggling(true);
    try {
      const res = await bossPortfolioApi.togglePublic(item.id, custId);
      if (res.success) {
        setItem({ ...item, isPublic: !isPublic });
        toast.success(!isPublic ? '공개로 전환되었습니다' : '비공개로 전환되었습니다');
        markListDirty(LIST_KEYS.portfolio);
      } else {
        toast.error(res.message || '상태 변경에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setToggling(false);
    }
  };

  // 확인은 ConfirmDialog 가 맡는다 — 여기서는 확정된 뒤의 처리만
  const handleDelete = async () => {
    if (!item) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossPortfolioApi.remove(item.id, custId);
      if (res.success) {
        toast.success('포트폴리오가 삭제되었습니다');
        markListDirty(LIST_KEYS.portfolio);
        router.push('/boss/portfolio');
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const images = tab === 'before' ? before : after;

  if (loading) {
    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="boss-card p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="boss-card p-5">
          <Skeleton className="h-5 w-3/4" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AlertBanner
        tone="bad"
        action={
          <ButtonLink href="/boss/portfolio" variant="secondary" size="sm">
            목록으로
          </ButtonLink>
        }
      >
        {error}
      </AlertBanner>
    );
  }

  if (!item) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="포트폴리오를 찾을 수 없습니다"
        description="삭제되었거나 접근 권한이 없는 사례입니다."
        action={
          <ButtonLink href="/boss/portfolio" variant="primary" size="sm">
            목록으로
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* 주요 행동은 화면 맨 위에 */}
      <div className="lg:col-span-2">
        <DetailActions>
          <ButtonLink href={`/boss/portfolio/new?edit=${item.id}`} variant="primary" size="sm">
            수정
          </ButtonLink>
          <Button
            variant="secondary"
            size="sm"
            icon={isPublic ? EyeOff : Eye}
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? '전환 중…' : isPublic ? '비공개로' : '공개로'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="!text-boss-error"
          >
            삭제
          </Button>
        </DetailActions>
      </div>
      {/* ── 좌: 본문 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel
          kicker="사진"
          title={tab === 'after' ? '시공 후' : '시공 전'}
          right={
            <ListTabs
              tabs={[
                { key: 'after', label: '시공 후', count: after.length },
                { key: 'before', label: '시공 전', count: before.length },
              ]}
              active={tab}
              onChange={setTab}
            />
          }
        >
          {images.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-boss-text-secondary">
              {tab === 'after' ? '시공 후' : '시공 전'} 사진이 없습니다.
              {tab === 'after' && before.length > 0 && ' 시공 전 탭을 확인해 보세요.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {images.map((src, idx) => (
                <a
                  key={`${src}-${idx}`}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="boss-placeholder relative block aspect-square overflow-hidden border border-boss-border transition-colors duration-[120ms] ease-out hover:border-boss-border-hover"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${tab === 'after' ? '시공 후' : '시공 전'} ${idx + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-boss-text/75 px-1 py-px font-boss-head text-[10px] tabular-nums text-boss-bg">
                    {idx + 1}
                  </span>
                </a>
              ))}
            </div>
          )}
        </Panel>

        <Panel kicker="설명" title="시공 내용">
          {item.description ? (
            <p className="whitespace-pre-line text-[14px] leading-[1.7] text-boss-text-body">
              {item.description}
            </p>
          ) : (
            <p className="text-[13px] text-boss-text-secondary">작성한 설명이 없습니다.</p>
          )}
        </Panel>

        {links.length > 0 && (
          <div className="boss-card-content">
            <div className="boss-card-head">
              <h3 className="boss-section-title">외부 링크</h3>
              <div className="min-w-0 flex-1" />
              <span className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-text-muted">
                {links.length}건
              </span>
            </div>
            <ul>
              {links.map((link, idx) => (
                <li key={`${link.url}-${idx}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="boss-row boss-row-hover flex items-center gap-3 !text-boss-text hover:!text-boss-text"
                  >
                    <span className="boss-placeholder flex h-10 w-10 flex-none items-center justify-center overflow-hidden border border-boss-border text-boss-text-muted">
                      {link.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={link.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ExternalLink size={14} strokeWidth={1.5} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">
                        {link.title || '외부 링크'}
                      </span>
                      <span className="block truncate text-[12px] text-boss-text-muted">{link.url}</span>
                    </span>
                    <ExternalLink size={13} className="flex-none text-boss-text-ghost" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── 우: 요약 + 액션 ── */}
      <aside className="flex min-w-0 flex-col gap-4">
        <div className="boss-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="boss-kicker">사례 #{item.id}</p>
              <h2 className="boss-section-title mt-0.5 break-keep">{item.title || '제목 없음'}</h2>
            </div>
            <StatusPill tone={isPublic ? 'ok' : 'neutral'}>{isPublic ? '공개' : '비공개'}</StatusPill>
          </div>

          {(item.buildingType || item.wallpaperType) && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {item.buildingType && <TagPill>{item.buildingType}</TagPill>}
              {item.wallpaperType && <TagPill>{item.wallpaperType}</TagPill>}
            </div>
          )}

          <dl className="mt-3 border-t border-boss-border pt-1">
            <DescRow label="지역" value={item.region ?? '-'} />
            <DescRow
              label="면적"
              value={
                item.area != null ? (
                  <span className="font-boss-head tabular-nums">{Math.round(item.area)}평</span>
                ) : (
                  '-'
                )
              }
            />
            <DescRow
              label="시공 비용"
              value={<span className="font-boss-head tabular-nums">{moneyFormat(item.cost)}</span>}
            />
            <DescRow
              label="시공일"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.workDate)}</span>}
            />
            <DescRow
              label="등록일"
              value={<span className="font-boss-head tabular-nums">{formatDate(item.createdAt)}</span>}
            />
            <DescRow
              label="사진"
              value={
                <span className="font-boss-head tabular-nums">
                  전 {before.length} · 후 {after.length}
                </span>
              }
            />
          </dl>

          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            {isPublic
              ? '고객 검색 결과에 노출되고 있습니다.'
              : '비공개 상태라 고객에게 보이지 않습니다.'}
          </p>

          <div className="mt-4 flex flex-col gap-2 border-t border-boss-border pt-4">
            <Button
              variant="secondary"
              icon={isPublic ? EyeOff : Eye}
              onClick={handleToggle}
              disabled={toggling}
              className="w-full"
            >
              {toggling ? '전환 중…' : isPublic ? '비공개로 전환' : '공개로 전환'}
            </Button>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="w-full !text-boss-error"
            >
              {deleting ? '삭제 중…' : '사례 삭제'}
            </Button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="포트폴리오 삭제"
        description={`'${item.title || '이 사례'}'을(를) 삭제합니다. 삭제된 사례는 복구할 수 없습니다.`}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
