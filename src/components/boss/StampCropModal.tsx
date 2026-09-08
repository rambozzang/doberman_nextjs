'use client';

// 도장 이미지를 원형으로 잘라 저장하는 대화상자
//
//   도장은 인장 특성상 둥근 모양이 자연스럽다. react-easy-crop 으로 사용자가
//   확대/이동하며 자를 위치를 고르면, 캔버스에 원형(clip) 으로 그려 투명 배경
//   PNG 로 내보낸다 — 그래야 견적서/영수증 위에 얹었을 때 사각형 테두리 없이
//   진짜 도장처럼 보인다.

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { Button } from '@/components/boss/ui';

const OUTPUT_SIZE = 480;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = src;
  });
}

async function cropToCircle(imageSrc: string, area: Area): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context 생성에 실패했습니다.');

  ctx.save();
  ctx.beginPath();
  ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환에 실패했습니다.'))), 'image/png');
  });
}

export default function StampCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const close = () => {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  };

  const confirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await cropToCircle(imageSrc, croppedAreaPixels);
      const croppedFile = new File([blob], `stamp-${Date.now()}.png`, { type: 'image/png' });
      URL.revokeObjectURL(imageSrc);
      onCropped(croppedFile);
    } catch (err) {
      console.error('stamp crop error', err);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="도장 이미지 원형으로 자르기"
        className="flex w-full max-w-[420px] flex-col border border-boss-border bg-boss-surface"
      >
        <div className="flex items-center justify-between border-b border-boss-border px-5 py-3.5">
          <p className="text-[15px] font-semibold text-boss-text">도장 이미지 자르기</p>
          <button
            type="button"
            onClick={close}
            disabled={processing}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center text-boss-text-muted hover:bg-boss-elevated hover:text-boss-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative h-[320px] w-full bg-boss-inset">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-boss-border px-5 py-4">
          <p className="text-[12px] leading-relaxed text-boss-text-secondary">
            원 안쪽만 도장으로 저장됩니다. 드래그로 위치를, 아래 막대로 확대/축소를 맞춰 주세요.
          </p>
          <label className="flex items-center gap-3 text-[12px] text-boss-text-secondary">
            확대
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={close} disabled={processing}>
              취소
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={confirm} disabled={processing || !croppedAreaPixels}>
              {processing ? '적용 중…' : '원형으로 자르기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
