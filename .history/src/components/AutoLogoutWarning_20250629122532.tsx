"use client";

import React, { useState, useEffect } from 'react';

interface AutoLogoutWarningProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
}

// 개발 환경에서도 운영과 동일한 시간으로 설정
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const WARNING_COUNTDOWN = 300; // 개발/운영 모두: 5분(300초)

export default function AutoLogoutWarning({ 
  isOpen, 
  onExtendSession, 
  onLogout 
}: AutoLogoutWarningProps) {
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(WARNING_COUNTDOWN);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-yellow-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            세션 만료 경고
          </h3>
          
          <p className="text-gray-600 mb-4">
            비활성화로 인해 곧 자동 로그아웃됩니다.
          </p>
          
          <div className="text-2xl font-bold text-red-600 mb-6">
            {formatTime(countdown)}
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onExtendSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              세션 연장
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 