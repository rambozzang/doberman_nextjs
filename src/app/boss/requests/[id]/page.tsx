'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import type { BossRequestDetail, BossRequestAnswer } from '@/types/boss';
import BossPageHeader from '@/components/boss/BossPageHeader';
import { Card, Button, Badge, EmptyState } from '@/components/boss/ui';
import {
  ArrowLeft,
  Edit3,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  Ruler,
  DoorOpen,
  Wallpaper,
  Square,
  FileText,
  CheckCircle,
  MessageSquare,
  Clock,
  Hash,
} from 'lucide-react';

export default function BossRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [data, setData] = useState<BossRequestDetail | null>(null);
  const [answers, setAnswers] = useState<BossRequestAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [detailRes, answerRes] = await Promise.all([
          bossRequestsApi.detail(id),
          bossRequestsApi.answers(id).catch(() => null),
        ]);
        if (cancelled) return;
        if (detailRes.success && detailRes.data) {
          setData(detailRes.data);
        } else {
          setError(detailRes.message || '상세를 불러오지 못했습니다.');
        }
        if (answerRes?.success && Array.isArray(answerRes.data)) {
          setAnswers(answerRes.data);
        }
      } catch {
        if (!cancelled) setError('네트워크 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const statusBadge = (status?: string) => {
    const s = (status ?? '').toUpperCase();
    if (s.includes('DONE') || s.includes('완료') || s.includes('채택')) return { tone: 'emerald' as const, label: '채택완료' };
    if (s.includes('PROGRESS') || s.includes('진행')) return { tone: 'sky' as const, label: '검토중' };
    if (s.includes('CANCEL') || s.includes('취소')) return { tone: 'rose' as const, label: '취소' };
    return { tone: 'default' as const, label: status || '접수' };
  };

  const badge = statusBadge(data?.status);

  return (
    <div className="space-y-5">
      <BossPageHeader
        title={`견적 요청 상세`}
        backHref="/boss/requests"
        actions={
          <Link href={`/boss/requests/${id}/answer`}>
            <Button variant="primary" icon={Edit3}>
              답변 작성
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="boss-empty">불러오는 중...</div>
      ) : data ? (
        <>
          {/* 개요 카드 */}
          <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={badge.tone}>{badge.label}</Badge>
                <span className="text-xs text-boss-text-muted">#{id}</span>
              </div>
              <h2 className="text-lg font-semibold text-boss-text">
                {data.buildingType || '걸물 유형 미지정'} · {data.region || '지역 미지정'}
              </h2>
              <p className="mt-1 text-sm text-boss-text-muted">
                접수일: {data.requestDate || data.createdDt ? formatDate(data.requestDate || data.createdDt) : '-'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">답변</p>
                <p className="font-semibold text-boss-text">{data.answerCount ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-boss-text-muted">면적</p>
                <p className="font-semibold text-boss-text">{data.areaSize ? `${data.areaSize}㎡` : '-'}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* 고객 정보 */}
            <Section title="고객 정보" icon={User}>
              <Info label="성함" value={data.customerName} icon={User} />
              <Info label="연락처" value={data.customerPhone} icon={Phone} />
              <Info label="이메일" value={data.customerEmail} icon={Mail} />
            </Section>

            {/* 시공 정보 */}
            <Section title="시공 정보" icon={Home}>
              <Info label="걸물 유형" value={data.buildingType} icon={Home} />
              <Info label="시공 위치" value={data.constructionLocation} icon={MapPin} />
              <Info label="면적" value={data.areaSize ? `${data.areaSize}㎡` : undefined} icon={Ruler} />
              <Info label="방 개수" value={data.roomCount?.toString()} icon={DoorOpen} />
              <Info label="벽지" value={data.wallpaper} icon={Wallpaper} />
              <Info label="천장" value={data.ceiling} icon={Square} />
            </Section>

            {/* 일정 및 요청사항 */}
            <Section title="일정 및 요청사항" icon={Calendar}>
              <Info label="희망 일정" value={data.preferredDate} icon={Calendar} />
              <Info label="일정 상세" value={data.preferredDateDetail} icon={Clock} />
              <Info label="특이사항" value={data.specialInfo} icon={FileText} />
              <Info label="상세 요청" value={data.specialInfoDetail} icon={FileText} />
              <Info label="기타1" value={data.etc1} icon={Hash} />
              <Info label="기타2" value={data.etc2} icon={Hash} />
              <Info label="기타3" value={data.etc3} icon={Hash} />
              {data.agreeTerms && (
                <div className="flex items-center gap-2 text-sm text-boss-primary">
                  <CheckCircle size={14} />
                  <span>약관 동의 완료</span>
                </div>
              )}
            </Section>
          </div>

          {/* 답변 목록 */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-boss-text">
              <MessageSquare size={16} className="text-boss-primary" />
              견적 답변 {answers.length > 0 ? `(${answers.length})` : ''}
            </h3>
            {answers.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="아직 답변이 없습니다"
                description="먼저 답변을 작성해 보세요."
                action={
                  <Link href={`/boss/requests/${id}/answer`}>
                    <Button variant="primary" size="sm" icon={Edit3}>
                      답변 작성
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {answers.map((a, i) => (
                  <li
                    key={a.answerId ?? i}
                    className="rounded-lg border border-boss-border bg-boss-elevated/30 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-boss-text">{a.answerTitle || '제목 없음'}</p>
                      <span className="text-sm font-semibold text-boss-primary">
                        {a.cost ? `₩${a.cost.toLocaleString('ko-KR')}` : '금액 미정'}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-sm text-boss-text-secondary"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.answerBody) }}
                    />
                    <div className="mt-3 flex items-center gap-3 text-xs text-boss-text-muted">
                      <span>{a.userNm || '작성자 미상'}</span>
                      {a.companyNm && <span>· {a.companyNm}</span>}
                      <span>· {a.createdDt ? formatDate(a.createdDt) : '-'}</span>
                      {a.status && <Badge tone="default">{a.status}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
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
      <div>
        <p className="text-xs text-boss-text-muted">{label}</p>
        <p className="text-boss-text">{value}</p>
      </div>
    </div>
  );
}

function formatDate(input?: string | null) {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
