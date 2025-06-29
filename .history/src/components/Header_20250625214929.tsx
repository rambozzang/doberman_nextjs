"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, FileText, Sparkles, Bell, User, ChevronDown, LogOut } from "lucide-react";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import Image from "next/image";

interface NavigationItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
  items?: {
    title: string;
    href: string;
  }[];
}

interface HeaderProps {
  logo?: string;
  navigationItems?: NavigationItem[];
  ctaText?: string;
  ctaHref?: string;
  showAuth?: boolean;
}

const defaultNavigationItems: NavigationItem[] = [
  {
    title: "홈",
    href: "/",
    icon: <Home className="w-4 h-4" />,
  },
  {
    title: "서비스 소개",
    href: "/service-intro",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    title: "견적요청",
    icon: <FileText className="w-4 h-4" />,
    items: [
      {
        title: "견적 요청하기",
        href: "/quote-request",
      },
      {
        title: "전체 견적 리스트",
        href: "/quote-request/list",
      },
      {
        title: "내 견적 요청",
        href: "/quote-request/my-quotes",
      },
    ],
  },
  {
    title: "고객지원",
    href: "/customer-support",
    icon: <Bell className="w-4 h-4" />,
  },
];

const Header: React.FC<HeaderProps> = ({
  logo = "도배 비교견적 플랫폼",
  navigationItems = defaultNavigationItems,
  ctaText = "시작하기",
  ctaHref = "/signup",
  showAuth = true,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // 인증 상태 관리
  const { isLoggedIn, user, logout, refreshAuth } = useAuth();
  const { checkLoginAndNavigate } = useStore();
  const router = useRouter();

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃되었습니다.");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // 로그인이 필요한 페이지 네비게이션 처리
  const handleProtectedNavigation = (href: string, e: React.MouseEvent) => {
    if (href === "/quote-request/my-quotes") {
      e.preventDefault();
      console.log("Protected navigation - isLoggedIn:", isLoggedIn, "user:", user);
      const canNavigate = checkLoginAndNavigate(isLoggedIn, href, () => {
        setIsLoginModalOpen(true);
      });
      if (canNavigate) {
        router.push(href);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto" style={{ padding: '0 var(--spacing-4)' }}>
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <Link href="/" className="flex items-center group" style={{ gap: 'var(--spacing-3)' }}>
                <div className="relative">
                  {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">🐕</span>
                  </div> */}
                  <Image src={"/logo.png"} alt="logo" width={50} height={50} />
                  <div className="absolute -top-0 -right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {logo}
                  </span>
                  <div className="text-xs text-slate-400" style={{ marginTop: 'var(--spacing-1)' }}>Professional Service</div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-center flex-1" style={{ padding: '0 var(--spacing-8)' }}>
              <nav className="flex items-center bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50" style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-2)' }}>
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {item.items ? (
                      // 드롭다운 메뉴가 있는 경우
                      <div
                        className="relative"
                        onMouseEnter={() => setActiveDropdown(item.title)}
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        <button
                          className="group relative flex items-center rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:bg-slate-700/50"
                          style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-4) var(--spacing-4)' }}
                        >
                          <span className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium">{item.title}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-all duration-300" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                        
                        {/* 드롭다운 메뉴 */}
                        <AnimatePresence>
                          {activeDropdown === item.title && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50"
                            >
                              <div className="p-2">
                                {item.items.map((subItem, subIndex) => (
                                  <motion.div
                                    key={subItem.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIndex * 0.05 }}
                                  >
                                    <Link
                                      href={subItem.href}
                                      className="flex items-center px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                      onClick={(e) => {
                                        setActiveDropdown(null);
                                        handleProtectedNavigation(subItem.href, e);
                                      }}
                                    >
                                      <span className="text-sm font-medium">{subItem.title}</span>
                                    </Link>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      // 일반 링크
                      <Link
                        href={item.href || "#"}
                        className="group relative flex items-center rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:bg-slate-700/50"
                        style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-4) var(--spacing-4)' }}
                      >
                        <span className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Desktop CTA and Auth */}
            <div className="hidden lg:flex items-center" style={{ gap: 'var(--spacing-4)' }}>
              {/* Notification Bell */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 text-slate-400 hover:text-white transition-colors duration-300"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
              </motion.button>

              {/* CTA Button */}
              {/* <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={ctaHref}
                  className="group relative inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden"
                  style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-6)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{ctaText}</span>
                </Link>
              </motion.div> */}

              {/* Auth Buttons */}
              {showAuth && (
                <div className="flex items-center gap-3">
                  {isLoggedIn ? (
                    // 로그인된 상태
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {user?.customerName || "사용자"}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center text-slate-300 hover:text-white rounded-xl border border-red-700/50 hover:border-red-600/50 hover:bg-red-800/20 transition-all duration-300"
                        style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-4)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">로그아웃</span>
                      </motion.button>
                    </div>
                  ) : (
                    // 로그인되지 않은 상태
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="flex items-center text-slate-300 hover:text-white rounded-xl border border-green-700/50 hover:border-green-600/50 hover:bg-green-800/20 transition-all duration-300"
                        style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-4)' }}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">회원가입</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsLoginModalOpen(true)}
                        className="flex items-center text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300"
                        style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-4)' }}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">로그인</span>
                      </motion.button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative p-2 text-slate-300 hover:text-white transition-colors duration-300"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Mobile Menu */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ left: 'var(--spacing-4)', right: 'var(--spacing-4)', marginTop: 'var(--spacing-2)' }}
              >
                <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  {/* Mobile Navigation Items */}
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {item.items ? (
                        // 드롭다운 메뉴가 있는 경우
                        <div>
                          <div className="flex items-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
                            style={{ gap: 'var(--spacing-3)', padding: 'var(--spacing-3)' }}
                          >
                            <span className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                              {item.icon}
                            </span>
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {/* 서브메뉴 */}
                          <div className="ml-6 mt-2 space-y-1">
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className="block px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-lg transition-all duration-200"
                                onClick={(e) => {
                                  setIsMobileMenuOpen(false);
                                  handleProtectedNavigation(subItem.href, e);
                                }}
                              >
                                {subItem.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // 일반 링크
                        <Link
                          href={item.href || "#"}
                          className="flex items-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
                          style={{ gap: 'var(--spacing-3)', padding: 'var(--spacing-3)' }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Mobile CTA and Auth */}
                  <div className="border-t border-slate-700/50" style={{ paddingTop: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        href={ctaHref}
                        className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300"
                        style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-6)' }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{ctaText}</span>
                      </Link>
                    </motion.div>
                    
                    {showAuth && (
                      <div className="space-y-3">
                        {isLoggedIn ? (
                          // 로그인된 상태 (모바일)
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                                                             <span className="text-sm font-medium text-white">
                                 {user?.customerName || "사용자"}
                               </span>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center justify-center w-full text-slate-300 hover:text-white rounded-xl border border-red-700/50 hover:border-red-600/50 hover:bg-red-800/20 transition-all duration-300"
                              style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-6)' }}
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="font-medium">로그아웃</span>
                            </motion.button>
                          </>
                        ) : (
                          // 로그인되지 않은 상태 (모바일)
                          <>
                            <motion.button
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              onClick={() => {
                                setIsRegisterModalOpen(true);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center justify-center w-full text-slate-300 hover:text-white rounded-xl border border-green-700/50 hover:border-green-600/50 hover:bg-green-800/20 transition-all duration-300"
                              style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-6)' }}
                            >
                              <User className="w-4 h-4" />
                              <span className="font-medium">회원가입</span>
                            </motion.button>
                            <motion.button
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              onClick={() => {
                                setIsLoginModalOpen(true);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center justify-center w-full text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300"
                              style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-6)' }}
                            >
                              <User className="w-4 h-4" />
                              <span className="font-medium">로그인</span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          // 약간의 지연 후 상태 새로고침 (토큰 저장 완료 대기)
          setTimeout(() => {
            refreshAuth();
          }, 100);
          toast.success("로그인되었습니다!");
        }}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={() => {
          setIsRegisterModalOpen(false);
          // 약간의 지연 후 상태 새로고침 (토큰 저장 완료 대기)
          setTimeout(() => {
            refreshAuth();
          }, 100);
          toast.success("회원가입이 완료되었습니다!");
        }}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
};

export default Header; 