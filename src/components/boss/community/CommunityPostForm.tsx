'use client';

// 커뮤니티 글쓰기 · 수정 공통 폼 — Industry 패턴 (참조 ListingForm 의 긴 폼 조판)
//
// 구조: lg:grid-cols-[minmax(0,1fr)_280px]
//   좌 — 패널 «게시판 · 제목» → (구인/구직) 패널 «구인 / 구직 정보» 2열 → 패널 «내용»(RichEditor)
//        → 하단 액션 패널(좌: 초기화 · 임시 저장 시각 / 우: 취소 secondary · 등록 primary)
//   우 — 안내 패널(게시판 설명 · 필수 누락 · 작성 팁)
//
// 화면 제목과 «← 커뮤니티» 는 셸 헤더가 그린다. 초기화는 ConfirmDialog 를 거친다.
// RichEditor 는 별도 담당(수정하지 않는다).

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import RichEditor from '@/components/boss/RichEditor';
import {
  Button,
  ButtonLink,
  Panel,
  Field,
  FieldLabel,
  Segmented,
  ConfirmDialog,
} from '@/components/boss/ui';
import type { BbsCreateRequest, BbsUpdateRequest, BbsData } from '@/types/boss-community';

type CategoryCode = 'FREE' | 'JOB' | 'ANON';

interface JobMeta {
  region: string;
  jobType: string;
  pay: string;
  contact: string;
  headcount: string;
  period: string;
}

const CATEGORIES: { key: CategoryCode; label: string; description: string }[] = [
  { key: 'FREE', label: '자유게시판', description: '도배 사장님들과 자유롭게 이야기해요.' },
  { key: 'JOB', label: '구인 / 구직', description: '인력을 구하거나 일자리를 찾아보세요.' },
  { key: 'ANON', label: '익명', description: '익명으로 질문하거나 이야기해요.' },
];

const EMPTY_JOB_META: JobMeta = {
  region: '',
  jobType: '',
  pay: '',
  contact: '',
  headcount: '',
  period: '',
};

const JOB_META_MARKER = '<!-- job-meta -->';

function buildJobMetaHtml(meta: JobMeta): string {
  const rows = [
    { label: '근무 지역', value: meta.region },
    { label: '직종 / 업무', value: meta.jobType },
    { label: '급여 / 조건', value: meta.pay },
    { label: '연락처', value: meta.contact },
    { label: '모집 인원', value: meta.headcount },
    { label: '근무 기간', value: meta.period },
  ].filter((r) => r.value.trim());

  if (rows.length === 0) return '';

  const listItems = rows.map((r) => `<li><strong>${r.label}:</strong> ${r.value.trim()}</li>`).join('');
  return `<h3>구인 / 구직 정보</h3><ul>${listItems}</ul>`;
}

function splitContents(contents: string): { meta: JobMeta; body: string } {
  const markerIndex = contents.indexOf(JOB_META_MARKER);
  if (markerIndex === -1) {
    return { meta: { ...EMPTY_JOB_META }, body: contents };
  }
  const metaHtml = contents.slice(0, markerIndex);
  const body = contents.slice(markerIndex + JOB_META_MARKER.length).trim();
  const meta: JobMeta = { ...EMPTY_JOB_META };

  const extract = (label: string) => {
    const regex = new RegExp(`<strong>${label}:</strong>\\s*([^<]+)`, 'i');
    const match = metaHtml.match(regex);
    return match ? match[1].trim() : '';
  };

  meta.region = extract('근무 지역');
  meta.jobType = extract('직종 / 업무');
  meta.pay = extract('급여 / 조건');
  meta.contact = extract('연락처');
  meta.headcount = extract('모집 인원');
  meta.period = extract('근무 기간');

  return { meta, body };
}

interface Props {
  mode: 'create' | 'edit';
  boardId?: string;
  initial?: BbsData;
  defaultCategory?: CategoryCode;
  onSubmit: (payload: BbsCreateRequest | BbsUpdateRequest) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: () => void;
}

export default function CommunityPostForm({ mode, boardId, initial, defaultCategory, onSubmit, onSuccess }: Props) {
  const [category, setCategory] = useState<CategoryCode>(
    initial?.typeDtCd === 'JOB' || defaultCategory === 'JOB'
      ? 'JOB'
      : initial?.typeDtCd === 'ANON' || defaultCategory === 'ANON'
        ? 'ANON'
        : 'FREE',
  );
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [contents, setContents] = useState('');
  const [jobMeta, setJobMeta] = useState<JobMeta>({ ...EMPTY_JOB_META });
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (initial?.contents) {
      const { meta, body } = splitContents(initial.contents);
      setJobMeta(meta);
      setContents(body);
    }
  }, [initial?.contents]);

  // 작성 모드에서 로컬 드래프트 자동 저장
  useEffect(() => {
    if (mode !== 'create') return;
    if (defaultCategory) return;
    try {
      const raw = localStorage.getItem('boss-community-draft');
      if (raw) {
        const draft = JSON.parse(raw) as { category: CategoryCode; subject: string; contents: string; jobMeta: JobMeta; savedAt: string };
        if (!subject && !contents) {
          setCategory(draft.category);
          setSubject(draft.subject);
          setContents(draft.contents);
          setJobMeta(draft.jobMeta);
          setDraftSavedAt(draft.savedAt);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'create') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          'boss-community-draft',
          JSON.stringify({ category, subject, contents, jobMeta, savedAt: new Date().toISOString() }),
        );
        setDraftSavedAt(new Date().toISOString());
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [category, subject, contents, jobMeta, mode]);

  const plainLength = useMemo(() => contents.replace(/<[^>]*>/g, '').trim().length, [contents]);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (plainLength === 0) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    let finalContents = contents.trim();
    if (category === 'JOB') {
      const metaHtml = buildJobMetaHtml(jobMeta);
      finalContents = metaHtml ? `${metaHtml}\n${JOB_META_MARKER}\n${finalContents}` : finalContents;
    }

    setSubmitting(true);
    try {
      const payload: BbsCreateRequest | BbsUpdateRequest =
        mode === 'edit' && boardId
          ? {
              boardId,
              subject: subject.trim(),
              contents: finalContents,
              typeCd: 'BBS',
              typeDtCd: category,
              depthNo: '1',
              parentId: 0,
              fileListData: [],
            }
          : {
              typeCd: 'BBS',
              typeDtCd: category,
              depthNo: '1',
              boardId: '0',
              parentId: 0,
              subject: subject.trim(),
              contents: finalContents,
              fileListData: [],
            };
      const res = await onSubmit(payload);
      if (res.success) {
        if (mode === 'create') {
          localStorage.removeItem('boss-community-draft');
        }
        toast.success(mode === 'edit' ? '수정되었습니다.' : '게시글이 등록되었습니다.');
        onSuccess?.();
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetDraft = () => {
    localStorage.removeItem('boss-community-draft');
    setCategory('FREE');
    setSubject('');
    setContents('');
    setJobMeta({ ...EMPTY_JOB_META });
    setDraftSavedAt(null);
    setResetOpen(false);
  };

  const isJob = category === 'JOB';
  const isEdit = mode === 'edit';
  const cancelHref = isEdit && boardId ? `/boss/community/${boardId}` : '/boss/community';
  const currentCategory = CATEGORIES.find((c) => c.key === category);

  // 필수 누락 — 참조 04 의 «필수 누락» 패널
  const missing: string[] = [];
  if (!subject.trim()) missing.push('제목');
  if (plainLength === 0) missing.push('내용');

  const fmtSavedAt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ───── 좌: 폼 ───── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel title="게시판 · 제목">
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel required>게시판</FieldLabel>
              <Segmented<CategoryCode>
                ariaLabel="게시판"
                options={CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
                value={category}
                onChange={setCategory}
              />
              {currentCategory && (
                <p className="mt-1.5 text-[12px] text-boss-text-secondary">{currentCategory.description}</p>
              )}
            </div>

            <Field
              id="subject"
              label="제목"
              required
              type="text"
              maxLength={100}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="한 줄로 무엇에 대한 글인지 적어 주세요"
              hint={
                <span className="font-boss-head tabular-nums">{subject.length} / 100</span>
              }
            />
          </div>
        </Panel>

        {isJob && (
          <Panel title="구인 / 구직 정보" kicker="JOB">
            <p className="mb-3 text-[12px] text-boss-text-secondary">
              적은 항목만 본문 위에 표로 정리되어 올라갑니다. 비워도 됩니다.
            </p>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field
                label="근무 지역"
                value={jobMeta.region}
                onChange={(e) => setJobMeta((m) => ({ ...m, region: e.target.value }))}
                placeholder="예: 서울 강남구"
                maxLength={100}
              />
              <Field
                label="직종 / 업무"
                value={jobMeta.jobType}
                onChange={(e) => setJobMeta((m) => ({ ...m, jobType: e.target.value }))}
                placeholder="예: 도배 공수, 현장 보조"
                maxLength={200}
              />
              <Field
                label="급여 / 조건"
                value={jobMeta.pay}
                onChange={(e) => setJobMeta((m) => ({ ...m, pay: e.target.value }))}
                placeholder="예: 일당 15만원"
                maxLength={100}
              />
              <Field
                label="연락처"
                value={jobMeta.contact}
                onChange={(e) => setJobMeta((m) => ({ ...m, contact: e.target.value }))}
                placeholder="예: 010-1234-5678"
                maxLength={20}
              />
              <Field
                label="모집 인원"
                value={jobMeta.headcount}
                onChange={(e) => setJobMeta((m) => ({ ...m, headcount: e.target.value }))}
                placeholder="예: 2명"
                maxLength={100}
              />
              <Field
                label="근무 기간"
                value={jobMeta.period}
                onChange={(e) => setJobMeta((m) => ({ ...m, period: e.target.value }))}
                placeholder="예: 6개월 이상"
                maxLength={100}
              />
            </div>
          </Panel>
        )}

        <Panel
          title="내용"
          right={
            <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">
              {plainLength.toLocaleString()}자
            </span>
          }
        >
          <RichEditor
            value={contents}
            onChange={setContents}
            placeholder={
              isJob
                ? '상세한 모집/구직 조건을 작성하세요. (경력, 자격 요건, 근무 시간 등)'
                : '자유롭게 작성하세요. 굵게, 목록, 인용, 링크 등을 사용할 수 있습니다.'
            }
            minHeight={360}
          />
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          {mode === 'create' && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setResetOpen(true)}>
              초기화
            </Button>
          )}
          <span className="text-[12px] text-boss-text-secondary">
            {mode === 'create'
              ? draftSavedAt
                ? `임시 저장 ${fmtSavedAt(draftSavedAt)} · 이 브라우저에만 보관됩니다`
                : '입력을 멈추면 자동으로 임시 저장됩니다'
              : '수정 내용은 저장을 눌러야 반영됩니다'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href={cancelHref} variant="secondary">
              취소
            </ButtonLink>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (isEdit ? '저장 중…' : '등록 중…') : isEdit ? '저장' : '등록'}
            </Button>
          </div>
        </div>
      </div>

      {/* ───── 우: 안내 ───── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel kicker="게시판" title={currentCategory?.label ?? '게시판'}>
          <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
            {currentCategory?.description}
            {category === 'ANON' && ' 익명 글은 작성자 이름 대신 «익명» 으로 표시됩니다.'}
            {category === 'JOB' && ' 다른 사장님이 «연락 요청» 을 보내면 푸시로 알려드립니다.'}
          </p>
        </Panel>

        <Panel kicker={missing.length > 0 ? '필수 누락' : '확인'} title={missing.length > 0 ? `${missing.length}항목 남음` : '등록할 수 있습니다'}>
          {missing.length > 0 ? (
            <ul className="flex flex-col gap-1 text-[13px] text-boss-error">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              제목과 내용이 모두 채워졌습니다. 아래 «{isEdit ? '저장' : '등록'}» 을 누르면 바로 게시됩니다.
            </p>
          )}
        </Panel>

        <Panel kicker="작성 팁" title="편집기">
          <ul className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li>· Cmd/Ctrl + B 굵게, Cmd/Ctrl + I 기울임</li>
            <li>· 툴바에서 제목 · 목록 · 인용 · 링크 삽입</li>
            <li>· 전화번호 · 주소 같은 개인정보는 본문보다 연락 요청으로 주고받으세요</li>
          </ul>
        </Panel>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="작성 중인 내용을 지울까요?"
        description="임시 저장된 내용까지 함께 지워지며 되돌릴 수 없습니다."
        confirmLabel="지우기"
        onConfirm={resetDraft}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
