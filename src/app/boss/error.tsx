'use client';

// 사장님 화면 오류 받이
//
// 배포 직후, 열어 둔 탭이 예전 파일 조각(chunk)을 찾다가 실패하면
// "Application error: a client-side exception has occurred" 만 뜨고 화면이 비었다.
// 이건 코드가 깨진 게 아니라 새로 고치면 풀리는 문제라서, 한 번만 자동으로 새로 고친다.
// 그 외 오류는 사장님이 직접 다시 시도할 수 있게 안내를 보여 준다.

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const RELOAD_FLAG = 'boss_chunk_reloaded';

function isChunkError(error: Error): boolean {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module/i.test(text);
}

export default function BossError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isChunkError(error)) return;
    // 무한 새로 고침을 막는다 — 한 번 시도하고 그래도 안 되면 안내를 보여 준다
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    window.location.reload();
  }, [error]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isChunkError(error)) sessionStorage.removeItem(RELOAD_FLAG);
  }, [error]);

  const chunk = isChunkError(error);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-boss-head text-[11px] uppercase tracking-[0.08em] text-boss-text-muted">
        {chunk ? 'UPDATING' : 'ERROR'}
      </p>
      <h1 className="mt-2 text-[17px] font-semibold text-boss-text">
        {chunk ? '새 버전으로 바꾸는 중입니다' : '화면을 불러오지 못했습니다'}
      </h1>
      <p className="mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-boss-text-secondary">
        {chunk
          ? '잠시 뒤 자동으로 새로 고쳐집니다. 그대로 있으면 아래 버튼을 눌러 주세요.'
          : '잠시 뒤 다시 시도해 주세요. 계속 같은 화면이면 새로 고침을 눌러 주세요.'}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="boss-btn boss-btn-sm boss-btn-primary" onClick={() => reset()}>
          다시 시도
        </button>
        <button
          type="button"
          className="boss-btn boss-btn-sm boss-btn-secondary"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={13} /> 새로 고침
        </button>
      </div>
    </div>
  );
}
