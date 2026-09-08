'use client';

// 견적 답변 작성 — Industry 패턴의 긴 폼 (참조 매물 등록: 좌 폼 + 하단 액션 패널 + 우 280px 안내 패널)
// 화면 제목 · "← 견적 요청" 링크는 셸 헤더가 그린다.
//
// 답변 양식은 앱 `web_request_answer_page.dart` 와 같은 규칙:
//   양식 고르기(제목 · 내용이 채워진다) · 양식 관리(⚙) · 지우기.
// 양식은 답변 양식(/boss/templates)와 같은 저장소(/web-templates)를 쓴다.

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings2, Eraser } from 'lucide-react';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import RichEditor from '@/components/boss/RichEditor';
import { Panel, Button, ButtonLink, EmptyState, Field, FieldLabel } from '@/components/boss/ui';
import TemplateManagerDialog, { loadTemplates } from '@/components/boss/templates/TemplateManagerDialog';
import type { BossTemplate } from '@/types/boss-templates';
import type { BossRequestDetail } from '@/types/boss';
import { looksLikePlainText, sanitizeHtml } from '@/lib/sanitizeHtml';
import { formatPreferredDate, requestSummary, stripBrackets } from '@/lib/boss/requestFormat';
import { BossAuthManager } from '@/lib/bossAuth';
import { LIST_KEYS, markListDirty } from '@/lib/boss/listCache';
import { amountInKorean } from '@/lib/boss/docMeta';

/** 자주 쓰는 금액 — 누르면 더해진다 */
const QUICK_AMOUNTS = [50000, 100000, 500000, 1000000];

function stripHtml(html: string): string {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

/** 저장된 양식 내용을 편집기에 넣을 HTML 로 — 앱에서 만든 줄글은 문단으로 바꾼다 */
function templateToHtml(content: string): string {
  if (looksLikePlainText(content)) {
    return content
      .split(/\r?\n/)
      .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '<br>'}</p>`)
      .join('');
  }
  return sanitizeHtml(content);
}

export default function BossAnswerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = Number(params?.id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cost, setCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 요청 요약 — 답변하면서 무엇을 요청했는지 보게 (앱 _buildCustomerSummary)
  const [request, setRequest] = useState<BossRequestDetail | null>(null);

  // 이미 이 요청에 답변했는지 — 백엔드는 요청당 답변을 1건만 허용한다(중복 제출 시 실패).
  // 폼을 다 채운 뒤에야 실패를 알기보다, 열자마자 막고 기존 답변으로 보낸다.
  // null = 아직 확인 중, false = 답변 없음(정상 진행), true = 이미 답변함(폼 대신 안내)
  const [alreadyAnswered, setAlreadyAnswered] = useState<boolean | null>(null);

  // 답변 양식
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!requestId) return;
    bossRequestsApi
      .detail(requestId)
      .then((res) => {
        if (!cancelled && res.success !== false && res.data) setRequest(res.data);
      })
      .catch(() => {});
    // 답변이 없으면 서버가 실패 응답(예외)을 준다 — 그게 정상(미답변) 상태다.
    bossRequestsApi
      .myAnswer(requestId)
      .then((res) => {
        if (!cancelled) setAlreadyAnswered(res.success === true && !!res.data);
      })
      .catch(() => {
        if (!cancelled) setAlreadyAnswered(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  useEffect(() => {
    let cancelled = false;
    loadTemplates().then(({ list, error }) => {
      if (cancelled) return;
      setTemplates(list);
      if (error) toast.error(error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTemplate = useCallback((t: BossTemplate) => {
    setTemplateId(String(t.id));
    setTitle(t.title || '');
    setBody(templateToHtml(t.content || ''));
  }, []);

  const clearForm = () => {
    setTemplateId('');
    setTitle('');
    setBody('');
  };

  const onTemplatesChanged = useCallback((list: BossTemplate[]) => {
    setTemplates(list);
    // 쓰고 있던 양식이 지워졌으면 선택만 푼다 (적어 둔 내용은 남긴다)
    setTemplateId((cur) => (cur && !list.some((t) => String(t.id) === cur) ? '' : cur));
  }, []);

  const bodyText = useMemo(() => stripHtml(body), [body]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // 화면 진입 시점엔 미답변이었다가 다른 탭 · 기기에서 먼저 답변을 넣었을 수 있다 —
    // 제출 직전에도 한 번 더 막는다(서버도 같은 이유로 막지만, 여기서 먼저 알려준다).
    if (alreadyAnswered) {
      toast.error('이미 이 요청에 답변을 등록했습니다.');
      return;
    }
    if (!title.trim() || !bodyText || !cost.trim()) {
      toast.error('제목, 내용, 견적 금액을 모두 입력해주세요.');
      return;
    }
    const numericCost = Number(cost.replace(/[^\d]/g, ''));
    if (Number.isNaN(numericCost) || numericCost <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    // 서버는 요청 고객 ID 와 내 아이디를 필수로 받는다(앱도 같이 보낸다)
    const webCustomerId = request?.webCustomerId;
    const userId = BossAuthManager.getUserInfo()?.userId;
    // 0 도 앱과 똑같이 그대로 보낸다 — 막으면 제출 자체가 안 된다
    if (webCustomerId === undefined || webCustomerId === null) {
      toast.error('요청 정보를 아직 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
      return;
    }
    if (!userId) {
      toast.error('로그인 정보가 없습니다. 다시 로그인해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bossRequestsApi.submit({
        requestId,
        webCustomerId: String(webCustomerId),
        userId,
        answerTitle: title.trim(),
        answerBody: body.trim(),
        cost: numericCost,
        status: '답변완료',
      });
      if (res.success) {
        toast.success('견적 답변이 제출되었습니다.');
        markListDirty(LIST_KEYS.requests);
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

  const summary = request ? requestSummary(request) : '';

  // 이미 답변한 요청 — 빈 폼을 다시 보여 주면 재제출로 오해해 중복 답변을 만든다.
  // 백엔드도 같은 요청에 두 번째 답변을 거부하므로, 여기서 폼 자체를 막고 기존 답변으로 보낸다.
  if (alreadyAnswered) {
    return (
      <EmptyState
        title="이미 답변한 요청입니다"
        description="한 요청에는 답변을 한 번만 등록할 수 있습니다. 이미 보낸 답변은 요청 상세에서 확인하세요."
        action={
          <ButtonLink href={`/boss/requests/${requestId}`} variant="primary" size="sm">
            요청 상세로
          </ButtonLink>
        }
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      {/* ───── 좌: 폼 ───── */}
      <div className="flex flex-col gap-4">
        <Panel kicker={`요청 #${requestId}`} title="답변 내용">
          <div className="flex flex-col gap-4">
            {/* 답변 양식 — 앱과 같은 자리: 폼 맨 위 */}
            <div className="flex flex-wrap items-end gap-2 border-b border-boss-border-row pb-4">
              <div className="min-w-[220px] flex-1">
                <FieldLabel htmlFor="answer-template">답변 양식</FieldLabel>
                <select
                  id="answer-template"
                  className="boss-input"
                  value={templateId}
                  onChange={(e) => {
                    const t = templates.find((x) => String(x.id) === e.target.value);
                    if (t) applyTemplate(t);
                    else setTemplateId('');
                  }}
                >
                  <option value="">양식 고르기 — 제목과 내용이 채워집니다</option>
                  {templates.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.name}
                      {t.isDefault ? ' (기본)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                icon={Settings2}
                onClick={() => setManagerOpen(true)}
                title="양식 추가 · 수정 · 삭제"
              >
                양식 관리
              </Button>
              <Button type="button" variant="ghost" icon={Eraser} onClick={clearForm} title="제목과 내용을 비웁니다">
                지우기
              </Button>
            </div>

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
              <FieldLabel required>
                <span id="answer-body-label">상세 내용</span>
              </FieldLabel>
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

            <div>
              <Field
                id="cost"
                label="견적 금액"
                required
                inputMode="numeric"
                suffix="원"
                // 적는 대로 콤마가 붙는다 — 0 이 몇 개인지 세지 않게
                value={cost ? Number(cost).toLocaleString('ko-KR') : ''}
                onChange={(e) => setCost(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                placeholder="0"
                className="max-w-[280px] [&_input]:text-right [&_input]:font-boss-head [&_input]:text-[18px] [&_input]:font-semibold"
                hideCounter
                hint={
                  cost ? (
                    <span className="font-boss-head">{amountInKorean(Number(cost))}</span>
                  ) : (
                    '부가세 포함 여부를 본문에 적어 주세요.'
                  )
                }
              />
              {/* 자주 쓰는 금액 — 누르면 더한다. 0 을 여러 번 치지 않아도 된다 */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {QUICK_AMOUNTS.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCost(String(Math.min(Number(cost || 0) + v, 999999999999)))}
                  >
                    +{(v / 10000).toLocaleString('ko-KR')}만
                  </Button>
                ))}
                {cost ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCost('')}>
                    지우기
                  </Button>
                ) : null}
              </div>
            </div>
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
        {request && (
          <Panel kicker="고객 요청" title={request.region || '지역 미지정'}>
            <dl className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[12.5px]">
              <dt className="text-boss-text-muted">요청</dt>
              <dd className="text-boss-text">{summary || '-'}</dd>
              <dt className="text-boss-text-muted">희망일</dt>
              <dd className="font-boss-head tabular-nums text-boss-text">
                {formatPreferredDate(request.preferredDate)}
                {request.preferredDateDetail ? (
                  <span className="ml-1 font-sans text-boss-text-secondary">· {stripBrackets(request.preferredDateDetail)}</span>
                ) : null}
              </dd>
              {request.specialInfo || request.specialInfoDetail ? (
                <>
                  <dt className="text-boss-text-muted">특이사항</dt>
                  <dd className="text-boss-text">
                    {[stripBrackets(request.specialInfo), request.specialInfoDetail].filter(Boolean).join(' · ')}
                  </dd>
                </>
              ) : null}
            </dl>
          </Panel>
        )}

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
            <li>· 자주 쓰는 문구는 양식으로 저장해 두면 다음 답변이 빨라집니다.</li>
          </ul>
        </Panel>
      </div>

      <TemplateManagerDialog
        open={managerOpen}
        templates={templates}
        onClose={() => setManagerOpen(false)}
        onChanged={onTemplatesChanged}
        onPick={(t) => {
          applyTemplate(t);
          setManagerOpen(false);
        }}
      />
    </form>
  );
}
