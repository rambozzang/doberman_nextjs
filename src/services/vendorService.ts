import ApiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  VendorAd,
  VendorAdClickResponse,
  VendorCluster,
  VendorDetail,
  VendorMapRequest,
  VendorMapResponse,
  VendorRegionRequest,
  VendorStory,
  VendorStoryComment,
  VendorStoryDetail,
  VendorStoryListResponse,
} from '@/types/vendor';

export class VendorService {
  // ── 지도 ────────────────────────────────────────────────
  // 지도 영역 내 업체 조회 (비로그인 공개)
  static async getInBounds(params: VendorMapRequest): Promise<ApiResponse<VendorMapResponse>> {
    return await ApiClient.post<VendorMapResponse>('/vendor/map', params);
  }

  // 지역 기준 조회 — 지도 SDK 가 없을 때의 대체 경로
  static async getByRegion(params: VendorRegionRequest): Promise<ApiResponse<VendorMapResponse>> {
    return await ApiClient.post<VendorMapResponse>('/vendor/by-region', params);
  }

  // 시군구 단위 업체 수 집계 (지도 축소 상태용)
  static async getClusters(): Promise<ApiResponse<VendorCluster[]>> {
    return await ApiClient.get<VendorCluster[]>('/vendor/clusters');
  }

  // 업체 상세 (좌측 패널) — 수집된 SNS 링크 포함
  static async getDetail(vendorId: number): Promise<ApiResponse<VendorDetail>> {
    return await ApiClient.get<VendorDetail>(`/vendor/${vendorId}`);
  }

  // ── 이야기(커뮤니티) ────────────────────────────────────
  // vendorId 를 넘기지 않으면 전체 광장
  static async getStories(params: {
    vendorId?: number | null;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<VendorStoryListResponse>> {
    return await ApiClient.post<VendorStoryListResponse>('/vendor/story/list', params);
  }

  static async getStoryDetail(storyId: number): Promise<ApiResponse<VendorStoryDetail>> {
    return await ApiClient.get<VendorStoryDetail>(`/vendor/story/${storyId}`);
  }

  static async createStory(params: {
    vendorId?: number | null;
    title: string;
    contents: string;
    writerName?: string;
  }): Promise<ApiResponse<VendorStory>> {
    return await ApiClient.post<VendorStory>('/vendor/story', params);
  }

  static async deleteStory(storyId: number): Promise<ApiResponse<boolean>> {
    return await ApiClient.postPrivate<boolean>(`/vendor/story/${storyId}/delete`, {});
  }

  static async likeStory(storyId: number): Promise<ApiResponse<boolean>> {
    return await ApiClient.post<boolean>(`/vendor/story/${storyId}/like`, {});
  }

  static async addComment(
    storyId: number,
    params: { contents: string; writerName?: string },
  ): Promise<ApiResponse<VendorStoryComment>> {
    return await ApiClient.post<VendorStoryComment>(`/vendor/story/${storyId}/comment`, params);
  }

  static async deleteComment(commentId: number): Promise<ApiResponse<boolean>> {
    return await ApiClient.postPrivate<boolean>(`/vendor/story/comment/${commentId}/delete`, {});
  }

  // ── 광고 ────────────────────────────────────────────────
  // 조회 시 노출수가 서버에서 자동 집계된다
  static async getAds(params: {
    sido?: string | null;
    sigungu?: string | null;
    limit?: number;
  }): Promise<ApiResponse<VendorAd[]>> {
    return await ApiClient.post<VendorAd[]>('/vendor/ads', params);
  }

  static async clickAd(adId: number): Promise<ApiResponse<VendorAdClickResponse>> {
    return await ApiClient.post<VendorAdClickResponse>(`/vendor/ads/${adId}/click`, {});
  }
}
