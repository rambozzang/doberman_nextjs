'use client';

// 사장님 사진 관리 — Industry 패턴 (agent.opentohome.com)
// Flutter `lib/app/image/image_picker_page.dart` 의 그리드 갤러리를 Next.js 로 포팅
// - customerId 필터 (querystring)
// - GET /orders/files/{customerId} 로 목록 조회
// - 신규 파일을 base64 dataURL 또는 직접 입력한 URL 로 추가 후 POST /orders/files 일괄 저장
// - 카테고리(방/사진유형) 변경, 단건 삭제 지원
//
//   고객 줄  : kicker(고객) + 이름 · ID · 우측 액션(이미지 추가 · 편집 · 저장)
//   필터 줄  : ListTabs(방) + Segmented(사진 유형) + 검색 + 우측 "전체 n건" + 보기 전환
//   그리드   : 사진이 주인공이므로 카드 그리드 허용 — 사각 썸네일, hover 는 테두리만,
//              메타(방 · 유형 · 날짜)와 액션은 썸네일 아래 캡션 줄에 둔다(겹쳐 올리지 않는다)
//   표       : 썸네일 · 방 · 유형 · 파일 · 등록일 · 액션
//   모달     : 사각 패널(SelectField). 삭제는 ConfirmDialog.
//
// 화면 제목은 셸 헤더(PAGE_META)가 그린다.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Plus, Save, RefreshCw, Inbox, Pencil, X } from 'lucide-react';
import { bossImageApi } from '@/lib/api/boss/image';
import {
  SearchInput,
  Button,
  ButtonLink,
  ListTabs,
  Segmented,
  DataTable,
  Tag,
  EmptyState,
  Skeleton,
  RowSkeleton,
  ContentCard,
  ViewToggle,
  AlertBanner,
  ConfirmDialog,
  SelectField,
  FieldLabel,
  Kicker,
  type StatusTone,
} from '@/components/boss/ui';
import ListDateCell from '@/components/boss/ListDateCell';
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

// 사진 유형별 Tag 색쌍
function photoTypeTone(code?: string): StatusTone {
  switch (code) {
    case 'before':
      return 'warn';
    case 'after':
      return 'ok';
    case 'detail':
      return 'info';
    default:
      return 'neutral';
  }
}

function fmtDateTime(v?: string): string {
  return v ? v.replace('T', ' ').slice(0, 16) : '—';
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

  // 삭제 확인 상태
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 목록 로드
  const load = useCallback(async () => {
    if (!customerId) {
      setError('고객이 지정되지 않았습니다. 고객 관리에서 고객을 고른 뒤 사진으로 들어오세요.');
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

  // 단건 삭제 (서버 fileKey 가 있으면 즉시 호출, 신규 추가분은 로컬에서만 제거) — ConfirmDialog 확인 후
  const handleDelete = async (index: number) => {
    const target = items[index];
    if (!target) return;
    setDeleting(true);

    // 서버 식별자(num/fileKey) 가 있는 기존 이미지면 서버에 즉시 삭제 요청
    const serverFileId = target.num ?? target.fileKey;
    if (serverFileId !== undefined && serverFileId !== null) {
      try {
        const res = await bossImageApi.remove(String(serverFileId));
        if (!res.success) {
          toast.error(res.message || '삭제에 실패했습니다.');
          setDeleting(false);
          return;
        }
      } catch {
        toast.error('네트워크 오류로 삭제에 실패했습니다.');
        setDeleting(false);
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setPendingDelete(null);
    setDeleting(false);
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
    toast.success('카테고리가 변경되었습니다. 저장 버튼을 눌러야 반영됩니다.');
  };

  // 전체 저장 (POST /orders/files)
  const handleSave = async () => {
    if (!customerId) {
      toast.error('고객이 지정되지 않았습니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await bossImageApi.save({
        customerId,
        orderFiles: items,
      });
      if (res.success) {
        toast.success('저장되었습니다.');
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

  // 저장 전 로컬 변경분(서버 식별자가 없는 신규 항목) 수
  const unsavedCount = useMemo(
    () => items.filter((it) => it.num === undefined && it.fileKey === undefined).length,
    [items],
  );

  const isFiltered = keyword.trim().length > 0 || roomFilter !== 'all' || typeFilter !== 'all';

  const typeOptions = [
    { key: 'all' as TypeFilter, label: '전체' },
    ...BOSS_PHOTO_TYPES.map((t) => ({ key: t.code as TypeFilter, label: t.displayName })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 고객 줄 + 페이지 액션 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <Kicker>고객</Kicker>
          <p className="mt-0.5 text-[15px] font-semibold text-boss-text">
            {customerName || (customerId ? '이름 없음' : '지정되지 않음')}
            {customerId && (
              <span className="ml-2 font-boss-head text-[12.5px] font-normal tabular-nums text-boss-text-muted">
                ID {customerId}
              </span>
            )}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {unsavedCount > 0 && <Tag tone="warn">저장 안 됨 {unsavedCount}</Tag>}
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setAddOpen(true)}
            disabled={!customerId}
          >
            이미지 추가
          </Button>
          <ButtonLink
            href={`/boss/photo/edit?customerId=${encodeURIComponent(customerId)}`}
            variant="secondary"
            size="sm"
            icon={Pencil}
          >
            편집
          </ButtonLink>
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            disabled={saving || !customerId}
          >
            {saving ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>

      {/* 필터 줄 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <ListTabs<RoomFilter> tabs={roomTabs} active={roomFilter} onChange={setRoomFilter} />
        <Segmented<TypeFilter>
          ariaLabel="사진 유형"
          value={typeFilter}
          onChange={setTypeFilter}
          options={typeOptions}
        />
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="파일명 · 경로 검색"
          className="w-full sm:w-[220px]"
          hint={false}
        />
        <div className="ml-auto flex items-center gap-2.5">
          <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary" aria-live="polite">
            {loading ? '불러오는 중…' : `전체 ${filtered.length}건`}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={load}
            disabled={loading || !customerId}
          >
            새로고침
          </Button>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && (
        <AlertBanner
          tone="bad"
          action={
            customerId ? (
              <Button variant="primary" size="sm" onClick={load}>
                다시 시도
              </Button>
            ) : (
              <ButtonLink href="/boss/customers" variant="primary" size="sm">
                고객 관리로
              </ButtonLink>
            )
          }
        >
          {error}
        </AlertBanner>
      )}

      {/* 콘텐츠 */}
      {loading && items.length === 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        ) : (
          <ContentCard>
            <RowSkeleton rows={6} />
          </ContentCard>
        )
      ) : filtered.length === 0 ? (
        error ? null : (
          <EmptyState
            icon={Inbox}
            title={isFiltered ? '조건에 맞는 사진이 없습니다' : '아직 등록된 사진이 없습니다'}
            description={
              isFiltered
                ? "방 · 유형 필터를 '전체'로 바꾸거나 검색어를 지워 보세요."
                : '현장 사진을 올리고 방 · 시공 전/후로 분류해 두면 견적서와 포트폴리오에 쓸 수 있습니다.'
            }
            action={
              isFiltered ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setKeyword('');
                    setRoomFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  필터 초기화
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)} disabled={!customerId}>
                  이미지 추가
                </Button>
              )
            }
          />
        )
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((it) => {
            const originIndex = items.indexOf(it);
            const path = it.filePath ?? '';
            const isImg = path.startsWith('http') || path.startsWith('data:');
            const isNew = it.num === undefined && it.fileKey === undefined;
            return (
              <figure
                key={`${path}-${originIndex}`}
                className="boss-card flex flex-col transition-colors duration-[120ms] ease-out hover:border-boss-border-hover"
              >
                <button
                  type="button"
                  onClick={() => openEdit(originIndex)}
                  title="방 · 사진 유형 변경"
                  className="relative aspect-square w-full bg-boss-inset"
                >
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={path} alt={it.fileNm ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                      <ImageIcon size={28} strokeWidth={1.5} />
                    </div>
                  )}
                  {isNew && (
                    <span className="absolute left-2 top-2 bg-boss-text/75 px-1.5 py-px font-boss-head text-[10px] uppercase tracking-[0.06em] text-boss-bg">
                      저장 전
                    </span>
                  )}
                </button>
                <figcaption className="flex flex-col gap-1.5 border-t border-boss-border px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-boss-text">
                      {getRoomDisplayName(it.roomCategory)}
                    </span>
                    <Tag tone={photoTypeTone(it.photoType)}>{getPhotoTypeDisplayName(it.photoType)}</Tag>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-boss-head text-[11px] tabular-nums text-boss-text-muted">
                      {fmtDateTime(it.crtDtm)}
                    </span>
                    <span className="-mr-1 flex items-center">
                      <button
                        type="button"
                        onClick={() => openEdit(originIndex)}
                        className="boss-btn boss-btn-sm boss-btn-ghost !px-1.5 !text-[11.5px]"
                      >
                        변경
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(originIndex)}
                        className="boss-btn boss-btn-sm boss-btn-ghost !px-1.5 !text-[11.5px] !text-boss-text-muted hover:!text-boss-error"
                      >
                        삭제
                      </button>
                    </span>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>등록일</th>
              <th>사진</th>
              <th>방</th>
              <th>유형</th>
              <th>파일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const originIndex = items.indexOf(it);
              const path = it.filePath ?? '';
              const isImg = path.startsWith('http') || path.startsWith('data:');
              const isNew = it.num === undefined && it.fileKey === undefined;
              return (
                <tr key={`${path}-${originIndex}`}>
                  <td>
                    <ListDateCell at={it.crtDtm} showNew={false} />
                  </td>
                  <td>
                    <div className="h-10 w-10 overflow-hidden border border-boss-border bg-boss-inset">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={path} alt={it.fileNm ?? ''} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-boss-text-muted">
                          <ImageIcon size={16} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{getRoomDisplayName(it.roomCategory)}</td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <Tag tone={photoTypeTone(it.photoType)}>{getPhotoTypeDisplayName(it.photoType)}</Tag>
                      {isNew && <Tag tone="warn">저장 전</Tag>}
                    </span>
                  </td>
                  <td className="wrap max-w-[280px]">
                    <span className="line-clamp-1 text-[12.5px] text-boss-text-secondary">
                      {it.fileNm || (path.startsWith('data:') ? '(파일 선택으로 추가)' : it.filePath) || '—'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(originIndex)}>
                        변경
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-boss-text-muted hover:!text-boss-error"
                        onClick={() => setPendingDelete(originIndex)}
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
        <ModalFrame title="이미지 추가" onClose={() => setAddOpen(false)}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                id="add-room"
                label="방"
                value={addRoom}
                onChange={(e) => setAddRoom(e.target.value as BossRoomCategoryCode)}
              >
                {BOSS_ROOM_CATEGORIES.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.displayName}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="add-type"
                label="사진 유형"
                value={addType}
                onChange={(e) => setAddType(e.target.value as BossPhotoTypeCode)}
              >
                {BOSS_PHOTO_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.displayName}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel htmlFor="add-files">파일 선택 (여러 장 가능)</FieldLabel>
              <input
                id="add-files"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleAddByFile(e.target.files)}
                className="block w-full text-[12.5px] text-boss-text-secondary file:mr-3 file:border file:border-boss-border file:bg-boss-bg file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-boss-text hover:file:bg-boss-elevated"
              />
              <p className="mt-1 text-[12px] leading-relaxed text-boss-text-secondary">
                고른 파일은 바로 목록에 올라갑니다. 마지막에 저장 버튼을 눌러야 서버에 반영됩니다.
              </p>
            </div>
            <div className="border-t border-boss-border pt-4">
              <FieldLabel htmlFor="add-url">또는 이미지 URL 직접 입력</FieldLabel>
              <div className="flex gap-2">
                <input
                  id="add-url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://…"
                  className="boss-input"
                  maxLength={500}
                />
                <Button variant="secondary" onClick={handleAddByUrl}>
                  추가
                </Button>
              </div>
            </div>
          </div>
        </ModalFrame>
      )}

      {/* 카테고리 편집 모달 */}
      {editIndex !== null && (
        <ModalFrame
          title="방 · 사진 유형 변경"
          onClose={() => setEditIndex(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditIndex(null)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleApplyEdit}>
                적용
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              id="edit-room"
              label="방"
              value={editRoom}
              onChange={(e) => setEditRoom(e.target.value as BossRoomCategoryCode)}
            >
              {BOSS_ROOM_CATEGORIES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.displayName}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="edit-type"
              label="사진 유형"
              value={editType}
              onChange={(e) => setEditType(e.target.value as BossPhotoTypeCode)}
            >
              {BOSS_PHOTO_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.displayName}
                </option>
              ))}
            </SelectField>
          </div>
        </ModalFrame>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="이 사진을 삭제할까요?"
        description={
          pendingDelete !== null && items[pendingDelete]
            ? items[pendingDelete].num === undefined && items[pendingDelete].fileKey === undefined
              ? '아직 저장하지 않은 사진이라 목록에서만 빠집니다.'
              : '서버에서 바로 지워지며 되돌릴 수 없습니다.'
            : undefined
        }
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) void handleDelete(pendingDelete);
        }}
      />
    </div>
  );
}

// ----- 모달 껍데기 — 사각 패널 + 헤더 + 본문 + 하단 액션 -----
function ModalFrame({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Escape 로 닫기 — role="dialog" 의 기본 기대
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 클릭으로는 닫지 않는다 — 입력 중인 값이 날아간다. 닫기는 X · 취소 · Esc 로만 */}
      <div className="absolute inset-0 bg-boss-text/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md border border-boss-border bg-boss-surface shadow-boss-lg"
      >
        <div className="boss-card-head">
          <h3 className="boss-section-title">{title}</h3>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="boss-btn boss-btn-sm boss-btn-ghost -mr-2 !text-boss-text-muted hover:!text-boss-text"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-boss-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
