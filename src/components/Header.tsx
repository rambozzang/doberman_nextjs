"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, FileText, LogOut, Menu, User, X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

interface NavigationItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
  items?: { title: string; href: string }[];
}

interface HeaderProps {
  logo?: string;
  navigationItems?: NavigationItem[];
  showAuth?: boolean;
  className?: string;
}

const MY_QUOTES = "/quote-request/my-quotes";
const PENDING_QUOTES_KEY = "header:open-my-quotes-after-login";
const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
const linkStyle = `inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${focusStyle}`;

const defaultNavigationItems: NavigationItem[] = [
  { title: "견적 요청하기", href: "/quote-request" },
  {
    title: "도배 알아보기",
    items: [
      { title: "도배 비용 계산", href: "/quote-calculator" },
      { title: "AI 상담으로 견적 요청", href: "/quote-request-ai" },
      { title: "다른 견적 요청 둘러보기", href: "/quote-request/list" },
      { title: "서비스 소개", href: "/service-intro" },
    ],
  },
  { title: "고객센터", href: "/customer-support" },
];

function URLParamHandler({ isLoggedIn, openLogin, openRegister }: {
  isLoggedIn: boolean;
  openLogin: () => void;
  openRegister: () => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const login = searchParams.get("login") === "true";
    const register = searchParams.get("register") === "true";
    if (isLoggedIn || (!login && !register)) return;
    if (login) openLogin();
    else openRegister();
    const url = new URL(window.location.href);
    url.searchParams.delete(login ? "login" : "register");
    window.history.replaceState({}, "", url.toString());
  }, [searchParams, isLoggedIn, openLogin, openRegister]);
  return null;
}

export default function Header({
  logo = "도배르만",
  navigationItems = defaultNavigationItems,
  showAuth = true,
  className = "",
}: HeaderProps) {
  const { isLoggedIn, user, logout, refreshAuth, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const authSucceededRef = useRef(false);

  const openLogin = useCallback(() => {
    authSucceededRef.current = false;
    setLoginOpen(true);
  }, []);
  const openRegister = useCallback(() => {
    authSucceededRef.current = false;
    setRegisterOpen(true);
  }, []);
  const closeNavigation = useCallback(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, []);
  const isActive = (href: string) => pathname === href || (
    href !== "/" && href !== "/quote-request" && pathname?.startsWith(`${href}/`)
  );

  // 내 요청을 누른 뒤 로그인했다면 원래 목적지로 간다. 소셜 로그인 새로고침도 이어진다.
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      if (sessionStorage.getItem(PENDING_QUOTES_KEY) !== "true") return;
      if (pathname === MY_QUOTES) sessionStorage.removeItem(PENDING_QUOTES_KEY);
      else router.replace(MY_QUOTES);
    } catch {
      // 보관이 차단돼도 로그인 후 상단의 내 견적 요청으로 이동할 수 있다.
    }
  }, [isLoggedIn, pathname, router]);

  const navigate = (href: string, event: React.MouseEvent<HTMLAnchorElement>) => {
    closeNavigation();
    if (href !== MY_QUOTES || isLoggedIn) return;
    event.preventDefault();
    try { sessionStorage.setItem(PENDING_QUOTES_KEY, "true"); } catch { /* 선택 기능 */ }
    openLogin();
  };

  const closeAuth = () => {
    setLoginOpen(false);
    setRegisterOpen(false);
    if (authSucceededRef.current) return;
    try { sessionStorage.removeItem(PENDING_QUOTES_KEY); } catch { /* 선택 기능 */ }
  };

  const authSucceeded = () => {
    authSucceededRef.current = true;
    setLoginOpen(false);
    setRegisterOpen(false);
    refreshAuth();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    closeNavigation();
    setLoggingOut(true);
    try { sessionStorage.removeItem(PENDING_QUOTES_KEY); } catch { /* 보관이 차단돼도 로그아웃한다. */ }
    try { await logout(); } finally { setLoggingOut(false); }
  };

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setActiveDropdown(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileOpen) {
          setMobileOpen(false);
          mobileTriggerRef.current?.focus();
        } else if (activeDropdown) {
          setActiveDropdown(null);
          dropdownTriggerRef.current?.focus();
        }
      }
      if (event.key !== "Tab" || !mobileOpen) return;
      const controls = mobilePanelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeDropdown, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => mobileCloseRef.current?.focus());
    const media = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (media.matches) setMobileOpen(false); };
    media.addEventListener("change", onResize);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      media.removeEventListener("change", onResize);
    };
  }, [mobileOpen]);

  const renderLink = (item: { title: string; href: string }, mobile = false) => (
    <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}
      onClick={(event) => navigate(item.href, event)}
      className={mobile
        ? `flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${focusStyle} ${isActive(item.href) ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
        : `${linkStyle} ${isActive(item.href) ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
      <span>{isLoggedIn && item.href === "/quote-request" ? "새 견적 요청" : item.title}</span>
      {mobile && <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
    </Link>
  );

  return (
    <>
      <Suspense fallback={null}>
        <URLParamHandler isLoggedIn={isLoggedIn} openLogin={openLogin} openRegister={openRegister} />
      </Suspense>
      <header ref={headerRef} className={`fixed inset-x-0 top-0 z-50 border-b border-slate-700/70 bg-slate-900 text-white ${className}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:h-20 lg:gap-6 lg:px-6">
          <Link href="/" aria-label="도배르만 홈" onClick={closeNavigation} className={`flex min-w-0 shrink-0 items-center gap-2 rounded-lg ${focusStyle}`}>
            <Image src="/logo.png" alt="" width={36} height={36} className="h-8 w-8 rounded-lg sm:h-9 sm:w-9" />
            <span className="min-w-0">
              <span className="block max-w-[140px] truncate text-base font-bold tracking-tight sm:text-lg">{logo}</span>
              <span className="hidden text-[11px] text-slate-400 sm:block">도배 비교견적</span>
            </span>
          </Link>
          <nav aria-label="주요 메뉴" className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {showAuth && isLoggedIn && (
              <Link href={MY_QUOTES} aria-current={isActive(MY_QUOTES) ? "page" : undefined} onClick={closeNavigation}
                className={`${linkStyle} mr-2 bg-blue-600 text-white hover:bg-blue-500`}>
                <FileText className="h-4 w-4" aria-hidden="true" />내 견적 요청
              </Link>
            )}
            {navigationItems.map((item, index) => item.items ? (
              <div key={item.title} className="relative" onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setActiveDropdown((current) => current === item.title ? null : current);
              }}>
                <button type="button" aria-expanded={activeDropdown === item.title} aria-controls={`header-links-${index}`}
                  onClick={(event) => {
                    dropdownTriggerRef.current = event.currentTarget;
                    setActiveDropdown((current) => current === item.title ? null : item.title);
                  }} className={`${linkStyle} text-slate-300 hover:bg-slate-800 hover:text-white`}>
                  {item.title}<ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${activeDropdown === item.title ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === item.title && (
                  <div id={`header-links-${index}`} className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                    {item.items.map((subItem) => <div key={subItem.href}>{renderLink(subItem, true)}</div>)}
                  </div>
                )}
              </div>
            ) : item.href ? <React.Fragment key={item.href}>{renderLink({ title: item.title, href: item.href })}</React.Fragment> : null)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {showAuth && isLoggedIn && (
              <Link href={MY_QUOTES} onClick={closeNavigation} aria-current={isActive(MY_QUOTES) ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 lg:hidden ${focusStyle}`}>
                내 견적 요청
              </Link>
            )}
            {showAuth && (
              <div className="hidden lg:block" aria-busy={isLoading}>
                {isLoggedIn ? (
                  <div className="relative" onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) setActiveDropdown((current) => current === "account" ? null : current);
                  }}>
                    <button type="button" aria-label="계정 메뉴" aria-expanded={activeDropdown === "account"} aria-controls="header-account-links"
                      onClick={(event) => {
                        dropdownTriggerRef.current = event.currentTarget;
                        setActiveDropdown((current) => current === "account" ? null : "account");
                      }} className={`${linkStyle} text-slate-300 hover:bg-slate-800 hover:text-white`}>
                      <User aria-hidden="true" className="h-4 w-4" />
                      <span className="max-w-24 truncate">{user?.customerName || "내 계정"}</span>
                      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    {activeDropdown === "account" && (
                      <div id="header-account-links" className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                        {renderLink({ title: "내 정보", href: "/profile" }, true)}
                        <button type="button" disabled={loggingOut} onClick={() => void handleLogout()}
                          className={`flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white ${focusStyle}`}>
                          <LogOut aria-hidden="true" className="h-4 w-4" />{loggingOut ? "로그아웃 중…" : "로그아웃"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={openLogin} disabled={isLoading}
                    className={`${linkStyle} border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50`}>
                    {isLoading ? "확인 중…" : "로그인"}
                  </button>
                )}
              </div>
            )}
            <button type="button" ref={mobileTriggerRef} onClick={() => { setActiveDropdown(null); setMobileOpen(true); }}
              aria-label="메뉴 열기" aria-expanded={mobileOpen} aria-controls="customer-mobile-menu"
              className={`flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 lg:hidden ${focusStyle}`}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/70" aria-hidden="true" onClick={() => { setMobileOpen(false); mobileTriggerRef.current?.focus(); }} />
              <motion.div id="customer-mobile-menu" ref={mobilePanelRef} role="dialog" aria-modal="true" aria-labelledby="customer-mobile-menu-title"
                initial={{ x: reduceMotion ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduceMotion ? 0 : "100%" }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
                className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-slate-700 bg-slate-900 text-white shadow-xl">
                <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5 pt-[env(safe-area-inset-top)]">
                  <h2 id="customer-mobile-menu-title" className="text-base font-semibold">전체 메뉴</h2>
                  <button ref={mobileCloseRef} type="button" aria-label="메뉴 닫기" onClick={() => { setMobileOpen(false); mobileTriggerRef.current?.focus(); }}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 ${focusStyle}`}><X className="h-5 w-5" aria-hidden="true" /></button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5">
                  <nav aria-label="모바일 주요 메뉴" className="space-y-5">
                    {showAuth && (
                      <div>
                        <p className="mb-3 text-xs text-slate-400">{isLoggedIn ? `${user?.customerName || "고객"}님` : "이미 견적을 요청하셨나요?"}</p>
                        <Link href={MY_QUOTES} onClick={(event) => navigate(MY_QUOTES, event)} aria-current={isActive(MY_QUOTES) ? "page" : undefined}
                          className={`flex min-h-14 items-center gap-3 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 ${focusStyle}`}>
                          <FileText className="h-5 w-5" aria-hidden="true" /><span className="flex-1">내 견적 요청</span><ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <p className="mt-2 px-1 text-xs leading-relaxed text-slate-400">신청한 내역과 업체 답변을 확인하세요.</p>
                      </div>
                    )}
                    {navigationItems.map((item) => item.items ? (
                      <div key={item.title} className="border-t border-slate-800 pt-4">
                        <p className="mb-1 px-3 text-xs font-medium text-slate-500">{item.title}</p>
                        {item.items.map((subItem) => renderLink(subItem, true))}
                      </div>
                    ) : item.href ? <React.Fragment key={item.href}>{renderLink({ title: item.title, href: item.href }, true)}</React.Fragment> : null)}
                  </nav>
                  {showAuth && (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      {isLoggedIn ? <>
                        {renderLink({ title: "내 정보", href: "/profile" }, true)}
                        <button type="button" disabled={loggingOut} onClick={() => void handleLogout()}
                          className={`flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800 ${focusStyle}`}>
                          <LogOut aria-hidden="true" className="h-4 w-4" />{loggingOut ? "로그아웃 중…" : "로그아웃"}
                        </button>
                      </> : <button type="button" onClick={() => { closeNavigation(); openLogin(); }}
                        className={`flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-sm text-slate-200 hover:bg-slate-800 ${focusStyle}`}><User aria-hidden="true" className="h-4 w-4" />로그인</button>}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>, document.body,
      )}
      <LoginModal isOpen={loginOpen} onClose={closeAuth} onLoginSuccess={authSucceeded}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
      <RegisterModal isOpen={registerOpen} onClose={closeAuth}
        onRegisterSuccess={authSucceeded} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />
    </>
  );
}
