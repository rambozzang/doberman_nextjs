'use client';

// 견적 요청 상세 — Industry 패턴 (좌 본문 패널 + 우 요약 패널 2열)
// 화면 제목 · "← 견적 요청" 링크는 셸 헤더가 그린다. 이 화면의 주요 행동(답변 작성)은 우측 요약 패널에 둔다.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import type { BossRequestDetail, BossRequestAnswer } from '@/types/boss';
import {
  Panel,
  Tag,
  Badge,
  ButtonLink,
  AlertBanner,
  DescRow,
  EmptyState,
} from '@/components/boss/ui';

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
    if (s.includes('DONE') || s.includes('완료') || s.includes('채택')) return { tone: 'ok' as const, label: '채택 완료' };
    if (s.includes('PROGRESS') || s.includes('진행')) return { tone: 'info' as const, label: '검토 중' };
    if (s.includes('CANCEL') || s.includes('취소')) return { tone: 'bad' as const, label: '취소' };
    return { tone: 'neutral' as const, label: status || '접수' };
  };

  const badge = statusBadge(data?.status);
  const answerHref = `/boss/requests/${id}/answer`;

  if (loading) {
    return <div className="boss-empty text-[13px]">불러오는 중…</div>;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col gap-4">
        <AlertBanner tone="bad">{error}</AlertBanner>
        <EmptyState
          title="견적 요청을 열지 못했습니다"
          description="요청이 삭제됐거나 네트워크가 불안정할 수 있습니다. 목록에서 다시 골라 주세요."
          action={
            <ButtonLink href="/boss/requests" variant="secondary" size="sm">
              목록으로
            </ButtonLink>
          }
        />
      </div>
    );
  }

  if (!data) return null;

  const receivedAt =
    data.requestDate || data.createdDt ? formatDate(data.requestDate || data.createdDt) : '-';

  return (
    <div className="flex flex-col gap-4">
      {error && <AlertBanner tone="bad">{error}</AlertBanner>}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ───── 좌: 본문 ───── */}
        <div className="flex flex-col gap-4">
          <Panel kicker={`요청 #${id}`} title={`${data.buildingType || '건물 유형 미지정'} · ${data.region || '지역 미지정'}`}>
            <h4 className="boss-mono-label mb-2">시공 정보</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              <Fact label="건물 유형" value={data.buildingType} />
              <Fact label="시공 위치" value={data.constructionLocation} />
              <Fact label="면적" value={data.areaSize ? `${data.areaSize}㎡` : undefined} num />
              <Fact label="방 개수" value={data.roomCount != null ? `${data.roomCount}개` : undefined} num />
              <Fact label="벽지" value={data.wallpaper} />
              <Fact label="천장" value={data.ceiling} />
            </div>

            <h4 className="boss-mono-label mb-2 mt-5 border-t border-boss-border-row pt-4">
              일정 · 요청사항
            </h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
              <Fact label="희망 일정" value={data.preferredDate} num />
              <Fact label="일정 상세" value={data.preferredDateDetail} />
              <Fact label="특이사항" value={data.specialInfo} wide />
              <Fact label="상세 요청" value={data.specialInfoDetail} wide />
              <Fact label="기타 1" value={data.etc1} />
              <Fact label="기타 2" value={data.etc2} />
              <Fact label="기타 3" value={data.etc3} />
            </div>
            {data.agreeTerms && (
              <p className="mt-4 text-[12px] text-boss-text-secondary">
                <Tag tone="ok">약관 동의</Tag>
                <span className="ml-2">고객이 견적 요청 약관에 동의했습니다.</span>
              </p>
            )}
          </Panel>

          <Panel
            title="견적 답변"
            kicker={answers.length > 0 ? `${answers.length}건` : undefined}
            right={
              <Link href={answerHref} className="boss-btn boss-btn-sm boss-btn-ghost -mr-2">
                답변 작성
              </Link>
            }
          >
            {answers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[13.5px] font-semibold text-boss-text">아직 답변이 없습니다</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-boss-text-secondary">
                  먼저 답변한 업체가 고객 화면 위쪽에 보입니다. 견적 금액과 시공 범위를 적어 보내세요.
                </p>
                <ButtonLink href={answerHref} variant="primary" size="sm" className="mt-4">
                  답변 작성
                </ButtonLink>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {answers.map((a, i) => (
                  <li key={a.answerId ?? i} className="border border-boss-border bg-boss-inset p-4">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[14px] font-semibold text-boss-text">
                        {a.answerTitle || '제목 없음'}
                      </p>
                      <span className="font-boss-head text-[18px] font-semibold tabular-nums text-boss-text">
                        {a.cost ? `₩${a.cost.toLocaleString('ko-KR')}` : '금액 미정'}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-[13.5px] leading-relaxed text-boss-text-soft"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.answerBody) }}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-boss-text-secondary">
                      <span>{a.userNm || '작성자 미상'}</span>
                      {a.companyNm && <span>· {a.companyNm}</span>}
                      <span className="font-boss-head tabular-nums">
                        · {a.createdDt ? formatDate(a.createdDt) : '-'}
                      </span>
                      {a.status && <Badge tone="default">{a.status}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ───── 우: 요약 ───── */}
        <div className="flex flex-col gap-4">
          <Panel kicker="요약" title={data.customerName || '고객'}>
            <div className="mb-2">
              <Tag tone={badge.tone}>{badge.label}</Tag>
            </div>
            <dl>
              <DescRow label="접수" value={<span className="font-boss-head tabular-nums">{receivedAt}</span>} />
              <DescRow
                label="답변 수"
                value={<span className="font-boss-head tabular-nums">{data.answerCount ?? answers.length}건</span>}
              />
              <DescRow
                label="면적"
                value={<span className="font-boss-head tabular-nums">{data.areaSize ? `${data.areaSize}㎡` : '—'}</span>}
              />
              <DescRow
                label="연락처"
                value={
                  data.customerPhone ? (
                    <a href={`tel:${data.customerPhone}`} className="font-boss-head tabular-nums">
                      {data.customerPhone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <DescRow
                label="이메일"
                value={
                  data.customerEmail ? (
                    <a href={`mailto:${data.customerEmail}`}>{data.customerEmail}</a>
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
            <ButtonLink href={answerHref} variant="primary" className="mt-4 w-full">
              답변 작성
            </ButtonLink>
            {data.customerPhone && (
              <a href={`tel:${data.customerPhone}`} className="boss-btn boss-btn-md boss-btn-secondary mt-2 w-full">
                고객에게 전화
              </a>
            )}
          </Panel>

          <Panel kicker="안내" title="답변 후 흐름">
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              답변을 보내면 고객 앱에 알림이 갑니다. 고객이 채택하면 상태가 「채택 완료」로 바뀌고,
              그 뒤 고객 등록에서 시공 일정을 잡습니다.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** 라벨(10px 대문자) + 값. 값이 없으면 그리지 않는다 — 빈칸을 '-' 로 채우면 표가 길어지기만 한다. */
function Fact({
  label,
  value,
  num = false,
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  num?: boolean;
  wide?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p className="boss-mono-label">{label}</p>
      <p
        className={`mt-0.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-boss-text ${
          num ? 'font-boss-head tabular-nums' : ''
        }`}
      >
        {value}
      </p>
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
