'use client';

// 세금계산서 · 현금영수증 미리보기 — 내려받을 PDF 를 쪽마다 그림으로 구워 그대로 보여 준다.
//
// 견적서 미리보기(components/boss/print/PdfPreview)는 1쪽만 굽는다. 세금 문서는 품목이 많으면 여러 쪽이라
// 모든 쪽을 굽고, 인쇄도 쪽마다 A4 한 장씩 찍는다(@page 여백 0 — PDF 안에 여백이 있다).
// 화면 · PDF · 인쇄가 같은 PDF 에서 나오므로 금액 · 공급자 값이 어긋나지 않는다.
//
// 좁은 화면: 기본은 폭 맞춤. 글자가 작으면 100% · 150% 로 키우고 가로로 밀어 본다.

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { renderVectorPdf } from '@/components/boss/print/pdfRender';
import { Segmented } from '@/components/boss/ui';

type Zoom = 'fit' | '100' | '150';

/** PDF 모든 쪽을 PNG 로 — pdfjs 는 무거워서 쓸 때만 불러온다 */
async function pdfPagesToPng(blob: Blob, scale: number): Promise<Blob[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ data: await blob.arrayBuffer() });
  const doc = await task.promise;
  const out: Blob[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      out.push(
        await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
        ),
      );
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
  return out;
}

const ZOOM_WIDTH: Record<Zoom, string> = {
  fit: '100%',
  '100': '794px', // A4 폭 210mm @96dpi
  '150': '1191px',
};

export default function DocumentPreview({
  docFactory,
  renderKey,
  alt,
  onPages,
}: {
  /** PDF <Document> 를 만드는 함수 — 저장 · 공유 버튼과 같은 함수 */
  docFactory: () => Promise<ReactElement>;
  /** 바뀌면 다시 굽는다 */
  renderKey: string;
  alt: string;
  /** 구운 쪽 수(실패하면 0) */
  onPages?: (count: number) => void;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Zoom>('fit');
  const urlsRef = useRef<string[]>([]);
  const factoryRef = useRef(docFactory);
  const onPagesRef = useRef(onPages);

  useEffect(() => {
    factoryRef.current = docFactory;
    onPagesRef.current = onPages;
  });

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError(null);
    (async () => {
      try {
        const pdf = await renderVectorPdf(await factoryRef.current());
        const pngs = await pdfPagesToPng(pdf, 2.5);
        if (cancelled) return;
        const urls = pngs.map((b) => URL.createObjectURL(b));
        urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        urlsRef.current = urls;
        setPages(urls);
        onPagesRef.current?.(urls.length);
      } catch (e) {
        console.error('tax document preview failed', e);
        if (!cancelled) {
          setError('미리보기를 만들지 못했습니다. 새로고침한 뒤 다시 열어 주세요.');
          onPagesRef.current?.(0);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [renderKey]);

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    },
    [],
  );

  return (
    <div className="tax-paper-preview flex flex-col gap-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <p className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary" aria-live="polite">
          {busy ? '문서를 그리는 중…' : error ? '미리보기 실패' : `A4 · ${pages.length}쪽`}
        </p>
        <Segmented
          ariaLabel="미리보기 크기"
          value={zoom}
          onChange={setZoom}
          options={[
            { key: 'fit', label: '폭 맞춤' },
            { key: '100', label: '100%' },
            { key: '150', label: '150%' },
          ]}
        />
      </div>

      {error ? (
        <div className="no-print border border-boss-error/35 bg-boss-pill-bad px-4 py-3 text-[13px] text-boss-pill-bad-fg" role="alert">
          {error}
        </div>
      ) : null}

      {/* 화면: 가로 스크롤 영역 안에 종이를 쌓는다. 인쇄: 쪽마다 A4 한 장 */}
      <div className="tax-paper-scroll boss-scroll overflow-x-auto">
        <div className="tax-paper-stack mx-auto flex flex-col gap-4" style={{ width: ZOOM_WIDTH[zoom], maxWidth: zoom === 'fit' ? 794 : undefined }}>
          {pages.length === 0 && !error ? (
            <div className="no-print relative w-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]" style={{ aspectRatio: '210 / 297' }}>
              <div className="no-print absolute inset-0 grid place-items-center">
                <span className="font-boss-head text-[12px] uppercase tracking-[0.1em] text-boss-text-secondary">문서를 그리는 중…</span>
              </div>
            </div>
          ) : (
            pages.map((src, i) => (
              <div
                key={src}
                className="tax-paper-page relative w-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_32px_-12px_rgba(0,0,0,0.28)]"
                style={{ aspectRatio: '210 / 297' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL 은 next/image 로 못 다룬다 */}
                <img src={src} alt={`${alt} ${i + 1}/${pages.length}쪽`} className="block h-full w-full" draggable={false} />
                {busy ? <div className="no-print absolute inset-0 bg-white/60" aria-hidden /> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
