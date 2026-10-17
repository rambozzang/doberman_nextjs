'use client';

// 회원 관리 — 목록(검색 · 상태 · 쪽) → 회원 보기 → 이용 정지 · 해제
//
//   보기를 열면 그 회원을 서버에서 새로 읽어 지금 상태로 판단한다(목록은 잠깐 전 모습일 수 있다).
//   정지 · 해제: 사유(필수, 감사 이력) + 확인 체크 → 요청 1회. 보던 상태(expectedStatus)가 바뀌었으면 서버가 409 로 거절 →
//   최신 상태로 바꾸고 다시 확인을 받는다. 응답을 못 받았으면 자동으로 다시 보내지 않고 회원을 다시 읽어 반영됐는지 본다.
//   본인 · 탈퇴 계정은 화면에서 먼저 막고, 운영자 계정은 서버가 막는다. 탈퇴(DEL_YN)는 이 화면에서 바꾸지 않는다.
//   extendedAccess 는 확장 이용 권한 표시일 뿐 유료 구독이 아니다.
//   계정이 바뀌면 응답을 넣지 않고, 보내기 직전에도 다시 대조한다. 실패해도 적은 사유는 그대로 둔다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { UserCheck, UserX } from 'lucide-react';
import { platformAdminApi } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';
import { MEMBER_STATUS_VIEW, REASON_MAX, memberName, memberStatusBlockers } from '@/lib/boss/platformAdmin';
import type { MemberStatusFilter, PlatformMember } from '@/types/boss-platform-admin';
import { AlertBanner, Button, CheckLine, DescRow, Segmented, Skeleton, TextareaField } from '@/components/boss/ui';
import OpsDialog from '@/components/boss/taxinvoice/OpsDialog';
import {
  AdminSearch,
  AdminTable,
  Blockers,
  ListBar,
  ListBody,
  LoadFailure,
  Note,
  StatusTag,
  When,
  useAdminQuery,
  type AdminColumn,
} from './AdminParts';
import { usePlatformAdmin } from './PlatformAdminShell';

const PAGE_SIZE = 20;

const FILTERS: { key: MemberStatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ACTIVE', label: '이용 중' },
  { key: 'SUSPENDED', label: '이용 정지' },
  { key: 'DELETED', label: '탈퇴' },
];

function ExtendedAccess({ value }: { value: boolean | null }) {
  if (value == null) return <span className="text-boss-text-muted">-</span>;
  return <span>{value ? '있음' : '없음'}</span>;
}

const contact = (m: PlatformMember) => [m.phone, m.email].filter(Boolean).join(' · ') || '-';

const COLUMNS: AdminColumn<PlatformMember>[] = [
  {
    key: 'name',
    header: '회원',
    card: 'title',
    className: 'wrap',
    cell: (m) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold text-boss-text">{memberName(m)}</span>
        <span className="text-[12px] font-normal text-boss-text-muted">{m.userId}</span>
      </span>
    ),
  },
  { key: 'status', header: '상태', card: 'badge', cell: (m) => <StatusTag status={m.status} view={MEMBER_STATUS_VIEW} /> },
  { key: 'company', header: '상호', card: 'line', className: 'wrap', cell: (m) => m.companyName || '-' },
  { key: 'contact', header: '연락처', card: 'line', className: 'wrap', cell: contact },
  { key: 'created', header: '가입', card: 'line', cell: (m) => <When value={m.createdAt} /> },
  { key: 'login', header: '최근 로그인', card: 'line', cell: (m) => <When value={m.lastLoginAt} empty="기록 없음" /> },
  { key: 'ext', header: '확장 권한', card: 'line', cell: (m) => <ExtendedAccess value={m.extendedAccess} /> },
];

export default function AdminMembers() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<MemberStatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlatformMember | null>(null);

  const fetch = useCallback(() => platformAdminApi.members({ q, status, page, size: PAGE_SIZE }), [q, status, page]);
  const { data, loading, error, reload } = useAdminQuery(`${q}\u0000${status}`, fetch);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <AdminSearch
          value={q}
          disabled={loading}
          placeholder="이름 · 아이디 · 닉네임 · 상호 · 연락처"
          onSearch={(v) => {
            setQ(v);
            setPage(0);
            setNotice(null);
          }}
        />
      </div>
      <ListBar total={data?.totalElements ?? null} loading={loading} onRefresh={() => void reload()}>
        <Segmented
          ariaLabel="회원 상태"
          value={status}
          options={FILTERS}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
            setNotice(null);
          }}
        />
      </ListBar>
      <p className="break-keep text-[12px] leading-relaxed text-boss-text-muted">
        확장 권한은 회원 계정의 확장 이용 권한 표시입니다. 유료 구독 여부가 아닙니다. 연락처는 운영 확인에만 쓰고 밖으로 옮기지 마세요.
      </p>

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
        emptyTitle={q ? '검색 결과가 없습니다' : status === 'ALL' ? '회원이 없습니다' : `${FILTERS.find((f) => f.key === status)?.label} 회원이 없습니다`}
        emptyDescription={q ? '검색어나 상태 조건을 바꿔 보세요.' : undefined}
      >
        {(items) => (
          <AdminTable
            caption="회원 목록"
            rows={items}
            rowKey={(m) => m.id}
            columns={COLUMNS}
            action={(m) => (
              <Button variant="secondary" size="sm" onClick={() => setSelected(m)}>
                보기
              </Button>
            )}
          />
        )}
      </ListBody>

      {selected && (
        <MemberDialog
          initial={selected}
          onClose={() => setSelected(null)}
          onChanged={(m) => {
            setNotice(`${memberName(m)}(${m.userId}) 회원을 ${m.status === 'SUSPENDED' ? '이용 정지했습니다' : '이용 중으로 바꿨습니다'}. 감사 이력에 남았습니다.`);
            setSelected(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

type Message = { tone: 'bad' | 'warn' | 'info'; text: string };

function MemberDialog({
  initial,
  onClose,
  onChanged,
}: {
  initial: PlatformMember;
  onClose: () => void;
  onChanged: (m: PlatformMember) => void;
}) {
  const { scope, myUserId, onForbidden } = usePlatformAdmin();
  const [member, setMember] = useState<PlatformMember | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  // 결과를 모르거나 최신 상태를 못 읽었으면 다시 확인 전까지 보내지 않는다
  const [locked, setLocked] = useState(false);
  const inFlight = useRef(false);

  // 열 때 · 다시 확인할 때 서버에서 새로 읽는다
  const fetchMember = useCallback(async (): Promise<PlatformMember | null> => {
    const r = await platformAdminApi.member(initial.id);
    if (!isCurrentScope(scope)) return null;
    if (r.ok) {
      setMember(r.data);
      setLoadError(null);
      return r.data;
    }
    if (r.failure === 'forbidden') onForbidden();
    else setLoadError(r.message);
    return null;
  }, [initial.id, scope, onForbidden]);

  useEffect(() => {
    void fetchMember();
  }, [fetchMember]);

  const view = member ?? initial;
  const target: 'ACTIVE' | 'SUSPENDED' | null = view.status === 'ACTIVE' ? 'SUSPENDED' : view.status === 'SUSPENDED' ? 'ACTIVE' : null;
  const blockers = member
    ? memberStatusBlockers(member, myUserId, reason, confirmed).concat(locked ? ['최신 상태를 다시 확인해야 보낼 수 있습니다.'] : [])
    : ['최신 회원 정보를 불러오는 중입니다.'];
  const canSend = !!member && target != null && blockers.length === 0 && !busy;

  const recheck = async (why: 'stale' | 'unknown') => {
    setConfirmed(false);
    const fresh = await fetchMember();
    if (!fresh) {
      setLocked(true);
      setMessage({ tone: 'warn', text: '최신 상태를 불러오지 못했습니다. 창을 닫고 목록을 새로고침해 결과를 확인하세요. 다시 보내지 않았습니다.' });
      return;
    }
    setLocked(false);
    if (why === 'unknown' && fresh.status === target) {
      onChanged(fresh);
      return;
    }
    setMessage({
      tone: 'warn',
      text:
        why === 'stale'
          ? '그사이 이 회원의 상태가 바뀌었습니다. 최신 상태로 바꿨으니 다시 확인하고 체크한 뒤 보내 주세요.'
          : '다시 읽어 보니 아직 반영이 확인되지 않았습니다. 처음 요청이 처리 중일 수 있으니 잠시 뒤 다시 확인하세요. 다시 보내도 이미 반영된 뒤라면 서버가 거절하므로 두 번 처리되지 않습니다.',
    });
  };

  const send = async () => {
    setAttempted(true);
    if (!canSend || inFlight.current || !member || target == null || (member.status !== 'ACTIVE' && member.status !== 'SUSPENDED')) return;
    if (!isCurrentScope(scope)) {
      setLocked(true);
      setMessage({ tone: 'bad', text: '로그인한 계정이 바뀌어 보내지 않았습니다. 창을 닫고 다시 확인해 주세요.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const r = await platformAdminApi.setMemberStatus(member.id, { status: target, reason: reason.trim(), expectedStatus: member.status });
      if (!isCurrentScope(scope)) return;
      if (r.ok) {
        onChanged(r.data);
        return;
      }
      if (r.failure === 'forbidden') {
        onForbidden();
        return;
      }
      if (r.failure === 'stale') {
        await recheck('stale');
        return;
      }
      if (r.failure === 'network' || r.failure === 'unconfirmed') {
        setLocked(true);
        setMessage({ tone: 'warn', text: '결과를 받지 못했습니다. 처리됐을 수 있어 다시 보내지 않았습니다. 아래 "결과 확인"으로 지금 상태를 확인하세요.' });
        return;
      }
      setMessage({ tone: 'bad', text: r.message });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const suspend = target === 'SUSPENDED';
  // 본인 계정 — 바꿀 수 없으니 처리 칸 · 버튼을 그리지 않는다(서버도 막는다)
  const self = !!myUserId && view.userId === myUserId;
  const changeable = !!member && target != null && !self;

  return (
    <OpsDialog
      title={`${memberName(view)} 회원`}
      subtitle="서버에서 방금 읽은 정보입니다. 상태를 바꾸면 사유와 함께 감사 이력에 남습니다."
      busy={busy}
      danger={suspend && confirmed}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            닫기
          </Button>
          {locked && (
            <Button variant="secondary" onClick={() => void recheck('unknown')} disabled={busy}>
              결과 확인
            </Button>
          )}
          {changeable && (
            <Button
              variant={suspend ? 'danger' : 'primary'}
              icon={suspend ? UserX : UserCheck}
              onClick={() => void send()}
              disabled={!canSend}
              aria-busy={busy || undefined}
            >
              {busy ? '보내는 중…' : suspend ? '이용 정지' : '정지 해제'}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}
        {loadError && !member && (
          <AlertBanner
            tone="bad"
            action={
              <Button variant="primary" size="sm" onClick={() => void fetchMember()}>
                다시 시도
              </Button>
            }
          >
            회원 정보를 새로 읽지 못했습니다. {loadError} 아래는 목록에서 본 내용이며, 상태는 바꿀 수 없습니다.
          </AlertBanner>
        )}
        {!member && !loadError && <Skeleton className="h-6" />}

        <dl className="[&_dd]:overflow-visible [&_dd]:whitespace-normal [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
          <DescRow label="아이디" value={view.userId} />
          <DescRow label="이름" value={view.name || '-'} />
          <DescRow label="닉네임" value={view.nickName || '-'} />
          <DescRow label="상호" value={view.companyName || '-'} />
          <DescRow label="휴대폰" value={view.phone || '-'} />
          <DescRow label="이메일" value={view.email || '-'} />
          <DescRow label="상태" value={<StatusTag status={view.status} view={MEMBER_STATUS_VIEW} />} />
          <DescRow label="가입" value={<When value={view.createdAt} />} />
          <DescRow label="최근 로그인" value={<When value={view.lastLoginAt} empty="기록 없음" />} />
          <DescRow label="확장 이용 권한(유료 구독 아님)" value={<ExtendedAccess value={view.extendedAccess} />} />
        </dl>

        {member && view.status === 'DELETED' && <Note tone="info">탈퇴한 계정입니다. 이 화면에서 상태를 바꾸지 않습니다.</Note>}
        {member && self && <Note tone="info">지금 로그인한 본인 계정입니다. 본인 계정의 이용 상태는 바꿀 수 없습니다.</Note>}

        {changeable && (
          <div className="flex flex-col gap-3 border-t border-boss-border pt-4">
            <p className="text-[13.5px] font-semibold text-boss-text">{suspend ? '이용 정지' : '이용 정지 해제'}</p>
            {suspend ? (
              <Note tone="warn">
                정지하면 이 회원은 앱 · 웹에서 바로 이용이 막히고, 이미 로그인된 기기에서도 막힙니다. 탈퇴 처리가 아니며 자료는 지우지 않습니다. 운영자 계정은
                서버가 막습니다.
              </Note>
            ) : (
              <Note tone="info">해제하면 이 회원은 다시 앱 · 웹을 이용할 수 있습니다.</Note>
            )}
            <TextareaField
              id="member-status-reason"
              label={suspend ? '정지 사유 (감사 이력에 남음)' : '해제 사유 (감사 이력에 남음)'}
              required
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
              placeholder={suspend ? '예: 커뮤니티 도배 광고 반복 게시(신고 3건)' : '예: 소명 확인 후 해제'}
              hint="회원에게 보내지는 않습니다. 비밀번호 · 연락처 같은 개인정보는 적지 마세요."
            />
            <div className="border border-boss-border bg-boss-inset px-4 py-3">
              <CheckLine checked={confirmed} onChange={setConfirmed} disabled={busy}>
                {suspend
                  ? `${memberName(view)}(${view.userId}) 회원의 이용을 정지합니다.`
                  : `${memberName(view)}(${view.userId}) 회원의 이용 정지를 해제합니다.`}
              </CheckLine>
            </div>
            <Blockers items={blockers} attempted={attempted} busy={busy} />
          </div>
        )}
      </div>
    </OpsDialog>
  );
}
