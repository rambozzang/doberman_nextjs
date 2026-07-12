'use client';

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
  Save,
} from 'lucide-react';
import { bossTemplatesApi } from '@/lib/api/boss/templates';
import { getBossCustId } from '@/lib/api/boss/as';
import type { BossTemplate, BossTemplateFormValue } from '@/types/boss-templates';
import RichEditor from '@/components/boss/RichEditor';
import { sanitizeHtml, looksLikePlainText } from '@/lib/sanitizeHtml';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  IconButton,
  Badge,
  ListTabs,
  DataTable,
  EmptyState,
  Skeleton,
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

  const openCreate = (prefill?: BossTemplateFormValue) => {
    setEditor({
      open: true,
      mode: 'create',
      target: null,
      value: prefill ?? { ...emptyForm },
    });
  };

  const openEdit = (t: BossTemplate) => {
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="답변 템플릿"
        description="웹 견적서 답변에 자주 쓰는 문구를 템플릿으로 저장하고 불러오세요."
      />

      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="이름·제목·내용 검색"
          className="w-full max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
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
      </Toolbar>

      <ListTabs
        tabs={KIND_TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {loading && templates.length === 0 ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="등록된 템플릿이 없습니다"
          description="자주 쓰는 견적 답변을 템플릿으로 만들어 시간을 아끼세요."
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openCreate()}>
              템플릿 추가
            </Button>
          }
        />
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
              return (
                <tr
                  key={String(t.id)}
                  className="cursor-pointer"
                  onClick={() => setPreviewTarget(t)}
                >
                  <td>
                    <span className="flex items-center gap-1.5 font-medium text-boss-text">
                      {t.isDefault ? (
                        <Lock size={13} className="shrink-0 text-boss-text-muted" />
                      ) : (
                        <FileText size={13} className="shrink-0 text-boss-text-muted" />
                      )}
                      <span className="truncate">{t.name}</span>
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">{t.title || '-'}</td>
                  <td className="text-boss-text-muted">
                    {contentPreview ? (
                      <span className="line-clamp-1 max-w-[280px]">{contentPreview}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {t.isDefault ? (
                      <Badge tone="default">기본</Badge>
                    ) : (
                      <Badge tone="emerald">사용자</Badge>
                    )}
                  </td>
                  <td
                    className="whitespace-nowrap text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon={Copy} label="복사" onClick={() => duplicate(t)} />
                      {!t.isDefault && (
                        <IconButton
                          icon={Trash2}
                          label="삭제"
                          onClick={() => void handleDelete(t)}
                        />
                      )}
                      {t.isDefault ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => setPreviewTarget(t)}
                        >
                          보기
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Pencil}
                          onClick={() => openEdit(t)}
                        >
                          편집
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 미리보기 모달 */}
      {previewTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-boss-border px-5 py-3">
              <Eye size={16} className="shrink-0 text-boss-primary" />
              <h2 className="flex-1 truncate text-sm font-semibold text-boss-text">
                {previewTarget.name}
              </h2>
              {previewTarget.isDefault && <Badge tone="default">기본</Badge>}
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
                  제목
                </p>
                <div className="rounded-lg border border-boss-border bg-boss-bg px-3 py-2.5 text-sm text-boss-text">
                  {previewTarget.title}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-boss-text-muted">
                  내용
                </p>
                {looksLikePlainText(previewTarget.content) ? (
                  <div className="whitespace-pre-wrap rounded-lg border border-boss-border bg-boss-bg px-3 py-2.5 text-sm leading-relaxed text-boss-text">
                    {previewTarget.content}
                  </div>
                ) : (
                  <div
                    className="prose dark:prose-invert prose-sm max-w-none rounded-lg border border-boss-border bg-boss-bg px-3 py-2.5 leading-relaxed prose-headings:text-boss-text prose-strong:text-boss-text prose-blockquote:border-l-boss-primary"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewTarget.content) }}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-boss-border px-5 py-3">
              <Button variant="secondary" size="sm" onClick={() => setPreviewTarget(null)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {editor.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeEditor}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-boss-border bg-boss-surface shadow-boss-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-boss-border px-5 py-3">
              <FileText size={16} className="shrink-0 text-boss-primary" />
              <h2 className="flex-1 text-sm font-semibold text-boss-text">
                {editor.mode === 'edit' ? '템플릿 수정' : '새 템플릿 추가'}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="flex h-8 w-8 items-center justify-center rounded-md text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="boss-label">템플릿 이름 *</label>
                <input
                  type="text"
                  value={editor.value.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="예: 도배 공사용, 인테리어용"
                  className="boss-input h-11"
                />
              </div>
              <div>
                <label className="boss-label">견적서 제목 *</label>
                <input
                  type="text"
                  value={editor.value.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="예: 견적서 보내드립니다."
                  className="boss-input h-11"
                />
              </div>
              <div>
                <label className="boss-label">견적서 내용 *</label>
                <RichEditor
                  value={editor.value.content}
                  onChange={(html) => update('content', html)}
                  placeholder="굵게, 목록, 링크를 사용해 전문적인 답변 템플릿을 작성하세요."
                  minHeight={260}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
              <Button variant="secondary" size="sm" onClick={closeEditor} disabled={saving}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={saving ? RefreshCw : Save}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : editor.mode === 'edit' ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
