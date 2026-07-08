'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import RichEditor from '@/components/boss/RichEditor';
import { Button, Card, PageHeader } from '@/components/boss/ui';
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
  onSubmit: (payload: BbsCreateRequest | BbsUpdateRequest) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: () => void;
}

export default function CommunityPostForm({ mode, boardId, initial, onSubmit, onSuccess }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryCode>(initial?.typeDtCd === 'JOB' ? 'JOB' : initial?.typeDtCd === 'ANON' ? 'ANON' : 'FREE');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [contents, setContents] = useState('');
  const [jobMeta, setJobMeta] = useState<JobMeta>({ ...EMPTY_JOB_META });
  const [submitting, setSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

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
    if (!confirm('임시 저장 내용을 지우고 초기화할까요?')) return;
    localStorage.removeItem('boss-community-draft');
    setCategory('FREE');
    setSubject('');
    setContents('');
    setJobMeta({ ...EMPTY_JOB_META });
    setDraftSavedAt(null);
  };

  const isJob = category === 'JOB';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Community"
        title={mode === 'edit' ? '게시글 수정' : '새 게시글'}
        description={CATEGORIES.find((c) => c.key === category)?.description}
        breadcrumbs={[
          { label: '커뮤니티', href: '/boss/community' },
          ...(mode === 'edit' && boardId ? [{ label: '상세', href: `/boss/community/${boardId}` }] : []),
          { label: mode === 'edit' ? '수정' : '새 글' },
        ]}
        actions={
          <Link
            href={mode === 'edit' && boardId ? `/boss/community/${boardId}` : '/boss/community'}
            className="inline-flex items-center gap-1 text-xs text-boss-text-muted hover:text-boss-text"
          >
            <ArrowLeft size={12} /> 목록으로
          </Link>
        }
      />

      <Card padded>
        <div className="space-y-5">
          {/* 카테고리 */}
          <div>
            <label className="boss-label">게시판</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ key, label }) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-boss-primary bg-boss-primary/10 text-boss-primary'
                        : 'border-boss-border bg-boss-surface text-boss-text-secondary hover:text-boss-text'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="subject" className="boss-label">
                제목
              </label>
              <span className="text-[10px] text-boss-text-muted">{subject.length}/100</span>
            </div>
            <input
              id="subject"
              type="text"
              maxLength={100}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="제목을 입력하세요"
              className="boss-input h-11 w-full border-boss-border-strong bg-boss-surface px-3 text-sm focus:border-boss-primary focus:ring-boss-primary/15"
            />
          </div>

          {/* 구인/구직 메타 */}
          {isJob && (
            <div className="rounded-lg border border-boss-border bg-boss-elevated/40 p-4">
              <h3 className="mb-3 text-sm font-semibold text-boss-text">구인 / 구직 정보</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <JobField label="근무 지역" value={jobMeta.region} onChange={(v) => setJobMeta((m) => ({ ...m, region: v }))} placeholder="예: 서울 강남구" />
                <JobField label="직종 / 업무" value={jobMeta.jobType} onChange={(v) => setJobMeta((m) => ({ ...m, jobType: v }))} placeholder="예: 도배 공수, 현장 보조" />
                <JobField label="급여 / 조건" value={jobMeta.pay} onChange={(v) => setJobMeta((m) => ({ ...m, pay: v }))} placeholder="예: 일당 15만원" />
                <JobField label="연락처" value={jobMeta.contact} onChange={(v) => setJobMeta((m) => ({ ...m, contact: v }))} placeholder="예: 010-1234-5678" />
                <JobField label="모집 인원" value={jobMeta.headcount} onChange={(v) => setJobMeta((m) => ({ ...m, headcount: v }))} placeholder="예: 2명" />
                <JobField label="근무 기간" value={jobMeta.period} onChange={(v) => setJobMeta((m) => ({ ...m, period: v }))} placeholder="예: 6개월 이상" />
              </div>
            </div>
          )}

          {/* 내용 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="boss-label">내용</label>
              <span className="text-[10px] text-boss-text-muted">{plainLength.toLocaleString()}자</span>
            </div>
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
            <p className="mt-1.5 text-[10px] text-boss-text-muted">
              Cmd/Ctrl + B 굵게 · Cmd/Ctrl + I 기울임 · 툴바에서 제목·목록·인용·링크 삽입
            </p>
          </div>

          {mode === 'create' && draftSavedAt && (
            <p className="text-[11px] text-boss-text-muted">
              임시 저장: {new Date(draftSavedAt).toLocaleString('ko-KR')}
            </p>
          )}

          {/* 액션 */}
          <div className="sticky bottom-4 z-20 -mx-2 -mb-2 flex items-center justify-between gap-3 rounded-lg border border-boss-border bg-boss-surface/95 p-3 shadow-boss-md backdrop-blur">
            <div className="flex items-center gap-2">
              {mode === 'create' && (
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetDraft}>
                  초기화
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={mode === 'edit' && boardId ? `/boss/community/${boardId}` : '/boss/community'}
                className="boss-btn boss-btn-secondary h-9 px-4 text-xs"
              >
                취소
              </Link>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSubmit} disabled={submitting}>
                {submitting ? (mode === 'edit' ? '수정 중…' : '등록 중…') : mode === 'edit' ? '수정 완료' : '게시글 등록'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function JobField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-boss-text-secondary">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="boss-input h-9 w-full border-boss-border-strong bg-boss-surface px-3 text-sm focus:border-boss-primary focus:ring-boss-primary/15"
      />
    </div>
  );
}
