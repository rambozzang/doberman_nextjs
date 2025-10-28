"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cookie, Shield, Settings, Eye, Database, ExternalLink } from "lucide-react";

export default function CookiesPage() {
  const cookieTypes = [
    {
      icon: <Settings className="w-6 h-6" />,
      title: "필수 쿠키",
      description: "웹사이트의 기본 기능을 위해 반드시 필요한 쿠키입니다.",
      items: [
        "세션 관리 쿠키",
        "보안 쿠키",
        "로그인 상태 유지",
        "사용자 설정 저장"
      ],
      canDisable: false
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "분석 쿠키", 
      description: "웹사이트 사용 패턴을 분석하여 서비스 개선에 활용됩니다.",
      items: [
        "Google Analytics",
        "페이지 조회수 측정",
        "사용자 행동 분석",
        "트래픽 소스 분석"
      ],
      canDisable: true
    },
    {
      icon: <ExternalLink className="w-6 h-6" />,
      title: "마케팅 쿠키",
      description: "맞춤형 광고 제공과 마케팅 효과 측정을 위한 쿠키입니다.",
      items: [
        "Google Ads",
        "Facebook Pixel",
        "맞춤형 광고",
        "광고 성과 측정"
      ],
      canDisable: true
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-cyan-900/20 border-b border-slate-700/50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6"
            >
              <Cookie className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6"
            >
              쿠키 정책
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-slate-300 leading-relaxed"
            >
              도배르만이 사용하는 쿠키와 개인정보 처리에 대한 투명한 정보를 제공합니다.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* What are Cookies */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/30 backdrop-blur-sm"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl mr-4">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">쿠키란 무엇인가요?</h2>
            </div>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <p>
                쿠키는 웹사이트를 방문할 때 브라우저에 저장되는 작은 텍스트 파일입니다. 
                쿠키를 통해 웹사이트는 사용자의 방문을 기억하고, 더 나은 사용자 경험을 제공할 수 있습니다.
              </p>
              <p>
                도배르만에서는 웹사이트의 기본 기능 제공, 서비스 개선, 그리고 맞춤형 콘텐츠 제공을 위해 쿠키를 사용합니다.
              </p>
            </div>
          </motion.section>

          {/* Cookie Types */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">사용되는 쿠키의 종류</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {cookieTypes.map((type, index) => (
                <motion.div
                  key={type.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg mr-3">
                      {type.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{type.title}</h3>
                  </div>
                  <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                    {type.description}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {type.items.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    type.canDisable 
                      ? 'bg-green-900/30 text-green-300 border border-green-600/30'
                      : 'bg-red-900/30 text-red-300 border border-red-600/30'
                  }`}>
                    {type.canDisable ? '선택적' : '필수'}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Cookie Management */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/30 backdrop-blur-sm"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl mr-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">쿠키 관리 방법</h2>
            </div>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <p>
                사용자는 브라우저 설정을 통해 쿠키를 관리할 수 있습니다. 
                쿠키를 비활성화하거나 특정 쿠키만 허용할 수 있지만, 
                일부 기능이 제대로 작동하지 않을 수 있습니다.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2 mt-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/20">
                  <h4 className="font-semibold text-white mb-2">Chrome</h4>
                  <p className="text-sm text-slate-400">설정 → 개인정보 보호 및 보안 → 쿠키 및 기타 사이트 데이터</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/20">
                  <h4 className="font-semibold text-white mb-2">Firefox</h4>
                  <p className="text-sm text-slate-400">환경 설정 → 개인 정보 보호 및 보안 → 쿠키 및 사이트 데이터</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/20">
                  <h4 className="font-semibold text-white mb-2">Safari</h4>
                  <p className="text-sm text-slate-400">환경설정 → 개인 정보 보호 → 쿠키 및 웹사이트 데이터</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/20">
                  <h4 className="font-semibold text-white mb-2">Edge</h4>
                  <p className="text-sm text-slate-400">설정 → 쿠키 및 사이트 권한 → 쿠키 및 저장된 데이터</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Third Party Services */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/30 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-white mb-6">제3자 서비스</h2>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <p>
                도배르만은 다음과 같은 제3자 서비스를 사용하며, 각 서비스는 자체 쿠키 정책을 가지고 있습니다:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Google Analytics</h4>
                  <p className="text-sm text-slate-400 mb-2">웹사이트 사용 통계 분석</p>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Google 개인정보처리방침 →
                  </a>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Google Ads</h4>
                  <p className="text-sm text-slate-400 mb-2">맞춤형 광고 제공</p>
                  <a 
                    href="https://policies.google.com/technologies/ads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Google 광고 정책 →
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-blue-600/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-white mb-4">문의사항</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              쿠키 정책에 대한 질문이나 문의사항이 있으시면 언제든 연락해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center text-slate-300">
                <span className="font-medium">이메일:</span>
                <a 
                  href="mailto:codelabtiger@gmail.com" 
                  className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  codelabtiger@gmail.com
                </a>
              </div>
            </div>
          </motion.section>

          {/* Last Updated */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center pt-8 border-t border-slate-700/50"
          >
            <p className="text-slate-400 text-sm">
              최종 업데이트: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}