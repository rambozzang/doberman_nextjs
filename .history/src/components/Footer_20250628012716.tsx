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
    title: "커뮤니티",
    links: [{ title: "게시판", href: "/board" }],
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
    email: "hello@doberman.com",
    phone: "+82 2-1234-5678",
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
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-4 sm:py-6 lg:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
            {/* Company Info */}
            <div className="md:col-span-2 lg:col-span-4 space-y-2 sm:space-y-3 lg:space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link href="/" className="flex items-center space-x-2 mb-1 sm:mb-2 lg:mb-1">
                  <Image src="/logo.png" alt="logo" width={20} height={20} className="sm:w-6 sm:h-6 lg:w-6 lg:h-6" />
                  <span className="text-sm sm:text-base lg:text-base font-bold text-foreground">{logo}</span>
                </Link>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-xs leading-snug pr-4 line-clamp-2">
                  {description}
                </p>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex space-x-2 sm:space-x-3 lg:space-x-3"
              >
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 sm:p-2 lg:p-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-target"
                    aria-label={social.name}
                  >
                    <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4">
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
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="break-all">{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-muted-foreground">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-start space-x-2 sm:space-x-3 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
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
                    className="space-y-1.5 sm:space-y-2 lg:space-y-1.5"
                  >
                    <h3 className="text-xs sm:text-sm lg:text-sm font-semibold text-foreground">
                      {section.title}
                    </h3>
                    <ul className="space-y-0.5 sm:space-y-1 lg:space-y-0.5">
                      {section.links.map((link) => (
                        <li key={link.title}>
                          <Link
                            href={link.href}
                            className="text-xs sm:text-sm lg:text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5 lg:py-0.5 touch-target"
                          >
                            {link.title}
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
                    className="border border-slate-700/30 rounded-lg bg-slate-800/20 overflow-hidden"
                  >
                    {/* 아코디언 헤더 */}
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/20 transition-colors touch-target"
                    >
                      <h3 className="text-sm font-semibold text-foreground">
                        {section.title}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedSections[section.title] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                          <div className="px-4 pb-4 border-t border-slate-700/30">
                            <ul className="space-y-2 pt-3">
                              {section.links.map((link) => (
                                <motion.li
                                  key={link.title}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Link
                                    href={link.href}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-2 px-2 rounded hover:bg-slate-700/20 touch-target"
                                  >
                                    {link.title}
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
                  className="space-y-2 lg:space-y-2"
                >
                  <h3 className="text-xs sm:text-sm lg:text-xs font-semibold text-foreground">
                    뉴스레터 구독
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-xs text-muted-foreground">
                    최신 소식과 업데이트를 받아보세요.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-1.5 lg:space-y-1.5">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      className="w-full px-2 py-1 lg:px-2.5 lg:py-1.5 text-xs lg:text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <button 
                      type="submit" 
                      className="w-full px-2 py-1 lg:px-2.5 lg:py-1.5 text-xs lg:text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      구독하기
                    </button>
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
          className="py-3 lg:py-3 border-t border-border"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
            <div className="text-xs sm:text-sm lg:text-xs text-muted-foreground">
              © {new Date().getFullYear()} {logo}. All rights reserved.
            </div>
            <div className="flex space-x-3 lg:space-x-4">
              <Link
                href="/privacy"
                className="text-xs sm:text-sm lg:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/terms"
                className="text-xs sm:text-sm lg:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/cookies"
                className="text-xs sm:text-sm lg:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                쿠키 정책
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 