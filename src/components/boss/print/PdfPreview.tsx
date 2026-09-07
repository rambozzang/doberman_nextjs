'use client';

// 문서 미리보기 — HTML 로 따로 그리지 않고 **내려받을 PDF 그 자체**를 그림으로 구워 보여 준다.
//
// 화면에서 보는 것과 저장 · 공유 · 인쇄되는 것이 한 치도 다르지 않다.
// 양식을 바꾸면 다시 굽는다(1초 안팎). 그동안은 A4 비율의 빈 종이를 보여 준다.
//
// 인쇄: 이 그림을 A4 한 장에 꽉 채워 찍는다(@page margin 0 — PDF 안에 여백이 이미 있다).

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { pdfBlobToPng, renderVectorPdf } from './pdfRender';

export default function PdfPreview({
  docFactory,
  renderKey,
  alt,
}: {
  /** PDF <Document> 를 만드는 함수 — 버튼을 누를 때와 같은 함수를 넘긴다 */
  docFactory: () => Promise<ReactElement>;
  /** 이 값이 바뀌면 다시 굽는다(양식 · 품목 · 고객이 바뀔 때) */
  renderKey: string;
  alt: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError(null);
    (async () => {
      try {
        const pdf = await renderVectorPdf(await docFactory());
        // 화면용은 2.5배면 충분히 또렷하다(3배는 저장용). 인쇄도 이 그림으로 찍는다.
        const png = await pdfBlobToPng(pdf, 2.5);
        if (cancelled) return;
        const url = URL.createObjectURL(png);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setSrc(url);
      } catch (e) {
        console.error('pdf preview failed', e);
        if (!cancelled) setError('미리보기를 만들지 못했습니다. 새로 고침해 주세요.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // docFactory 는 매 렌더마다 새 함수라 renderKey 로만 다시 굽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  return (
    <div className="pdf-preview relative mx-auto w-full max-w-[794px]">
      {/* A4 비율 종이 — 그림이 오기 전에도 자리를 잡아 화면이 덜컹이지 않게 */}
      <div
        className="relative w-full overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_32px_-12px_rgba(0,0,0,0.28)] print:shadow-none"
        style={{ aspectRatio: '210 / 297' }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- Blob URL 은 next/image 로 못 다룬다
          <img src={src} alt={alt} className="block h-full w-full" draggable={false} />
        ) : null}
        {busy ? (
          <div className="no-print absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="font-boss-head text-[11px] uppercase tracking-[0.1em] text-boss-text-muted">
              문서를 그리는 중…
            </span>
          </div>
        ) : null}
        {error ? (
          <div className="no-print absolute inset-0 flex items-center justify-center bg-white">
            <span className="text-[13px] text-boss-error">{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
