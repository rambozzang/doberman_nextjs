"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, Phone, MapPin, ChevronDown } from "lucide-react";

import Image from "next/image";

interface FooterLink {
  title: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface FooterProps {
  logo?: string;
  description?: string;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  showNewsletter?: boolean;
}

const defaultSections: FooterSection[] = [
  {
    title: "서비스 안내",
    links: [
      { title: "서비스 소개", href: "/service-intro" },
      { title: "서비스 이용약관", href: "/terms-of-service" },
      { title: "개인정보 처리방침", href: "/privacy-policy" },
    ],
  },
  {
    title: "도배가이드",
    links: [
      { title: "FAQ", href: "/faq" },
      { title: "체크리스트", href: "/checklist" },
      { title: "지역별 정보", href: "/regional-guide" },
    ],
  },
  {
    title: "고객지원",
    links: [{ title: "고객센터", href: "/customer-support" }],
  },
];

const defaultSocialLinks: SocialLink[] = [
  {
    name: "GitHub",
    href: "https://github.com",
    icon: <Github className="w-5 h-5" />,
  },
  {
    name: "Twitter",
    href: "https://twitter.com",
    icon: <Twitter className="w-5 h-5" />,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: <Linkedin className="w-5 h-5" />,
  },
];

const Footer: React.FC<FooterProps> = ({
  logo = "도배르만",
  description = "현대적인 웹 애플리케이션을 위한 최고의 솔루션을 제공합니다. 비즈니스 성장을 위한 강력한 도구와 서비스를 경험해보세요.",
  sections = defaultSections,
  socialLinks = defaultSocialLinks,
  contactInfo = {
    email: "codelabtiger@gmail.com",
    phone: "+82 010-2468-7272",
    address: "서울특별시 강남구 테헤란로 123",
  },
  showNewsletter = true,
}) => {
  // 모바일 아코디언 상태 관리
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // 아코디언 토글 함수
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 뉴스레터 구독 로직
    console.log("뉴스레터 구독");
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-3 sm:py-4 lg:py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4">
            {/* Company Info */}
            <div className="md:col-span-2 lg:col-span-4 space-y-1 sm:space-y-2 lg:space-y-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link href="/" className="flex items-center space-x-2 mb-2 sm:mb-3 lg:mb-2 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Image src="/logo.png" alt="logo" width={24} height={24} className="relative sm:w-7 sm:h-7 lg:w-7 lg:h-7" />
                  </div>
                  <span className="text-base sm:text-lg lg:text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{logo}</span>
                </Link>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-sm leading-relaxed pr-4 line-clamp-2">
                  {description}
                </p>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex space-x-3 sm:space-x-4 lg:space-x-4"
              >
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 sm:p-2.5 lg:p-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-slate-400 hover:text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl touch-target group"
                    aria-label={social.name}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5">
                      {social.icon}
                    </div>
                  </motion.a>
                ))}
              </motion.div>

              {/* Contact Info */}
              {contactInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-1 sm:space-y-1.5 lg:space-y-1"
                >
                  {contactInfo.email && (
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-slate-300 hover:text-blue-400 transition-colors">
                      <div className="p-1 rounded-md bg-slate-800/50">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      </div>
                      <span className="break-all">{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-slate-300 hover:text-blue-400 transition-colors">
                      <div className="p-1 rounded-md bg-slate-800/50">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      </div>
                      <span>{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-start space-x-2 sm:space-x-3 text-xs sm:text-sm text-slate-300 hover:text-blue-400 transition-colors">
                      <div className="p-1 rounded-md bg-slate-800/50 mt-0.5">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      </div>
                      <span className="leading-relaxed">{contactInfo.address}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer Links */}
            <div className="md:col-span-2 lg:col-span-6">
              {/* 데스크톱 버전 - 기존 그리드 */}
              <div className="hidden md:grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="space-y-2 sm:space-y-3 lg:space-y-2"
                  >
                    <h3 className="text-sm sm:text-base lg:text-sm font-semibold text-white border-b border-slate-700/50 pb-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-1 sm:space-y-1.5 lg:space-y-1">
                      {section.links.map((link) => (
                        <li key={link.title}>
                          <Link
                            href={link.href}
                            className="text-xs sm:text-sm lg:text-sm text-slate-300 hover:text-blue-400 hover:translate-x-1 transition-all duration-200 block py-1 lg:py-1 touch-target group"
                          >
                            <span className="relative">
                              {link.title}
                              <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              {/* 모바일 버전 - 아코디언 */}
              <div className="md:hidden space-y-2">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="border border-slate-600/30 rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-700/40 backdrop-blur-sm overflow-hidden shadow-lg"
                  >
                    {/* 아코디언 헤더 */}
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-all duration-200 touch-target group"
                    >
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedSections[section.title] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-slate-400 group-hover:text-blue-400 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* 아코디언 컨텐츠 */}
                    <AnimatePresence>
                      {expandedSections[section.title] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-slate-600/30 bg-gradient-to-b from-transparent to-slate-800/20">
                            <ul className="space-y-1 pt-3">
                              {section.links.map((link) => (
                                <motion.li
                                  key={link.title}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Link
                                    href={link.href}
                                    className="text-sm text-slate-300 hover:text-blue-400 hover:translate-x-1 transition-all duration-200 block py-2 px-3 rounded-lg hover:bg-slate-700/30 touch-target group"
                                  >
                                    <span className="relative">
                                      {link.title}
                                      <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
                                    </span>
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            {showNewsletter && (
              <div className="md:col-span-2 lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="space-y-3 lg:space-y-3"
                >
                  <div className="relative">
                    <h3 className="text-sm sm:text-base lg:text-sm font-semibold text-white border-b border-slate-700/50 pb-2">
                      뉴스레터 구독
                    </h3>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-sm text-slate-300">
                    최신 소식과 업데이트를 받아보세요.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2 lg:space-y-2">
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="이메일 주소"
                        className="w-full px-3 py-2 lg:px-3 lg:py-2.5 text-xs lg:text-sm bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all duration-200"
                        required
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    <motion.button 
                      type="submit" 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-3 py-2 lg:px-3 lg:py-2.5 text-xs lg:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      구독하기
                    </motion.button>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="py-4 lg:py-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-xs sm:text-sm lg:text-sm text-slate-400">
              © {new Date().getFullYear()} <span className="text-blue-400 font-medium">{logo}</span>. All rights reserved.
            </div>
            <div className="flex space-x-4 lg:space-x-6">
              <Link
                href="/privacy"
                className="text-xs sm:text-sm lg:text-sm text-slate-400 hover:text-blue-400 transition-colors relative group"
              >
                개인정보처리방침
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/terms"
                className="text-xs sm:text-sm lg:text-sm text-slate-400 hover:text-blue-400 transition-colors relative group"
              >
                이용약관
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/cookies"
                className="text-xs sm:text-sm lg:text-sm text-slate-400 hover:text-blue-400 transition-colors relative group"
              >
                쿠키 정책
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 