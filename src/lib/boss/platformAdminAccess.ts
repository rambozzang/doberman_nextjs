'use client';

// 도배르만 운영 — 운영자 판정(서버 GET /platform-admin/access) 공용 기억
//
// 레일 메뉴와 /boss/admin 화면이 같은 판정을 본다. 판정은 계정 범위(아이디 + 토큰 요약, useBossScope)마다 따로다 —
// 범위가 바뀌면(로그아웃 · 다른 계정 로그인) 앞 판정을 쓰지 않고 다시 묻는다.
// 어느 화면이든 서버가 403(운영자 아님)을 주면 denyPlatformAdminAccess 로 즉시 거절로 바꿔 메뉴와 내용을 함께 닫는다.
// 화면 표시용일 뿐이다 — 모든 운영 요청은 서버가 다시 검사한다.
//
// 다시 묻기: 운영자 · 거절은 5분, 확인 실패는 1분 동안 기억한다. 다시 묻는 동안에는 앞 판정을 그대로 보여
// (작성 중인 공지 등) 화면이 깜빡이며 사라지지 않게 한다. 다시 물은 결과가 거절이면 그때 닫는다.

import { useEffect, useSyncExternalStore } from 'react';
import { platformAdminApi, type AdminFailure } from '@/lib/api/boss/platformAdmin';
import { isCurrentScope } from '@/lib/boss/bossScope';

export type PlatformAdminAccessView =
  | { status: 'signed-out' }
  | { status: 'checking' }
  | { status: 'admin' }
  | { status: 'denied' }
  | { status: 'error'; failure: AdminFailure; message: string };

type Entry = { scope: string; at: number; view: PlatformAdminAccessView; inFlight: boolean };

const SETTLED_TTL_MS = 5 * 60_000;
const FAILED_TTL_MS = 60_000;

const SIGNED_OUT: PlatformAdminAccessView = { status: 'signed-out' };
const CHECKING: PlatformAdminAccessView = { status: 'checking' };
const ADMIN: PlatformAdminAccessView = { status: 'admin' };
const DENIED: PlatformAdminAccessView = { status: 'denied' };

let entry: Entry | null = null;
const listeners = new Set<() => void>();

function set(next: Entry | null): void {
  entry = next;
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * 이 범위의 판정을 확인한다. 기억이 살아 있으면 다시 묻지 않는다(force 면 묻는다).
 * 묻는 중에는 같은 범위로 또 묻지 않는다.
 */
export function checkPlatformAdminAccess(scope: string, force = false): void {
  // 지난 계정 범위로는 묻지 않는다(호출부도 대조하지만 여기서 한 번 더 막는다)
  if (!isCurrentScope(scope)) return;
  const prev = entry && entry.scope === scope ? entry : null;
  if (prev?.inFlight) return;
  if (prev && !force) {
    const ttl = prev.view.status === 'error' ? FAILED_TTL_MS : SETTLED_TTL_MS;
    if (Date.now() - prev.at < ttl) return;
  }
  // 처음 묻거나 확인 실패 뒤 다시 물으면 "확인 중", 이미 판정이 있으면 그 판정을 보이면서 다시 묻는다
  const keep = prev && (prev.view.status === 'admin' || prev.view.status === 'denied') ? prev.view : CHECKING;
  const mine: Entry = { scope, at: prev?.at ?? Date.now(), view: keep, inFlight: true };
  set(mine);
  void platformAdminApi.access().then((r) => {
    // 그사이 다른 범위로 바뀌었거나 거절 등으로 기록이 바뀌었으면 이 응답은 버린다
    if (entry !== mine) return;
    if (!isCurrentScope(scope)) {
      set(null);
      return;
    }
    let view: PlatformAdminAccessView;
    if (r.ok) view = r.data.isAdmin ? ADMIN : DENIED;
    else if (r.failure === 'forbidden') view = DENIED;
    // 이미 판정이 있는데 연결만 실패했다면 앞 판정을 두고 1분 뒤 다시 묻는다(권한을 새로 열지는 않는다)
    else if (keep !== CHECKING) {
      set({ scope, at: Date.now() - SETTLED_TTL_MS + FAILED_TTL_MS, view: keep, inFlight: false });
      return;
    } else view = { status: 'error', failure: r.failure, message: r.message };
    set({ scope, at: Date.now(), view, inFlight: false });
  });
}

/** 서버가 403(운영자 아님)을 줬다 — 이 범위를 바로 거절로 바꿔 메뉴와 화면을 닫는다 */
export function denyPlatformAdminAccess(scope: string): void {
  // 지난 계정의 늦은 403 으로 지금 계정 판정을 바꾸지 않는다
  if (!isCurrentScope(scope)) return;
  set({ scope, at: Date.now(), view: DENIED, inFlight: false });
}

/**
 * 지금 계정 범위의 운영자 판정. scope 는 useBossScope() 값을 그대로 넘긴다.
 * 범위가 없으면 signed-out, 이 범위로 아직 묻지 않았거나 묻는 중이면 checking.
 */
export function usePlatformAdminAccess(scope: string | null): PlatformAdminAccessView {
  const snap = useSyncExternalStore(subscribe, () => entry, () => null);
  useEffect(() => {
    if (scope) checkPlatformAdminAccess(scope);
  }, [scope]);
  if (!scope) return SIGNED_OUT;
  if (!snap || snap.scope !== scope) return CHECKING;
  return snap.view;
}
