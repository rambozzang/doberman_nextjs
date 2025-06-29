"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import LoginModal from "./LoginModal";

interface NavigationItem {
  title: string;
  href?: string;
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
  },
  {
    title: "견적요청",
    href: "/quote-request",
  },
  {
    title: "요금제",
    href: "/pricing",
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
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center space-x-2">
                <Image src="/images/logo.png" alt="logo" width={32} height={32} />
                <span className="text-xl font-bold text-gray-900">{logo}</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-8">
            <nav className="flex space-x-8">
                {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href || "#"}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                      >
                        {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop CTA and Auth */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href={ctaHref}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {ctaText}
            </Link>
            {showAuth && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                로그인
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
          >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

        {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-gray-200"
          >
              <div className="px-4 py-4 space-y-4">
              {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href || "#"}
                    className="block text-gray-700 hover:text-blue-600 py-2 text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.title}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <Link
                    href={ctaHref}
                    className="block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {ctaText}
                  </Link>
                  {showAuth && (
                      <button
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-gray-700 hover:text-blue-600 py-2 text-sm font-medium text-center"
                    >
                      로그인
                      </button>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </motion.header>
  );
};

export default Header; 