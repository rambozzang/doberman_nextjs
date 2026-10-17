'use client';

import { ArrowRight, Gift, Megaphone, Sparkles } from 'lucide-react';
import type { NoticePopupSettings as Settings } from '@/types/boss-platform-admin';
import { POPUP_DESTINATION_OPTIONS, POPUP_KIND_OPTIONS } from '@/lib/boss/noticePopup';
import { CheckLine, Field, Segmented, TextareaField } from '@/components/boss/ui';

export function NoticePopupSettings({ value, disabled, onChange }: {
  value: Settings; disabled: boolean; onChange: (value: Settings) => void;
}) {
  const update = (patch: Partial<Settings>) => onChange({ ...value, ...patch });
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
            <Segmented ariaLabel="안내 종류" options={[...POPUP_KIND_OPTIONS]} value={value.kind} onChange={(kind) => update({ kind })} />
          </fieldset>
        </div>
        <TextareaField id="notice-popup-summary" label="팝업 소개" rows={3} maxLength={160}
          value={value.summary} disabled={disabled} onChange={(e) => update({ summary: e.target.value })}
          hint="비워 두면 본문 앞부분이 보입니다. 자세한 설명은 본문에 적어 주세요."
          placeholder="예: 이제 고객 정보로 세금계산서를 간편하게 작성하세요." />
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="notice-popup-cta" label="버튼 이름" maxLength={24} value={value.ctaLabel}
            disabled={disabled} onChange={(e) => update({ ctaLabel: e.target.value })} placeholder="자세히 보기" />
          <label className="flex min-w-0 flex-col gap-1.5 text-[12.5px] font-semibold text-boss-text" htmlFor="notice-popup-destination">
            누르면 이동할 화면
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

const STYLES = {
  NOTICE: { label: '공지', icon: Megaphone, accent: '#5145d9', pale: '#edebfc' },
  EVENT: { label: '이벤트', icon: Gift, accent: '#c2410c', pale: '#fff1e6' },
  FEATURE: { label: '새 기능', icon: Sparkles, accent: '#0b7a6e', pale: '#e3f5f1' },
};

/** 실제 버튼이 아닌 미리보기: 클릭해도 설정 저장·페이지 이동이 일어나지 않는다. */
export function NoticePopupPreview({ value, title, content }: { value: Settings; title: string; content: string }) {
  const style = STYLES[value.kind];
  const Icon = style.icon;
  const ends = value.endsAt ? new Date(`${value.endsAt.length === 16 ? value.endsAt + ':00' : value.endsAt}+09:00`) : null;
  const period = ends && Number.isFinite(ends.getTime()) ? new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ends) + ' 전까지' : null;
  return (
    <section aria-label="앱 로그인 팝업 미리보기" className="flex flex-col gap-3">
      <p className="boss-label">앱 로그인 팝업 미리보기</p>
      <div className="flex justify-center bg-boss-inset px-3 py-7 sm:px-7">
        <div className="w-full max-w-[352px] overflow-hidden rounded-[24px] border border-black/5 bg-white text-[#1b1e27] shadow-xl">
          <div className="flex items-center gap-3 px-[22px] py-5" style={{ backgroundColor: style.pale }}>
            <div aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-white" style={{ backgroundColor: style.accent }}>
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold" style={{ color: style.accent }}>{style.label}</p>
              {period && <p className="mt-0.5 text-[13px] text-[#5b6270]">{period}</p>}
            </div>
          </div>
          <div className="px-[22px] pb-1 pt-[18px]">
            <p className="whitespace-pre-wrap break-words text-[20px] font-bold leading-snug [overflow-wrap:anywhere]">{title || '팝업 제목'}</p>
            <p className="mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#5b6270] [overflow-wrap:anywhere]">
              {value.summary.trim() || content.trim().slice(0, 160) || '짧은 소개를 적으면 여기에 보입니다.'}
            </p>
          </div>
          <div className="px-5 pb-4 pt-3.5">
            <div className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-[12px] px-4 py-3 text-[16px] font-semibold text-white" style={{ backgroundColor: style.accent }}>
              <span className="min-w-0 break-words text-center">{value.ctaLabel.trim() || '자세히 보기'}</span><ArrowRight size={18} className="shrink-0" aria-hidden />
            </div>
          </div>
          <div className="flex flex-wrap border-t border-[#eceef1] text-[15px] text-[#5b6270] [&>span]:flex [&>span]:min-h-[52px] [&>span]:min-w-[130px] [&>span]:flex-1 [&>span]:items-center [&>span]:justify-center [&>span]:px-3 [&>span]:py-2.5" aria-hidden>
            <span>오늘 하루 보지 않기</span><span className="font-semibold text-[#1b1e27]">닫기</span>
          </div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-boss-text-secondary">구성과 문구 미리보기입니다. 기기의 화면 크기와 글자 크기에 맞춰 앱에서 조정됩니다.</p>
    </section>
  );
}
