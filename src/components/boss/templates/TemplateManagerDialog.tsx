'use client';

// 답변 양식 관리 대화상자 — 앱 `web_template_manage_page.dart` 를 답변 화면 안으로 옮긴 것
//
// 앱은 답변 화면에서 ⚙ 을 누르면 양식 관리 화면으로 갔다가 돌아온다.
// 웹은 쓰던 답변이 날아가지 않도록 화면 위에 띄워서 추가 · 수정 · 삭제하고,
// 고른 양식을 바로 답변에 넣을 수도 있다("이 양식 쓰기").
//
// 저장 규칙은 웹견적서 관리 화면(/boss/templates)과 같다:
//   이름 · 제목 · 내용이 모두 있어야 저장, 기본 양식(isDefault)은 수정 · 삭제 불가.

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Plus, Lock, Pencil, Trash2, Check } from 'lucide-react';
import { bossTemplatesApi } from '@/lib/api/boss/templates';
import { getBossCustId } from '@/lib/api/boss/as';
import { mergeWithDefaults } from '@/lib/boss/defaultTemplates';
import type { BossTemplate, BossTemplateFormValue } from '@/types/boss-templates';
import RichEditor from '@/components/boss/RichEditor';
import { Button, Field, FieldLabel, ConfirmDialog, Tag } from '@/components/boss/ui';

export const DEFAULT_TEMPLATE_TITLE = '견적서 보내드립니다.';

const emptyForm: BossTemplateFormValue = { name: '', title: DEFAULT_TEMPLATE_TITLE, content: '' };

/** 서버 TB_WEB_TEMPLATE.CONTENT 가 2,000자 — 서식(HTML) 포함 길이라 편집기 아래에 남은 글자를 보여 준다 */
export const TEMPLATE_CONTENT_MAX = 2000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 양식 목록 — 기본 2개(앱과 같은 글) + 서버에 저장한 것. 답변 화면과 대화상자가 같이 쓴다 */
export async function loadTemplates(): Promise<{ list: BossTemplate[]; error?: string }> {
  const cid = getBossCustId();
  if (!cid) return { list: mergeWithDefaults([]), error: '로그인 정보가 없습니다.' };
  try {
    const res = await bossTemplatesApi.list(cid);
    // 서버가 실패해도 기본 양식 2개는 남긴다 — 양식이 하나도 없는 사장님도 답변할 수 있어야 한다
    if (!res.success) return { list: mergeWithDefaults([]), error: res.message || '양식을 불러오지 못했습니다.' };
    return { list: mergeWithDefaults((res.data ?? []) as BossTemplate[]) };
  } catch {
    return { list: mergeWithDefaults([]), error: '양식을 불러오지 못했습니다.' };
  }
}

type Mode = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; target: BossTemplate };

export default function TemplateManagerDialog({
  open,
  templates,
  onClose,
  onChanged,
  onPick,
}: {
  open: boolean;
  templates: BossTemplate[];
  onClose: () => void;
  /** 추가 · 수정 · 삭제 뒤 새 목록을 돌려준다 */
  onChanged: (list: BossTemplate[]) => void;
  /** "이 양식 쓰기" — 답변에 바로 넣는다 */
  onPick: (t: BossTemplate) => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [form, setForm] = useState<BossTemplateFormValue>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BossTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) setMode({ kind: 'list' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving && !pendingDelete) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, pendingDelete, onClose]);

  const refresh = useCallback(async () => {
    const { list, error } = await loadTemplates();
    if (error) toast.error(error);
    onChanged(list);
  }, [onChanged]);

  if (!open) return null;

  const startCreate = () => {
    setForm({ ...emptyForm });
    setMode({ kind: 'create' });
  };
  const startEdit = (t: BossTemplate) => {
    setForm({ name: t.name, title: t.title || DEFAULT_TEMPLATE_TITLE, content: t.content });
    setMode({ kind: 'edit', target: t });
  };
  const update = (field: keyof BossTemplateFormValue, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const missing = [
    !form.name.trim() && '이름',
    !form.title.trim() && '제목',
    !stripHtml(form.content) && '내용',
  ].filter((v): v is string => Boolean(v));

  const save = async () => {
    if (missing.length > 0) {
      toast.error(`${missing.join(' · ')}을(를) 입력해 주세요.`);
      return;
    }
    if (form.content.length > TEMPLATE_CONTENT_MAX) {
      toast.error(`양식 내용은 서식 포함 ${TEMPLATE_CONTENT_MAX.toLocaleString('ko-KR')}자까지 저장할 수 있습니다.`);
      return;
    }
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인 정보가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      if (mode.kind === 'edit') {
        const res = await bossTemplatesApi.update({
          id: Number(mode.target.id) || 0,
          custId,
          name: form.name.trim(),
          title: form.title.trim(),
          content: form.content.trim(),
          sortOrder: mode.target.sortOrder ?? 0,
        });
        if (res.success === false) {
          toast.error(res.message || '수정에 실패했습니다.');
          return;
        }
        toast.success('양식을 고쳤습니다.');
      } else {
        const nextOrder = templates.length > 0 ? Math.max(...templates.map((t) => t.sortOrder ?? 0)) + 1 : 0;
        const res = await bossTemplatesApi.create({
          custId,
          name: form.name.trim(),
          title: form.title.trim(),
          content: form.content.trim(),
          sortOrder: nextOrder,
        });
        if (res.success === false) {
          toast.error(res.message || '추가에 실패했습니다.');
          return;
        }
        toast.success('양식을 추가했습니다.');
      }
      await refresh();
      setMode({ kind: 'list' });
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const t = pendingDelete;
    const custId = getBossCustId();
    if (!t || t.isDefault || !custId) return;
    setDeleting(true);
    try {
      const res = await bossTemplatesApi.remove(t.id, custId);
      if (res.success === false) {
        toast.error(res.message || '삭제에 실패했습니다.');
        return;
      }
      toast.success('양식을 지웠습니다.');
      setPendingDelete(null);
      await refresh();
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const editing = mode.kind !== 'list';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="답변 양식 관리"
        className="flex max-h-[92dvh] w-full max-w-[760px] flex-col border border-boss-border bg-boss-surface"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <div>
            <p className="text-[15px] font-semibold text-boss-text">
              {mode.kind === 'list' ? '답변 양식 관리' : mode.kind === 'edit' ? '양식 고치기' : '새 양식'}
            </p>
            <p className="mt-0.5 text-[12px] text-boss-text-secondary">
              {mode.kind === 'list'
                ? '자주 쓰는 답변을 양식으로 저장해 두고 골라 넣습니다. 이름은 사장님만 보고, 제목과 내용이 고객에게 갑니다.'
                : '이름 · 제목 · 내용을 채우면 저장할 수 있습니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="boss-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {mode.kind === 'list' ? (
            templates.length === 0 ? (
              <div className="border border-dashed border-boss-border px-4 py-8 text-center">
                <p className="text-[13px] text-boss-text-secondary">저장한 양식이 없습니다.</p>
                <Button variant="primary" size="sm" icon={Plus} className="mt-3" onClick={startCreate}>
                  첫 양식 만들기
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col border border-boss-border">
                {templates.map((t) => (
                  <li
                    key={String(t.id)}
                    className="flex items-start gap-3 border-b border-boss-border-row px-3.5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13.5px] font-semibold text-boss-text">{t.name}</span>
                        {t.isDefault ? (
                          <Tag tone="neutral">
                            <Lock size={10} className="mr-0.5 inline" />
                            기본
                          </Tag>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-boss-text-secondary">{t.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-boss-text-muted">
                        {stripHtml(t.content) || '(내용 없음)'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="primary" size="sm" icon={Check} onClick={() => onPick(t)}>
                        이 양식 쓰기
                      </Button>
                      {!t.isDefault && (
                        <>
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => startEdit(t)} title="고치기">
                            고치기
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            className="!text-boss-text-muted hover:!text-boss-error"
                            onClick={() => setPendingDelete(t)}
                            title="지우기"
                          >
                            지우기
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  id="tm-name"
                  label="양식 이름"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="예) 아파트 실크벽지, 원룸 합지"
                  autoFocus
                  maxLength={100}
                />
                <Field
                  id="tm-title"
                  label="답변 제목"
                  required
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder={DEFAULT_TEMPLATE_TITLE}
                  maxLength={200}
                />
              </div>
              <div>
                <FieldLabel required>답변 내용</FieldLabel>
                <RichEditor
                  value={form.content}
                  onChange={(html) => update('content', html)}
                  placeholder="시공 범위 · 자재 · 일정 · AS 조건처럼 매번 적는 문구를 넣어 두세요."
                  minHeight={220}
                />
                <p
                  className={`mt-1 text-right font-boss-head text-[12px] tabular-nums ${
                    form.content.length > TEMPLATE_CONTENT_MAX ? 'text-boss-error' : 'text-boss-text-muted'
                  }`}
                >
                  {form.content.length.toLocaleString('ko-KR')}/{TEMPLATE_CONTENT_MAX.toLocaleString('ko-KR')} (서식 포함)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-boss-border px-5 py-3">
          {editing ? (
            <>
              <span className="text-[12.5px] text-boss-text-secondary">
                {missing.length > 0 ? `${missing.join(' · ')} 남음` : '저장할 수 있습니다'}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setMode({ kind: 'list' })} disabled={saving}>
                  목록으로
                </Button>
                <Button variant="primary" size="sm" onClick={save} disabled={saving}>
                  {saving ? '저장 중…' : mode.kind === 'edit' ? '고친 내용 저장' : '양식 추가'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[12.5px] text-boss-text-secondary">{templates.length}개 양식</span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={Plus} onClick={startCreate}>
                  새 양식
                </Button>
                <Button variant="primary" size="sm" onClick={onClose}>
                  닫기
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="양식 삭제"
        description={`'${pendingDelete?.name ?? ''}' 양식을 지웁니다. 지운 양식은 되돌릴 수 없습니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
