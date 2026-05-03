'use client';
import { useState } from 'react';
import { Camera, Mic, MicOff, Send } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useImageUpload, type ImageAnalysisStage } from '../hooks/useImageUpload';

interface Props {
  disabled?: boolean;
  onSendText: (text: string) => void;
  onUploadImage: (file: File) => Promise<unknown>;
}

const STAGE_LABEL: Record<ImageAnalysisStage, string> = {
  idle: '',
  edge: '🤖 윤곽 검출 중...',
  area: '🤖 면적 추정 중...',
  wallpaper: '🤖 벽지 추천 중...',
  done: '✅ 분석 완료',
};

export default function ChatInput({ disabled, onSendText, onUploadImage }: Props) {
  const [text, setText] = useState('');
  const { isSupported, isListening, start, stop } = useVoiceInput((spoken) => setText((prev) => (prev ? prev + ' ' + spoken : spoken)));
  const { stage, inputRef, open: openFileDialog, onChange: onFileChange } = useImageUpload({ onUpload: onUploadImage });

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSendText(text.trim());
    setText('');
  };

  return (
    <div className="space-y-2">
      {stage !== 'idle' && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-xs">
          {STAGE_LABEL[stage]}
        </div>
      )}
      <div className="flex items-end gap-2 p-2 rounded-2xl bg-slate-900/60 backdrop-blur border border-slate-700">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={openFileDialog}
          disabled={disabled}
          aria-label="이미지 업로드"
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition disabled:opacity-40"
        >
          <Camera className="w-5 h-5" />
        </button>
        {isSupported && (
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={disabled}
            aria-label={isListening ? '음성 입력 중지' : '음성 입력 시작'}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-40 ${
              isListening ? 'bg-red-500/30 text-red-200 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="자연스럽게 입력하세요... (예: 30평 아파트 거실 실크로요)"
          disabled={disabled}
          className="flex-1 min-h-[40px] max-h-32 resize-none bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none px-2 py-2"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          aria-label="전송"
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
