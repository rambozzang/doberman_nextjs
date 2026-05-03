// 사장님 고객 서명(signature) 모듈 타입 정의
// Flutter `lib/app/signature/model/signature_item.dart` 와 1:1 대응
// 백엔드 엔드포인트: /signatures/* (Flutter SignatureRepo 와 동일)

// 서명 아이템 (서버 응답)
export interface BossSignatureItem {
  id?: string;
  custId?: string;
  orderId?: number | null;
  recordId?: number | null;
  customerName?: string;
  customerPhone?: string | null;
  // 서명 이미지 URL (Cloudflare 등에 업로드된 경로) 혹은 base64 dataURL
  signatureImagePath?: string;
  // 획(stroke) 데이터 JSON 문자열 (선택)
  signatureData?: string | null;
  confirmedAt?: string | null;
  memo?: string | null;
  createdDt?: string;
}

// 서명 생성 요청 (POST /signatures)
export interface BossSignatureCreateRequest {
  custId: string;
  customerName: string;
  customerPhone?: string | null;
  signatureImagePath: string;
  signatureData?: string | null;
  orderId?: number | null;
  recordId?: number | null;
  memo?: string | null;
}
