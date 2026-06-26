'use client';

// 사장님 웹견적서 답변 템플릿 관리 페이지
// Flutter `lib/app/web/web_template_manage_page.dart` 의 React 포팅 버전
// - 현재 로그인 사장님의 custId 로 템플릿 목록 조회
// - 추가 / 수정 / 삭제 / 미리보기 지원
// - 기본 템플릿(isDefault) 은 수정·삭제 불가
// - 견적 답변에 재사용될 본문(content) 은 textarea 로 작성
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  RefreshCw,
  Inbox,
  X,
  Lock,
} from 'lucide-react';
import { bossTemplatesApi } from '@/lib/api/boss/templates';
import { getBossCustId } from '@/lib/api/boss/as';
import type { BossTemplate, BossTemplateFormValue } from '@/types/boss-templates';
import RichEditor from '@/components/boss/RichEditor';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';

const DEFAULT_TITLE = '견적서 보내드립니다.';

type EditorMode = 'create' | 'edit';

interface EditorState {
  open: boolean;
  mode: EditorMode;
  // edit 모드일 때만 존재
  target: BossTemplate | null;
  value: BossTemplateFormValue;
}

const emptyForm: BossTemplateFormValue = {
  name: '',
  title: DEFAULT_TITLE,
  content: '',
};

export default function BossTemplatesPage() {
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custId, setCustId] = useState<string>('');

  // 미리보기/편집 모달 상태
  const [previewTarget, setPreviewTarget] = useState<BossTemplate | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    mode: 'create',
    target: null,
    value: emptyForm,
  });
  const [saving, setSaving] = useState(false);

  // 목록 조회
  const load = useCallback(async () => {
    const cid = getBossCustId();
    setCustId(cid);
    if (!cid) {
      setError('로그인 정보가 없습니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossTemplatesApi.list(cid);
      if (res.success) {
        const list = (res.data ?? []) as BossTemplate[];
        // sortOrder 기준 오름차순 정렬, 동일 시 id 순
        const sorted = [...list].sort((a, b) => {
          const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          if (so !== 0) return so;
          return String(a.id).localeCompare(String(b.id));
        });
        setTemplates(sorted);
      } else {
        setTemplates([]);
        setError(res.message || '템플릿을 불러오지 못했습니다.');
      }
    } catch {
      setError('템플릿을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 신규 추가 다이얼로그 열기
  const openCreate = (prefill?: BossTemplateFormValue) => {
    setEditor({
      open: true,
      mode: 'create',
      target: null,
      value: prefill ?? { ...emptyForm },
    });
  };

  // 수정 다이얼로그 열기
  const openEdit = (t: BossTemplate) => {
    setEditor({
      open: true,
      mode: 'edit',
      target: t,
      value: { name: t.name, title: t.title, content: t.content },
    });
  };

  // 복제 (이름에 "(복사)" 붙여 신규 추가 모달로 진입)
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

  // 저장 처리 (생성/수정)
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

  // 삭제 처리
  const handleDelete = async (t: BossTemplate) => {
    if (t.isDefault) return;
    if (!custId) return;
    if (!confirm(`"${t.name}" 템플릿을 삭제하시겠습니까?`)) return;
    try {
      const res = await bossTemplatesApi.remove(t.id, custId);
      if (res.success !== false) {
        toast.success('삭제 완료');
        await load();
      } else {
        toast.error(res.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  // 통계
  const stats = useMemo(() => {
    const total = templates.length;
    const def = templates.filter((t) => t.isDefault).length;
    return { total, def, user: total - def };
  }, [templates]);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <FileText size={22} className="text-boss-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-boss-text">답변 템플릿</h1>
          </div>
          <p className="text-sm text-boss-text-muted">
            웹 견적서 답변에 자주 사용하는 문구를 템플릿으로 저장해 두고 한 번에 불러오세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-surface px-3 text-sm text-boss-text-secondary hover:border-boss-border hover:text-boss-text disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-3 text-sm font-medium text-boss-text hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 템플릿 추가
          </button>
        </div>
      </div>

      {/* 안내 + 통계 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-4">
          <div className="text-[11px] font-semibold uppercase text-boss-text-muted">전체</div>
          <div className="mt-1 text-2xl font-bold text-boss-text">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-4">
          <div className="text-[11px] font-semibold uppercase text-boss-text-muted">기본 템플릿</div>
          <div className="mt-1 text-2xl font-bold text-boss-text">{stats.def}</div>
        </div>
        <div className="rounded-2xl border border-boss-border bg-boss-surface/50 p-4">
          <div className="text-[11px] font-semibold uppercase text-boss-text-muted">사용자 템플릿</div>
          <div className="mt-1 text-2xl font-bold text-boss-primary">{stats.user}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 목록 */}
      {loading && templates.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-boss-border bg-boss-surface"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-boss-elevated text-boss-text-muted">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-boss-text">등록된 템플릿이 없습니다</p>
          <p className="mt-1 text-xs text-boss-text-muted">새 템플릿을 추가해 보세요.</p>
          <button
            type="button"
            onClick={() => openCreate()}
            className="mt-4 flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-medium text-boss-text hover:bg-boss-primary-hover"
          >
            <Plus size={14} /> 템플릿 추가
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t, idx) => (
            <li
              key={String(t.id) || `tpl-${idx}`}
              className="rounded-2xl border border-boss-border bg-boss-surface/50 p-4 transition hover:border-boss-primary/20"
            >
              <div className="flex items-start gap-3">
                {/* 인덱스 / 잠금 아이콘 */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
                    t.isDefault
                      ? 'border-boss-border bg-boss-elevated/70 text-boss-text-muted'
                      : 'border-boss-primary/30 bg-boss-primary/10 text-boss-primary'
                  }`}
                >
                  {t.isDefault ? <Lock size={14} /> : idx + 1}
                </div>

                {/* 본문 */}
                <button
                  type="button"
                  onClick={() => setPreviewTarget(t)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-boss-text">{t.name}</span>
                    {t.isDefault && (
                      <span className="rounded bg-boss-elevated px-1.5 py-0.5 text-[10px] text-boss-text-muted">
                        기본
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-xs text-boss-text-muted">{t.title}</div>
                  <div className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-boss-text-muted">
                    {t.content ? t.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''}
                  </div>
                </button>

                {/* 액션 */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="미리보기"
                    onClick={() => setPreviewTarget(t)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-text-muted hover:border-boss-border hover:text-boss-text"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    title="복제"
                    onClick={() => duplicate(t)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-primary hover:border-boss-primary/20"
                  >
                    <Copy size={14} />
                  </button>
                  {!t.isDefault && (
                    <button
                      type="button"
                      title="수정"
                      onClick={() => openEdit(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-info hover:border-sky-500/40"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {!t.isDefault && (
                    <button
                      type="button"
                      title="삭제"
                      onClick={() => handleDelete(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-800/60 bg-rose-950/30 text-boss-error hover:bg-rose-950/60"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 미리보기 모달 */}
      {previewTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-boss-border bg-boss-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-boss-border px-5 py-4">
              <Eye size={18} className="text-boss-primary" />
              <h2 className="flex-1 truncate text-base font-semibold text-boss-text">
                {previewTarget.name}
              </h2>
              {previewTarget.isDefault && (
                <span className="rounded bg-boss-elevated px-1.5 py-0.5 text-[10px] text-boss-text-muted">
                  기본
                </span>
              )}
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase text-boss-text-muted">
                  제목
                </div>
                <div className="rounded-lg border border-boss-border bg-boss-surface px-3 py-2.5 text-sm text-boss-text">
                  {previewTarget.title}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase text-boss-text-muted">
                  내용
                </div>
                {looksLikePlainText(previewTarget.content) ? (
                  <div className="whitespace-pre-wrap rounded-lg border border-boss-border bg-boss-surface px-3 py-2.5 text-sm leading-relaxed text-boss-text">
                    {previewTarget.content}
                  </div>
                ) : (
                  <div
                    className="prose prose-invert prose-sm max-w-none rounded-lg border border-boss-border bg-boss-surface px-3 py-2.5 leading-relaxed prose-headings:text-boss-text prose-strong:text-boss-text prose-blockquote:border-l-emerald-500"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTarget.content) }}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-boss-border px-5 py-3">
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="h-9 rounded-lg border border-boss-border bg-boss-surface px-4 text-sm text-boss-text hover:border-boss-border hover:text-boss-text"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {editor.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeEditor}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-boss-border bg-boss-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-boss-border px-5 py-4">
              <FileText size={18} className="text-boss-primary" />
              <h2 className="flex-1 text-base font-semibold text-boss-text">
                {editor.mode === 'edit' ? '템플릿 수정' : '템플릿 추가'}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase text-boss-text-muted">
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={editor.value.name}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, value: { ...s.value, name: e.target.value } }))
                  }
                  placeholder="예: 도배 공사용, 인테리어용"
                  className="w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2.5 text-sm text-boss-text placeholder-slate-600 focus:border-boss-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase text-boss-text-muted">
                  견적서 제목 *
                </label>
                <input
                  type="text"
                  value={editor.value.title}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, value: { ...s.value, title: e.target.value } }))
                  }
                  placeholder="예: 견적서 보내드립니다."
                  className="w-full rounded-lg border border-boss-border bg-boss-surface px-3 py-2.5 text-sm text-boss-text placeholder-slate-600 focus:border-boss-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase text-boss-text-muted">
                  견적서 내용 *
                </label>
                <RichEditor
                  value={editor.value.content}
                  onChange={(html) =>
                    setEditor((s) => ({ ...s, value: { ...s.value, content: html } }))
                  }
                  placeholder="■ 서비스 내용 — 굵게, 목록, 링크를 사용해 전문적인 답변 템플릿을 작성하세요"
                  minHeight={260}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="h-9 rounded-lg border border-boss-border bg-boss-surface px-4 text-sm text-boss-text hover:border-boss-border hover:text-boss-text disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-boss-primary px-4 text-sm font-medium text-boss-text hover:bg-boss-primary-hover disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {editor.mode === 'edit' ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
