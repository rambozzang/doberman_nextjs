'use client';

// 사장님 답변 템플릿 — Industry 패턴 (agent.opentohome.com)
// 웹 견적서 답변에 자주 쓰는 문구를 저장 · 불러온다. (GET/POST/PUT/DELETE /templates)
//
//   필터 줄 : ListTabs(전체 · 기본 · 사용자 + 건수) + 검색 + 우측 "전체 n건" · 새로고침 · 템플릿 추가
//   편집    : 모달이 아니라 표 위에 뜨는 폼 패널(참조 04-listing-new) — 좌 폼 2열 grid + RichEditor,
//             우 안내 패널(필수 누락 · 기본 템플릿 안내), 하단 액션(취소 secondary / 저장 primary 우측)
//   미리보기: 표 위 패널(제목 · 내용) + 복사 · 편집 액션
//   표      : 이름 · 견적서 제목 · 내용 · 구분 Tag · 액션(미리보기 · 복사 · 편집/삭제)
//   삭제는 ConfirmDialog. 첫 조회 실패(AlertBanner)와 0건(검색/구분 안내)을 구분한다.
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Inbox, Lock, Copy } from 'lucide-react';
import { bossTemplatesApi } from '@/lib/api/boss/templates';
import { getBossCustId } from '@/lib/api/boss/as';
import { mergeWithDefaults } from '@/lib/boss/defaultTemplates';
import { TEMPLATE_CONTENT_MAX } from '@/components/boss/templates/TemplateManagerDialog';
import type { BossTemplate, BossTemplateFormValue } from '@/types/boss-templates';
import RichEditor from '@/components/boss/RichEditor';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';
import {
  SearchInput,
  Button,
  Tag,
  ListTabs,
  DataTable,
  EmptyState,
  RowSkeleton,
  ContentCard,
  ConfirmDialog,
  AlertBanner,
  Panel,
  Field,
  FieldLabel,
  Kicker,
} from '@/components/boss/ui';

const DEFAULT_TITLE = '견적서 보내드립니다.';

type EditorMode = 'create' | 'edit';
type KindFilter = 'all' | 'default' | 'user';

const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'default', label: '기본' },
  { key: 'user', label: '사용자' },
];

interface EditorState {
  open: boolean;
  mode: EditorMode;
  target: BossTemplate | null;
  value: BossTemplateFormValue;
}

const emptyForm: BossTemplateFormValue = {
  name: '',
  title: DEFAULT_TITLE,
  content: '',
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 저장된 HTML 본문 — typography 플러그인이 없으므로 필요한 요소만 직접 조판한다
const HTML_BODY_CLS =
  'text-[13.5px] leading-[1.75] text-boss-text [&_p]:my-1.5 [&_a]:text-boss-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_h2]:mt-3 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-[14.5px] [&_h3]:font-semibold ' +
  '[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-boss-primary [&_blockquote]:pl-3 [&_blockquote]:text-boss-text-secondary ' +
  '[&_code]:bg-boss-inset [&_code]:px-1 [&_code]:font-boss-head [&_strong]:font-semibold';

export default function BossTemplatesPage() {
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custId, setCustId] = useState('');
  const [tab, setTab] = useState<KindFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [previewTarget, setPreviewTarget] = useState<BossTemplate | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    mode: 'create',
    target: null,
    value: emptyForm,
  });
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BossTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 편집 · 미리보기 패널은 표 위에 뜬다 — 표 아래쪽 행에서 열면 화면 밖이라 패널로 스크롤한다
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor.open || previewTarget) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editor.open, previewTarget]);

  const load = useCallback(async () => {
    const cid = getBossCustId();
    setCustId(cid);
    if (!cid) {
      setError('로그인 정보가 없습니다. 다시 로그인한 뒤 열어 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossTemplatesApi.list(cid);
      if (res.success) {
        // 기본 2개(앱과 같은 글)가 맨 앞, 그 뒤에 내가 만든 양식
        setTemplates(mergeWithDefaults((res.data ?? []) as BossTemplate[]));
      } else {
        setTemplates(mergeWithDefaults([]));
        setError(res.message || '템플릿을 불러오지 못했습니다.');
      }
    } catch {
      setTemplates(mergeWithDefaults([]));
      setError('템플릿을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (prefill?: BossTemplateFormValue) => {
    setPreviewTarget(null);
    setEditor({
      open: true,
      mode: 'create',
      target: null,
      value: prefill ?? { ...emptyForm },
    });
  };

  const openEdit = (t: BossTemplate) => {
    setPreviewTarget(null);
    setEditor({
      open: true,
      mode: 'edit',
      target: t,
      value: { name: t.name, title: t.title, content: t.content },
    });
  };

  const duplicate = (t: BossTemplate) => {
    openCreate({
      name: `${t.name} (복사)`,
      title: t.title || DEFAULT_TITLE,
      content: t.content,
    });
  };

  const closeEditor = () => {
    if (saving) return;
    setEditor((s) => ({ ...s, open: false }));
  };

  const openPreview = (t: BossTemplate) => {
    setEditor((s) => (s.open ? { ...s, open: false } : s));
    setPreviewTarget(t);
  };

  const handleSave = async () => {
    const v = editor.value;
    if (!v.name.trim()) {
      toast.error('템플릿 이름을 입력해주세요');
      return;
    }
    if (!v.title.trim()) {
      toast.error('견적서 제목을 입력해주세요');
      return;
    }
    if (!v.content.trim()) {
      toast.error('견적서 내용을 입력해주세요');
      return;
    }
    if (v.content.length > TEMPLATE_CONTENT_MAX) {
      toast.error(`견적서 내용은 서식 포함 ${TEMPLATE_CONTENT_MAX.toLocaleString('ko-KR')}자까지 저장할 수 있습니다.`);
      return;
    }
    if (!custId) {
      toast.error('로그인 정보가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      if (editor.mode === 'edit' && editor.target) {
        const numericId = Number(editor.target.id) || 0;
        const res = await bossTemplatesApi.update({
          id: numericId,
          custId,
          name: v.name.trim(),
          title: v.title.trim(),
          content: v.content.trim(),
          sortOrder: editor.target.sortOrder ?? 0,
        });
        if (res.success !== false) {
          toast.success('수정 완료');
          setEditor((s) => ({ ...s, open: false }));
          await load();
        } else {
          toast.error(res.message || '수정에 실패했습니다.');
        }
      } else {
        const nextOrder =
          templates.length > 0
            ? Math.max(...templates.map((t) => t.sortOrder ?? 0)) + 1
            : 0;
        const res = await bossTemplatesApi.create({
          custId,
          name: v.name.trim(),
          title: v.title.trim(),
          content: v.content.trim(),
          sortOrder: nextOrder,
        });
        if (res.success !== false) {
          toast.success('추가 완료');
          setEditor((s) => ({ ...s, open: false }));
          await load();
        } else {
          toast.error(res.message || '추가에 실패했습니다.');
        }
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 템플릿 삭제 (확인 모달 → API → 목록 새로고침)
  const handleDelete = async () => {
    const t = pendingDelete;
    if (!t || t.isDefault) return;
    if (!custId) return;
    setDeleting(true);
    try {
      const res = await bossTemplatesApi.remove(t.id, custId);
      if (res.success !== false) {
        toast.success('삭제 완료');
        setPendingDelete(null);
        await load();
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const update = (field: keyof BossTemplateFormValue, val: string) =>
    setEditor((s) => ({ ...s, value: { ...s.value, [field]: val } }));

  const counts = useMemo(() => {
    const c = { all: templates.length, default: 0, user: 0 };
    templates.forEach((t) => {
      if (t.isDefault) c.default++;
      else c.user++;
    });
    return c;
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (tab === 'default') list = list.filter((t) => t.isDefault);
    else if (tab === 'user') list = list.filter((t) => !t.isDefault);
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((t) =>
        [t.name, t.title, stripHtml(t.content || '')]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    return list;
  }, [templates, tab, keyword]);

  const isFiltered = keyword.trim().length > 0 || tab !== 'all';

  // 편집 폼 필수 누락 — 참조 04 의 우측 "필수 누락" 패널
  const missing = useMemo(() => {
    const v = editor.value;
    const m: string[] = [];
    if (!v.name.trim()) m.push('템플릿 이름');
    if (!v.title.trim()) m.push('견적서 제목');
    if (!stripHtml(v.content || '')) m.push('견적서 내용');
    return m;
  }, [editor.value]);

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs
          tabs={KIND_TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
          active={tab}
          onChange={setTab}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이름 · 제목 · 내용 검색"
          className="w-full sm:w-[240px]"
          hint={false}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : `전체 ${filtered.length}건`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={load}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreate()}>
            템플릿 추가
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={load}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* 편집 · 미리보기 패널 앵커 */}
      <div ref={panelRef} className="scroll-mt-[120px]" />

      {/* 편집 패널 — 좌 폼 / 우 안내 */}
      {editor.open && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4">
            <Panel
              kicker={editor.mode === 'edit' ? '수정' : '새 템플릿'}
              title={editor.mode === 'edit' ? editor.target?.name ?? '템플릿 수정' : '템플릿 추가'}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  id="tpl-name"
                  label="템플릿 이름"
                  required
                  value={editor.value.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="예) 도배 공사용, 인테리어용"
                  autoFocus
                  maxLength={100}
                />
                <Field
                  id="tpl-title"
                  label="견적서 제목"
                  required
                  value={editor.value.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="예) 견적서 보내드립니다."
                  maxLength={200}
                />
              </div>
              <div className="mt-4">
                <FieldLabel required>견적서 내용</FieldLabel>
                <RichEditor
                  value={editor.value.content}
                  onChange={(html) => update('content', html)}
                  placeholder="굵게 · 목록 · 링크를 써서 고객에게 보낼 답변을 작성하세요."
                  minHeight={260}
                />
                <p
                  className={`mt-1 text-right font-boss-head text-[12px] tabular-nums ${
                    editor.value.content.length > TEMPLATE_CONTENT_MAX ? 'text-boss-error' : 'text-boss-text-muted'
                  }`}
                >
                  {editor.value.content.length.toLocaleString('ko-KR')}/{TEMPLATE_CONTENT_MAX.toLocaleString('ko-KR')} (서식 포함)
                </p>
              </div>
            </Panel>

            {/* 하단 액션 패널 */}
            <div className="boss-card flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="text-[12.5px] text-boss-text-secondary">
                {missing.length > 0 ? `필수 ${missing.length}항목 남음` : '저장할 수 있습니다'}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" onClick={closeEditor} disabled={saving}>
                  취소
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중…' : editor.mode === 'edit' ? '수정 저장' : '추가'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Panel kicker="필수 항목">
              {missing.length === 0 ? (
                <p className="text-[13px] text-boss-text-secondary">모두 채웠습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-[13px] text-boss-error">
                  {missing.map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel kicker="안내">
              <p className="text-[12.5px] leading-[1.65] text-boss-text-secondary">
                템플릿은 견적 요청에 답변할 때 불러와 쓰는 문구입니다. 이름은 사장님만 보고, 제목과 내용이
                고객에게 갑니다.
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-boss-text-secondary">
                기본 템플릿은 고칠 수 없습니다 — 복사해서 사용자 템플릿으로 만든 뒤 바꾸세요.
              </p>
            </Panel>
          </div>
        </div>
      )}

      {/* 미리보기 패널 */}
      {previewTarget && !editor.open && (
        <Panel
          kicker="미리보기"
          title={previewTarget.name}
          right={
            <div className="flex items-center gap-1.5">
              {previewTarget.isDefault && <Tag tone="neutral">기본</Tag>}
              <Button variant="secondary" size="sm" icon={Copy} onClick={() => duplicate(previewTarget)}>
                복사
              </Button>
              {!previewTarget.isDefault && (
                <Button variant="primary" size="sm" onClick={() => openEdit(previewTarget)}>
                  편집
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setPreviewTarget(null)}>
                닫기
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <div>
              <Kicker className="mb-1">제목</Kicker>
              <div className="boss-card-inset px-3 py-2.5 text-[13.5px] text-boss-text">
                {previewTarget.title || '—'}
              </div>
            </div>
            <div>
              <Kicker className="mb-1">내용</Kicker>
              {looksLikePlainText(previewTarget.content) ? (
                <div className="boss-card-inset whitespace-pre-wrap px-3 py-2.5 text-[13.5px] leading-[1.75] text-boss-text">
                  {previewTarget.content}
                </div>
              ) : (
                <div
                  className={`boss-card-inset px-3 py-2.5 ${HTML_BODY_CLS}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTarget.content) }}
                />
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* 표 */}
      {loading && templates.length === 0 ? (
        <ContentCard>
          <RowSkeleton rows={5} />
        </ContentCard>
      ) : filtered.length === 0 ? (
        error ? null : (
          <EmptyState
            icon={Inbox}
            title={isFiltered ? '조건에 맞는 템플릿이 없습니다' : '아직 만든 템플릿이 없습니다'}
            description={
              isFiltered
                ? "검색어를 지우거나 구분을 '전체'로 바꿔 보세요."
                : '자주 쓰는 견적 답변을 템플릿으로 만들어 두면 답변할 때 불러와 바로 보낼 수 있습니다.'
            }
            action={
              isFiltered ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setKeyword('');
                    setTab('all');
                  }}
                >
                  필터 초기화
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreate()}>
                  템플릿 추가
                </Button>
              )
            }
          />
        )
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이름</th>
              <th>견적서 제목</th>
              <th>내용</th>
              <th>구분</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const contentPreview = t.content ? stripHtml(t.content) : '';
              const isOpen = previewTarget?.id === t.id || (editor.open && editor.target?.id === t.id);
              return (
                <tr
                  key={String(t.id)}
                  className={`cursor-pointer ${isOpen ? '[&>td]:bg-boss-elevated' : ''}`}
                  onClick={() => openPreview(t)}
                >
                  <td className="wrap max-w-[240px]">
                    <span className="flex items-center gap-1.5 font-semibold text-boss-text">
                      {t.isDefault && (
                        <Lock size={12} strokeWidth={1.75} className="shrink-0 text-boss-text-muted" aria-label="기본 템플릿" />
                      )}
                      <span className="line-clamp-1">{t.name}</span>
                    </span>
                  </td>
                  <td className="wrap max-w-[260px]">
                    <span className="line-clamp-1 text-boss-text-secondary">{t.title || '—'}</span>
                  </td>
                  <td className="wrap max-w-[320px]">
                    <span className="line-clamp-1 text-[12.5px] text-boss-text-muted">
                      {contentPreview || '—'}
                    </span>
                  </td>
                  <td>
                    {t.isDefault ? (
                      <Tag tone="neutral">기본</Tag>
                    ) : (
                      <Tag tone="ok">사용자</Tag>
                    )}
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(t)}>
                        미리보기
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicate(t)}>
                        복사
                      </Button>
                      {t.isDefault ? null : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                            편집
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!text-boss-text-muted hover:!text-boss-error"
                            onClick={() => setPendingDelete(t)}
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="템플릿을 삭제할까요?"
        description={`"${pendingDelete?.name ?? ''}" — 삭제한 템플릿은 되돌릴 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
