'use client';

// 사장님 고객 서명 캡처 페이지 (HTML5 Canvas 기반)
// Flutter: lib/app/signature/signature_capture_page.dart 와 대응
// 외부 라이브러리 없이 마우스/터치 입력 → canvas drawing → toDataURL(base64) 저장
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Eraser, Save, PenLine, Info, Clock, Undo2 } from 'lucide-react';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';

export default function BossSignatureCapturePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasStrokeRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [recordIdInput, setRecordIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState<string>('');

  // 캔버스 초기 셋업: DPR 보정 + 하얀 배경
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#111111';
  };

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);
    // 현재 시각 표시
    const upd = () => {
      const d = new Date();
      setNow(
        `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
          d.getDate(),
        ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes(),
        ).padStart(2, '0')}`,
      );
    };
    upd();
    const timer = setInterval(upd, 30 * 1000);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(timer);
    };
  }, []);

  // 좌표 추출 헬퍼 (마우스 / 터치 통합)
  const getPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return null;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPoint(e);
    if (!p) return;
    drawingRef.current = true;
    lastPointRef.current = p;
    // 점 하나 찍기
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#111111';
      ctx.fill();
    }
    hasStrokeRef.current = true;
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = getPoint(e);
    const last = lastPointRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!p || !last || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    pushHistory();
  };

  const undoLast = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || historyRef.current.length === 0) return;
    historyRef.current.pop();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (historyRef.current.length > 0) {
      ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
    } else {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    ctx.scale(dpr, dpr);
    hasStrokeRef.current = historyRef.current.length > 0;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    hasStrokeRef.current = false;
    historyRef.current = [];
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      toast.error('고객 이름을 입력해 주세요.');
      return;
    }
    if (!hasStrokeRef.current) {
      toast.error('서명을 입력해 주세요.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      // 캔버스 → base64 PNG dataURL
      const dataUrl = canvas.toDataURL('image/png');

      const orderId = orderIdInput.trim() ? Number(orderIdInput.trim()) : null;
      const recordId = recordIdInput.trim() ? Number(recordIdInput.trim()) : null;

      const res = await bossSignatureApi.create({
        custId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        signatureImagePath: dataUrl,
        signatureData: null,
        orderId: Number.isFinite(orderId as number) ? (orderId as number) : null,
        recordId: Number.isFinite(recordId as number) ? (recordId as number) : null,
        memo: memo.trim() || null,
      });

      if (res.success) {
        toast.success('서명이 저장되었습니다.');
        router.push('/boss/signature');
      } else {
        toast.error(res.message || '서명 저장에 실패했습니다.');
      }
    } catch {
      toast.error('서명 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href="/boss/signature"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undoLast}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white"
          >
            <Undo2 size={14} /> 되돌리기
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white"
          >
            <Eraser size={14} /> 지우기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 disabled:opacity-50"
          >
            <Save size={14} /> {isSaving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-2 text-xs text-blue-200">
        <Info size={14} /> 시공 완료 후 고객님의 서명을 받아주세요.
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 폼 */}
        <div className="space-y-4 lg:col-span-1">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              고객 이름 <span className="text-rose-400">*</span>
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="고객 이름을 입력하세요"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">전화번호</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="전화번호 (선택)"
              inputMode="tel"
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">주문 ID</label>
              <input
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="(선택)"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">시공기록 ID</label>
              <input
                value={recordIdInput}
                onChange={(e) => setRecordIdInput(e.target.value)}
                placeholder="(선택)"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
            <Clock size={12} /> 확인 일시: {now}
          </div>
        </div>

        {/* 서명 패드 */}
        <div className="lg:col-span-2">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <PenLine size={12} /> 고객 서명 <span className="text-rose-400">*</span>
          </label>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-white">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
              onTouchCancel={endDraw}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            마우스 또는 손가락으로 서명해 주세요. 우측 상단의 ‘지우기’로 다시 그릴 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
