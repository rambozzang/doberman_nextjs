"use client";

import { Menu, Eye, FileText, Users, MessageCircle, LogIn } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const stats = [
    { label: '오늘 방문자', value: '1,327명', icon: Eye },
    { label: '총 게시물', value: '1,420개', icon: FileText },
    { label: '전체 회원수', value: '850명', icon: Users },
    { label: '오늘 댓글', value: '32개', icon: MessageCircle },
  ];

  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 좌측: 햄버거 메뉴 (모바일) + 통계 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-300 hover:text-white p-2"
          >
            <Menu size={20} />
          </button>
          
          {/* 통계 정보 */}
          <div className="hidden md:flex items-center space-x-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Icon size={16} className="text-blue-400" />
                  <span className="text-gray-400">{stat.label}</span>
                  <span className="text-white font-semibold">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측: 로그인 버튼 */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
            <LogIn size={16} />
            <span>로그인</span>
          </button>
        </div>
      </div>

      {/* 모바일용 통계 (접힌 상태에서 보이는 간소화된 버전) */}
      <div className="md:hidden px-4 pb-3">
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(0, 2).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <Icon size={14} className="text-blue-400" />
                <span className="text-gray-400 text-xs">{stat.label}</span>
                <span className="text-white font-semibold text-sm">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
} 