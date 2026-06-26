// 사장님 인증 API
// Flutter login_repo.dart 의 login/register/findId/changePassword/checkId/verifyUser/withdrawUser 에 대응
import BossApiClient from '@/lib/bossApi';
import type {
  BossLoginRequest,
  BossLoginResponse,
  BossSignupRequest,
  BossFindIdRequest,
  BossCheckUserInfoRequest,
  BossChangePasswordRequest,
} from '@/types/boss';

export const bossAuthApi = {
  // 로그인 — Flutter: LoginRepo.login → POST /auth/login
  login: (data: BossLoginRequest) =>
    BossApiClient.post<BossLoginResponse>('/auth/login', data),

  // 회원가입 — Flutter: LoginRepo.register → POST /auth/register
  register: (data: BossSignupRequest) =>
    BossApiClient.post<BossLoginResponse>('/auth/register', data),

  // 아이디 중복 확인 — Flutter: LoginRepo.checkId → GET /auth/check-id/{userId}
  checkId: (userId: string) =>
    BossApiClient.get<{ available?: boolean } | boolean>(`/auth/check-id/${encodeURIComponent(userId)}`),

  // 아이디 찾기 — Flutter: LoginRepo.findId → POST /auth/find-id
  findId: (data: BossFindIdRequest) =>
    BossApiClient.post<{ userId?: string }>('/auth/find-id', data),

  // 사용자 정보 확인(비밀번호 찾기 전 단계) — Flutter: LoginRepo.verifyUser → POST /auth/checkUserInfo
  verifyUser: (data: BossCheckUserInfoRequest) =>
    BossApiClient.post<{ verified?: boolean }>('/auth/checkUserInfo', data),

  // 비밀번호 변경 — Flutter: LoginRepo.changePassword → PUT /auth/password
  // 비밀번호 찾기 흐름에서는 로그인 전이므로 public 클라이언트 사용
  changePassword: (data: BossChangePasswordRequest) =>
    BossApiClient.put<{ success?: boolean }>('/auth/password', data),

  // 회원 탈퇴 — Flutter: LoginRepo.withdrawUser → DELETE /user/{userId}
  withdraw: (userId: string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(`/user/${encodeURIComponent(userId)}`),
};
