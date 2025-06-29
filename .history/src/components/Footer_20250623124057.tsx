"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

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
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 뉴스레터 구독 로직
    console.log("뉴스레터 구독");
  };

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Company Info */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <Image src="/logo.png" alt="logo" width={32} height={32} />
                  <span className="text-xl font-bold text-foreground">{logo}</span>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex space-x-4"
              >
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon}
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
                  className="space-y-3"
                >
                  {contactInfo.email && (
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{contactInfo.address}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Newsletter */}
            {showNewsletter && (
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    뉴스레터 구독
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    최신 소식과 업데이트를 받아보세요.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <button 
                      type="submit" 
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          className="py-6 border-t border-border"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {logo}. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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