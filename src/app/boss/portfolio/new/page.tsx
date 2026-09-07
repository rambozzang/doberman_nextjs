'use client';

// 사장님 포트폴리오 신규 등록 — Industry 패턴 (참조 04-listing-new · ListingForm)
// Flutter `portfolio_add_page.dart` 폼을 단순화. 핵심 필드 + 사진(파일/URL) + 외부 링크.
// 이미지 업로드(R2/Cloudflare)는 별도 작업 — 여기서는 data URL / URL 직접 입력. 실 API: POST /portfolios
//
// 좌 본문: 번호 kicker 패널(01 기본 정보 · 02 사진 · 03 외부 링크) + 하단 액션 패널.
// 우 안내 패널(280px): 등록 전 확인 사항 + 현재 입력 요약. 페이로드 구성·검증은 그대로다.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type {
  BossPortfolioCreateRequest,
  BossPortfolioForm,
  PortfolioExternalLink,
  PortfolioImage,
} from '@/types/boss-portfolio';
import { Plus, X, Link as LinkIcon, Upload } from 'lucide-react';
import {
  Button,
  ButtonLink,
  CheckLine,
  DescRow,
  Field,
  FieldLabel,
  Panel,
  SelectField,
  TextareaField,
} from '@/components/boss/ui';

const BUILDING_TYPES = ['아파트', '빌라', '주택', '상가', '오피스텔', '기타'];
const WALLPAPER_TYPES = ['합지', '실크', '친환경', '뮤럴', '기타'];

const todayStr = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const initialForm: BossPortfolioForm = {
  title: '',
  description: '',
  buildingType: '',
  region: '',
  area: '',
  wallpaperType: '',
  cost: '',
  workDate: todayStr(),
  isPublic: true,
  beforeImages: [],
  afterImages: [],
  externalLinks: [],
};

export default function BossPortfolioNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<BossPortfolioForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // 이미지 URL 임시 입력
  const [beforeInput, setBeforeInput] = useState('');
  const [afterInput, setAfterInput] = useState('');

  // 외부 링크 임시 입력
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkThumb, setLinkThumb] = useState('');

  const update = <K extends keyof BossPortfolioForm>(key: K, value: BossPortfolioForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addBefore = () => {
    const v = beforeInput.trim();
    if (!v) return;
    update('beforeImages', [...form.beforeImages, v]);
    setBeforeInput('');
  };

  const addAfter = () => {
    const v = afterInput.trim();
    if (!v) return;
    update('afterImages', [...form.afterImages, v]);
    setAfterInput('');
  };

  const removeBefore = (idx: number) => {
    update(
      'beforeImages',
      form.beforeImages.filter((_, i) => i !== idx),
    );
  };

  const removeAfter = (idx: number) => {
    update(
      'afterImages',
      form.afterImages.filter((_, i) => i !== idx),
    );
  };

  const addBeforeFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(Array.from(files).map(readFileAsDataURL));
    update('beforeImages', [...form.beforeImages, ...dataUrls]);
  };

  const addAfterFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(Array.from(files).map(readFileAsDataURL));
    update('afterImages', [...form.afterImages, ...dataUrls]);
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const next: PortfolioExternalLink = {
      url,
      title: linkTitle.trim() || null,
      thumbnailUrl: linkThumb.trim() || null,
    };
    update('externalLinks', [...form.externalLinks, next]);
    setLinkUrl('');
    setLinkTitle('');
    setLinkThumb('');
  };

  const removeLink = (idx: number) => {
    update(
      'externalLinks',
      form.externalLinks.filter((_, i) => i !== idx),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('제목을 입력하세요.');
      return;
    }
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId;
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 이미지 페이로드 (BEFORE/AFTER 모두)
    const images: PortfolioImage[] = [
      ...form.beforeImages.map((p, i) => ({
        imageType: 'BEFORE' as const,
        filePath: p,
        sortOrder: i,
      })),
      ...form.afterImages.map((p, i) => ({
        imageType: 'AFTER' as const,
        filePath: p,
        sortOrder: i,
      })),
    ];

    // 링크 페이로드 (sortOrder 부여)
    const links: PortfolioExternalLink[] = form.externalLinks.map((l, i) => ({
      url: l.url,
      title: l.title ?? null,
      thumbnailUrl: l.thumbnailUrl ?? null,
      sortOrder: i,
    }));

    const payload: BossPortfolioCreateRequest = {
      custId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      buildingType: form.buildingType || null,
      region: form.region.trim() || null,
      area: form.area ? Number(form.area) : null,
      wallpaperType: form.wallpaperType || null,
      cost: form.cost ? Number(form.cost.replace(/[^0-9]/g, '')) : null,
      workDate: form.workDate || todayStr(),
      isPublic: form.isPublic ? 'Y' : 'N',
      images,
      links,
    };

    setSubmitting(true);
    try {
      const res = await bossPortfolioApi.create(payload);
      if (res.success) {
        toast.success('포트폴리오가 등록되었습니다');
        router.push('/boss/portfolio');
      } else {
        toast.error(res.message || '등록에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const titleMissing = form.title.trim().length === 0;
  const photoCount = form.beforeImages.length + form.afterImages.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="flex min-w-0 flex-col gap-4">
        {/* ── 01 기본 정보 ── */}
        <Section kicker="01" title="기본 정보">
          <Field
            id="title"
            label="제목"
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="예) 강남구 아파트 32평 전체 도배"
            hint="고객 검색 결과에 그대로 보입니다. 지역 · 평수 · 시공 범위를 넣어 주세요."
            maxLength={200}
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <SelectField
              id="buildingType"
              label="건물 유형"
              value={form.buildingType}
              onChange={(e) => update('buildingType', e.target.value)}
            >
              <option value="">선택</option>
              {BUILDING_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="wallpaperType"
              label="벽지 종류"
              value={form.wallpaperType}
              onChange={(e) => update('wallpaperType', e.target.value)}
            >
              <option value="">선택</option>
              {WALLPAPER_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </SelectField>
            <Field
              id="region"
              label="지역"
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
              placeholder="예) 서울 강남구"
              maxLength={100}
            />
            <Field
              id="area"
              label="평수"
              suffix="평"
              value={form.area}
              onChange={(e) => update('area', e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="32"
              inputMode="decimal"
              maxLength={100}
            />
            <Field
              id="cost"
              label="시공 비용"
              suffix="원"
              value={form.cost}
              onChange={(e) => update('cost', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="3000000"
              inputMode="numeric"
              hint={
                form.cost ? `${Number(form.cost).toLocaleString('ko-KR')}원` : '숫자만 입력합니다.'
              }
              maxLength={12}
            />
            <Field
              id="workDate"
              label="시공일"
              type="date"
              value={form.workDate}
              onChange={(e) => update('workDate', e.target.value)}
            />
          </div>
          <TextareaField
            id="description"
            label="설명"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="작업 범위, 사용 자재, 특이사항을 적어 주세요."
            rows={4}
            maxLength={2000}
          />
          <div>
            <FieldLabel>공개 여부</FieldLabel>
            <CheckLine checked={form.isPublic} onChange={(v) => update('isPublic', v)}>
              고객에게 공개
              <span className="ml-1.5 text-[12px] text-boss-text-secondary">
                끄면 나만 볼 수 있고 검색에 나오지 않습니다
              </span>
            </CheckLine>
          </div>
        </Section>

        {/* ── 02 사진 ── */}
        <Section
          kicker="02"
          title="시공 사진"
          description="파일을 끌어다 놓거나 URL 을 붙여 넣습니다. 시공 후 첫 사진이 목록의 대표 사진이 됩니다."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ImageGroup
              title="시공 전"
              count={form.beforeImages.length}
              inputValue={beforeInput}
              onInputChange={setBeforeInput}
              onAdd={addBefore}
              images={form.beforeImages}
              onRemove={removeBefore}
              onAddFiles={addBeforeFiles}
            />
            <ImageGroup
              title="시공 후"
              count={form.afterImages.length}
              inputValue={afterInput}
              onInputChange={setAfterInput}
              onAdd={addAfter}
              images={form.afterImages}
              onRemove={removeAfter}
              onAddFiles={addAfterFiles}
            />
          </div>
        </Section>

        {/* ── 03 외부 링크 ── */}
        <Section
          kicker="03"
          title="외부 링크"
          description="블로그 · 인스타그램 등 다른 곳에 올린 시공 사례를 연결합니다. 선택 사항입니다."
        >
          <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              aria-label="링크 URL"
              className="boss-input"
              maxLength={500}
            />
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="제목 (선택)"
              aria-label="링크 제목"
              className="boss-input"
              maxLength={500}
            />
            <input
              value={linkThumb}
              onChange={(e) => setLinkThumb(e.target.value)}
              placeholder="썸네일 URL (선택)"
              aria-label="썸네일 URL"
              className="boss-input"
              maxLength={500}
            />
            <Button variant="secondary" icon={Plus} onClick={addLink} disabled={!linkUrl.trim()} className="h-9">
              추가
            </Button>
          </div>

          {form.externalLinks.length > 0 && (
            <ul className="border border-boss-border">
              {form.externalLinks.map((link, idx) => (
                <li
                  key={`${link.url}-${idx}`}
                  className="flex items-center gap-3 border-b border-boss-border-row px-3 py-2.5 last:border-b-0"
                >
                  <span className="boss-placeholder flex h-9 w-9 flex-none items-center justify-center overflow-hidden border border-boss-border text-boss-text-muted">
                    {link.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={link.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <LinkIcon size={14} strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-boss-text">
                      {link.title || '외부 링크'}
                    </span>
                    <span className="block truncate text-[12px] text-boss-text-muted">{link.url}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="boss-btn boss-btn-sm boss-btn-ghost !text-boss-text-muted hover:!text-boss-error"
                    aria-label="링크 삭제"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── 하단 액션 패널 ── */}
        <div className="boss-card flex flex-wrap items-center gap-2.5 px-4 py-3.5">
          <span className="text-[12.5px] text-boss-text-secondary">
            {titleMissing ? (
              <>
                <span className="text-boss-error">*</span> 제목을 입력해야 등록할 수 있습니다
              </>
            ) : form.isPublic ? (
              '등록하면 바로 고객 검색에 노출됩니다'
            ) : (
              '비공개로 등록됩니다 — 나중에 상세 화면에서 공개할 수 있습니다'
            )}
          </span>
          <ButtonLink href="/boss/portfolio" variant="secondary" className="ml-auto">
            취소
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? '등록 중…' : '등록'}
          </Button>
        </div>
      </div>

      {/* ── 우측 안내 ── */}
      <aside className="flex min-w-0 flex-col gap-3.5">
        <Panel kicker="안내" title="등록 전 확인">
          <ul className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-boss-text-secondary">
            <li className="flex gap-2">
              <span className="text-boss-primary">·</span>
              시공 전 · 후 사진을 같이 올리면 문의로 이어질 확률이 높습니다.
            </li>
            <li className="flex gap-2">
              <span className="text-boss-primary">·</span>
              사진에 고객 얼굴 · 주소가 보이지 않는지 확인해 주세요.
            </li>
            <li className="flex gap-2">
              <span className="text-boss-primary">·</span>
              비용은 참고용으로 보입니다. 비워 두면 표시되지 않습니다.
            </li>
          </ul>
        </Panel>

        <Panel kicker="현재 입력" title="요약">
          <dl>
            <DescRow
              label="제목"
              value={
                titleMissing ? <span className="text-boss-error">미입력</span> : form.title.trim()
              }
            />
            <DescRow
              label="사진"
              value={
                photoCount === 0 ? (
                  <span className="font-normal text-boss-text-muted">없음</span>
                ) : (
                  <span className="font-boss-head tabular-nums">
                    전 {form.beforeImages.length} · 후 {form.afterImages.length}
                  </span>
                )
              }
            />
            <DescRow
              label="외부 링크"
              value={<span className="font-boss-head tabular-nums">{form.externalLinks.length}건</span>}
            />
            <DescRow label="공개" value={form.isPublic ? '공개' : '비공개'} />
          </dl>
        </Panel>
      </aside>
    </form>
  );
}

/** 번호 kicker + 17px 제목 패널 — 참조 apply 의 Section */
function Section({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="boss-card p-5">
      <p className="boss-kicker">{kicker}</p>
      <h2 className="boss-section-title">{title}</h2>
      {description && (
        <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">{description}</p>
      )}
      <div className="mt-3.5 flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageGroup({
  title,
  count,
  inputValue,
  onInputChange,
  onAdd,
  images,
  onRemove,
  onAddFiles,
}: {
  title: string;
  count: number;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  images: string[];
  onRemove: (idx: number) => void;
  onAddFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onAddFiles(e.dataTransfer.files);
  };

  return (
    <div className="boss-card-inset p-3">
      <div className="mb-2.5 flex items-baseline justify-between">
        <p className="boss-mono-label">{title}</p>
        <span className="font-boss-head text-[12px] tabular-nums text-boss-text-muted">{count}장</span>
      </div>

      {/* 사각 드롭존 */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-1.5 border border-dashed px-3 py-5 text-[12.5px] transition-colors duration-[120ms] ease-out ${
          dragOver
            ? 'border-boss-primary bg-boss-elevated text-boss-primary'
            : 'border-boss-border-hover bg-boss-surface text-boss-text-secondary hover:border-boss-primary hover:text-boss-primary'
        }`}
      >
        <Upload size={16} strokeWidth={1.5} />
        <span className="font-medium">파일 선택 또는 끌어다 놓기</span>
        <span className="text-[11px] text-boss-text-muted">jpg · png · 여러 장 가능</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onAddFiles(e.target.files)}
      />

      <div className="mt-2 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="이미지 URL 붙여 넣기"
          aria-label={`${title} 이미지 URL`}
          className="boss-input min-w-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          maxLength={500}
        />
        <Button variant="secondary" size="sm" onClick={onAdd} disabled={!inputValue.trim()} className="h-9">
          추가
        </Button>
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {images.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="boss-placeholder group relative aspect-square overflow-hidden border border-boss-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} ${idx + 1}`} className="h-full w-full object-cover" />
              <span className="absolute bottom-1 left-1 bg-boss-text/75 px-1 py-px font-boss-head text-[10px] tabular-nums text-boss-bg">
                {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-boss-text/75 text-boss-bg opacity-0 transition-opacity hover:bg-boss-error group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`${title} ${idx + 1} 삭제`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
