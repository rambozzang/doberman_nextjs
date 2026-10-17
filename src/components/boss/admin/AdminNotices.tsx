'use client';

// 공지 관리 — 목록(검색 · 상태 · 쪽) → 새 공지 · 열기(수정 · 미리보기 · 공개/숨김) → 삭제
//
//   공지는 기존 앱 공지(TB_BOARD_MASTER NOTI)와 같은 글이다. 공개(PUBLISHED)만 앱 · 웹 회원에게 보이고, 임시 저장 · 숨김 · 삭제는 보이지 않는다.
//   본문은 일반 글자다 — 미리보기도 글자 그대로(줄바꿈만 살려) 그린다. 서버는 태그 모양 글자(<b> 등)를 걷어 내고 저장한다(미리보기도 같은 규칙).
//   공개로 저장할 때는 회원 전체에 바로 보인다는 확인 체크를 받는다. 푸시 · 이메일은 보내지 않는다(서버).
//   수정 · 삭제는 연 판의 수정 시각(expectedUpdatedAt)을 함께 보낸다 — 그사이 바뀌었으면 서버가 409 로 거절한다.
//     이때 적은 내용은 그대로 두고, "최신 내용 불러오기"를 눌러야 바꾼다(작성값을 말없이 버리지 않는다).
//   응답을 못 받았으면 자동으로 다시 보내지 않는다 — "결과 확인"으로 서버에 반영됐는지 본 뒤에만 다시 저장할 수 있다.
//   계정이 바뀌면 응답을 넣지 않고, 보내기 직전에도 다시 대조한다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';
import {
  NOTICE_CONTENT_MAX,
  NOTICE_EDITABLE_OPTIONS,
  NOTICE_STATUS_VIEW,
  NOTICE_TITLE_MAX,
  QUERY_MAX,
  REASON_MAX,
  hasTagLikeText,
  noticeBlockers,
  noticeMatches,
  noticePayload,
  plainNoticeContent,
  plainNoticeTitle,
  reasonBlocker,
  type NoticeForm,
} from '@/lib/boss/platformAdmin';
import { formatOpsDateTime } from '@/lib/boss/taxInvoiceOps';
import type { NoticeEditableStatus, NoticeStatusFilter, PlatformNotice } from '@/types/boss-platform-admin';
import {
  AlertBanner,
  Button,
  CheckLine,
  DescRow,
  Field,
  RadioOption,
  Segmented,
  Skeleton,
  TextareaField,
} from '@/components/boss/ui';
import OpsDialog from '@/components/boss/taxinvoice/OpsDialog';
import {
  AdminSearch,
  AdminTable,
  Blockers,
  ListBar,
  ListBody,
  LoadFailure,
  Note,
  PlainText,
  StatusTag,
  When,
  useAdminQuery,
  type AdminColumn,
} from './AdminParts';
import { usePlatformAdmin } from './PlatformAdminShell';

const PAGE_SIZE = 20;

const FILTERS: { key: NoticeStatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'PUBLISHED', label: '공개 중' },
  { key: 'DRAFT', label: '임시 저장' },
  { key: 'HIDDEN', label: '숨김' },
  { key: 'DELETED', label: '삭제됨' },
];

const COLUMNS: AdminColumn<PlatformNotice>[] = [
  {
    key: 'title',
    header: '제목',
    card: 'title',
    className: 'wrap min-w-[220px]',
    cell: (n) => <span className="font-semibold text-boss-text [overflow-wrap:anywhere]">{n.title || '(제목 없음)'}</span>,
  },
  { key: 'status', header: '상태', card: 'badge', cell: (n) => <StatusTag status={n.status} view={NOTICE_STATUS_VIEW} /> },
  { key: 'author', header: '작성자', card: 'line', cell: (n) => n.authorUserId || '-' },
  { key: 'created', header: '작성', card: 'line', cell: (n) => <When value={n.createdAt} /> },
  { key: 'updated', header: '마지막 수정', card: 'line', cell: (n) => <When value={n.updatedAt} /> },
];

type Editor = { id: number | null };

export default function AdminNotices() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<NoticeStatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<PlatformNotice | null>(null);

  const fetch = useCallback(() => platformAdminApi.notices({ q, status, page, size: PAGE_SIZE }), [q, status, page]);
  const { data, loading, error, reload } = useAdminQuery(`${q}\u0000${status}`, fetch);

  const saved = (n: PlatformNotice, how: 'created' | 'updated' | 'confirmed') => {
    const where = n.status === 'PUBLISHED' ? '앱 · 웹 회원 공지에 보입니다.' : '회원에게는 보이지 않습니다.';
    const what = how === 'created' ? '저장했습니다' : how === 'updated' ? '고쳤습니다' : '저장된 것을 확인했습니다';
    setNotice(`「${n.title}」 공지를 ${what}. 지금 상태는 ${n.status ? NOTICE_STATUS_VIEW[n.status].label : '확인 필요'} — ${where}`);
    setEditor(null);
    void reload();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <AdminSearch
          value={q}
          disabled={loading}
          placeholder="제목 · 본문"
          onSearch={(v) => {
            setQ(v);
            setPage(0);
            setNotice(null);
          }}
        />
        <Button variant="primary" size="sm" icon={Plus} className="ml-auto" onClick={() => setEditor({ id: null })}>
          새 공지 쓰기
        </Button>
      </div>
      <ListBar total={data?.totalElements ?? null} loading={loading} onRefresh={() => void reload()}>
        <Segmented
          ariaLabel="공지 상태"
          value={status}
          options={FILTERS}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
            setNotice(null);
          }}
        />
      </ListBar>

      {notice && (
        <Note tone="ok" live>
          {notice}
        </Note>
      )}
      {error && <LoadFailure error={error} hasData={!!data} onRetry={() => void reload()} />}

      <ListBody
        data={data}
        loading={loading}
        page={page}
        onPage={setPage}
        emptyTitle={q ? '검색 결과가 없습니다' : status === 'ALL' ? '공지가 없습니다' : `${FILTERS.find((f) => f.key === status)?.label} 공지가 없습니다`}
        emptyDescription={q ? '검색어나 상태 조건을 바꿔 보세요.' : status === 'ALL' ? '새 공지 쓰기로 첫 공지를 남겨 보세요.' : undefined}
      >
        {(items) => (
          <AdminTable
            caption="공지 목록"
            rows={items}
            rowKey={(n) => n.id}
            columns={COLUMNS}
            action={(n) => (
              <Button variant="secondary" size="sm" onClick={() => setEditor({ id: n.id })}>
                {n.status === 'DELETED' ? '보기' : '열기'}
              </Button>
            )}
          />
        )}
      </ListBody>

      {editor && (
        <NoticeEditor
          key={editor.id ?? 'new'}
          id={editor.id}
          onClose={() => setEditor(null)}
          onSaved={saved}
          onDelete={(n) => {
            setEditor(null);
            setDeleting(n);
          }}
        />
      )}
      {deleting && (
        <NoticeDeleteDialog
          initial={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(n, already) => {
            setNotice(
              already
                ? `「${n.title}」 공지는 이미 삭제되어 있었습니다. 다시 보내지 않았습니다.`
                : `「${n.title}」 공지를 삭제했습니다. 앱 · 웹 회원 공지에서 빠졌습니다.`,
            );
            setDeleting(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

type Message = { tone: 'bad' | 'warn' | 'info'; text: string };

const EMPTY_FORM: NoticeForm = { title: '', content: '', status: 'DRAFT', publishConfirmed: false };

/** 연 공지 → 작성값. 삭제 · 모르는 상태는 숨김(회원에게 안 보이는 쪽)으로 두고 화면이 따로 알린다 */
function formOf(n: PlatformNotice): NoticeForm {
  const status: NoticeEditableStatus = n.status === 'DRAFT' || n.status === 'PUBLISHED' || n.status === 'HIDDEN' ? n.status : 'HIDDEN';
  return { title: n.title, content: n.content, status, publishConfirmed: false };
}

function sameForm(a: NoticeForm, b: NoticeForm): boolean {
  return a.title === b.title && a.content === b.content && a.status === b.status;
}

/**
 * 공지 작성 · 수정 대화상자. id 가 없으면 새 공지.
 * 열면 서버에서 그 공지를 새로 읽어 그 판을 기준으로 고친다(목록은 잠깐 전 모습일 수 있다).
 */
function NoticeEditor({
  id,
  onClose,
  onSaved,
  onDelete,
}: {
  id: number | null;
  onClose: () => void;
  onSaved: (n: PlatformNotice, how: 'created' | 'updated' | 'confirmed') => void;
  onDelete: (n: PlatformNotice) => void;
}) {
  const { scope, onForbidden } = usePlatformAdmin();
  const creating = id == null;
  // 고치기 시작한 판(서버에서 읽은 그대로)과 그때의 작성값
  const [base, setBase] = useState<PlatformNotice | null>(null);
  const [baseForm, setBaseForm] = useState<NoticeForm | null>(creating ? EMPTY_FORM : null);
  const [form, setForm] = useState<NoticeForm | null>(creating ? EMPTY_FORM : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  /** 응답을 못 받음 — "결과 확인" 전까지 보내지 않는다 */
  const [unknown, setUnknown] = useState(false);
  /**
   * 새 공지만: 결과 확인에서 같은 공지를 아직 찾지 못함. 처음 요청이 처리 중이거나 검색 범위 밖일 수 있어 실패로 단정하지 않는다 —
   * 두 번 저장될 수 있음을 알고 체크(duplicateAck)해야만 다시 저장할 수 있다. 자동으로 다시 보내지 않는다.
   */
  const [notFoundYet, setNotFoundYet] = useState(false);
  const [duplicateAck, setDuplicateAck] = useState(false);
  /** 결과를 모르는 그 요청에 실어 보낸 작성값 — 그 뒤에 고쳐도 확인은 보낸 내용으로 한다 */
  const [sentForm, setSentForm] = useState<NoticeForm | null>(null);
  /** 그사이 서버 판이 바뀜 — "최신 내용 불러오기" 전까지 보내지 않는다 */
  const [stale, setStale] = useState(false);
  /** 공지가 없어짐 */
  const [gone, setGone] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const inFlight = useRef(false);

  const loadBase = useCallback(async (): Promise<PlatformNotice | null> => {
    if (id == null) return null;
    const r = await platformAdminApi.notice(id);
    if (!isCurrentScope(scope)) return null;
    if (r.ok) {
      setLoadError(null);
      return r.data;
    }
    if (r.failure === 'forbidden') onForbidden();
    else if (r.failure === 'not-found') setGone(true);
    setLoadError(r.message);
    return null;
  }, [id, scope, onForbidden]);

  // 서버 판을 기준으로 삼는다 — 작성값도 그 판으로 바꾼다(최신 내용 불러오기 · 처음 열기에서만)
  const adopt = useCallback((n: PlatformNotice) => {
    const f = formOf(n);
    setBase(n);
    setBaseForm(f);
    setForm(f);
    setStale(false);
    setUnknown(false);
    setAttempted(false);
    setConfirmClose(false);
  }, []);

  useEffect(() => {
    if (id == null) return;
    void loadBase().then((n) => {
      if (n) adopt(n);
    });
  }, [id, loadBase, adopt]);

  const readOnly = base?.status === 'DELETED' || gone;
  const dirty = !!form && !!baseForm && !sameForm(form, baseForm);
  const blockers = form
    ? noticeBlockers(form).concat(
        !creating && !dirty ? ['바뀐 내용이 없습니다.'] : [],
        unknown && !(creating && notFoundYet) ? ['"결과 확인"으로 처음 요청이 반영됐는지 먼저 확인하세요.'] : [],
        creating && unknown && notFoundYet && !duplicateAck ? ['다시 저장하려면 중복 가능성 확인 항목에 체크하세요.'] : [],
      )
    : ['공지를 불러오는 중입니다.'];
  // 결과를 모르면 막는다. 새 공지는 확인에서 아직 못 찾았고 중복 가능성을 알고 체크했을 때만 다시 저장할 수 있다
  const retryAllowed = !unknown || (creating && notFoundYet && duplicateAck);
  const canSave = !!form && !readOnly && !busy && retryAllowed && !stale && blockers.length === 0;

  const update = (patch: Partial<NoticeForm>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const requestClose = () => {
    if (busy) return;
    if (dirty && !readOnly) setConfirmClose(true);
    else onClose();
  };

  const save = async () => {
    setAttempted(true);
    if (!canSave || inFlight.current || !form) return;
    if (!isCurrentScope(scope)) {
      setUnknown(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const payload = noticePayload(form);
      const r = base
        ? await platformAdminApi.updateNotice(base.id, { ...payload, expectedUpdatedAt: base.updatedAt })
        : await platformAdminApi.createNotice(payload);
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        onSaved(r.data, base ? 'updated' : 'created');
        return;
      }
      switch (r.failure) {
        case 'forbidden':
          onForbidden();
          return;
        case 'stale':
          setStale(true);
          setMessage({
            tone: 'warn',
            text: `${r.message} 적은 내용은 그대로 두었습니다. 필요하면 복사해 두고 "최신 내용 불러오기"로 바뀐 내용을 확인하세요.`,
          });
          return;
        case 'not-found':
          setGone(true);
          setMessage({ tone: 'bad', text: `${r.message} 목록을 새로고침해 주세요.` });
          return;
        case 'network':
        case 'unconfirmed':
          // 다시 보낸 요청도 결과를 모르면 처음처럼 확인부터 다시 한다(중복 확인 체크도 다시 받는다)
          setUnknown(true);
          setNotFoundYet(false);
          setDuplicateAck(false);
          setSentForm(form);
          setMessage({
            tone: 'warn',
            text: '저장 결과를 받지 못했습니다. 저장됐을 수 있어 다시 보내지 않았습니다. "결과 확인"으로 서버에 반영됐는지 먼저 확인하세요.',
          });
          return;
        default:
          setMessage({ tone: 'bad', text: r.message });
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  /**
   * 결과를 모를 때 — 서버에 이 작성 내용이 반영됐는지 본다. 반영이 보이면 저장 완료.
   * 보이지 않아도 저장 실패로 단정하지 않는다(처음 요청이 아직 처리 중일 수 있다).
   *   수정: 서버 판이 그대로면 다시 저장할 수 있게 연다 — 같은 수정 시각을 보내므로 처음 요청이 뒤늦게 반영돼도 둘 중 하나는 409 로 거절된다.
   *   새 공지: 같은 공지를 찾지 못하면 확인 범위(제목 검색 50건) 밖이거나 처리 중일 수 있다 — 중복 가능성을 알고 체크해야만 다시 저장한다.
   */
  const verify = async () => {
    const sent = sentForm ?? form;
    if (!sent || busy) return;
    setBusy(true);
    try {
      if (base) {
        const fresh = await loadBase();
        if (!fresh) {
          setMessage({ tone: 'warn', text: '서버 내용을 확인하지 못했습니다. 잠시 뒤 다시 확인하세요. 다시 보내지 않았습니다.' });
          return;
        }
        if (noticeMatches(fresh, sent)) {
          onSaved(fresh, 'confirmed');
          return;
        }
        if (fresh.updatedAt === base.updatedAt) {
          setUnknown(false);
          setMessage({
            tone: 'info',
            text: '아직 반영이 확인되지 않았습니다. 서버 내용이 처음 열었을 때 그대로입니다. 처음 요청이 처리 중일 수 있으니 잠시 뒤 다시 저장하세요. 이미 반영된 뒤라면 서버가 "다른 곳에서 바뀌었다"고 거절하므로 두 번 저장되지 않습니다.',
          });
          return;
        }
        setUnknown(false);
        setStale(true);
        setMessage({
          tone: 'warn',
          text: '서버 공지가 다른 내용으로 바뀌어 있습니다. 적은 내용은 그대로 두었습니다. "최신 내용 불러오기"로 바뀐 내용을 확인하세요.',
        });
        return;
      }
      // 새 공지 — 같은 제목으로 찾아 같은 내용이 있는지 본다
      const title = plainNoticeTitle(sent.title).slice(0, QUERY_MAX);
      const r = await platformAdminApi.notices({ q: title, status: 'ALL', page: 0, size: 50 });
      if (!isCurrentScope(scope)) return;
      if (!r.ok) {
        if (r.failure === 'forbidden') onForbidden();
        else setMessage({ tone: 'warn', text: `저장됐는지 확인하지 못했습니다. ${r.message} 다시 보내지 않았습니다.` });
        return;
      }
      const found = r.data.items.find((n) => noticeMatches(n, sent));
      if (found) {
        onSaved(found, 'confirmed');
        return;
      }
      // 실패로 단정하지 않는다 — 결과 확인은 계속 열어 두고, 다시 저장은 중복 가능성 확인 체크 뒤에만
      setNotFoundYet(true);
      setDuplicateAck(false);
      setMessage({
        tone: 'warn',
        text: '같은 제목 · 본문의 공지를 아직 찾지 못했습니다. 처음 요청이 아직 처리 중이거나 확인 범위(제목 검색 50건) 밖에 있을 수 있어 저장 실패로 단정할 수 없습니다. 잠시 뒤 "결과 확인"을 다시 누르거나 공지 목록을 확인하세요.',
      });
    } finally {
      setBusy(false);
    }
  };

  const reloadLatest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const fresh = await loadBase();
      if (!fresh) {
        setMessage({ tone: 'warn', text: '최신 내용을 불러오지 못했습니다. 잠시 뒤 다시 시도하세요.' });
        return;
      }
      adopt(fresh);
      setMessage({ tone: 'info', text: '최신 내용으로 바꿨습니다. 다시 고친 뒤 저장하세요.' });
    } finally {
      setBusy(false);
    }
  };

  const publish = form?.status === 'PUBLISHED';
  const title = creating ? '새 공지' : readOnly ? '공지 보기' : '공지 수정';

  // 저장하지 않은 내용이 있을 때 닫기 — 겹친 창 대신 같은 창 아래 줄에서 묻는다(키보드 초점이 이 창 안에서만 돈다)
  const closeFooter = (
    <>
      <p role="alert" className="mr-auto min-w-0 break-keep text-[12.5px] font-semibold text-boss-pill-warn-fg">
        저장하지 않은 내용이 있습니다. 버리고 닫을까요?
      </p>
      <Button variant="secondary" onClick={() => setConfirmClose(false)}>
        계속 쓰기
      </Button>
      <Button variant="danger" onClick={onClose}>
        버리고 닫기
      </Button>
    </>
  );

  return (
    <>
      <OpsDialog
        title={title}
        subtitle={
          creating
            ? '저장 전에는 회원에게 보이지 않습니다. 공개를 고르면 저장하는 즉시 보입니다.'
            : readOnly
              ? '삭제된 공지는 고치거나 되살리지 않습니다.'
              : '고친 내용은 저장해야 반영됩니다. 공개 중인 공지는 저장 즉시 회원 화면이 바뀝니다.'
        }
        busy={busy}
        danger={publish && !readOnly}
        wide
        onClose={requestClose}
        footer={
          confirmClose ? closeFooter : <>
            {base && !readOnly && (
              <Button
                variant="ghost"
                icon={Trash2}
                className="mr-auto !text-boss-error"
                disabled={busy || dirty || unknown || stale}
                title={dirty ? '고친 내용을 저장하거나 되돌린 뒤 삭제할 수 있습니다.' : undefined}
                onClick={() => onDelete(base)}
              >
                삭제
              </Button>
            )}
            <Button variant="secondary" onClick={requestClose} disabled={busy}>
              닫기
            </Button>
            {unknown && (
              <Button variant="secondary" onClick={() => void verify()} disabled={busy}>
                결과 확인
              </Button>
            )}
            {stale && (
              <Button variant="secondary" onClick={() => void reloadLatest()} disabled={busy}>
                최신 내용 불러오기
              </Button>
            )}
            {!readOnly && form && (
              <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!canSave} aria-busy={busy || undefined}>
                {busy ? '처리 중…' : creating && unknown && notFoundYet ? '중복될 수 있음을 알고 다시 저장' : publish ? '공개로 저장' : '저장'}
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
          {creating && unknown && notFoundYet && (
            <div className="border border-boss-warning/35 bg-boss-inset px-4 py-3">
              <CheckLine checked={duplicateAck} onChange={setDuplicateAck} disabled={busy}>
                처음 요청이 이미 저장됐을 수 있고, 다시 저장하면 같은 공지가 두 번 생길 수 있음을 알고 다시 저장합니다. 두 번 생기면 하나를 삭제합니다.
              </CheckLine>
            </div>
          )}
          {!form && !loadError && <Skeleton className="h-48" />}
          {!form && loadError && (
            <AlertBanner
              tone="bad"
              action={
                !gone && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      void loadBase().then((n) => {
                        if (n) adopt(n);
                      })
                    }
                  >
                    다시 시도
                  </Button>
                )
              }
            >
              공지를 불러오지 못했습니다. {loadError}
            </AlertBanner>
          )}

          {base && (
            <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words">
              <DescRow label="지금 상태" value={<StatusTag status={base.status} view={NOTICE_STATUS_VIEW} />} />
              <DescRow label="작성" value={<When value={base.createdAt} />} />
              <DescRow label="마지막 수정" value={<When value={base.updatedAt} />} />
              <DescRow label="작성자" value={base.authorUserId || '-'} />
            </dl>
          )}
          {base && base.status == null && (
            <Note tone="warn">서버 상태를 확인하지 못했습니다. 저장하면 아래에서 고른 상태로 바뀝니다(기본: 숨김).</Note>
          )}

          {form && (
            <>
              <Segmented
                ariaLabel="작성 · 미리보기"
                value={tab}
                onChange={setTab}
                options={[
                  { key: 'write', label: readOnly ? '내용' : '작성' },
                  { key: 'preview', label: '회원 화면 미리보기' },
                ]}
              />

              {tab === 'write' ? (
                <div className="flex flex-col gap-3">
                  <Field
                    id="notice-title"
                    label="제목"
                    required
                    maxLength={NOTICE_TITLE_MAX}
                    value={form.title}
                    disabled={busy || readOnly}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="예: 10월 시스템 점검 안내"
                  />
                  <TextareaField
                    id="notice-content"
                    label="본문"
                    required
                    rows={12}
                    maxLength={NOTICE_CONTENT_MAX}
                    value={form.content}
                    disabled={busy || readOnly}
                    onChange={(e) => update({ content: e.target.value })}
                    hint="일반 글자로 저장됩니다. 줄바꿈은 그대로 보이고, 태그 모양 글자(<b>, <p> 등)는 저장할 때 지워집니다."
                  />
                  {!readOnly && (
                    <div className="flex flex-col gap-2">
                      <p className="boss-label">공개 상태</p>
                      <div role="radiogroup" aria-label="공개 상태" className="grid gap-2 sm:grid-cols-3">
                        {NOTICE_EDITABLE_OPTIONS.map((o) => (
                          <RadioOption
                            key={o.key}
                            checked={form.status === o.key}
                            onChange={() => update({ status: o.key, publishConfirmed: false })}
                            label={o.label}
                          />
                        ))}
                      </div>
                      <p className="text-[12px] leading-relaxed text-boss-text-secondary">
                        {NOTICE_EDITABLE_OPTIONS.find((o) => o.key === form.status)?.hint}. 푸시 · 이메일은 보내지 않습니다.
                      </p>
                    </div>
                  )}
                  {publish && !readOnly && (
                    <div className="flex flex-col gap-2 border border-boss-border bg-boss-inset px-4 py-3">
                      <Note tone="warn">공개로 저장하면 앱 · 웹의 모든 회원 공지 목록에 바로 보입니다. 내용 · 맞춤법을 미리보기로 확인하세요.</Note>
                      <CheckLine checked={form.publishConfirmed} onChange={(v) => update({ publishConfirmed: v })} disabled={busy}>
                        미리보기로 확인했고, 이 공지를 회원 전체에게 공개합니다.
                      </CheckLine>
                    </div>
                  )}
                  {!readOnly && <Blockers items={blockers} attempted={attempted} busy={busy} />}
                </div>
              ) : (
                <NoticePreview form={form} createdAt={base?.createdAt ?? null} />
              )}
            </>
          )}
        </div>
      </OpsDialog>
    </>
  );
}

/** 회원 화면(공지 상세)과 같은 모양 — 서버가 저장할 일반 글자로 보인다 */
function NoticePreview({ form, createdAt }: { form: NoticeForm; createdAt: string | null }) {
  const title = plainNoticeTitle(form.title);
  const content = useMemo(() => plainNoticeContent(form.content), [form.content]);
  const date = formatOpsDateTime(createdAt)?.slice(0, 10).replaceAll('-', '.') ?? '저장 후 날짜가 붙습니다';
  return (
    <div className="flex flex-col gap-3">
      {form.status === 'PUBLISHED' ? (
        <Note tone="info">저장하면 회원에게 이 모양으로 보입니다.</Note>
      ) : (
        <Note tone="info">지금 고른 상태({NOTICE_EDITABLE_OPTIONS.find((o) => o.key === form.status)?.label})로는 회원에게 보이지 않습니다. 공개하면 이 모양으로 보입니다.</Note>
      )}
      {hasTagLikeText(form.content) && (
        <Note tone="warn">본문의 태그 모양 글자는 저장할 때 지워지고 글자만 남습니다. 아래 미리보기가 저장될 모양입니다.</Note>
      )}
      <article className="boss-card p-5 sm:p-6">
        <h2 className="break-words text-[20px] font-semibold leading-relaxed text-boss-text sm:text-[22px]">{title || '(제목을 적어 주세요)'}</h2>
        <p className="mt-2 text-[12px] text-boss-text-secondary">{date}</p>
        {content ? (
          <PlainText className="mt-5 border-t border-boss-border pt-5 text-[15px] leading-[1.85] text-boss-text-soft">{content}</PlainText>
        ) : (
          <p className="mt-5 border-t border-boss-border pt-5 text-[13px] text-boss-text-muted">(본문을 적어 주세요)</p>
        )}
      </article>
    </div>
  );
}

/** 공지 삭제 — 사유 + 확인 체크 → 요청 1회. 삭제하면 회원 목록 · 주소 바로 열기에서 빠지고 되살리지 않는다 */
function NoticeDeleteDialog({
  initial,
  onClose,
  onDeleted,
}: {
  initial: PlatformNotice;
  onClose: () => void;
  onDeleted: (n: PlatformNotice, already: boolean) => void;
}) {
  const { scope, onForbidden } = usePlatformAdmin();
  const [target, setTarget] = useState(initial);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const inFlight = useRef(false);

  const reasonProblem = reasonBlocker(reason, '삭제 사유');
  const blockers = [...(reasonProblem ? [reasonProblem] : []), ...(confirmed ? [] : ['확인 항목에 체크하세요.'])];
  const canSend = blockers.length === 0 && !busy && !unknown;

  /** 서버에서 다시 읽는다 — 이미 삭제됐으면 끝, 아니면 최신 판으로 바꿔 다시 확인을 받는다 */
  const refresh = async (why: 'stale' | 'unknown') => {
    const r = await platformAdminApi.notice(target.id);
    if (!isCurrentScope(scope)) return;
    if (!r.ok) {
      if (r.failure === 'forbidden') onForbidden();
      else setMessage({ tone: 'warn', text: `공지 상태를 확인하지 못했습니다. ${r.message} 다시 보내지 않았습니다.` });
      return;
    }
    setConfirmed(false);
    setUnknown(false);
    if (r.data.status === 'DELETED') {
      onDeleted(r.data, why === 'stale');
      return;
    }
    setTarget(r.data);
    setMessage({
      tone: 'warn',
      text:
        why === 'stale'
          ? '그사이 공지가 바뀌었습니다. 최신 제목 · 상태를 확인하고 다시 체크한 뒤 삭제하세요.'
          : '다시 읽어 보니 아직 삭제가 확인되지 않았습니다. 처음 요청이 처리 중일 수 있으니 잠시 뒤 다시 확인하세요. 다시 보내도 이미 삭제된 뒤라면 서버가 거절하므로 두 번 처리되지 않습니다.',
    });
  };

  const send = async () => {
    setAttempted(true);
    if (!canSend || inFlight.current) return;
    if (!isCurrentScope(scope)) {
      setUnknown(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const r = await platformAdminApi.deleteNotice(target.id, { reason: reason.trim(), expectedUpdatedAt: target.updatedAt });
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        onDeleted(r.data, false);
        return;
      }
      if (r.failure === 'forbidden') {
        onForbidden();
        return;
      }
      if (r.failure === 'stale') {
        await refresh('stale');
        return;
      }
      if (r.failure === 'network' || r.failure === 'unconfirmed') {
        setUnknown(true);
        setMessage({ tone: 'warn', text: '결과를 받지 못했습니다. 삭제됐을 수 있어 다시 보내지 않았습니다. "결과 확인"으로 지금 상태를 확인하세요.' });
        return;
      }
      setMessage({ tone: 'bad', text: r.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <OpsDialog
      title="공지 삭제"
      subtitle="삭제하면 앱 · 웹 회원 공지 목록과 주소로 바로 열기에서 빠지고, 이 화면에서 되살리지 않습니다."
      busy={busy}
      danger
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            닫기
          </Button>
          {unknown && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await refresh('unknown');
                } finally {
                  setBusy(false);
                }
              }}
            >
              결과 확인
            </Button>
          )}
          <Button variant="danger" icon={Trash2} onClick={() => void send()} disabled={!canSend} aria-busy={busy || undefined}>
            {busy ? '처리 중…' : '삭제'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
        <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
          <DescRow label="제목" value={target.title || '(제목 없음)'} />
          <DescRow label="지금 상태" value={<StatusTag status={target.status} view={NOTICE_STATUS_VIEW} />} />
          <DescRow label="마지막 수정" value={<When value={target.updatedAt} />} />
        </dl>
        <TextareaField
          id="notice-delete-reason"
          label="삭제 사유 (감사 이력에 남음)"
          required
          rows={3}
          maxLength={REASON_MAX}
          value={reason}
          disabled={busy}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 행사 종료로 더 이상 필요 없는 안내"
        />
        <div className="border border-boss-border bg-boss-inset px-4 py-3">
          <CheckLine checked={confirmed} onChange={setConfirmed} disabled={busy}>
            「{target.title || '(제목 없음)'}」 공지를 삭제합니다. 회원 화면에서 바로 빠집니다.
          </CheckLine>
        </div>
        <Blockers items={blockers} attempted={attempted} busy={busy} />
      </div>
    </OpsDialog>
  );
}
