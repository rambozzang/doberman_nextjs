'use client';

// 고객 서명 받기 — Industry 패턴 (HTML5 Canvas)
//   좌: 서명 패드 패널(흰 종이 + 되돌리기 · 지우기) → 고객 정보 패널(2열) → 하단 액션 패널 / 우: 필수 누락 · 안내.
//   화면 제목은 셸 헤더(PAGE_META)가 그린다. 캔버스 배경은 흰색 유지, 그리기 로직은 불변.
// Flutter: lib/app/signature/signature_capture_page.dart 와 대응
//   외부 라이브러리 없이 마우스/터치 입력 → canvas drawing → toDataURL(base64) 저장
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eraser, Undo2 } from 'lucide-react';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import { Panel, Field, TextareaField, Button, ButtonLink } from '@/components/boss/ui';

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

  // 우측 안내 패널용 — 아직 채우지 않은 필수 항목 (서명 여부는 ref 라 저장 시점에만 검사한다)
  const missing = useMemo(() => (customerName.trim() ? [] : ['고객 이름']), [customerName]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ── 좌: 서명 패드 · 고객 정보 ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <Panel
          title="고객 서명"
          kicker="SIGN HERE"
          right={
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" icon={Undo2} onClick={undoLast}>
                되돌리기
              </Button>
              <Button variant="secondary" size="sm" icon={Eraser} onClick={clearCanvas}>
                지우기
              </Button>
            </div>
          }
        >
          {/* 서명 패드 — 캔버스가 흰 배경을 직접 칠하므로 종이처럼 흰 면으로 둔다 */}
          <div className="relative h-80 w-full overflow-hidden border border-boss-border-strong bg-white">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              aria-label="고객 서명 입력 영역"
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
          <p className="mt-2 text-[12px] text-boss-text-secondary">
            마우스 또는 손가락으로 위 칸에 서명해 주세요. 잘못 그렸으면 되돌리기 · 지우기로 다시 그립니다.
          </p>
        </Panel>

        <Panel title="고객 정보" kicker="CUSTOMER">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="customerName"
                label="고객 이름"
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="서명하는 고객 이름"
                autoComplete="off"
              />
              <Field
                id="customerPhone"
                label="연락처"
                type="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="orderId"
                label="연결할 고객 번호"
                type="text"
                inputMode="numeric"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="예: 1234"
              />
              <Field
                id="recordId"
                label="연결할 시공 기록 번호"
                type="text"
                inputMode="numeric"
                value={recordIdInput}
                onChange={(e) => setRecordIdInput(e.target.value)}
                placeholder="예: 56"
              />
            </div>
            <TextareaField
              id="memo"
              label="메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="현장 · 시공 내용 · 고객 요청 사항"
            />
          </div>
        </Panel>

        {/* 하단 액션 패널 */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          <span className="text-[12.5px] text-boss-text-secondary">
            확인 일시{' '}
            <span className="font-boss-head tabular-nums text-boss-text">{now || '—'}</span>
          </span>
          <ButtonLink href="/boss/signature" variant="secondary" className="ml-auto">
            취소
          </ButtonLink>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중…' : '서명 저장'}
          </Button>
        </div>
      </div>

      {/* ── 우: 안내 ── */}
      <div className="flex flex-col gap-4">
        <Panel kicker="필수 누락">
          {missing.length === 0 ? (
            <p className="text-[13px] text-boss-success">고객 이름을 채웠습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-[13px] text-boss-error">
              {missing.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] leading-relaxed text-boss-text-secondary">
            서명 칸이 비어 있으면 저장되지 않습니다. 저장 전에 고객에게 화면을 돌려 직접 서명받으세요.
          </p>
        </Panel>

        <Panel kicker="안내">
          <p className="text-[12.5px] leading-[1.7] text-boss-text-soft">
            시공을 마친 뒤 고객이 완료를 확인했다는 근거로 남깁니다. 서명은{' '}
            <strong className="font-semibold">이미지(PNG)</strong>와 확인 일시로 저장됩니다.
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-boss-text-soft">
            고객 · 시공 기록 번호를 함께 적어 두면 해당 상세에서 서명을 바로 찾을 수 있습니다.
          </p>
        </Panel>
      </div>
    </div>
  );
}
