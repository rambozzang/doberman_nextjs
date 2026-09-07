// PDF 만들기 · PDF 1쪽을 그림으로 굽기 — 미리보기(PdfPreview)와 내보내기(PrintActions)가 같이 쓴다
//
// @react-pdf/renderer 와 pdfjs 는 무거워서 여기서도 **함수 안에서만** 동적으로 불러온다.
// 페이지 번들에 정적으로 들어가면 화면 자체가 죽는다(2026-09-07 프로덕션 장애).

import type { ReactElement } from 'react';

/** 벡터 PDF 를 Blob 으로 (@react-pdf/renderer) */
export async function renderVectorPdf(doc: ReactElement): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  // pdf() 는 <Document> 만 받는다. 호출부가 항상 Document 를 넘기므로 여기서 형만 맞춘다.
  return pdf(doc as Parameters<typeof pdf>[0]).toBlob();
}

/** PDF 1쪽을 고해상도 PNG 로 — 캡처가 아니라 벡터에서 구워서 글자가 또렷하다 */
export async function pdfBlobToPng(blob: Blob, scale = 3): Promise<Blob> {
  const pdfjs = await import('pdfjs-dist');
  // 워커는 같은 버전의 파일을 쓴다(번들러가 URL 을 만들어 준다)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  const buf = await blob.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvasToBlob(canvas);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
