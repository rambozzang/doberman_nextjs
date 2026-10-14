// 정식 오픈 시 명시적으로 활성화한다. 서버의 발급 준비 검사도 별도로 통과해야 한다.
export const ELECTRONIC_TAX_INVOICE_OPEN = process.env.NEXT_PUBLIC_ELECTRONIC_TAX_INVOICE_OPEN === 'true';
