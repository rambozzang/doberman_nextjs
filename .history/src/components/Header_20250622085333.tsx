"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, FileText, CreditCard, Sparkles, Bell, User } from "lucide-react";
import LoginModal from "./LoginModal";

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
    title: "견적요청",
    href: "/quote-request",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    title: "요금제",
    href: "/pricing",
    icon: <CreditCard className="w-4 h-4" />,
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <span className="text-white font-bold text-lg">🐕</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
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
                  >
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
              <motion.div
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
              </motion.div>

              {/* Auth Button */}
              {showAuth && (
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
                      <Link
                        href={item.href || "#"}
                        className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-slate-400 group-hover:text-blue-400 transition-colors duration-300">
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Mobile CTA and Auth */}
                  <div className="pt-4 border-t border-slate-700/50 space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        href={ctaHref}
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{ctaText}</span>
                      </Link>
                    </motion.div>
                    
                    {showAuth && (
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2 w-full text-slate-300 hover:text-white px-6 py-3 rounded-xl border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <User className="w-4 h-4" />
                        <span className="font-medium">로그인</span>
                      </motion.button>
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
      />
    </>
  );
};

export default Header; 