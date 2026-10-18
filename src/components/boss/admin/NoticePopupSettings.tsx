'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock, ImagePlus, Megaphone, PartyPopper, Sparkles, X, type LucideIcon } from 'lucide-react';
import type { NoticePopupSettings as Settings } from '@/types/boss-platform-admin';
import {
  POPUP_DESTINATION_OPTIONS,
  POPUP_IMAGE_TYPES,
  POPUP_KIND_OPTIONS,
  isPopupImageUrl,
  popupImageFileProblem,
  popupPeriodLabel,
} from '@/lib/boss/noticePopup';
import { bossUploadApi } from '@/lib/api/boss/upload';
import { Button, CheckLine, Field, Segmented, TextareaField } from '@/components/boss/ui';

export function NoticePopupSettings({ value, disabled, onChange, onUploadingChange }: {
  value: Settings; disabled: boolean; onChange: (value: Settings) => void;
  /** 팝업 이미지를 올리는 동안 true — 편집기가 그사이 저장하지 않도록 막는 데 쓴다 */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const update = (patch: Partial<Settings>) => onChange({ ...value, ...patch });
  // 팝업 모양(2026-10-18): 이벤트는 이미지 한 장으로만, 공지 · 새 기능은 글자 또는 이미지 중 고른다.
  // 공지에서 "이미지"를 골랐지만 아직 올리기 전인 상태를 기억하려고 화면 안에서만 따로 들고 있는다.
  const [imageMode, setImageMode] = useState<boolean>(value.kind === 'EVENT' || !!value.imageUrl);
  const isEvent = value.kind === 'EVENT';
  const showImage = isEvent || imageMode || !!value.imageUrl;
  // 이미지 올리기는 시간이 걸린다 — 끝났을 때 그사이 고친 다른 칸을 옛 값으로 덮지 않게 마지막 값에 얹는다
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  return (
    <section aria-label="앱 로그인 팝업 설정" className="flex min-w-0 flex-col gap-4 border border-boss-border bg-boss-inset p-4 [&_input]:h-auto [&_input]:min-h-11 [&_input]:min-w-0 [&_input]:max-w-full [&_input]:py-2">
      <div>
        <CheckLine checked={value.enabled} onChange={(enabled) => update({ enabled })} disabled={disabled}>
          앱 로그인 팝업으로도 알리기
        </CheckLine>
        <p className="mt-2 text-[12px] leading-relaxed text-boss-text-secondary">
          공개한 글을 로그인한 사장님께 안내합니다. 닫기 · 오늘 하루 보지 않기는 앱에 자동으로 표시됩니다.
        </p>
      </div>
      {value.enabled && <>
        <div className="flex flex-col gap-2">
          <p className="boss-label" id="popup-kind-label">안내 종류</p>
          <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
            <Segmented ariaLabel="안내 종류" options={[...POPUP_KIND_OPTIONS]} value={value.kind}
              onChange={(kind) => {
                // 이벤트로 바꾸면 이미지 모양으로 고정된다
                if (kind === 'EVENT') setImageMode(true);
                update({ kind });
              }} />
          </fieldset>
        </div>
        {isEvent ? (
          <p className="border-l-2 border-boss-accent pl-3 text-[12.5px] leading-relaxed text-boss-text">
            이벤트는 다른 앱의 이벤트 팝업처럼 <b>이미지 한 장</b>으로만 뜹니다. 이미지를 누르면 아래에서 고른 화면으로 이동합니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="boss-label" id="popup-shape-label">팝업 모양</p>
            <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
              <Segmented ariaLabel="팝업 모양" options={[{ key: 'TEXT', label: '글자' }, { key: 'IMAGE', label: '이미지' }]}
                value={showImage ? 'IMAGE' : 'TEXT'}
                onChange={(shape) => {
                  if (shape === 'IMAGE') {
                    setImageMode(true);
                    return;
                  }
                  // 글자로 바꾸면 올린 이미지는 뺀다(두 모양이 섞여 보이지 않게)
                  setImageMode(false);
                  if (value.imageUrl) update({ imageUrl: null });
                }} />
            </fieldset>
          </div>
        )}
        {showImage && (
          <PopupImageField imageUrl={value.imageUrl} disabled={disabled} required={isEvent} onUploadingChange={onUploadingChange}
            onUploaded={(imageUrl) => onChange({ ...latest.current, imageUrl })}
            onRemove={() => update({ imageUrl: null })} />
        )}
        {showImage && !isEvent && !value.imageUrl && (
          <p className="text-[12px] leading-relaxed text-boss-text-secondary">이미지를 올리지 않으면 글자 팝업(제목 · 소개)으로 뜹니다.</p>
        )}
        {!showImage && (
          <TextareaField id="notice-popup-summary" label="팝업 소개" rows={3} maxLength={160}
            value={value.summary} disabled={disabled} onChange={(e) => update({ summary: e.target.value })}
            hint="비워 두면 본문 앞부분이 보입니다. 자세한 설명은 본문에 적어 주세요."
            placeholder="예: 이제 고객 정보로 세금계산서를 간편하게 작성하세요." />
        )}
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {!showImage && (
            <Field id="notice-popup-cta" label="버튼 이름" maxLength={24} value={value.ctaLabel}
              disabled={disabled} onChange={(e) => update({ ctaLabel: e.target.value })} placeholder="자세히 보기" />
          )}
          <label className="flex min-w-0 flex-col gap-1.5 text-[12.5px] font-semibold text-boss-text" htmlFor="notice-popup-destination">
            {showImage ? '이미지를 누르면 이동할 화면' : '누르면 이동할 화면'}
            <select id="notice-popup-destination" value={value.destination} disabled={disabled}
              onChange={(e) => update({ destination: e.target.value as Settings['destination'] })}
              className="min-h-11 w-full min-w-0 border border-boss-border bg-boss-surface px-3 py-2 text-[13px] font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-boss-accent disabled:opacity-50">
              {POPUP_DESTINATION_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field className="min-w-0" id="notice-popup-start" label="노출 시작 (선택)" type="datetime-local" value={value.startsAt?.slice(0, 16) ?? ''}
            disabled={disabled} onInput={(e) => update({ startsAt: e.currentTarget.value || null })}
            onChange={(e) => update({ startsAt: e.target.value || null })} />
          <Field className="min-w-0" id="notice-popup-end" label="노출 종료 (선택)" type="datetime-local" value={value.endsAt?.slice(0, 16) ?? ''}
            disabled={disabled} onInput={(e) => update({ endsAt: e.currentTarget.value || null })}
            onChange={(e) => update({ endsAt: e.target.value || null })} />
        </div>
        <p className="text-[12px] leading-relaxed text-boss-text-secondary">한국 시각 기준입니다. 시작을 비우면 바로, 종료를 비우면 계속 노출합니다.</p>
        <Field id="notice-popup-priority" label="노출 우선순위" type="number" min={0} max={100} step={1}
          value={Number.isNaN(value.priority) ? '' : value.priority} disabled={disabled}
          onChange={(e) => update({ priority: e.target.value === '' ? Number.NaN : Number(e.target.value) })}
          hint="0~100. 여러 팝업이 있으면 숫자가 큰 안내 하나를 먼저 보여줍니다." />
        <p className="border-t border-boss-border pt-3 text-[12px] leading-relaxed text-boss-text-secondary">
          팝업 설정을 켜도 임시 저장 · 숨김 상태이면 보이지 않습니다. 앱을 업데이트한 회원부터 이용할 수 있습니다.
        </p>
      </>}
    </section>
  );
}

/**
 * 팝업 이미지 — 이미지 올리기로 올린 주소만 넣는다(주소를 손으로 적는 칸은 두지 않는다).
 * 넣으면 앱 팝업이 이 이미지 한 장으로 뜨고, 아래에는 오늘 하루 보지 않기 · 닫기만 남는다(2026-10-18).
 */
function PopupImageField({ imageUrl, disabled, required, onUploaded, onRemove, onUploadingChange }: {
  imageUrl: string | null; disabled: boolean; required?: boolean;
  onUploaded: (url: string) => void; onRemove: () => void; onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const problem = popupImageFileProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const r = await bossUploadApi.image(file);
      const url = r.success === false ? '' : (r.data?.url ?? '').trim();
      if (!url) setError(`이미지를 올리지 못했습니다. ${r.message || r.error || '잠시 뒤 다시 시도해 주세요.'}`);
      // 서버가 다른 모양의 주소를 돌려주면 저장 때 막히므로 여기서 먼저 알린다
      else if (!isPopupImageUrl(url)) setError('올린 이미지 주소를 팝업에 쓸 수 없습니다. 다시 올려 주세요.');
      else onUploaded(url);
    } catch {
      setError('이미지를 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div role="group" aria-labelledby="popup-image-label" className="flex min-w-0 flex-col gap-2">
      <p className="boss-label" id="popup-image-label">팝업 이미지 {required ? '(필수)' : ''}</p>
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        {imageUrl && (
          <div className="aspect-[4/5] w-[128px] shrink-0 overflow-hidden border border-boss-border bg-boss-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="올린 팝업 이미지" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button icon={ImagePlus} className="min-h-11" disabled={disabled || uploading} aria-busy={uploading}
            aria-describedby="popup-image-hint" onClick={() => inputRef.current?.click()}>
            {uploading ? '올리는 중…' : imageUrl ? '이미지 바꾸기' : '이미지 올리기'}
          </Button>
          {imageUrl && (
            <Button variant="ghost" icon={X} className="min-h-11" disabled={disabled || uploading}
              onClick={() => {
                setError(null);
                onRemove();
              }}>
              이미지 빼기
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={POPUP_IMAGE_TYPES.join(',')} className="hidden" tabIndex={-1} aria-hidden
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // 같은 파일을 다시 골라도 올리도록 비운다
          void upload(file);
        }} />
      <p id="popup-image-hint" className="text-[12px] leading-relaxed text-boss-text-secondary">
        권장 크기 1080×1350 (4:5). 비율이 다르면 앱에서 위아래나 좌우가 잘립니다. 글자는 이미지 안에 넣어 주세요 — 팝업에는 이미지만 보이고, 아래에 오늘 하루 보지 않기 · 닫기가 붙습니다. 앱을 업데이트한 회원부터 이미지로 보입니다.
      </p>
      <p role="status" className="sr-only">{uploading ? '팝업 이미지를 올리는 중입니다.' : ''}</p>
      {error && <p role="alert" className="text-[12px] leading-relaxed text-boss-error">{error}</p>}
    </div>
  );
}

type KindStyle = { label: string; icon: LucideIcon; accent: string; hero: readonly [string, string] };

/** 앱 팝업과 같은 종류별 색 — 강조색(이름표 · 기간 · 버튼)과 위쪽 그림 칸 그라데이션 */
const STYLES: Record<Settings['kind'], KindStyle> = {
  NOTICE: { label: '공지', icon: Megaphone, accent: '#5145d9', hero: ['#7B6FF0', '#4A3FCB'] },
  EVENT: { label: '이벤트', icon: PartyPopper, accent: '#c2410c', hero: ['#FF9A4D', '#E5482A'] },
  FEATURE: { label: '새 기능', icon: Sparkles, accent: '#0b7a6e', hero: ['#2CC5A8', '#0B7A6E'] },
};

/** 앱 팝업 그림 칸의 도배르만 얼굴 — 앱 assets/images/doberman.png 와 같은 파일 */
const MASCOT_SRC = '/images/boss/doberman-mascot.png';

/** 그림 칸의 반짝이 점 — 앱과 같은 자리(가로 비율, 세로 비율, 반지름 px) */
const HERO_DOTS = [[20, 62, 2.6], [30, 30, 1.8], [74, 24, 2.2], [82, 70, 3.0], [66, 84, 1.6]] as const;

/**
 * 실제 버튼이 아닌 미리보기: 클릭해도 설정 저장·페이지 이동이 일어나지 않는다.
 * 앱 팝업과 같은 구성 — 어둡게 덮은 바탕 위 카드(그림자 없음), 카드 아래 '오늘 하루 보지 않기 · 닫기' 띠.
 */
export function NoticePopupPreview({ value, title, content }: { value: Settings; title: string; content: string }) {
  const style = STYLES[value.kind];
  const period = popupPeriodLabel(value.endsAt);
  const image = value.imageUrl?.trim() || null;
  // 올린 이미지의 실제 비율 — 4:5 와 많이 다르면 앱에서 잘린다고 알려 준다
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => setRatio(null), [image]);
  const cropped = ratio !== null && Math.abs(ratio - 1.25) > 0.08;
  return (
    <section aria-label="앱 로그인 팝업 미리보기" className="flex flex-col gap-3">
      <p className="boss-label">앱 로그인 팝업 미리보기</p>
      <div className="bg-boss-inset">
        {/* 앱처럼 화면 위를 검정 62%로 덮는다 */}
        <div className="flex justify-center bg-black/[0.62] px-5 py-8 sm:px-7">
          <div className="w-full max-w-[352px]">
            <div className="overflow-hidden rounded-[24px] bg-white text-[#1b1e27]">
              {!image && value.kind === 'EVENT' ? (
                // 이벤트는 이미지로만 뜬다 — 이미지를 올리기 전에는 자리만 보여 준다(글자 팝업처럼 보이면 헷갈린다)
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-[#eceef1] px-8 text-center text-[#5b6270]">
                  <ImagePlus size={28} aria-hidden />
                  <p className="text-[14px] font-bold">이벤트 이미지를 올려 주세요</p>
                  <p className="text-[12px] leading-relaxed">1080×1350 (4:5) 한 장이 그대로 팝업이 됩니다.</p>
                </div>
              ) : image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="팝업 이미지" className="block aspect-[4/5] w-full bg-[#eceef1] object-cover"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0) setRatio(img.naturalHeight / img.naturalWidth);
                  }} />
              ) : (
                <>
                  <PreviewHero style={style} />
                  <div className="flex flex-col items-center px-6 pb-1 pt-[22px] text-center">
                    {period && (
                      <p className="mb-2.5 flex items-center justify-center gap-1 text-[13.5px] font-bold leading-[1.3]" style={{ color: style.accent }}>
                        <Clock size={15} className="shrink-0" aria-hidden />{period}
                      </p>
                    )}
                    <p className="w-full whitespace-pre-wrap break-keep text-[21px] font-extrabold leading-[1.35] tracking-[-0.4px] [overflow-wrap:anywhere]">
                      {title || '팝업 제목'}
                    </p>
                    <p className="mt-2.5 w-full whitespace-pre-wrap break-keep text-[15px] leading-[1.6] tracking-[-0.2px] text-[#5b6270] [overflow-wrap:anywhere]">
                      {value.summary.trim() || content.trim().slice(0, 160) || '짧은 소개를 적으면 여기에 보입니다.'}
                    </p>
                  </div>
                </>
              )}
              {/* 앱과 같다: 이미지 팝업은 이미지만, 버튼은 글자 팝업에만 */}
              {!image && value.kind !== 'EVENT' && (
                <div className="px-5 pb-5 pt-[18px]">
                  <div className="flex min-h-[54px] items-center justify-center gap-1.5 rounded-[16px] px-4 py-3 text-[16px] font-extrabold text-white" style={{ backgroundColor: style.accent }}>
                    <span className="min-w-0 break-keep text-center [overflow-wrap:anywhere]">{value.ctaLabel.trim() || '자세히 보기'}</span>
                    <ArrowRight size={18} className="shrink-0" aria-hidden />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 text-[15px] leading-tight" aria-hidden>
              <span className="flex min-h-12 items-center px-2 py-2.5 font-medium text-white/[0.86]">오늘 하루 보지 않기</span>
              <span className="flex min-h-12 items-center gap-1 px-2 py-2.5 font-bold text-white">닫기<X size={18} /></span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-boss-text-secondary">
        {image
          ? '이미지 팝업 미리보기입니다. 이미지를 누르면 고른 화면으로 이동합니다. 앱을 업데이트하지 않은 회원이나 이미지를 불러오지 못한 경우에는 글자 팝업(제목 · 소개 · 버튼)으로 보입니다.'
          : '구성과 문구 미리보기입니다. 기기의 화면 크기와 글자 크기에 맞춰 앱에서 조정됩니다.'}
      </p>
      {image && cropped && (
        <p role="status" className="text-[12px] leading-relaxed text-boss-error">
          올린 이미지 비율이 4:5 와 달라 앱에서 {ratio! > 1.25 ? '위아래' : '좌우'}가 잘립니다. 1080×1350 크기로 다시 만들어 올리는 걸 권합니다.
        </p>
      )}
    </section>
  );
}

/** 위쪽 그림 칸(164px) — 종류별 그라데이션, 왼쪽 위 이름표, 가운데 흰 원 안 도배르만 + 종류 아이콘 배지 */
function PreviewHero({ style }: { style: KindStyle }) {
  const Icon = style.icon;
  return (
    <div className="relative h-[164px] overflow-hidden" style={{ backgroundImage: `linear-gradient(to bottom right, ${style.hero[0]}, ${style.hero[1]})` }}>
      {/* 장식 — 가운데 빛 번짐, 큰 반투명 원 둘, 반짝이 점 */}
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle 123px at 50% 50%, rgba(255,255,255,0.30), rgba(255,255,255,0))' }} />
      <div aria-hidden className="absolute h-[204px] w-[204px] rounded-full bg-white/[0.09]" style={{ left: 'calc(96% - 102px)', top: 'calc(6% - 102px)' }} />
      <div aria-hidden className="absolute h-[158px] w-[158px] rounded-full bg-white/[0.09]" style={{ left: 'calc(2% - 79px)', top: 'calc(102% - 79px)' }} />
      {HERO_DOTS.map(([x, y, r]) => (
        <span key={`${x}-${y}`} aria-hidden className="absolute rounded-full bg-white/75"
          style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, transform: 'translate(-50%, -50%)' }} />
      ))}
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[102px] w-[110px] -translate-x-1/2 -translate-y-1/2">
        {/* 앱과 같은 도배르만 얼굴(투명 바탕) — 흰 원 안 14% 여백 */}
        <div className="absolute left-1/2 top-1/2 flex h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-[13px]"
          style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.45), 0 4px 16px rgba(0,0,0,0.12)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MASCOT_SRC} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="absolute bottom-0 right-0 flex h-[35px] w-[35px] items-center justify-center rounded-full border-[2.5px] border-white text-white" style={{ backgroundColor: style.accent }}>
          <Icon size={18} />
        </div>
      </div>
      <p className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-full bg-white px-2.5 py-[5px] text-[12.5px] font-extrabold leading-[1.2]" style={{ color: style.accent }}>
        <Icon size={14} className="shrink-0" aria-hidden />{style.label}
      </p>
    </div>
  );
}
