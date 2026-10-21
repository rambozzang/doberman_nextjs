// /boss 내비게이션 정의 + 화면 제목/부제 매핑
//
// Industry 패턴(agent.opentohome.com)의 헤더는 "kicker + 26px 제목 + 설명"을 항상 노출한다.
// 사이드바와 헤더가 같은 소스를 보도록 이 파일로 분리했다.
//
// 용어는 **앱과 같은 말**을 쓴다 (사장님이 앱 · 웹을 오가며 헷갈리지 않게):
//   웹견적   = 도배르만 사이트 방문자가 보낸 견적 요청 (앱 "웹견적" · "나의 견적" · "웹견적서관리")
//   고객관리  = 사장님이 직접 등록한 시공 건 (앱 "고객 리스트" — 전체 · 진행중 · 수금중). "주문"이라는 말은 쓰지 않는다.
//   고객 견적서 = 그 고객에게 보내는 견적서 (앱 "내 고객 견적서 보내기")
//
// 주의: 부제에는 실데이터가 아닌 목업 숫자를 넣지 않는다.
// 건수/카운트가 필요한 화면은 각 페이지가 직접 그린다.

import {
  LayoutDashboard,
  Globe,
  MessageSquare,
  Calendar,
  Hammer,
  Wrench,
  Image as ImageIcon,
  // FileSignature, ← 고객 견적서 메뉴를 되살릴 때 함께
  ListChecks,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  Briefcase,
  Receipt,
  Contact,
  PenTool,
  Megaphone,
  FileCheck2,
  LayoutTemplate,
  ShoppingBag,
  Newspaper,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  /** 활성 판정에서 제외할 하위 경로 */
  exclude?: string[];
  /** 운영자(admin.user-ids)에게만 보인다. 서버 판정이 거절이면 감추고, 판정 전 · 확인 실패 때만 이 목록으로 대신한다 */
  adminOnly?: boolean;
  /** 서버 운영자 판정(GET /platform-admin/access)이 운영자일 때만 보인다 — 판정 전 · 실패 때는 감춘다 */
  platformAdmin?: boolean;
  /** 소비자 사이트 등 바깥 링크 — 새 창으로 연다 */
  external?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

// 앱 홈의 두 묶음("업무 · 견적", "고객 관리")을 그대로 따른다.
export const SECTIONS: NavSection[] = [
  {
    title: "워크스페이스",
    items: [
      { href: "/boss", label: "대시보드", icon: LayoutDashboard, exact: true },
      { href: "/boss/calendar", label: "일정", icon: Calendar },
      { href: "/boss/chat", label: "채팅", icon: MessageSquare },
    ],
  },
  {
    title: "웹견적 · 도배르만 사이트",
    items: [
      {
        href: "/boss/requests",
        label: "웹견적 요청",
        icon: Globe,
      },
      // "나의 견적" 은 웹견적 요청 화면의 "내가 답변함" 탭으로 합쳤다(2026-09-08).
      // 같은 요청이 두 메뉴로 갈라져 사장님이 헷갈렸다. 주소(/boss/requests/my)는 넘겨주기만 한다.
      { href: "/boss/templates", label: "답변 양식", icon: LayoutTemplate },
    ],
  },
  {
    title: "고객 관리 · 내 시공 건",
    items: [
      { href: "/boss/customers", label: "고객관리", icon: Contact },
      // 고객 견적서 — 메뉴에서 감춤(2026-09-07, 사장님 지시). 고객 상세의 견적 품목에서 여전히 들어갈 수 있다.
      // 되살릴 때는 아래 한 줄만 풀면 된다.
      // { href: "/boss/estimate", label: "고객 견적서", icon: FileSignature },
      { href: "/boss/tax-invoice", label: "세금계산서", icon: FileCheck2 },
      { href: "/boss/construction", label: "시공 기록", icon: Hammer },
      { href: "/boss/checklist", label: "체크리스트", icon: ListChecks },
      { href: "/boss/signature", label: "고객 서명", icon: PenTool },
      { href: "/boss/as", label: "AS 관리", icon: Wrench },
      { href: "/boss/portfolio", label: "포트폴리오", icon: ImageIcon },
    ],
  },
  {
    title: "경영",
    items: [
      { href: "/boss/receipt", label: "영수증 지출관리", icon: Receipt },
      { href: "/boss/sales", label: "매출 분석", icon: TrendingUp },
      { href: "/boss/statistics", label: "종합 통계", icon: BarChart3 },
    ],
  },
  {
    title: "커뮤니티 · 홍보",
    items: [
      {
        href: "/boss/community",
        label: "커뮤니티",
        icon: Users,
        exclude: ["/boss/community/jobs"],
      },
      { href: "/boss/community/jobs", label: "구인 / 구직", icon: Briefcase },
      { href: "/boss/ads", label: "지도 광고", icon: Megaphone },
      // 도배 용품(쿠팡 파트너스) — 담는 건 운영자, 보는 건 누구나
      {
        href: "/boss/store",
        label: "도배 용품 관리",
        icon: ShoppingBag,
        adminOnly: true,
      },
      {
        href: "https://www.doberman.kr/도배-용품",
        label: "도배 용품 보기",
        icon: ShoppingBag,
        external: true,
      },
    ],
  },
  {
    title: "계정",
    items: [
      // 결제 API 가 서버에 아직 없어 화면을 감춰 둔다. 결제가 열리면 이 줄만 되살리면 된다.
      // { href: '/boss/billing', label: '구독 · 결제', icon: CreditCard },  ← 되살릴 때 CreditCard import 도 함께
      // 공지사항 — 게시된 공지 읽기(모든 사장님). 작성 · 숨김은 운영 관리의 공지 관리에서 한다
      { href: "/boss/notices", label: "공지사항", icon: Newspaper },
      { href: "/boss/settings", label: "설정", icon: Settings },
    ],
  },
  {
    // 대표(운영자) 전용 — 서버가 운영자라고 답한 계정에만 보인다. 화면 · 모든 요청도 서버가 다시 검사한다
    title: "도배르만 운영",
    items: [{ href: "/boss/admin", label: "운영 관리", icon: ShieldCheck, platformAdmin: true }],
  },
];

export const NAV_ITEMS: NavItem[] = SECTIONS.flatMap((s) => s.items);

export function isNavActive(
  pathname: string | null,
  href: string,
  exact?: boolean,
  exclude?: string[],
): boolean {
  if (!pathname) return false;
  if (exclude?.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// ───────────────────────────────────────────
// 헤더 화면 제목 / 부제
// ───────────────────────────────────────────
export type PageWidth = "narrow" | "wide" | "full";

/**
 * 본문 최대 폭. 헤더(BossHeader)와 본문(BossChrome)이 같은 값을 써야
 * 넓은 화면에서 제목줄과 내용의 좌우 끝이 어긋나지 않는다.
 *
 * full 은 대시보드·목록 등 기본값이다. 예전에는 1560 이라 27인치 이상에서
 * 사실상 100% 로 펼쳐져 카드 안 내용이 서로 멀어지고 한 줄이 너무 길어졌다.
 */
// 본문은 레일 쪽(왼쪽)에 붙여 그리고, 넓은 화면에서 끝까지 늘어나지 않게 상한을 둔다.
// full 을 1080 으로 줄인 이유: 1280 은 보통 모니터에서 사실상 100% 라 표가 옆으로 퍼져 읽기 어려웠다(2026-09-08).
export const CONTENT_MAX_WIDTH: Record<PageWidth, string> = {
  narrow: "max-w-[620px]",
  wide: "max-w-[860px]",
  full: "max-w-[1080px]",
};

export type PageMeta = {
  title: string;
  subtitle?: string;
  /** 헤더 우측 주요 버튼 (accent 채움) */
  action?: { label: string; href: string };
  /** 헤더 우측 보조 버튼 (테두리) */
  secondary?: { label: string; href: string };
  /** 본문 최대 폭 — narrow 620 / wide 860 / full 1280. 기본 full */
  width?: PageWidth;
  /** id 경로 하위 화면(상세 등)의 부제 — 없으면 상위 부제를 그대로 쓴다(2026-10-17: 세금계산서 상세가 목록 설명을 되풀이했다) */
  detailSubtitle?: string;
  /** 상위 화면 링크 — kicker 자리에 `← 라벨` 로 들어간다. 하위 화면은 자동 파생 */
  back?: { label: string; href: string };
  /**
   * 제목 위 머리글(기본 "사장님 센터"). 구역 머리글을 준 화면(예: 도배르만 운영)은 그 구역 안에서 따로 이동 메뉴를 그리므로
   * 상위 링크(back)를 자동으로 붙이지 않는다.
   */
  kicker?: string;
};

// 대표 전용 운영 화면 머리글 — 일반 사장님 화면과 구분해 보인다
const PLATFORM_ADMIN_KICKER = "도배르만 운영 · 대표 전용";

// 긴 경로가 먼저 매칭되도록 정의 순서를 지킬 것 (아래에서 length 순 정렬)
const PAGE_META: Record<string, PageMeta> = {
  "/boss": {
    title: "대시보드",
    subtitle: "오늘의 일감과 확인이 필요한 항목을 한눈에 봅니다.",
    secondary: { label: "웹견적 요청", href: "/boss/requests" },
    action: { label: "고객 등록", href: "/boss/customers/new" },
  },

  "/boss/chat": {
    title: "채팅",
    subtitle: "고객 문의를 한 곳에서 응대합니다.",
  },
  "/boss/calendar": {
    title: "일정",
    subtitle: "시공 · 견적 방문 예약을 관리합니다.",
  },
  "/boss/calendar/day": { title: "일별 일정", subtitle: "하루 단위로 봅니다." },
  "/boss/calendar/week": {
    title: "주간 일정",
    subtitle: "한 주 단위로 봅니다.",
  },
  "/boss/calendar/alarm": {
    title: "일정 알림",
    subtitle: "일정 전 알림을 설정합니다.",
    width: "wide",
  },
  "/boss/notifications": {
    title: "알림",
    subtitle: "받은 알림 전체 내역입니다.",
  },

  // ── 웹견적: 도배르만 사이트 방문자가 보낸 요청 ──
  "/boss/requests": {
    title: "웹견적 요청",
    subtitle:
      "도배르만 사이트에서 들어온 고객 견적 요청입니다. 내가 답변했는지 · 채택됐는지도 여기서 봅니다.",
    secondary: { label: "답변 양식", href: "/boss/templates" },
  },
  "/boss/requests/my": {
    // 넘겨주기 전용 — 화면은 웹견적 요청의 "내가 답변함" 탭이다
    title: "웹견적 요청",
    subtitle: "내가 답변한 요청으로 이동합니다.",
  },
  "/boss/store": {
    title: "도배 용품 관리",
    subtitle:
      "쿠팡 파트너스 상품을 담아 도배르만 사이트 도배 용품 페이지에 소개합니다. 담은 링크로 구매되면 수수료가 붙습니다.",
    secondary: { label: "페이지 보기", href: "https://www.doberman.kr/도배-용품" },
  },
  "/boss/templates": {
    // "웹견적서 관리" 는 고객 견적서와 헷갈려 "답변 양식" 으로 바꿨다(2026-09-08)
    title: "답변 양식",
    subtitle: "웹견적 답변에 자주 쓰는 문구를 저장해 두고 골라 씁니다.",
    secondary: { label: "웹견적 요청", href: "/boss/requests" },
    width: "wide",
  },

  // ── 고객: 사장님이 직접 등록한 시공 건 (앱 "고객 리스트") ──
  "/boss/customers": {
    title: "고객관리",
    subtitle: "내 고객(시공 건)을 등록하고 진행 · 수금 · 완료까지 관리합니다.",
    secondary: { label: "고객 견적서", href: "/boss/estimate" },
    action: { label: "고객 등록", href: "/boss/customers/new" },
  },
  "/boss/customers/new": {
    // ?id= 가 붙으면 수정 화면 — 제목은 BossHeader 가 검색 파라미터를 보고 바꾼다
    title: "고객 등록",
    subtitle: "현장에서 바로 입력합니다. 이름만 있어도 등록됩니다.",
    width: "wide",
  },
  "/boss/estimate": {
    title: "고객 견적서",
    subtitle:
      "고객을 고르고 품목 · 금액을 넣으면 견적서 · 영수증으로 출력됩니다.",
    width: "wide",
  },
  "/boss/portfolio": {
    title: "포트폴리오",
    subtitle: "시공 사례를 고객에게 보여줍니다.",
    action: { label: "새 사례", href: "/boss/portfolio/new" },
  },
  "/boss/portfolio/new": {
    title: "새 포트폴리오",
    subtitle: "시공 사례를 등록합니다.",
    width: "wide",
  },

  "/boss/construction": {
    title: "시공 기록",
    subtitle: "현장별 진행 상황을 기록합니다.",
    action: { label: "새 기록", href: "/boss/construction/new" },
  },
  "/boss/construction/new": {
    title: "새 시공 기록",
    subtitle: "현장 정보를 입력합니다.",
    width: "wide",
  },
  "/boss/checklist": {
    title: "체크리스트",
    subtitle: "시공 전후 점검 항목을 관리합니다.",
    action: { label: "새 체크리스트", href: "/boss/checklist/new" },
  },
  "/boss/checklist/new": {
    title: "새 체크리스트",
    subtitle: "점검 항목을 구성합니다.",
    width: "wide",
  },
  "/boss/as": {
    title: "AS 관리",
    subtitle: "하자 · 재시공 접수를 처리합니다.",
    action: { label: "새 접수", href: "/boss/as/new" },
  },
  "/boss/as/new": {
    title: "AS 접수",
    subtitle: "하자 내용을 입력합니다.",
    width: "wide",
  },
  "/boss/signature": {
    title: "고객 서명",
    subtitle: "계약 · 완료 확인 서명을 관리합니다.",
  },
  "/boss/signature/capture": {
    title: "서명 받기",
    subtitle: "현장에서 서명을 입력합니다.",
    width: "wide",
  },
  "/boss/tax-invoice": {
    title: "세금계산서",
    subtitle:
      "세금계산서 · 현금영수증을 작성하고 실물 서식으로 확인 · 출력하며 분기 부가세를 가늠합니다.",
    detailSubtitle: "문서 내용을 확인하고 미리보기 · PDF, 발급, 발급 기록을 관리합니다.",
    // 작성 단추는 화면 맨 위에 세금계산서 · 현금영수증 두 개를 같은 크기로 둔다(2026-10-17) — 머리에는 두지 않는다
  },
  "/boss/tax-invoice/registration": {
    title: "발급 서비스 등록",
    // 기술 낱말(팝빌 연동 · 운영 상태)은 화면 안 단계에서 설명한다(2026-10-21)
    subtitle: "전자 발급에 필요한 등록을 차례대로 마치고, 어디까지 했는지 확인합니다.",
  },
  "/boss/tax-invoice/guide": {
    // 본문 머리(준비물 확인은 5초 · 세금계산서, 시작은 간단하게)는 화면이 그린다. 등록 화면은 같은 본문을 대화상자로 띄운다
    title: "시작 전 준비 안내",
    width: "wide",
  },
  "/boss/tax-invoice/activity": {
    // 목록 단추 이름(발급 알림)과 같게(2026-10-21) — 머리의 종(전체 알림)과 다르다
    title: "발급 알림",
    subtitle: "세금계산서 · 현금영수증 발급 결과 · 국세청 전송 · 권한 심사 · 인증서 만료 안내를 모아 봅니다.",
    width: "wide",
  },
  "/boss/tax-invoice/admin": {
    title: "전자 발급 운영 관리",
    subtitle: "발급 권한 신청 심사 · 결과 확인이 필요한 문서 · 처리 이력을 봅니다. 운영자만 이용할 수 있습니다.",
  },
  "/boss/tax-invoice/new": {
    title: "세금계산서 · 현금영수증 작성",
    subtitle: "문서 종류를 고르고 고객 · 품목 · 금액을 적어 저장합니다. 저장은 발급이 아닙니다.",
    // 품목 표(8열)가 있어 wide(860px)로는 좁다 — 폼은 좌측 열이 스스로 max-w 를 잡는다
    width: "full",
  },

  // ── 경영 ──
  "/boss/receipt": {
    title: "영수증 지출관리",
    subtitle:
      "자재비 · 인건비 영수증을 모아 둡니다. 종합소득세 경비와 부가세 매입 자료로 그대로 씁니다.",
  },
  "/boss/sales": {
    title: "매출 분석",
    subtitle: "기간별 매출 추이를 봅니다.",
    secondary: { label: "실시간", href: "/boss/sales/realtime" },
  },
  "/boss/sales/realtime": {
    title: "실시간 매출",
    subtitle: "오늘 집계 기준입니다.",
  },
  "/boss/statistics": {
    title: "종합 통계",
    subtitle: "고객 · 매출 · 견적 지표입니다.",
  },

  "/boss/community": {
    title: "커뮤니티",
    subtitle: "사장님 게시판입니다.",
    action: { label: "글쓰기", href: "/boss/community/new" },
  },
  "/boss/community/new": {
    title: "글쓰기",
    subtitle: "커뮤니티 게시글을 작성합니다.",
    width: "wide",
  },
  "/boss/community/my": { title: "내 글", subtitle: "작성한 게시글입니다." },
  "/boss/community/jobs": {
    title: "구인 / 구직",
    subtitle: "인력을 구하거나 일자리를 찾습니다.",
  },
  "/boss/community/blocks": {
    title: "차단 관리",
    subtitle: "차단한 사용자 목록입니다.",
    width: "wide",
  },
  "/boss/ads": {
    title: "지도 광고",
    subtitle: "지도 노출 설정과 성과를 봅니다.",
  },
  "/boss/events": { title: "이벤트", subtitle: "진행 중인 혜택입니다." },

  "/boss/billing": {
    title: "구독 · 결제",
    subtitle: "플랜과 결제 수단을 관리합니다.",
    width: "wide",
  },
  "/boss/billing/plans": {
    title: "요금제",
    subtitle: "플랜을 비교하고 변경합니다.",
    width: "wide",
  },
  "/boss/billing/history": {
    title: "결제 내역",
    subtitle: "지난 결제 기록입니다.",
    width: "wide",
  },
  "/boss/billing/renewals": {
    title: "갱신 관리",
    subtitle: "자동 갱신을 설정합니다.",
    width: "wide",
  },
  "/boss/billing/status": {
    title: "구독 상태",
    subtitle: "현재 플랜 정보입니다.",
    width: "wide",
  },
  "/boss/notices": {
    // 상세(/boss/notices/[id])는 이 제목을 쓰고 "← 공지사항" 링크가 붙는다
    title: "공지사항",
    subtitle: "도배르만이 알려 드리는 서비스 소식입니다.",
    width: "wide",
  },

  // ── 도배르만 운영(대표 전용) — 화면 진입 · 모든 요청을 서버가 운영자인지 검사한다 ──
  "/boss/admin": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "운영 개요",
    subtitle: "회원 · 공지 · 신고 · 문의 현황을 서버 집계로 봅니다. 운영자만 이용할 수 있습니다.",
  },
  "/boss/admin/members": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "회원 관리",
    subtitle: "회원을 찾아보고 이용 정지 · 해제를 처리합니다. 처리는 사유와 함께 감사 이력에 남습니다.",
  },
  "/boss/admin/subscriptions": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "구독 기록",
    subtitle: "서버에 저장된 구독 기록을 읽기 전용으로 봅니다. 결제 · 해지는 여기서 하지 않습니다.",
  },
  "/boss/admin/payments": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "결제 기록",
    subtitle: "서버에 저장된 결제 거래 기록을 읽기 전용으로 봅니다. 환불은 여기서 하지 않습니다.",
  },
  "/boss/admin/notices": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "공지 · 이벤트 관리",
    subtitle: "공지 · 이벤트 · 새 기능을 알리고 앱 로그인 팝업과 이동할 화면을 설정합니다.",
  },
  "/boss/admin/reports": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "신고 처리",
    subtitle: "커뮤니티 신고를 확인하고 기각하거나 글을 숨깁니다. 글을 지우지는 않습니다.",
  },
  "/boss/admin/inquiries": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "문의 처리",
    subtitle: "접수된 문의를 확인하고 운영 메모와 함께 처리 완료로 바꿉니다. 이메일 회신은 하지 않습니다.",
  },
  "/boss/admin/audit": {
    kicker: PLATFORM_ADMIN_KICKER,
    title: "감사 이력",
    subtitle: "회원 상태 · 공지 · 신고 · 문의 변경을 누가 언제 왜 했는지 봅니다.",
  },

  "/boss/settings": {
    title: "설정",
    subtitle: "계정 · 알림 · 약관을 관리합니다.",
  },
  "/boss/settings/alarm": {
    title: "알림 설정",
    subtitle: "수신 항목을 선택합니다.",
    width: "wide",
  },
  "/boss/settings/notifications": {
    title: "푸시 알림",
    subtitle: "기기별로 설정합니다.",
    width: "wide",
  },
  "/boss/settings/privacy": { title: "개인정보 처리방침", width: "wide" },
  "/boss/settings/terms": { title: "이용약관", width: "wide" },
  "/boss/settings/faq": {
    title: "자주 묻는 질문",
    subtitle: "도움말",
    width: "wide",
  },

  "/boss/me": {
    title: "내 정보",
    subtitle: "프로필과 계정 정보입니다.",
    width: "wide",
  },
  "/boss/me/edit": {
    title: "정보 수정",
    subtitle: "프로필을 변경합니다.",
    width: "wide",
  },
  "/boss/me/company": {
    title: "회사 정보",
    subtitle: "사업자 · 시공 범위를 관리합니다.",
    width: "wide",
  },
  "/boss/me/company/new": {
    title: "회사 등록",
    subtitle: "사업자 정보를 입력합니다.",
    width: "wide",
  },
  "/boss/photo": { title: "사진 관리", subtitle: "현장 사진을 보관합니다." },
  "/boss/photo/edit": { title: "사진 편집", width: "wide" },
  "/boss/help": { title: "도움말", subtitle: "사용 가이드", width: "wide" },
  "/boss/help/faq": {
    title: "자주 묻는 질문",
    subtitle: "도움말",
    width: "wide",
  },
  "/boss/help/marketing": { title: "마케팅 정보 수신", width: "wide" },
  "/boss/help/privacy": { title: "개인정보 처리방침", width: "wide" },
  "/boss/help/terms": { title: "이용약관", width: "wide" },
  "/boss/onboarding": {
    title: "시작하기",
    subtitle: "초기 설정을 진행합니다.",
    width: "wide",
  },
  "/boss/onboarding/company": { title: "회사 정보 입력", width: "wide" },
};

const META_KEYS = Object.keys(PAGE_META).sort((a, b) => b.length - a.length);

/** 경로에 해당하는 화면 제목/부제를 찾는다.
 * 정확히 일치하는 키가 없으면 가장 긴 상위 경로로 폴백하고, 그 상위를 `back` 링크로 준다. */
export function getPageMeta(pathname: string | null): PageMeta {
  if (!pathname) return { title: "사장님" };

  const parentKey = META_KEYS.find(
    (key) => key !== pathname && pathname.startsWith(key + "/"),
  );
  const parent = parentKey ? PAGE_META[parentKey] : undefined;

  if (PAGE_META[pathname]) {
    const own = PAGE_META[pathname];
    // 정의된 하위 화면(등록·수정 등)도 상위로 돌아가는 링크를 갖는다.
    // 단, 레일에 직접 올라간 화면(나의 견적 · 구인/구직 등)은 자기 자신이 최상위다.
    const isTopLevel = NAV_ITEMS.some((n) => n.href === pathname);
    if (
      !own.back &&
      !own.kicker &&
      !isTopLevel &&
      parent &&
      parentKey &&
      parentKey !== "/boss"
    ) {
      return { ...own, back: { label: parent.title, href: parentKey } };
    }
    return own;
  }

  if (!parent || !parentKey) return { title: "사장님" };

  // 상세 화면(id 경로)은 상위 제목을 쓰되 헤더 주요 버튼은 숨기고 상위 링크를 붙인다
  return {
    title: parent.title,
    subtitle: parent.detailSubtitle ?? parent.subtitle,
    width: parent.width,
    kicker: parent.kicker,
    back:
      parentKey === "/boss"
        ? undefined
        : { label: parent.title, href: parentKey },
  };
}
