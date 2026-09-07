'use client';

// 인쇄 화면 공용 액션 — 인쇄 · PDF 저장 · 이미지 저장 · 공유 · 문자
//
// 웹에서 "핸드폰으로 견적서 보내기"를 가능한 만큼 구현한다.
//   PDF        : pdfDoc 이 주어지면 @react-pdf/renderer 로 **진짜 벡터 PDF** 를 만든다.
//                 (글자가 글자로 들어가 확대해도 안 깨지고 복사도 된다. 앱 PDF 와 같은 방식)
//                 pdfDoc 이 없으면 예전처럼 화면을 캡처해서 넣는다.
//   이미지      : 벡터 PDF 를 만들 수 있으면 그 PDF 1쪽을 고해상도로 굽고, 아니면 화면을 캡처한다.
//   공유        : Web Share API(navigator.share) 로 OS 공유 시트를 연다 — 아이폰 Safari · 안드로이드 Chrome 에서
//                 문자 · 카카오톡 · 메일에 파일이 첨부된다. 지원하지 않는 브라우저(데스크톱 대부분)에서는 버튼을 숨긴다.
//   문자        : sms: 링크로 문자 앱을 연다. 파일은 못 붙이고 요약 문구만 채운다.
//
// html2canvas · jspdf 는 무거워서 버튼을 누를 때만 동적으로 불러온다.

import { useEffect, useState, type ReactElement, type ReactNode, type RefObject } from 'react';
import toast from 'react-hot-toast';
import { Printer, FileDown, ImageDown, Share2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/boss/ui';
import { renderVectorPdf, pdfBlobToPng, canvasToBlob } from './pdfRender';

type Props = {
  /** 종이(캡처) 영역 */
  targetRef: RefObject<HTMLElement | null>;
  /** 확장자 없는 파일 이름 — 예: 견적서_홍길동_2026-09-06 */
  fileName: string;
  /** 공유 시트 제목 */
  shareTitle: string;
  /** 공유 · 문자에 들어갈 요약 문구 */
  shareText: string;
  /** 고객 전화번호 — 있으면 문자 버튼 노출 */
  smsPhone?: string | null;
  disabled?: boolean;
  /** 앞쪽에 둘 보조 버튼(목록으로 등) */
  children?: ReactNode;
  /**
   * 벡터 PDF 문서를 만드는 함수. 있으면 PDF · 이미지 · 공유가 모두 이걸로 만들어진다.
   *
   * 왜 함수인가: @react-pdf/renderer 는 브라우저에서 무겁고 페이지 번들에 정적으로 들어가면
   * 화면 자체가 죽는다(2026-09-07 프로덕션 장애). 버튼을 누른 순간에만 동적 import 하도록
   * 호출부에서 함수로 감싸 넘긴다.
   */
  pdfDocFactory?: (() => Promise<ReactElement>) | null;
};

type Busy = null | 'pdf' | 'png' | 'share';

/** 캡처용 파일 이름 — 파일 시스템에 못 쓰는 문자만 걷어낸다 */
function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  // iPadOS 13+ 는 UA 에 iPad 가 없고 Mac 으로 나온다 — 터치 지원 Mac 은 iPad 다
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** 종이 영역을 캔버스로. 화면의 패널 배경 · 테두리 · 그림자는 벗기고 흰 종이 위에 그린다. */
async function renderCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (_doc, cloned) => {
      cloned.style.background = '#ffffff';
      cloned.style.border = 'none';
      cloned.style.boxShadow = 'none';
    },
  });
}

/** A4 세로. 종이보다 길면 페이지 높이만큼 캔버스를 잘라 한 장씩 붙인다 — 겹침 · 여백 침범이 없다. */
async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 10;
  const pageW = 210 - margin * 2;
  const pageH = 297 - margin * 2;
  const pxPerMm = canvas.width / pageW;
  const sliceHeightPx = Math.max(1, Math.floor(pageH * pxPerMm));

  const slice = document.createElement('canvas');
  const ctx = slice.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  let y = 0;
  let first = true;
  while (y < canvas.height) {
    const h = Math.min(sliceHeightPx, canvas.height - y);
    slice.width = canvas.width;
    slice.height = h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, pageW, h / pxPerMm);
    y += h;
    first = false;
  }
  return pdf.output('blob');
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari 가 다운로드를 시작할 시간을 준다
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function PrintActions({
  targetRef,
  fileName,
  shareTitle,
  shareText,
  pdfDocFactory,
  smsPhone,
  disabled,
  children,
}: Props) {
  const [busy, setBusy] = useState<Busy>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // 파일 공유 가능 여부는 브라우저마다 달라 마운트 후에 판정한다
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('share' in navigator) || !('canShare' in navigator)) return;
    try {
      const probe = new File([new Blob(['x'])], 'probe.png', { type: 'image/png' });
      setCanShareFiles(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const name = safeName(fileName);
  const phoneDigits = (smsPhone ?? '').replace(/[^\d+]/g, '');

  const getTarget = () => {
    const el = targetRef.current;
    if (!el) toast.error('내려받을 내용이 아직 없습니다.');
    return el;
  };

  const handlePrint = () => {
    if (typeof window === 'undefined' || busy) return;
    window.print();
  };

  const handlePdf = async () => {
    if (busy) return;
    const el = getTarget();
    if (!pdfDocFactory && !el) return;
    setBusy('pdf');
    try {
      // 벡터 PDF 가 우선 — 글자가 이미지가 아니라 글자로 들어간다
      const blob = pdfDocFactory
        ? await renderVectorPdf(await pdfDocFactory())
        : await canvasToPdf(await renderCanvas(el!));
      download(blob, `${name}.pdf`);
      toast.success('PDF 를 저장했습니다.');
    } catch (e) {
      console.error('pdf export failed', e);
      toast.error('PDF 를 만들지 못했습니다. 인쇄 → PDF 로 저장을 대신 써 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const handlePng = async () => {
    if (busy) return;
    const el = getTarget();
    if (!pdfDocFactory && !el) return;
    setBusy('png');
    try {
      // 벡터 PDF 를 고해상도로 구워 낸다 — 화면 캡처보다 훨씬 또렷하다
      const blob = pdfDocFactory
        ? await pdfBlobToPng(await renderVectorPdf(await pdfDocFactory()))
        : await canvasToBlob(await renderCanvas(el!));
      download(blob, `${name}.png`);
      toast.success('이미지를 저장했습니다.');
    } catch (e) {
      console.error('png export failed', e);
      toast.error('이미지를 만들지 못했습니다.');
    } finally {
      setBusy(null);
    }
  };

  // 공유는 이미지로 — 문자(MMS)·카카오톡 양쪽에서 바로 보인다. PDF 가 필요하면 저장 후 첨부.
  const handleShare = async () => {
    if (busy) return;
    const el = getTarget();
    if (!pdfDocFactory && !el) return;
    setBusy('share');
    try {
      const png = pdfDocFactory
        ? await pdfBlobToPng(await renderVectorPdf(await pdfDocFactory()))
        : await canvasToBlob(await renderCanvas(el!));
      const file = new File([png], `${name}.png`, { type: 'image/png' });
      if (!navigator.canShare?.({ files: [file] })) {
        toast.error('이 기기에서는 파일 공유를 지원하지 않습니다. 이미지 저장 후 보내 주세요.');
        return;
      }
      await navigator.share({ files: [file], title: shareTitle, text: shareText });
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 오류가 아니다
      if (e instanceof DOMException && e.name === 'AbortError') return;
      console.error('share failed', e);
      toast.error('공유하지 못했습니다. 이미지 저장 후 보내 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const smsHref = phoneDigits
    ? `sms:${phoneDigits}${isIOS() ? '&' : '?'}body=${encodeURIComponent(shareText)}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={disabled}>
        인쇄
      </Button>
      <Button
        variant="secondary"
        icon={FileDown}
        onClick={() => void handlePdf()}
        disabled={disabled || busy !== null}
      >
        {busy === 'pdf' ? '만드는 중…' : 'PDF 저장'}
      </Button>
      <Button
        variant="secondary"
        icon={ImageDown}
        onClick={() => void handlePng()}
        disabled={disabled || busy !== null}
      >
        {busy === 'png' ? '만드는 중…' : '이미지 저장'}
      </Button>
      {smsHref && (
        <a
          href={smsHref}
          className={`boss-btn boss-btn-md boss-btn-secondary ${disabled ? 'pointer-events-none opacity-45' : ''}`}
          title="문자 앱을 열어 요약 문구를 채웁니다. 파일은 공유 버튼으로 보내 주세요."
        >
          <MessageSquareText size={14} strokeWidth={1.75} />
          문자
        </a>
      )}
      {canShareFiles && (
        <Button
          variant="primary"
          icon={Share2}
          onClick={() => void handleShare()}
          disabled={disabled || busy !== null}
          title="이미지로 공유 — 문자 · 카카오톡 · 메일"
        >
          {busy === 'share' ? '준비 중…' : '공유'}
        </Button>
      )}
    </div>
  );
}
