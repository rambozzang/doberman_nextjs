'use client';

// 사장님 사진 갤러리 페이지
// Flutter `lib/app/image/image_picker_page.dart` 의 그리드 갤러리 기능을 Next.js 로 포팅
// - customerId 필터 (querystring)
// - GET /orders/files/{customerId} 로 목록 조회
// - 신규 파일을 base64 dataURL 또는 직접 입력한 URL 로 추가 후 POST /orders/files 일괄 저장
// - 카테고리(방/사진유형) 변경, 단건 삭제 지원

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Inbox,
  Filter,
  Pencil,
  X,
  ArrowLeft,
} from 'lucide-react';
import { bossImageApi } from '@/lib/api/boss/image';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  Button,
  ListTabs,
  DataTable,
  Badge,
  EmptyState,
  Skeleton,
  IconButton,
  ViewToggle,
} from '@/components/boss/ui';
import {
  BOSS_PHOTO_TYPES,
  BOSS_ROOM_CATEGORIES,
  getPhotoTypeDisplayName,
  getRoomDisplayName,
  type BossImageDataInfo,
  type BossPhotoTypeCode,
  type BossRoomCategoryCode,
} from '@/types/boss-image';

type ViewMode = 'grid' | 'list';
type RoomFilter = BossRoomCategoryCode | 'all';
type TypeFilter = BossPhotoTypeCode | 'all';

// 사진 유형별 배지 톤
function photoTypeTone(code?: string): 'amber' | 'emerald' | 'sky' | 'default' {
  switch (code) {
    case 'before':
      return 'amber';
    case 'after':
      return 'emerald';
    case 'detail':
      return 'sky';
    default:
      return 'default';
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
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
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

  // 필터/검색/보기
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<ViewMode>('grid');

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
  const load = useCallback(async () => {
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
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const roomTabs = useMemo(
    () => [
      { key: 'all' as RoomFilter, label: '전체', count: counts.all },
      ...BOSS_ROOM_CATEGORIES.map((r) => ({
        key: r.code as RoomFilter,
        label: r.displayName,
        count: counts[r.code] ?? 0,
      })),
    ],
    [counts],
  );

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

  const headerDescription = customerName
    ? `${customerName} · 고객ID ${customerId}`
    : customerId
      ? `고객ID ${customerId}`
      : 'customerId 쿼리스트링이 필요합니다.';

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <IconButton
          icon={ArrowLeft}
          label="뒤로"
          onClick={() => router.back()}
          className="mt-1 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <PageHeader
            title="사진 갤러리"
            description={headerDescription}
            actions={
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setAddOpen(true)}
                >
                  이미지 추가
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  disabled={saving || !customerId}
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
                <Link
                  href={`/boss/photo/edit?customerId=${encodeURIComponent(customerId)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-boss-border bg-boss-elevated px-3 text-xs font-medium text-boss-text-secondary transition-colors hover:border-boss-border-strong hover:bg-boss-surface hover:text-boss-text"
                >
                  <Pencil size={13} /> 편집
                </Link>
              </>
            }
          />
        </div>
      </div>

      {/* 필터/액션 바 */}
      <Toolbar>
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="파일명·경로 검색"
          className="w-56"
        />
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={load}
          disabled={loading}
          className={loading ? '[&>svg]:animate-spin' : ''}
        >
          새로고침
        </Button>

        <div className="mx-1 h-4 w-px bg-boss-border" />

        <Filter size={14} className="text-boss-text-muted" />
        {(['all', ...BOSS_PHOTO_TYPES.map((t) => t.code)] as TypeFilter[]).map((code) => {
          const label = code === 'all' ? '전체' : BOSS_PHOTO_TYPES.find((t) => t.code === code)?.displayName ?? code;
          const active = typeFilter === code;
          return (
            <Button
              key={code}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter(code)}
            >
              {label}
            </Button>
          );
        })}

        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </Toolbar>

      {/* 방 카테고리 탭 */}
      <ListTabs<RoomFilter>
        tabs={roomTabs}
        active={roomFilter}
        onChange={setRoomFilter}
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {/* 콘텐츠 */}
      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-boss-border bg-boss-surface">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mx-4 my-2 h-10 w-[calc(100%-2rem)] rounded-md" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="표시할 이미지가 없습니다"
          description={
            keyword || roomFilter !== 'all' || typeFilter !== 'all'
              ? '필터 조건을 변경하거나 새로고침하세요.'
              : '이미지 추가 버튼으로 사진을 등록하세요.'
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((it) => {
            const originIndex = items.indexOf(it);
            const path = it.filePath ?? '';
            const isImg = path.startsWith('http') || path.startsWith('data:');
            return (
              <div
                key={`${path}-${originIndex}`}
                className="group relative overflow-hidden rounded-lg border border-boss-border bg-boss-surface"
              >
                <div className="relative aspect-[3/4] w-full bg-boss-bg">
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={path} alt={it.fileNm ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                      <ImageIcon size={28} />
                    </div>
                  )}

                  {/* 카테고리 배지 */}
                  <button
                    type="button"
                    onClick={() => openEdit(originIndex)}
                    className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-left"
                  >
                    <div className="text-[10px] font-medium text-boss-text">
                      {getRoomDisplayName(it.roomCategory)}
                    </div>
                    <div className="mt-0.5">
                      <Badge tone={photoTypeTone(it.photoType)}>
                        {getPhotoTypeDisplayName(it.photoType)}
                      </Badge>
                    </div>
                  </button>

                  {/* 작성일 */}
                  {it.crtDtm && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-boss-text">
                      {it.crtDtm.replace('T', ' ').slice(0, 16)}
                    </div>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleDelete(originIndex)}
                    className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-boss-text opacity-0 transition-opacity group-hover:opacity-100 hover:bg-boss-error/80"
                    aria-label="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>이미지</th>
              <th>방</th>
              <th>유형</th>
              <th>파일</th>
              <th>등록일</th>
              <th className="text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const originIndex = items.indexOf(it);
              const path = it.filePath ?? '';
              const isImg = path.startsWith('http') || path.startsWith('data:');
              return (
                <tr key={`${path}-${originIndex}`}>
                  <td>
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-boss-bg">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={path} alt={it.fileNm ?? ''} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{getRoomDisplayName(it.roomCategory)}</td>
                  <td>
                    <Badge tone={photoTypeTone(it.photoType)}>
                      {getPhotoTypeDisplayName(it.photoType)}
                    </Badge>
                  </td>
                  <td>
                    <span className="block max-w-[240px] truncate text-xs text-boss-text-secondary">
                      {it.fileNm || it.filePath || '-'}
                    </span>
                  </td>
                  <td className="text-boss-text-secondary">
                    {it.crtDtm ? it.crtDtm.replace('T', ' ').slice(0, 16) : '-'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() => openEdit(originIndex)}
                      >
                        변경
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(originIndex)}
                        className="text-boss-error hover:text-boss-error"
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      {/* 이미지 추가 모달 */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-boss-border bg-boss-bg p-5 shadow-boss-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-boss-text">이미지 추가</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-md p-1 text-boss-text-muted hover:text-boss-text"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="boss-label">방</label>
                <select
                  value={addRoom}
                  onChange={(e) => setAddRoom(e.target.value as BossRoomCategoryCode)}
                  className="boss-input"
                >
                  {BOSS_ROOM_CATEGORIES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="boss-label">사진 유형</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as BossPhotoTypeCode)}
                  className="boss-input"
                >
                  {BOSS_PHOTO_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="boss-label">파일 선택 (다중)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddByFile(e.target.files)}
                  className="block w-full text-xs text-boss-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-boss-primary/20 file:px-3 file:py-1.5 file:text-xs file:text-boss-primary hover:file:bg-boss-primary/30"
                />
                <p className="mt-1 text-[10px] text-boss-text-muted">
                  선택한 파일은 base64 dataURL 로 임시 저장됩니다.
                </p>
              </div>
              <div className="border-t border-boss-border pt-3">
                <label className="boss-label">또는 이미지 URL 직접 입력</label>
                <div className="flex gap-2">
                  <input
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://..."
                    className="boss-input"
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddByUrl}>
                    추가
                  </Button>
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
            className="w-full max-w-md rounded-lg border border-boss-border bg-boss-bg p-5 shadow-boss-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-boss-text">카테고리 변경</h2>
              <button
                type="button"
                onClick={() => setEditIndex(null)}
                className="rounded-md p-1 text-boss-text-muted hover:text-boss-text"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="boss-label">방</label>
                <select
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value as BossRoomCategoryCode)}
                  className="boss-input"
                >
                  {BOSS_ROOM_CATEGORIES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="boss-label">사진 유형</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as BossPhotoTypeCode)}
                  className="boss-input"
                >
                  {BOSS_PHOTO_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setEditIndex(null)}>
                  취소
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyEdit}>
                  적용
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
