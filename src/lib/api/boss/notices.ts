import axios from 'axios';
import { bossPrivateApi } from '@/lib/bossApi';
import type { ApiResponse } from '@/types/api';

export interface PublishedNotice {
  id: number;
  title: string;
  content: string;
  status: 'PUBLISHED';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublishedNoticePage {
  items: PublishedNotice[];
  page: number;
  size: number;
  totalElements: number;
}

export class NoticeReadError extends Error {
  constructor(readonly kind: 'missing' | 'unavailable') {
    super(kind);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) throw new NoticeReadError('unavailable');
  return value as Record<string, unknown>;
}

function notice(value: unknown): PublishedNotice {
  const row = record(value);
  if (!Number.isSafeInteger(row.id) || Number(row.id) <= 0 || typeof row.title !== 'string' ||
      typeof row.content !== 'string' || row.status !== 'PUBLISHED') throw new NoticeReadError('unavailable');
  return {
    id: Number(row.id), title: row.title, content: row.content, status: 'PUBLISHED',
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : null,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
  };
}

async function get(path: string, signal: AbortSignal): Promise<unknown> {
  try {
    const { data } = await bossPrivateApi.get<ApiResponse<unknown>>(path, { signal });
    if (data.success !== true || data.data == null) throw new NoticeReadError('unavailable');
    return data.data;
  } catch (error) {
    if (error instanceof NoticeReadError || axios.isCancel(error)) throw error;
    throw new NoticeReadError(axios.isAxiosError(error) && error.response?.status === 404 ? 'missing' : 'unavailable');
  }
}

export async function listPublishedNotices(page: number, signal: AbortSignal): Promise<PublishedNoticePage> {
  const data = record(await get(`/platform/notices?page=${page}&size=20`, signal));
  if (!Array.isArray(data.items) || !Number.isSafeInteger(data.totalElements) || Number(data.totalElements) < 0 ||
      !Number.isSafeInteger(data.page) || Number(data.page) < 0 || !Number.isSafeInteger(data.size) || Number(data.size) <= 0) {
    throw new NoticeReadError('unavailable');
  }
  return { items: data.items.map(notice), totalElements: Number(data.totalElements), page: Number(data.page), size: Number(data.size) };
}

export async function getPublishedNotice(id: number, signal: AbortSignal): Promise<PublishedNotice> {
  return notice(await get(`/platform/notices/${id}`, signal));
}
