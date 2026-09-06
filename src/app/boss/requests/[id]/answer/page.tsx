'use client';

// 견적 답변 작성 — Industry 패턴의 긴 폼 (참조 매물 등록: 좌 폼 + 하단 액션 패널 + 우 280px 안내 패널)
// 화면 제목 · "← 견적 요청" 링크는 셸 헤더가 그린다.

import { FormEvent, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import RichEditor from '@/components/boss/RichEditor';
import { Panel, Button, Field, FieldLabel } from '@/components/boss/ui';

const TEMPLATES = [
  {
    label: '표준 견적',
    body: '<h3>시공 범위</h3><ul><li>거실 + 주방 도배</li><li>침실 2개 도배</li></ul><h3>사용 자재</h3><p>실크벽지 (LG하우시스)</p><h3>일정</h3><p>방문 상담 후 1주 이내 시공 가능합니다.</p>',
  },
  {
    label: '프리미엄 견적',
    body: '<h3>프리미엄 패키지</h3><ul><li>전체 도배 + 천장 마감</li><li>친환경 수입 벽지</li><li>가구 이동/복구 포함</li></ul><blockquote>1년 무상 AS 제공</blockquote>',
  },
];

function stripHtml(html: string): string {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

export default function BossAnswerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = Number(params?.id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cost, setCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formattedCost = useMemo(() => {
    const n = Number(cost.replace(/[^\d]/g, ''));
    if (!n) return '';
    return n.toLocaleString('ko-KR') + '원';
  }, [cost]);

  const bodyText = useMemo(() => stripHtml(body), [body]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText || !cost.trim()) {
      toast.error('제목, 내용, 견적 금액을 모두 입력해주세요.');
      return;
    }
    const numericCost = Number(cost.replace(/[^\d]/g, ''));
    if (Number.isNaN(numericCost) || numericCost <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bossRequestsApi.submit({
        requestId,
        answerTitle: title.trim(),
        answerBody: body.trim(),
        cost: numericCost,
      });
      if (res.success) {
        toast.success('견적 답변이 제출되었습니다.');
        router.replace(`/boss/requests/${requestId}`);
      } else {
        toast.error(res.message || '제출에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 필수 누락 — 참조 매물 등록의 우측 "필수 누락" 패널과 같은 역할
  const missing = [
    !title.trim() && '제목',
    !bodyText && '상세 내용',
    !cost.trim() && '견적 금액',
  ].filter((v): v is string => Boolean(v));

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      {/* ───── 좌: 폼 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker={`요청 #${requestId}`} title="답변 내용">
          <div className="flex flex-col gap-4">
            <Field
              id="title"
              label="제목"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 32평 아파트 실크벽지 도배 견적"
              maxLength={100}
            />

            <div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <FieldLabel required>
                  <span id="answer-body-label">상세 내용</span>
                </FieldLabel>
                <div className="mb-[5px] flex items-center gap-1.5">
                  <span className="text-[11px] text-boss-text-muted">양식 넣기</span>
                  {TEMPLATES.map((t) => (
                    <Button
                      key={t.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setBody(t.body)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div id="answer-body" role="group" aria-labelledby="answer-body-label">
                <RichEditor
                  value={body}
                  onChange={setBody}
                  placeholder="시공 범위, 사용 자재, 일정 등을 자세히 적어주세요."
                  minHeight={280}
                />
              </div>
              <p className="mt-1 text-right font-boss-head text-[12px] tabular-nums text-boss-text-muted">
                {bodyText.length}자
              </p>
            </div>

            <Field
              id="cost"
              label="견적 금액"
              required
              inputMode="numeric"
              suffix="원"
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className="max-w-[280px] [&_input]:text-right [&_input]:font-boss-head [&_input]:text-[16px] [&_input]:font-semibold"
              hint={formattedCost ? <span className="font-boss-head tabular-nums">{formattedCost}</span> : '부가세 포함 여부를 본문에 적어 주세요.'}
            />
          </div>
        </Panel>

        {/* 하단 액션 패널 — 취소 secondary / 제출 primary 우측 */}
        <div className="boss-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <p className="text-[12.5px] text-boss-text-secondary">
            {missing.length > 0
              ? `필수 ${missing.length}항목이 비어 있습니다`
              : '제출하면 고객에게 바로 알림이 갑니다'}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/boss/requests/${requestId}`}
              className="boss-btn boss-btn-md boss-btn-secondary"
            >
              취소
            </Link>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '제출 중…' : '답변 제출'}
            </Button>
          </div>
        </div>
      </div>

      {/* ───── 우: 안내 패널 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="필수 확인" title={missing.length > 0 ? `${missing.length}항목 남음` : '준비 완료'}>
          {missing.length > 0 ? (
            <ul className="flex flex-col gap-1 text-[13px]">
              {missing.map((m) => (
                <li key={m} className="text-boss-error">
                  · {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-boss-text">제목 · 상세 내용 · 견적 금액이 모두 채워졌습니다.</p>
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            금액은 숫자만 입력합니다. 콤마는 자동으로 붙습니다.
          </p>
        </Panel>

        <Panel kicker="안내" title="잘 채택되는 답변">
          <ul className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li>· 시공 범위(거실 · 방 · 천장)를 먼저 적습니다.</li>
            <li>· 벽지 종류와 브랜드를 명시합니다.</li>
            <li>· 시공 가능한 가장 빠른 날짜를 적습니다.</li>
            <li>· AS 기간과 조건을 한 줄로 밝힙니다.</li>
          </ul>
        </Panel>
      </div>
    </form>
  );
}
