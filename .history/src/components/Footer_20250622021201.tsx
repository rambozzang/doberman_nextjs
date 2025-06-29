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
    title: "제품",
    links: [
      { title: "분석 도구", href: "/analytics" },
      { title: "대시보드", href: "/dashboard" },
      { title: "리포트", href: "/reports" },
      { title: "통합", href: "/integrations" },
    ],
  },
  {
    title: "솔루션",
    links: [
      { title: "기업용", href: "/enterprise" },
      { title: "중소기업", href: "/small-business" },
      { title: "스타트업", href: "/startups" },
      { title: "에이전시", href: "/agencies" },
    ],
  },
  {
    title: "리소스",
    links: [
      { title: "문서", href: "/docs" },
      { title: "블로그", href: "/blog" },
      { title: "고객 지원", href: "/help" },
      { title: "커뮤니티", href: "/community" },
    ],
  },
  {
    title: "회사",
    links: [
      { title: "소개", href: "/about" },
      { title: "채용", href: "/careers" },
      { title: "연락처", href: "/contact" },
      { title: "파트너", href: "/partners" },
    ],
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

export default function Footer() {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-4">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400 text-sm">
          © 2025 도배르만. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 