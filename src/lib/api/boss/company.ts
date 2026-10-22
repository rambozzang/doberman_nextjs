// 사장님 회사(업체) 정보 API
// Flutter company_repo.dart 에 1:1 대응
import BossApiClient from '@/lib/bossApi';
import type { BossCompanyData, BossContactOpenStatus } from '@/types/boss';

export const bossCompanyApi = {
  // 회사 생성 — Flutter: CompanyRepo.create → POST /company
  create: (data: BossCompanyData) =>
    BossApiClient.postPrivate<BossCompanyData>('/company', data),

  // 회사 조회 — Flutter: CompanyRepo.getCompany → GET /company/{companyId}
  get: (companyId: number | string) =>
    BossApiClient.getPrivate<BossCompanyData>(`/company/${companyId}`),

  // 회사 수정 — Flutter: CompanyRepo.update → PUT /company/{id}
  update: (companyId: number | string, data: BossCompanyData) =>
    BossApiClient.putPrivate<BossCompanyData>(`/company/${companyId}`, data),

  // 로고 경로 변경 — Flutter: CompanyRepo.updateLogoPath → PUT /company/logoPath
  updateLogoPath: (companyId: number | string, logoPath: string) =>
    BossApiClient.putPrivate<{ success?: boolean }>('/company/logoPath', {
      companyId: String(companyId),
      logoPath,
    }),

  // 도장 경로 변경 — Flutter: CompanyRepo.updateStampPath → PUT /company/stampPath
  updateStampPath: (companyId: number | string, stampPath: string) =>
    BossApiClient.putPrivate<{ success?: boolean }>('/company/stampPath', {
      companyId: String(companyId),
      stampPath,
    }),

  // 지역 변경 — Flutter: CompanyRepo.updateRegion → PUT /company/updateRegion
  updateRegion: (companyId: number | string, region: string) =>
    BossApiClient.putPrivate<{ success?: boolean }>('/company/updateRegion', {
      companyId: String(companyId),
      region,
    }),

  // 내 연락처 소개 상태 — 회사는 로그인한 사장님 계정으로 서버가 찾는다(2026-10-23)
  contactOpen: () => BossApiClient.getPrivate<BossContactOpenStatus>('/company/contact-open'),

  // 내 연락처 소개 켜기 · 끄기
  setContactOpen: (open: boolean) =>
    BossApiClient.putPrivate<BossContactOpenStatus>('/company/contact-open', { open }),

  // 로고 삭제 — DELETE /company/deleteLogo/{id}
  deleteLogoPath: (companyId: number | string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(`/company/deleteLogo/${companyId}`),

  // 도장 삭제 — DELETE /company/deleteStamp/{id}
  deleteStampPath: (companyId: number | string) =>
    BossApiClient.deletePrivate<{ success?: boolean }>(`/company/deleteStamp/${companyId}`),
};
