'use client';
import { useCallback, useRef, useState } from 'react';

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

  const open = useCallback(() => inputRef.current?.click(), []);

  const handleFile = useCallback(async (file: File) => {
    setStage('edge');
    const stages: ImageAnalysisStage[] = ['edge', 'area', 'wallpaper'];
    const tickPromise = (async () => {
      for (const s of stages) {
        setStage(s);
        await new Promise((r) => setTimeout(r, STAGE_DURATIONS[s as 'edge' | 'area' | 'wallpaper']));
      }
    })();
    await Promise.all([tickPromise, onUpload(file)]);
    setStage('done');
    setTimeout(() => setStage('idle'), 600);
  }, [onUpload]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  return { stage, inputRef, open, onChange };
}
