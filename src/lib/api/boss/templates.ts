// 사장님 웹견적서 답변 템플릿 API
// Flutter `lib/repo/web_template_repo.dart` (WebTemplateRepo) 1:1 대응
// 인증이 필요한 엔드포인트이므로 BossApiClient 의 *Private 메서드를 사용한다.
import BossApiClient from '@/lib/bossApi';
import type {
  BossTemplate,
  BossTemplateCreateRequest,
  BossTemplateUpdateRequest,
  BossTemplateReorderRequest,
} from '@/types/boss-templates';

export const bossTemplatesApi = {
  // 템플릿 목록 조회 — Flutter: WebTemplateRepo.getTemplates → GET /web-templates/{custId}
  list: (custId: string) =>
    BossApiClient.getPrivate<BossTemplate[]>(`/web-templates/${encodeURIComponent(custId)}`),

  // 템플릿 생성 — Flutter: WebTemplateRepo.createTemplate → POST /web-templates
  create: (data: BossTemplateCreateRequest) =>
    BossApiClient.postPrivate<BossTemplate>('/web-templates', data),

  // 템플릿 수정 — Flutter: WebTemplateRepo.updateTemplate → PUT /web-templates/{id}
  update: (data: BossTemplateUpdateRequest) =>
    BossApiClient.putPrivate<BossTemplate>(`/web-templates/${data.id}`, data),

  // 템플릿 삭제 — Flutter: WebTemplateRepo.deleteTemplate → DELETE /web-templates/{id}?custId=...
  remove: (id: string | number, custId: string) =>
    BossApiClient.deletePrivate<unknown>(
      `/web-templates/${encodeURIComponent(String(id))}?custId=${encodeURIComponent(custId)}`,
    ),

  // 템플릿 순서 변경 — Flutter: WebTemplateRepo.reorderTemplates → PUT /web-templates/reorder
  reorder: (data: BossTemplateReorderRequest) =>
    BossApiClient.putPrivate<unknown>('/web-templates/reorder', data),
};
