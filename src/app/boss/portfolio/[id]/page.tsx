'use client';

// 사장님 포트폴리오 상세 — 컴팩트 B2B 레이아웃
// - 공개/비공개 토글 (PUT /portfolios/{id}/toggle-public)
// - 삭제 (DELETE /portfolios/{id})
// - 시공 전/후 이미지 그리드, 외부 링크
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossPortfolioItem, PortfolioExternalLink } from '@/types/boss-portfolio';
import { PageHeader, Card, Button, Badge, EmptyState, ListTabs } from '@/components/boss/ui';
import {
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  MapPin,
  Ruler,
  Calendar,
  Clock,
  Wallet,
  Building2,
  Layers,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react';

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
      } else {
        toast.error(res.message || '상태 변경에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?\n삭제된 포트폴리오는 복구할 수 없습니다.')) {
      return;
    }
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="포트폴리오 상세"
        breadcrumbs={[{ label: '포트폴리오', href: '/boss/portfolio' }, { label: '상세' }]}
        actions={
          item ? (
            <>
              <Button variant="secondary" onClick={handleToggle} disabled={toggling}>
                {toggling ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isPublic ? (
                  <EyeOff size={13} />
                ) : (
                  <Eye size={13} />
                )}
                {isPublic ? '비공개로 전환' : '공개로 전환'}
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                삭제
              </Button>
              <Link href="/boss/portfolio/new">
                <Button variant="ghost" icon={Pencil}>
                  새 등록
                </Button>
              </Link>
            </>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex h-40 items-center justify-center text-boss-text-muted">
            <Loader2 size={18} className="mr-2 animate-spin" /> 불러오는 중...
          </div>
        </Card>
      ) : item ? (
        <>
          {/* 개요 카드 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={isPublic ? 'emerald' : 'default'}>
                  {isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
                  {isPublic ? '공개' : '비공개'}
                </Badge>
                {item.buildingType && <Badge tone="sky">{item.buildingType}</Badge>}
                <span className="text-xs text-boss-text-muted">#{item.id}</span>
              </div>
              <h2 className="text-lg font-semibold text-boss-text">{item.title}</h2>
              <p className="mt-1 text-sm text-boss-text-muted">
                작성일: {item.createdAt ? formatDate(item.createdAt) : '-'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">면적</p>
                <p className="font-semibold text-boss-text">
                  {item.area != null ? `${Math.round(item.area)}평` : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">비용</p>
                <p className="font-semibold text-boss-text">
                  {item.cost != null ? moneyFormat(item.cost) : '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* 정보 */}
          <Section title="정보" icon={FileText}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Info label="카테고리" value={item.buildingType} icon={Building2} />
              <Info label="지역" value={item.region} icon={MapPin} />
              <Info
                label="면적"
                value={item.area != null ? `${Math.round(item.area)}평` : undefined}
                icon={Ruler}
              />
              <Info label="벽지" value={item.wallpaperType} icon={Layers} />
              <Info
                label="비용"
                value={item.cost != null ? moneyFormat(item.cost) : undefined}
                icon={Wallet}
              />
              <Info
                label="작업일"
                value={item.workDate ? formatDate(item.workDate) : undefined}
                icon={Calendar}
              />
              <Info
                label="작성일"
                value={item.createdAt ? formatDate(item.createdAt) : undefined}
                icon={Clock}
              />
              <Info label="공개여부" value={isPublic ? '공개' : '비공개'} icon={isPublic ? Eye : EyeOff} />
            </div>
            {item.description && (
              <div className="border-t border-boss-border pt-3">
                <p className="mb-1 text-xs text-boss-text-muted">설명</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-boss-text-secondary">
                  {item.description}
                </p>
              </div>
            )}
          </Section>

          {/* 사진 */}
          <Section title="사진" icon={ImageIcon}>
            <ListTabs
              tabs={[
                { key: 'after', label: '시공 후', count: after.length },
                { key: 'before', label: '시공 전', count: before.length },
              ]}
              active={tab}
              onChange={setTab}
            />
            {images.length === 0 ? (
              <EmptyState icon={ImageIcon} title="등록된 사진이 없습니다" />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {images.map((src, idx) => (
                  <a
                    key={`${src}-${idx}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-boss-border bg-boss-bg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${tab}-${idx}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            )}
          </Section>

          {/* 외부 링크 */}
          {links.length > 0 && (
            <Section title={`외부 링크 (${links.length})`} icon={ExternalLink}>
              <ul className="space-y-2">
                {links.map((link, idx) => (
                  <li key={`${link.url}-${idx}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-boss-border bg-boss-elevated/30 p-3 transition-colors hover:border-boss-border-strong"
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-boss-elevated text-boss-text-muted">
                        {link.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={link.thumbnailUrl} alt="thumb" className="h-full w-full object-cover" />
                        ) : (
                          <ExternalLink size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-boss-text">
                          {link.title || '외부 링크'}
                        </p>
                        <p className="line-clamp-1 text-xs text-boss-text-muted">{link.url}</p>
                      </div>
                      <ExternalLink size={14} className="text-boss-text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      ) : (
        !error && (
          <Card>
            <EmptyState
              icon={ImageIcon}
              title="포트폴리오를 찾을 수 없습니다"
              description="삭제되었거나 접근 권한이 없는 포트폴리오입니다."
              action={
                <Link href="/boss/portfolio">
                  <Button variant="primary" size="sm">
                    목록으로
                  </Button>
                </Link>
              }
            />
          </Card>
        )
      )}
    </div>
  );
}

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

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon: React.ElementType;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="mt-0.5 text-boss-text-muted" />
      <div className="min-w-0">
        <p className="text-xs text-boss-text-muted">{label}</p>
        <p className="truncate text-boss-text">{value}</p>
      </div>
    </div>
  );
}
