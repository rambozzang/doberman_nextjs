'use client';

import { FormEvent, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import RichEditor from '@/components/boss/RichEditor';
import { PageHeader, Card, Button } from '@/components/boss/ui';
import { FileSignature, Wallet, Sparkles, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <PageHeader
        title={`견적 답변 작성 #${requestId}`}
        breadcrumbs={[
          { label: '견적 요청', href: '/boss/requests' },
          { label: '상세', href: `/boss/requests/${requestId}` },
          { label: '답변' },
        ]}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <label htmlFor="title" className="mb-2 flex items-center gap-2 text-sm font-medium text-boss-text">
              <FileSignature size={14} className="text-boss-primary" />
              제목
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="boss-input h-11 w-full"
              placeholder="예: 32평 아파트 실크벽지 도배 견적"
            />
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-boss-text">
                <Sparkles size={14} className="text-boss-primary" />
                상세 내용
              </label>
              <div className="flex gap-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setBody(t.body)}
                    className="rounded-md border border-boss-border bg-boss-elevated px-2 py-1 text-[11px] text-boss-text-secondary transition-colors hover:border-boss-primary/20 hover:text-boss-primary"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <RichEditor
              value={body}
              onChange={setBody}
              placeholder="시공 범위, 사용 자재, 일정 등을 자세히 적어주세요."
              minHeight={280}
            />
            <p className="mt-2 text-right text-[11px] text-boss-text-muted">{bodyText.length}자</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <label htmlFor="cost" className="mb-2 flex items-center gap-2 text-sm font-medium text-boss-text">
              <Wallet size={14} className="text-boss-primary" />
              견적 금액
            </label>
            <div className="relative">
              <input
                id="cost"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value.replace(/[^\d]/g, ''))}
                className="boss-input h-12 w-full pr-10 text-right text-lg font-bold text-boss-primary"
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-boss-text-muted">
                원
              </span>
            </div>
            {formattedCost && (
              <p className="mt-2 text-right text-xs text-boss-text-muted">{formattedCost}</p>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-boss-primary" />
              <p className="text-xs font-semibold text-boss-text">제출 전 체크</p>
            </div>
            <ul className="space-y-1 text-xs">
              <li className={title.trim() ? 'text-boss-primary' : 'text-boss-text-muted'}>• 제목 작성</li>
              <li className={bodyText ? 'text-boss-primary' : 'text-boss-text-muted'}>• 상세 내용 작성</li>
              <li className={cost ? 'text-boss-primary' : 'text-boss-text-muted'}>• 견적 금액 입력</li>
            </ul>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? '제출 중...' : '답변 제출하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
