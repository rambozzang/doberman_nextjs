// 사장님 웹견적서 답변 템플릿(boss templates) 모듈 타입 정의
// Flutter `lib/app/web/model/web_estimate_template.dart` 의 WebEstimateTemplate 1:1 대응
// 백엔드 엔드포인트: /web-templates/* (Flutter WebTemplateRepo 와 동일)

// 단일 템플릿 데이터
// - 서버에서 내려오는 id 는 number 또는 string 형태로 모두 올 수 있어 union 처리
// - 기본 제공 템플릿(isDefault=true)은 삭제/수정 불가
export interface BossTemplate {
  id: string | number;
  name: string;     // 템플릿 이름 (예: 도배 공사용, 인테리어용)
  title: string;    // 견적서 제목
  content: string;  // 견적서 본문 내용
  sortOrder: number;
  isDefault: boolean;
}

// 템플릿 생성 요청 (Flutter WebTemplateRepo.createTemplate body)
export interface BossTemplateCreateRequest {
  custId: string;
  name: string;
  title: string;
  content: string;
  sortOrder: number;
}

// 템플릿 수정 요청 (Flutter WebTemplateRepo.updateTemplate body)
export interface BossTemplateUpdateRequest {
  id: number;
  custId: string;
  name: string;
  title: string;
  content: string;
  sortOrder: number;
}

// 템플릿 순서 변경 요청
export interface BossTemplateReorderRequest {
  custId: string;
  templateIds: number[];
}

// 폼 입력값(다이얼로그/모달용 임시 구조)
export interface BossTemplateFormValue {
  name: string;
  title: string;
  content: string;
}
