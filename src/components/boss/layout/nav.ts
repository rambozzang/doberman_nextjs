// /boss 내비게이션 정의 + 화면 제목/부제 매핑
//
// 시안(design_handoff_ongo_redesign)의 상단바는 "화면 제목 + 부제"를 항상 노출한다.
// 사이드바와 상단바가 같은 소스를 보도록 이 파일로 분리했다.
//
// 주의: 부제에는 실데이터가 아닌 목업 숫자를 넣지 않는다.
// 건수/카운트가 필요한 화면은 각 페이지가 setPageMeta 로 주입할 것.

import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  Hammer,
  Wrench,
  Image as ImageIcon,
  FileSignature,
  ListChecks,
  Users,
  TrendingUp,
  CreditCard,
  Settings,
  ShoppingCart,
  BarChart3,
  Bell,
  Briefcase,
  Receipt,
  Contact,
  PenTool,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  /** 활성 판정에서 제외할 하위 경로 */
  exclude?: string[];
};

export type NavSection = { title: string; items: NavItem[] };

export const SECTIONS: NavSection[] = [
  {
    title: '워크스페이스',
    items: [
      { href: '/boss', label: '대시보드', icon: LayoutDashboard, exact: true },
      { href: '/boss/chat', label: '채팅', icon: MessageSquare },
      { href: '/boss/calendar', label: '일정', icon: Calendar },
      { href: '/boss/notifications', label: '알림', icon: Bell },
    ],
  },
  {
    title: '영업',
    items: [
      { href: '/boss/requests', label: '견적 요청', icon: FileText },
      { href: '/boss/orders', label: '주문 관리', icon: ShoppingCart },
      { href: '/boss/estimate', label: '견적서', icon: FileSignature },
      { href: '/boss/portfolio', label: '포트폴리오', icon: ImageIcon },
      { href: '/boss/customers', label: '고객 관리', icon: Contact },
    ],
  },
  {
    title: '운영',
    items: [
      { href: '/boss/construction', label: '시공 기록', icon: Hammer },
      { href: '/boss/checklist', label: '체크리스트', icon: ListChecks },
      { href: '/boss/as', label: 'AS 요청', icon: Wrench },
      { href: '/boss/receipt', label: '영수증 관리', icon: Receipt },
      { href: '/boss/signature', label: '고객 서명', icon: PenTool },
    ],
  },
  {
    title: '인사이트',
    items: [
      { href: '/boss/sales', label: '매출 분석', icon: TrendingUp },
      { href: '/boss/statistics', label: '종합 통계', icon: BarChart3 },
      {
        href: '/boss/community',
        label: '커뮤니티',
        icon: Users,
        exclude: ['/boss/community/jobs'],
      },
      { href: '/boss/community/jobs', label: '구인 / 구직', icon: Briefcase },
      { href: '/boss/ads', label: '지도 광고', icon: Megaphone },
    ],
  },
  {
    title: '계정',
    items: [
      { href: '/boss/billing', label: '구독·결제', icon: CreditCard },
      { href: '/boss/settings', label: '설정', icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = SECTIONS.flatMap((s) => s.items);

export function isNavActive(
  pathname: string | null,
  href: string,
  exact?: boolean,
  exclude?: string[]
): boolean {
  if (!pathname) return false;
  if (exclude?.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

// ───────────────────────────────────────────
// 상단바 화면 제목 / 부제
// ───────────────────────────────────────────
export type PageMeta = {
  title: string;
  subtitle?: string;
  /** 상단바 우측 주요 버튼 (accent) */
  action?: { label: string; href: string };
  /** 상단바 우측 보조 버튼 — 시안의 `일괄 가져오기` 자리 */
  secondary?: { label: string; href: string };
};

// 긴 경로가 먼저 매칭되도록 정의 순서를 지킬 것 (아래에서 length 순 정렬)
const PAGE_META: Record<string, PageMeta> = {
  '/boss': {
    title: '대시보드',
    subtitle: '오늘의 일감 · 확인 필요 항목',
    secondary: { label: '견적 요청', href: '/boss/requests' },
    action: { label: '주문 등록', href: '/boss/orders/quick' },
  },

  '/boss/chat': { title: '채팅', subtitle: '고객 문의 통합' },
  '/boss/calendar': { title: '일정', subtitle: '시공 · 방문 예약' },
  '/boss/notifications': { title: '알림', subtitle: '전체 알림 내역' },

  '/boss/requests': {
    title: '견적 요청',
    subtitle: '받은 요청 · 답변 관리',
    secondary: { label: '내 답변', href: '/boss/requests/my' },
  },
  '/boss/requests/my': { title: '내 답변', subtitle: '보낸 견적 답변' },
  '/boss/orders': {
    title: '주문 관리',
    subtitle: '진행 · 수금 · 완료',
    secondary: { label: '견적서', href: '/boss/estimate' },
    action: { label: '주문 등록', href: '/boss/orders/quick' },
  },
  '/boss/orders/quick': { title: '빠른 주문 등록', subtitle: '현장에서 바로 입력' },
  '/boss/estimate': { title: '견적서', subtitle: '발행 · 출력 · 수납' },
  '/boss/portfolio': {
    title: '포트폴리오',
    subtitle: '시공 사례 · 홍보',
    action: { label: '새 사례', href: '/boss/portfolio/new' },
  },
  '/boss/portfolio/new': { title: '새 포트폴리오', subtitle: '시공 사례 등록' },
  '/boss/customers': { title: '고객 관리', subtitle: '연락처 · 거래 이력' },

  '/boss/construction': {
    title: '시공 기록',
    subtitle: '현장 진행 상황',
    action: { label: '새 기록', href: '/boss/construction/new' },
  },
  '/boss/construction/new': { title: '새 시공 기록', subtitle: '현장 정보 입력' },
  '/boss/checklist': {
    title: '체크리스트',
    subtitle: '시공 전후 점검',
    action: { label: '새 체크리스트', href: '/boss/checklist/new' },
  },
  '/boss/checklist/new': { title: '새 체크리스트', subtitle: '항목 구성' },
  '/boss/as': {
    title: 'AS 요청',
    subtitle: '하자 · 재시공 접수',
    action: { label: '새 접수', href: '/boss/as/new' },
  },
  '/boss/as/new': { title: 'AS 접수', subtitle: '하자 내용 입력' },
  '/boss/receipt': { title: '영수증 관리', subtitle: '발행 · 보관' },
  '/boss/signature': { title: '고객 서명', subtitle: '계약 · 완료 확인' },
  '/boss/signature/capture': { title: '서명 받기', subtitle: '현장 서명 입력' },

  '/boss/sales': {
    title: '매출 분석',
    subtitle: '기간별 매출 추이',
    // 뷰 전환이므로 주요(accent) 액션이 아니라 보조 버튼으로 둔다
    secondary: { label: '실시간', href: '/boss/sales/realtime' },
  },
  '/boss/sales/realtime': { title: '실시간 매출', subtitle: '오늘 집계' },
  '/boss/statistics': { title: '종합 통계', subtitle: '주문 · 매출 · 고객' },
  '/boss/community': {
    title: '커뮤니티',
    subtitle: '사장님 게시판',
    action: { label: '글쓰기', href: '/boss/community/new' },
  },
  '/boss/community/new': { title: '글쓰기', subtitle: '커뮤니티 게시글 작성' },
  '/boss/community/my': { title: '내 글', subtitle: '작성한 게시글' },
  '/boss/community/jobs': { title: '구인 / 구직', subtitle: '인력 매칭' },
  '/boss/community/blocks': { title: '차단 관리', subtitle: '차단한 사용자' },
  '/boss/ads': { title: '지도 광고', subtitle: '노출 설정 · 성과' },

  '/boss/billing': { title: '구독·결제', subtitle: '플랜 · 결제 수단' },
  '/boss/billing/plans': { title: '요금제', subtitle: '플랜 비교 · 변경' },
  '/boss/billing/history': { title: '결제 내역', subtitle: '지난 결제' },
  '/boss/billing/renewals': { title: '갱신 관리', subtitle: '자동 갱신 설정' },
  '/boss/billing/status': { title: '구독 상태', subtitle: '현재 플랜' },
  '/boss/settings': { title: '설정', subtitle: '계정 · 알림 · 약관' },
  '/boss/settings/alarm': { title: '알림 설정', subtitle: '수신 항목 선택' },
  '/boss/settings/notifications': { title: '푸시 알림', subtitle: '기기별 설정' },
  '/boss/settings/privacy': { title: '개인정보 처리방침', subtitle: '약관' },
  '/boss/settings/terms': { title: '이용약관', subtitle: '약관' },
  '/boss/settings/faq': { title: '자주 묻는 질문', subtitle: '도움말' },

  '/boss/me': { title: '내 정보', subtitle: '프로필 · 계정' },
  '/boss/me/edit': { title: '정보 수정', subtitle: '프로필 변경' },
  '/boss/me/company': { title: '회사 정보', subtitle: '사업자 · 시공 범위' },
  '/boss/photo': { title: '사진 관리', subtitle: '현장 사진 보관' },
  '/boss/templates': { title: '템플릿', subtitle: '견적 · 문자 양식' },
  '/boss/events': { title: '이벤트', subtitle: '진행 중인 혜택' },
  '/boss/help': { title: '도움말', subtitle: '사용 가이드' },
  '/boss/help/faq': { title: '자주 묻는 질문', subtitle: '도움말' },
  '/boss/onboarding': { title: '시작하기', subtitle: '초기 설정' },
};

const META_KEYS = Object.keys(PAGE_META).sort((a, b) => b.length - a.length);

/** 경로에 해당하는 화면 제목/부제를 찾는다. 정확히 일치하는 키가 없으면 가장 긴 상위 경로로 폴백. */
export function getPageMeta(pathname: string | null): PageMeta {
  if (!pathname) return { title: '사장님' };
  if (PAGE_META[pathname]) return PAGE_META[pathname];

  const parent = META_KEYS.find(
    (key) => pathname === key || pathname.startsWith(key + '/')
  );
  if (!parent) return { title: '사장님' };

  // 상세/하위 화면은 상위 제목을 쓰되 상단바 주요 버튼은 숨긴다
  const { title, subtitle } = PAGE_META[parent];
  return { title, subtitle };
}
