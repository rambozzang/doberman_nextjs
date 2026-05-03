// 사장님 시공 기록(construction-records) API
// Flutter `lib/repo/construction_record_repo.dart` 에 1:1 대응
// - GET    /construction-records/{custId}
// - POST   /construction-records
// - PUT    /construction-records/{id}
// - DELETE /construction-records/{id}?custId={custId}
import BossApiClient from '@/lib/bossApi';
import type {
  ConstructionRecord,
  ConstructionRecordCreateRequest,
  ConstructionRecordUpdateRequest,
  ConstructionRecordImage,
  ConstructionImageType,
} from '@/types/boss-construction';

// 서버 응답에서 어떤 모양으로 오든 안전하게 string[] 으로 변환
function normalizeImageList(
  raw: unknown,
  images: ConstructionRecordImage[] | undefined,
  type: ConstructionImageType,
): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => (typeof v === 'string' ? v : (v as { filePath?: string })?.filePath ?? ''))
      .filter((v) => !!v);
  }
  if (Array.isArray(images)) {
    return images
      .filter((img) => img.imageType === type)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((img) => img.filePath)
      .filter((v) => !!v);
  }
  return [];
}

// 서버 raw 객체 → ConstructionRecord 정규화
export function normalizeConstructionRecord(raw: unknown): ConstructionRecord {
  const r = (raw ?? {}) as Record<string, unknown>;
  const images = (r.images as ConstructionRecordImage[] | undefined) ?? undefined;
  return {
    id: (r.id as number | string) ?? '',
    custId: (r.custId as string | undefined) ?? undefined,
    orderId: (r.orderId as number | null | undefined) ?? null,
    title: (r.title as string) ?? '',
    description: (r.description as string | null | undefined) ?? null,
    constructionDate:
      (r.constructionDate as string | undefined) ??
      (r.constructionDt as string | undefined) ??
      '',
    status: (r.status as string) ?? '진행중',
    beforeImages: normalizeImageList(r.beforeImages, images, 'BEFORE'),
    duringImages: normalizeImageList(r.duringImages, images, 'DURING'),
    afterImages: normalizeImageList(r.afterImages, images, 'AFTER'),
    createdAt: (r.createdAt as string | undefined) ?? (r.createdDt as string | undefined),
    createdDt: r.createdDt as string | undefined,
    updatedDt: r.updatedDt as string | undefined,
  };
}

// 폼의 시공 전/중/후 URL 배열 → 서버용 images 배열로 변환
export function buildImagePayload(
  beforeImages: string[],
  duringImages: string[],
  afterImages: string[],
): ConstructionRecordImage[] {
  const list: ConstructionRecordImage[] = [];
  beforeImages.forEach((filePath, i) =>
    list.push({ imageType: 'BEFORE', filePath, sortOrder: i }),
  );
  duringImages.forEach((filePath, i) =>
    list.push({ imageType: 'DURING', filePath, sortOrder: i }),
  );
  afterImages.forEach((filePath, i) =>
    list.push({ imageType: 'AFTER', filePath, sortOrder: i }),
  );
  return list;
}

export const bossConstructionApi = {
  // 시공 기록 목록 조회 — Flutter: getRecords(custId)
  list: (custId: string) =>
    BossApiClient.getPrivate<unknown[]>(
      `/construction-records/${encodeURIComponent(custId)}`,
    ),

  // 시공 기록 생성 — Flutter: createRecord(item, custId)
  create: (data: ConstructionRecordCreateRequest) =>
    BossApiClient.postPrivate<ConstructionRecord>('/construction-records', data),

  // 시공 기록 수정 — Flutter: updateRecord(item, custId)
  update: (id: number, data: ConstructionRecordUpdateRequest) =>
    BossApiClient.putPrivate<ConstructionRecord>(
      `/construction-records/${id}`,
      data,
    ),

  // 시공 기록 삭제 — Flutter: deleteRecord(id, custId)
  remove: (id: number | string, custId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(
      `/construction-records/${encodeURIComponent(String(id))}?custId=${encodeURIComponent(custId)}`,
    ),
};
