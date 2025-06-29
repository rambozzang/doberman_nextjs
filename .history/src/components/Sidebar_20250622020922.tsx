'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  User, 
  Calculator, 
  UserCircle, 
  Info, 
  HelpCircle,
  CheckSquare,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';

const menuItems = [
  { 
    id: 'home', 
    label: '홈', 
    icon: Home, 
    href: '/',
    active: true 
  },
  { 
    id: 'all-consultations', 
    label: '전체 상담 내역', 
    icon: FileText, 
    href: '/consultations' 
  },
  { 
    id: 'my-consultations', 
    label: '내 상담 내역', 
    icon: User, 
    href: '/my-consultations' 
  },
  { 
    id: 'quote-request', 
    label: '견적 요청하기', 
    icon: Calculator, 
    href: '/quote-request' 
  },
  { 
    id: 'my-profile', 
    label: '내 프로필', 
    icon: UserCircle, 
    href: '/profile' 
  },
  { 
    id: 'service-info', 
    label: '서비스 소개', 
    icon: Info, 
    href: '/service' 
  },
];

const guideItems = [
  { 
    id: 'faq', 
    label: 'FAQ', 
    icon: HelpCircle, 
    href: '/guide/faq' 
  },
  { 
    id: 'checklist', 
    label: '준비 체크리스트', 
    icon: CheckSquare, 
    href: '/guide/checklist' 
  },
  { 
    id: 'regions', 
    label: '지역별 정보', 
    icon: MapPin, 
    href: '/guide/regions' 
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [showGuideSubmenu, setShowGuideSubmenu] = useState(false);

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <div className={`
        fixed left-0 top-0 h-full w-64 sidebar z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏠</span>
            </div>
            <span className="text-white font-semibold">도배 비교견적 플랫폼</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* 도배 가이드 섹션 */}
            <div className="mt-6">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                도배 가이드
              </div>
              
              <button
                onClick={() => setShowGuideSubmenu(!showGuideSubmenu)}
                className="sidebar-item w-full justify-between"
              >
                <div className="flex items-center">
                  <HelpCircle size={20} />
                  <span>도배 가이드</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform ${showGuideSubmenu ? 'rotate-90' : ''}`}
                />
              </button>

              {showGuideSubmenu && (
                <div className="ml-4 space-y-1">
                  {guideItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* 사이드바 푸터 */}
        <div className="p-4 border-t border-gray-600">
          <div className="text-xs text-gray-400 text-center">
            © 2025 도배르만
          </div>
        </div>
      </div>
    </>
  );
} 