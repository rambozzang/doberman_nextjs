// 고객(주문) 정보 타입
// Flutter `lib/app/customer/cntr/order_add_data.dart` 의 OrderAddData 1:1 대응

export interface BossCustomerData {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  workDate?: string;      // yyyyMMddHHmm
  estimateDate?: string;  // yyyyMMddHHmm
  post?: string;
  address1?: string;
  address2?: string;
  statusCd?: string;
  memo?: string;
  commonPw?: string;
  housePw?: string;
  companyId?: number;
}
