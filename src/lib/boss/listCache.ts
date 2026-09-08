'use client';

// 목록 화면이 상세를 다녀와도 보던 자리를 그대로 지킨다.
//
// 문제: 목록 → 상세 → 뒤로 오면 화면이 새로 마운트되면서 탭 · 검색어 · 쪽 번호가 모두 초기값으로
//       돌아가고 목록도 처음부터 다시 불러왔다. 3쪽까지 넘겨 보던 사장님이 매번 1쪽으로 튕겼다.
//
// 방법: 목록은 조회조건과 이미 받아 둔 데이터를 여기에 남겨 두고, 돌아올 때 그대로 복원한다.
//       상세 · 등록 화면에서 실제로 무언가를 고치거나 지웠을 때만 markListDirty() 로 표시해 두고,
//       그때는 복원하지 않고 다시 불러온다. (조회수가 오른 정도로는 다시 부르지 않는다.)
//
// 새로고침(F5)이나 새 탭에서는 이 모듈이 새로 만들어져 캐시가 비므로 늘 최신을 본다.

import { useEffect } from 'react';

type Snapshot = { filters: unknown; data: unknown };

const snapshots = new Map<string, Snapshot>();
const dirty = new Set<string>();

/** 목록 화면 이름 — 상세에서 markListDirty 할 때도 같은 값을 쓴다 */
export const LIST_KEYS = {
  requests: 'boss:requests',
  customers: 'boss:customers',
  /** 커뮤니티는 전체 게시판과 구인/구직 메뉴가 각각 따로 기억한다 */
  community: 'boss:community',
  communityJob: 'boss:community:JOB',
  construction: 'boss:construction',
  as: 'boss:as',
  signature: 'boss:signature',
  portfolio: 'boss:portfolio',
  taxInvoice: 'boss:tax-invoice',
  notifications: 'boss:notifications',
  receipt: 'boss:receipt',
  communityMy: 'boss:community:my',
  checklist: 'boss:checklist',
  estimateList: 'boss:estimate',
} as const;

/**
 * 남겨 둔 조회조건 · 데이터를 읽는다. 부수효과가 없어 렌더 중에 불러도 된다.
 * 처음 들어왔거나 상세에서 내용이 바뀌었으면 null — 이때는 평소대로 불러오면 된다.
 */
export function readListSnapshot<F, D>(key: string): { filters: F; data: D } | null {
  if (dirty.has(key)) return null;
  const s = snapshots.get(key);
  if (!s) return null;
  return { filters: s.filters as F, data: s.data as D };
}

/** 목록이 새로 받아 온 내용을 남긴다. 남기는 순간 "다시 불러야 함" 표시는 지운다. */
export function writeListSnapshot<F, D>(key: string, filters: F, data: D): void {
  dirty.delete(key);
  snapshots.set(key, { filters, data });
}

/**
 * 상세 · 등록 화면에서 저장 · 삭제한 뒤 부른다.
 * 목록으로 돌아오면 남겨 둔 내용을 버리고 다시 불러온다.
 */
export function markListDirty(...keys: string[]): void {
  for (const k of keys) dirty.add(k);
}

/** 남겨 둔 내용을 아예 버린다 (로그아웃 등) */
export function clearListSnapshot(...keys: string[]): void {
  if (keys.length === 0) {
    snapshots.clear();
    dirty.clear();
    return;
  }
  for (const k of keys) {
    snapshots.delete(k);
    dirty.delete(k);
  }
}

/**
 * 목록 화면이 현재 조회조건 · 데이터를 계속 남기게 한다.
 * `ready` 가 true 인 동안(= 한 번이라도 불러온 뒤) 렌더마다 남기므로, 언제 나가도 마지막 상태가 남는다.
 */
export function useSaveListSnapshot<F, D>(key: string, filters: F, data: D, ready: boolean): void {
  useEffect(() => {
    if (ready) writeListSnapshot(key, filters, data);
  });
}
