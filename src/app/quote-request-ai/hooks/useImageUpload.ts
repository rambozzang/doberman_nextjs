'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ImageAnalysisStage = 'idle' | 'edge' | 'area' | 'wallpaper' | 'done';

interface UseImageUploadArgs {
  onUpload: (file: File) => Promise<unknown>;
}

const STAGE_DURATIONS: Record<Exclude<ImageAnalysisStage, 'idle' | 'done'>, number> = {
  edge: 800,
  area: 800,
  wallpaper: 800,
};

export function useImageUpload({ onUpload }: UseImageUploadArgs) {
  const [stage, setStage] = useState<ImageAnalysisStage>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 setState 호출 방지 및 타이머 정리
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const open = useCallback(() => inputRef.current?.click(), []);

  const handleFile = useCallback(async (file: File) => {
    try {
      setStage('edge');
      const stages: ImageAnalysisStage[] = ['edge', 'area', 'wallpaper'];
      const tickPromise = (async () => {
        for (const s of stages) {
          if (!isMountedRef.current) return;
          setStage(s);
          await new Promise((r) => setTimeout(r, STAGE_DURATIONS[s as 'edge' | 'area' | 'wallpaper']));
        }
      })();
      await Promise.all([tickPromise, onUpload(file)]);
      if (!isMountedRef.current) return;
      setStage('done');
      timerRef.current = setTimeout(() => {
        if (isMountedRef.current) setStage('idle');
      }, 600);
    } catch (err) {
      if (isMountedRef.current) setStage('idle');
      console.error('이미지 업로드 처리 오류:', err);
    }
  }, [onUpload]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  return { stage, inputRef, open, onChange };
}
