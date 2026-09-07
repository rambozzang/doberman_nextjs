// /boss 내비게이션 정의 + 화면 제목/부제 매핑
//
// Industry 패턴(agent.opentohome.com)의 헤더는 "kicker + 26px 제목 + 설명"을 항상 노출한다.
// 사이드바와 헤더가 같은 소스를 보도록 이 파일로 분리했다.
//
// 용어는 **앱과 같은 말**을 쓴다 (사장님이 앱 · 웹을 오가며 헷갈리지 않게):
//   웹견적   = 도배르만 사이트 방문자가 보낸 견적 요청 (앱 "웹견적" · "나의 견적" · "웹견적서관리")
//   고객     = 사장님이 직접 등록한 시공 건 (앱 "고객 리스트" — 전체 · 진행중 · 수금중). "주문"이라는 말은 쓰지 않는다.
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
  MessageSquareReply,
  LayoutTemplate,
  ShoppingBag,
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
  /** 운영자(admin.user-ids)에게만 보인다 */
  adminOnly?: boolean;
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
        exclude: ["/boss/requests/my"],
      },
      {
        href: "/boss/requests/my",
        label: "나의 견적",
        icon: MessageSquareReply,
      },
      { href: "/boss/templates", label: "웹견적서 관리", icon: LayoutTemplate },
    ],
  },
  {
    title: "고객 관리 · 내 시공 건",
    items: [
      { href: "/boss/customers", label: "고객", icon: Contact },
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
      { href: "/boss/settings", label: "설정", icon: Settings },
    ],
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
  /** 상위 화면 링크 — kicker 자리에 `← 라벨` 로 들어간다. 하위 화면은 자동 파생 */
  back?: { label: string; href: string };
};

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
      "도배르만 사이트에서 들어온 고객 견적 요청입니다. 답변하면 채팅으로 이어집니다.",
    secondary: { label: "나의 견적", href: "/boss/requests/my" },
  },
  "/boss/requests/my": {
    title: "나의 견적",
    subtitle: "웹견적 요청에 내가 보낸 견적 답변입니다.",
    secondary: { label: "웹견적 요청", href: "/boss/requests" },
  },
  "/boss/store": {
    title: "도배 용품 관리",
    subtitle:
      "쿠팡 파트너스 상품을 담아 도배르만 사이트 도배 용품 페이지에 소개합니다. 담은 링크로 구매되면 수수료가 붙습니다.",
    secondary: { label: "페이지 보기", href: "https://www.doberman.kr/도배-용품" },
  },
  "/boss/templates": {
    title: "웹견적서 관리",
    subtitle: "웹견적 답변에 자주 쓰는 견적서 양식을 저장해 둡니다.",
    width: "wide",
  },

  // ── 고객: 사장님이 직접 등록한 시공 건 (앱 "고객 리스트") ──
  "/boss/customers": {
    title: "고객",
    subtitle: "내 고객(시공 건)을 등록하고 진행 · 수금 · 완료까지 관리합니다.",
    secondary: { label: "고객 견적서", href: "/boss/estimate" },
    action: { label: "고객 등록", href: "/boss/customers/new" },
  },
  "/boss/customers/new": {
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
      "고객별 세금계산서 · 현금영수증 발행을 관리하고 분기 부가세를 가늠합니다.",
    action: { label: "발행 등록", href: "/boss/tax-invoice/new" },
  },
  "/boss/tax-invoice/new": {
    title: "세금계산서 등록",
    subtitle: "고객 사업자 정보와 금액을 정리해 홈택스 발행을 준비합니다.",
    // 품목 표(8열)가 있어 wide(860px)로는 좁다 — 폼은 좌측 열이 스스로 max-w 를 잡는다
    width: "full",
  },

  // ── 경영 ──
  "/boss/receipt": {
    title: "영수증 지출관리",
    subtitle: "자재 · 인건비 등 지출 영수증을 사진으로 모아 관리합니다.",
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
    subtitle: parent.subtitle,
    width: parent.width,
    back:
      parentKey === "/boss"
        ? undefined
        : { label: parent.title, href: parentKey },
  };
}
