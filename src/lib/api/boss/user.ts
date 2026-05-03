// 사장님 사용자 정보 API
// Flutter user_repo.dart 에 1:1 대응
import BossApiClient from '@/lib/bossApi';
import type { BossUserInfo, BossUserSearchRequest } from '@/types/boss';

export const bossUserApi = {
  // 사용자 정보 조회 — Flutter: UserRepo.getUserInfo → GET /user/{userId}
  get: (userId: string) =>
    BossApiClient.getPrivate<BossUserInfo>(`/user/${encodeURIComponent(userId)}`),

  // 사용자 정보 수정 — Flutter: UserRepo.modify → PUT /user
  update: (data: BossUserInfo) =>
    BossApiClient.putPrivate<BossUserInfo>('/user', data),

  // 알람 시간 설정 — Flutter: UserRepo.setAlarmTime → PUT /user/alramTime
  setAlarmTime: (alramTime: string) =>
    BossApiClient.putPrivate<{ success?: boolean }>('/user/alramTime', { alramTime }),

  // 프로필 이미지 경로 변경 — Flutter: UserRepo.updateProfilePath → PUT /user/profilePath
  updateProfilePath: (profilePath: string) =>
    BossApiClient.putPrivate<{ success?: boolean }>('/user/profilePath', { profilePath }),

  // 사용자 검색(공유 대상 검색) — Flutter: UserRepo.searchUser → POST /user/search
  search: (data: BossUserSearchRequest) =>
    BossApiClient.postPrivate<BossUserInfo[]>('/user/search', data),
};
