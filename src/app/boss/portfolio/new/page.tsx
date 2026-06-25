'use client';

// 사장님 포트폴리오 신규 등록
// Flutter `portfolio_add_page.dart` 폼을 단순화하여 핵심 필드 + 이미지 URL 입력 + 외부 링크 입력 지원.
// 이미지 업로드(R2/Cloudflare)는 별도 작업으로 분리, 여기서는 URL 직접 입력 방식 사용.
// 실제 API: POST /portfolios
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { bossPortfolioApi } from '@/lib/api/boss/portfolio';
import { BossAuthManager } from '@/lib/bossAuth';
import type {
  BossPortfolioCreateRequest,
  BossPortfolioForm,
  PortfolioExternalLink,
  PortfolioImage,
} from '@/types/boss-portfolio';
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Upload,
} from 'lucide-react';

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

// 다크 톤 인풋 공통 클래스
const inputDark =
  'h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10';

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/boss/portfolio"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> 목록
        </Link>
        <h1 className="text-lg font-bold text-white">포트폴리오 신규 등록</h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 기본 정보 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">기본 정보</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="제목" required>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="예) 강남구 아파트 32평 전체 도배"
                className={inputDark}
                required
              />
            </Field>
            <Field label="공개 여부">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => update('isPublic', e.target.checked)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  공개
                </label>
              </div>
            </Field>
            <Field label="건물 유형">
              <select
                value={form.buildingType}
                onChange={(e) => update('buildingType', e.target.value)}
                className={inputDark}
              >
                <option value="">선택</option>
                {BUILDING_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="벽지 종류">
              <select
                value={form.wallpaperType}
                onChange={(e) => update('wallpaperType', e.target.value)}
                className={inputDark}
              >
                <option value="">선택</option>
                {WALLPAPER_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="지역">
              <input
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
                placeholder="예) 서울 강남구"
                className={inputDark}
              />
            </Field>
            <Field label="평수">
              <input
                value={form.area}
                onChange={(e) => update('area', e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="32"
                inputMode="decimal"
                className={inputDark}
              />
            </Field>
            <Field label="시공 비용 (원)">
              <input
                value={form.cost}
                onChange={(e) => update('cost', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="3000000"
                inputMode="numeric"
                className={inputDark}
              />
            </Field>
            <Field label="작업일">
              <input
                type="date"
                value={form.workDate}
                onChange={(e) => update('workDate', e.target.value)}
                className={inputDark}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="설명">
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="작업 내용, 특이사항을 자유롭게 적어주세요."
                  rows={4}
                  className="min-h-[100px] w-full resize-y rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* 이미지 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <ImageIcon size={14} className="text-emerald-300" /> 시공 이미지
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            이미지 파일을 업로드하거나 URL을 직접 입력해 추가하세요.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ImageGroup
              title={`시공 전 (${form.beforeImages.length})`}
              inputValue={beforeInput}
              onInputChange={setBeforeInput}
              onAdd={addBefore}
              images={form.beforeImages}
              onRemove={removeBefore}
              onAddFiles={addBeforeFiles}
            />
            <ImageGroup
              title={`시공 후 (${form.afterImages.length})`}
              inputValue={afterInput}
              onInputChange={setAfterInput}
              onAdd={addAfter}
              images={form.afterImages}
              onRemove={removeAfter}
              onAddFiles={addAfterFiles}
            />
          </div>
        </section>

        {/* 외부 링크 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <LinkIcon size={14} className="text-emerald-300" /> 외부 포트폴리오 링크
          </h2>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className={inputDark}
            />
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="제목 (선택)"
              className={inputDark}
            />
            <div className="flex gap-2">
              <input
                value={linkThumb}
                onChange={(e) => setLinkThumb(e.target.value)}
                placeholder="썸네일 URL (선택)"
                className={inputDark}
              />
              <button
                type="button"
                onClick={addLink}
                className="flex h-10 flex-shrink-0 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <Plus size={14} /> 추가
              </button>
            </div>
          </div>

          {form.externalLinks.length > 0 && (
            <ul className="mt-4 space-y-2">
              {form.externalLinks.map((link, idx) => (
                <li
                  key={`${link.url}-${idx}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-slate-500">
                    {link.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={link.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <LinkIcon size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-100">
                      {link.title || '외부 링크'}
                    </p>
                    <p className="line-clamp-1 text-xs text-slate-500">{link.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-rose-300"
                    aria-label="삭제"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 액션 */}
        <div className="flex items-center justify-end gap-2 pb-4">
          <Link
            href="/boss/portfolio"
            className="flex h-10 items-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </span>
      {children}
    </label>
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
  inputValue,
  onInputChange,
  onAdd,
  images,
  onRemove,
  onAddFiles,
}: {
  title: string;
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-300">{title}</p>
      <div className="mb-3 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="이미지 URL"
          className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-10 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          <Plus size={14} /> 추가
        </button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors ${
          dragOver
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
            : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
        }`}
      >
        <Upload size={14} /> 파일 업로드 (또는 끌어다 놓기)
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onAddFiles(e.target.files)}
      />

      {images.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
          등록된 이미지가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`img-${idx}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 opacity-0 transition-opacity hover:bg-rose-500 hover:text-white group-hover:opacity-100"
                aria-label="삭제"
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
