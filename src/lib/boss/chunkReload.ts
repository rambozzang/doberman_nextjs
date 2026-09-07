// 배포 직후 "예전 파일 조각을 못 찾는" 오류를 한 번만 새로 고쳐서 넘긴다
//
// 배포가 나가면 열어 둔 탭은 사라진 chunk 를 요청하다 실패한다.
// 코드가 깨진 게 아니라 새로 고치면 풀리는 문제라서, 오류 받이(/boss/error.tsx)가
// 한 번 자동으로 새로 고친다. 다만 그 "한 번"을 기억해 두지 않으면 무한 새로 고침이 된다.
// 화면이 정상으로 뜨면(BossChrome 이 마운트되면) 그 기억을 지운다.

const RELOAD_FLAG = 'boss_chunk_reloaded';

export function isChunkError(error?: { name?: string; message?: string } | null): boolean {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module/i.test(text);
}

/** 아직 자동 새로 고침을 쓰지 않았으면 한 번 쓰고 true 를 돌려준다 */
export function tryReloadOnce(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    return false; // 사생활 보호 모드 등에서 sessionStorage 가 막힌 경우
  }
  window.location.reload();
  return true;
}

/** 화면이 정상으로 떴다 — 다음 배포 때 다시 한 번 쓸 수 있게 되돌린다 */
export function clearReloadMark(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // 무시 — 지우지 못해도 화면 동작에는 영향이 없다
  }
}
