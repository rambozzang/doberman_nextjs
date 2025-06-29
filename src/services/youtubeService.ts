import ApiClient from '@/lib/api';
import { ApiResponse, YoutubeVideo } from '@/types/api';

export class YoutubeService {
  // 유튜브 비디오 리스트 조회 (공개 API)
  static async getVideoList(): Promise<ApiResponse<YoutubeVideo[]>> {
    return await ApiClient.get<YoutubeVideo[]>('/youtube');
  }
} 