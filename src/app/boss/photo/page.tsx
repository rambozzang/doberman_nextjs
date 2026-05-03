'use client';

// 사장님 사진 갤러리 페이지
// Flutter `lib/app/image/image_picker_page.dart` 의 그리드 갤러리 기능을 Next.js 로 포팅
// - customerId 필터 (querystring)
// - GET /orders/files/{customerId} 로 목록 조회
// - 신규 파일을 base64 dataURL 또는 직접 입력한 URL 로 추가 후 POST /orders/files 일괄 저장
// - 카테고리(방/사진유형) 변경, 단건 삭제 지원

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Inbox,
  Filter,
  Pencil,
  X,
  ArrowLeft,
} from 'lucide-react';
import { bossImageApi } from '@/lib/api/boss/image';
import {
  BOSS_PHOTO_TYPES,
  BOSS_ROOM_CATEGORIES,
  getPhotoTypeDisplayName,
  getRoomDisplayName,
  type BossImageDataInfo,
  type BossPhotoTypeCode,
  type BossRoomCategoryCode,
} from '@/types/boss-image';

// 사진 유형별 배지 색상
function photoTypeBadgeClass(code?: string) {
  switch (code) {
    case 'before':
      return 'bg-amber-500/20 text-amber-300 ring-amber-500/30';
    case 'after':
      return 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30';
    default:
      return 'bg-sky-500/20 text-sky-300 ring-sky-500/30';
  }
}

// 파일을 base64 dataURL 로 변환 (Flutter 의 CDN 업로드 대신 dataURL 로 저장)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function BossPhotoPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/[0.04]" />}>
      <BossPhotoInner />
    </Suspense>
  );
}

function BossPhotoInner() {
  const router = useRouter();
  const search = useSearchParams();
  // customerId 는 querystring 으로 전달 (Flutter Get.arguments['customerId'] 대체)
  const customerId = search.get('customerId') ?? '';
  const customerName = search.get('custNm') ?? '';

  const [items, setItems] = useState<BossImageDataInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터/검색
  const [roomFilter, setRoomFilter] = useState<BossRoomCategoryCode | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<BossPhotoTypeCode | 'all'>('all');
  const [keyword, setKeyword] = useState('');

  // 신규 추가 모달 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addRoom, setAddRoom] = useState<BossRoomCategoryCode>('living_room');
  const [addType, setAddType] = useState<BossPhotoTypeCode>('before');
  const [addUrl, setAddUrl] = useState('');

  // 카테고리 편집 모달 상태
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editRoom, setEditRoom] = useState<BossRoomCategoryCode>('living_room');
  const [editType, setEditType] = useState<BossPhotoTypeCode>('before');

  // 목록 로드
  const load = async () => {
    if (!customerId) {
      setError('customerId 가 필요합니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await bossImageApi.list(customerId);
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setError(res.message || '이미지를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 이미지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // 필터링된 목록
  const filtered = useMemo(() => {
    let list = items;
    if (roomFilter !== 'all') list = list.filter((i) => i.roomCategory === roomFilter);
    if (typeFilter !== 'all') list = list.filter((i) => i.photoType === typeFilter);
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((i) =>
        [i.fileNm, i.filePath, i.roomCategory, i.photoType]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(k)),
      );
    }
    return list;
  }, [items, roomFilter, typeFilter, keyword]);

  // 카테고리별 카운트 (전체 대비)
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    BOSS_ROOM_CATEGORIES.forEach((r) => (c[r.code] = 0));
    items.forEach((it) => {
      const code = it.roomCategory ?? 'other';
      c[code] = (c[code] ?? 0) + 1;
    });
    return c;
  }, [items]);

  // URL 입력으로 추가
  const handleAddByUrl = () => {
    if (!addUrl.trim()) {
      toast.error('이미지 URL 을 입력해주세요.');
      return;
    }
    const newItem: BossImageDataInfo = {
      customerId: customerId ? Number(customerId) : undefined,
      filePath: addUrl.trim(),
      roomCategory: addRoom,
      photoType: addType,
    };
    setItems((prev) => [...prev, newItem]);
    setAddUrl('');
    setAddOpen(false);
    toast.success('이미지가 추가되었습니다. 저장 버튼을 눌러주세요.');
  };

  // 파일 선택으로 추가 (base64 dataURL 사용)
  const handleAddByFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const dataUrls = await Promise.all(Array.from(files).map((f) => fileToDataUrl(f)));
      const news: BossImageDataInfo[] = dataUrls.map((url, idx) => ({
        customerId: customerId ? Number(customerId) : undefined,
        filePath: url,
        fileNm: files[idx].name,
        roomCategory: addRoom,
        photoType: addType,
      }));
      setItems((prev) => [...prev, ...news]);
      setAddOpen(false);
      toast.success(`${news.length}장의 이미지를 추가했습니다.`);
    } catch {
      toast.error('파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  // 단건 삭제 (서버 fileKey 가 있으면 즉시 호출, 신규 추가분은 로컬에서만 제거)
  const handleDelete = async (index: number) => {
    const target = items[index];
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;

    // 서버 식별자(num/fileKey) 가 있는 기존 이미지면 서버에 즉시 삭제 요청
    const serverFileId = target.num ?? target.fileKey;
    if (serverFileId !== undefined && serverFileId !== null) {
      try {
        const res = await bossImageApi.remove(String(serverFileId));
        if (!res.success) {
          toast.error(res.message || '삭제에 실패했습니다.');
          return;
        }
      } catch {
        toast.error('네트워크 오류로 삭제에 실패했습니다.');
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    toast.success('삭제되었습니다.');
  };

  // 카테고리 편집 모달 열기
  const openEdit = (index: number) => {
    const it = items[index];
    setEditIndex(index);
    setEditRoom((it.roomCategory as BossRoomCategoryCode) ?? 'living_room');
    setEditType((it.photoType as BossPhotoTypeCode) ?? 'before');
  };

  const handleApplyEdit = () => {
    if (editIndex === null) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === editIndex ? { ...it, roomCategory: editRoom, photoType: editType } : it,
      ),
    );
    setEditIndex(null);
    toast.success('카테고리가 변경되었습니다.');
  };

  // 전체 저장 (POST /orders/files)
  const handleSave = async () => {
    if (!customerId) {
      toast.error('customerId 가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await bossImageApi.save({
        customerId,
        orderFiles: items,
      });
      if (res.success) {
        toast.success('정상 처리되었습니다.');
        load();
      } else {
        toast.error(res.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-300 hover:border-slate-700 hover:text-white"
              aria-label="뒤로"
            >
              <ArrowLeft size={14} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white">사진 갤러리</h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {items.length}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {customerName ? `${customerName} · ` : ''}
            {customerId ? `고객ID ${customerId}` : 'customerId 쿼리스트링이 필요합니다.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="파일명·경로 검색"
              className="h-9 w-56 rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm text-emerald-200 hover:bg-emerald-500/20"
          >
            <Plus size={14} /> 이미지 추가
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !customerId}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? '저장 중...' : '저장'}
          </button>
          <Link
            href={`/boss/photo/edit?customerId=${encodeURIComponent(customerId)}`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-sm text-slate-300 hover:border-slate-700 hover:text-white"
          >
            <Pencil size={14} /> 편집 모드
          </Link>
        </div>
      </div>

      {/* 필터 탭 (방 카테고리) */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setRoomFilter('all')}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
            roomFilter === 'all' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          전체
          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {counts.all ?? 0}
          </span>
        </button>
        {BOSS_ROOM_CATEGORIES.map((r) => {
          const active = roomFilter === r.code;
          return (
            <button
              key={r.code}
              type="button"
              onClick={() => setRoomFilter(r.code)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.displayName}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {counts[r.code] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 사진 유형 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-slate-500" />
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-full border px-3 py-1 text-xs ${
            typeFilter === 'all'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
          }`}
        >
          전체
        </button>
        {BOSS_PHOTO_TYPES.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setTypeFilter(t.code)}
            className={`rounded-full border px-3 py-1 text-xs ${
              typeFilter === t.code
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.displayName}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 그리드 */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-slate-200">표시할 이미지가 없습니다</p>
          <p className="mt-1 text-xs text-slate-500">상단 &quot;이미지 추가&quot; 로 등록해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((it) => {
            // filtered 의 인덱스가 아닌 원본 items 의 인덱스를 추적
            const originIndex = items.indexOf(it);
            const path = it.filePath ?? '';
            const isImg = path.startsWith('http') || path.startsWith('data:');
            return (
              <div
                key={`${path}-${originIndex}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
              >
                <div className="relative aspect-[3/4] w-full bg-slate-950">
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={path}
                      alt={it.fileNm ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  {/* 카테고리 배지 */}
                  <button
                    type="button"
                    onClick={() => openEdit(originIndex)}
                    className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-left backdrop-blur"
                  >
                    <div className="text-[10px] font-medium text-white">
                      {getRoomDisplayName(it.roomCategory)}
                    </div>
                    <div
                      className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${photoTypeBadgeClass(it.photoType)}`}
                    >
                      {getPhotoTypeDisplayName(it.photoType)}
                    </div>
                  </button>

                  {/* 작성일 */}
                  {it.crtDtm && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      {it.crtDtm.replace('T', ' ').slice(0, 16)}
                    </div>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleDelete(originIndex)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500/80"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 이미지 추가 모달 */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">이미지 추가</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:text-white"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">방</label>
                <select
                  value={addRoom}
                  onChange={(e) => setAddRoom(e.target.value as BossRoomCategoryCode)}
                  className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200"
                >
                  {BOSS_ROOM_CATEGORIES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">사진 유형</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as BossPhotoTypeCode)}
                  className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200"
                >
                  {BOSS_PHOTO_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">파일 선택 (다중)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddByFile(e.target.files)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-xs file:text-emerald-200 hover:file:bg-emerald-500/30"
                />
                <p className="mt-1 text-[10px] text-slate-500">선택한 파일은 base64 dataURL 로 임시 저장됩니다.</p>
              </div>
              <div className="border-t border-slate-800 pt-3">
                <label className="mb-1 block text-xs font-medium text-slate-400">또는 이미지 URL 직접 입력</label>
                <div className="flex gap-2">
                  <input
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-9 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddByUrl}
                    className="h-9 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm text-emerald-200 hover:bg-emerald-500/20"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 편집 모달 */}
      {editIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditIndex(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">카테고리 변경</h2>
              <button
                type="button"
                onClick={() => setEditIndex(null)}
                className="rounded-md p-1 text-slate-400 hover:text-white"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">방</label>
                <select
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value as BossRoomCategoryCode)}
                  className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200"
                >
                  {BOSS_ROOM_CATEGORIES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">사진 유형</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as BossPhotoTypeCode)}
                  className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200"
                >
                  {BOSS_PHOTO_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditIndex(null)}
                  className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-300 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplyEdit}
                  className="h-9 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
