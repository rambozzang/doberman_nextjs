'use client';

import React, { useState, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {  User, Github, Zap, Layers, Play, ExternalLink, ArrowRight, HelpCircle, CheckSquare, MapPin,  Youtube, List, Building, Calendar, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CustomerRequestService } from '@/services/customerRequestService';
import { CustomerRequest } from '@/types/api';
import { YoutubeService } from '@/services/youtubeService';
import { YoutubeVideo } from '@/types/api';



export default function Home() {

  const router = useRouter();
  const [youtubeRequested, setYoutubeRequested] = useState(false);
  const [customerRequestsRequested, setCustomerRequestsRequested] = useState(false);

  // 실제 견적 요청 데이터 로드 - 지연 로딩으로 홈페이지 속도 최적화
  const { data: customerRequestsData, isLoading: isCustomerRequestsLoading } = useQuery({
    queryKey: ['customer-requests-preview'],
    queryFn: async () => {
      const response = await CustomerRequestService.searchRequests({
        page: 0,
        size: 20, // 20개로 증가
        sortBy: 'latest',
        sortDirection: 'desc'
      });
      if (response.success && response.data) {
        return {
          content: response.data.content || [],
          totalCount: response.data.totalCount || 0
        };
      }
      return { content: [], totalCount: 0 };
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    enabled: customerRequestsRequested, // 지연 로딩 활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재호출 방지
  });

  const customerRequests = customerRequestsData?.content || [];
  const totalRequestCount = customerRequestsData?.totalCount || 0;

  // 통계 데이터 로드 - 지연 로딩으로 홈페이지 속도 최적화
  const { data: statistics } = useQuery({
    queryKey: ['customer-requests-statistics'],
    queryFn: async () => {
      const response = await CustomerRequestService.getStatistics();
      return response.success ? response.data : null;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    enabled: customerRequestsRequested, // 지연 로딩 활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재호출 방지
  });



  // 유튜브 비디오 데이터 로드 - 사용자가 요청할 때만 로딩
  const { data: youtubeVideos, isLoading: isYoutubeLoading } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: async () => {
      const response = await YoutubeService.getVideoList();
      return response.success ? response.data : [];
    },
    enabled: youtubeRequested, // 사용자가 요청할 때만 로딩
  });


  // 페이지 로딩 후 1초 뒤에 견적 요청 데이터 자동 호출 (홈페이지 속도 최적화)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerRequestsRequested(true);
    }, 1000); // 1초 후 자동 호출

    return () => clearTimeout(timer);
  }, []);

  // 페이지 로딩 후 2초 뒤에 유튜브 API 자동 호출
  useEffect(() => {
    const timer = setTimeout(() => {
      setYoutubeRequested(true);
    }, 2000); // 2초 후 자동 호출

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="main-layout">
      <div className="container mx-auto page-wrapper">
        
        {/* 도배업체명 스크롤 섹션 - 헤더에 딱 붙임 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="h-[70px] bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/30 overflow-hidden relative -mt-12 sm:-mt-16 md:-mt-18 lg:-mt-20"
        >
          <div className="absolute inset-0 flex items-center">
            <motion.div 
              className="flex items-center gap-3 whitespace-nowrap"
              animate={{ x: -1200 }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop"
              }}
            >
              {/* 도배업체명들 - 첫 번째 세트 */}
              <span className="text-slate-300 font-medium text-m">올바른인테리어</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">도배연가</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">도배마스터</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">원 인테리어</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">새로고침하우징</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">인테리어 도배필름</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">늘솜도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">자연으로도배</span>
              <span className="text-slate-400">•</span>
                  <span className="text-slate-300 font-medium text-m">미소앤하우스</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">강남인테리어</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">원탑도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">시안건재</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">앱팩토리</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">강도배</span>
              
              {/* 도배업체명들 - 두 번째 세트 (무한 루프를 위한 복사본) */}
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">픽스앤필름</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">메가맥</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">봉화지업사</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">새늘도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">서울도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">예쁜집도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">대구도배마스터</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">인천프로</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">태양지업사</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">강남인테리어</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">홍도배</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">도배홀릭</span>
              <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-medium text-m">플레나코퍼레이션</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-medium text-m">프리미엄인테리어</span>
            </motion.div>
          </div>
          
          {/* 좌우 그라데이션 페이드 효과 */}
          <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-slate-900 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-slate-900 to-transparent pointer-events-none"></div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 py-2 sm:py-4 md:py-4 lg:py-4 overflow-hidden"
        >
          {/* 배경 장식 요소들 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* 그라데이션 오브 */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-10 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
            ></motion.div>
            
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 right-1/4 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-full blur-3xl"
            ></motion.div>
            
            {/* 플로팅 파티클들 - 모바일에서 줄임 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-20, -60, -20],
                  x: [-10, 10, -10],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
                className={`hidden sm:block absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full`}
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${30 + (i % 3) * 20}%`
                }}
              ></motion.div>
            ))}
          </div>

          {/* 메인 컨텐츠 */}
          <div className="relative z-10 max-w-5xl mx-auto">
            {/* 상단 배지 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 mb-6 sm:mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-blue-300">전국 300+ 전문가 온라인</span>
            </motion.div>

            {/* 메인 타이틀 */}
            <div className="flex justify-center text-center mb-4 sm:mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl pr-3 sm:pr-5 inline-block"
              >
                🎯 
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 leading-tight tracking-tight"
              >
                무료 도배 비교견적
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  전국 300+ 전문가 매칭
                </span>
              </motion.h1>
            </div>

            {/* 서브타이틀 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed font-light px-4"
            >
              전국 300여명 이상의 검증된 도배 전문가들과 함께하는
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
                스마트한 비교견적 플랫폼
              </span>
            </motion.p>

            {/* 서비스 워크플로우 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mb-8 sm:mb-12 px-4"
            >
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* 사용자 섹션 */}
                  <div className="relative group cursor-pointer" onClick={() => router.push('/quote-request')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 sm:p-8 hover:border-blue-400/50 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white">일반 사용자</h3>
                          <p className="text-sm text-blue-300">웹사이트에서 간편하게</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">웹에서 견적신청 작성</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">최고의 업체 견적 비교</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">최적의 업체 선택</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 도배사장님 섹션 */}
                  <div className="relative group cursor-pointer" onClick={() => window.open('https://www.codelabtiger.com/doberman/', '_blank')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 sm:p-8 hover:border-purple-400/50 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <div className="text-xl sm:text-2xl">🔨</div>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white">도배사장님</h3>
                          <p className="text-sm text-purple-300">도배르만 앱에서 전문적으로</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">앱에서 비교견적 작성</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">전문적인 견적서 제공</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                          <span className="text-sm sm:text-base text-slate-300">고객과 직접 매칭</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

           
              </div>
            </motion.div>
            
            {/* 기술 스택 태그들 - 현대적 디자인 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-12 px-4"
            >
              {[
                { 
                  icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />, 
                  text: '국내 유일', 
                  gradient: 'from-blue-500 to-cyan-500',
                  bg: 'from-blue-500/10 to-cyan-500/10',
                  border: 'border-blue-500/30'
                },
                { 
                  icon: <Layers className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />, 
                  text: '도배 전용', 
                  gradient: 'from-purple-500 to-pink-500',
                  bg: 'from-purple-500/10 to-pink-500/10',
                  border: 'border-purple-500/30'
                },
                { 
                  icon: <Github className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />, 
                  text: '비교견적', 
                  gradient: 'from-orange-500 to-red-500',
                  bg: 'from-orange-500/10 to-red-500/10',
                  border: 'border-orange-500/30'
                },
                { 
                  icon: <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />, 
                  text: '플랫폼', 
                  gradient: 'from-emerald-500 to-teal-500',
                  bg: 'from-emerald-500/10 to-teal-500/10',
                  border: 'border-emerald-500/30'
                },
              ].map((tech, index) => (
                <motion.div
                  key={tech.text}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 1.1 + index * 0.1, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-r ${tech.bg} border ${tech.border} px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-xl sm:rounded-2xl cursor-pointer`}
                >
                  {/* 호버 효과 */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${tech.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative flex items-center gap-1 sm:gap-2 md:gap-3">
                    <div className={`${
                      tech.text === '국내 유일' ? 'text-blue-400' :
                      tech.text === '도배 전용' ? 'text-purple-400' :
                      tech.text === '비교견적' ? 'text-orange-400' :
                      'text-emerald-400'
                    } group-hover:text-white group-hover:scale-110 transition-all duration-300`}>
                      {tech.icon}
                    </div>
                    <span className={`text-xs sm:text-sm md:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r ${tech.gradient} group-hover:from-white group-hover:to-white transition-all duration-300`}>
                      {tech.text}
                    </span>
                  </div>
                  
                  {/* 반짝이는 효과 */}
                  <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* 무료 견적 받기 CTA - 모바일 최적화 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="px-4  md:px-8 "
        >
          <div className="relative max-w-4xl mx-auto">
            {/* 배경 글로우 효과 - 모바일에서 줄임 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl sm:blur-2xl lg:blur-3xl rounded-full scale-105 lg:scale-110"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 blur-lg sm:blur-xl lg:blur-2xl rounded-full scale-110 lg:scale-125 animate-pulse"></div>
            
            {/* 메인 CTA 카드 - 반응형 패딩 */}
            <div className="relative card-enhanced text-center border-gradient">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-subtle mb-6 md:mb-8 leading-relaxed px-2 sm:px-4">
                  <span className="block sm:inline">웹에서 간편하게 견적신청하면</span>
                  <span className="text-gradient-primary font-semibold"> 도배르만 앱 전문가들</span>이
                  <span className="block sm:inline"> 최고의 견적을 제공해드립니다</span>
                </p>
                
                {/* 반응형 버튼 - 모바일 최적화 */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 md:px-12 lg:px-16 py-4 sm:py-4 md:py-5 text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-2xl sm:rounded-full group relative overflow-hidden shadow-xl hover:shadow-blue-500/30 transition-all duration-300 border border-blue-400/30 min-h-[56px] sm:min-w-[280px] md:min-w-[320px]"
                  onClick={() => router.push('/quote-request')}
                >
                  {/* 버튼 내부 애니메이션 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* 버튼 텍스트 */}
                  <span className="relative font-black">지금 바로 견적받기</span>
                  <motion.div
                    animate={{ 
                      x: [0, 3, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.5,
                      ease: "easeInOut"
                    }}
                    className="relative text-xl sm:text-2xl md:text-3xl"
                  >
                    ✨
                  </motion.div>
                  
                  {/* 버튼 테두리 글로우 */}
                  <div className="absolute inset-0 rounded-2xl sm:rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10 scale-105"></div>
                </motion.button>
                
                {/* 추가 신뢰도 지표 - 모바일 최적화 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-slate-400 mt-6 sm:mt-8"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">100% 무료</span>
                  </div>
                  <div className="w-px h-3 sm:h-4 bg-slate-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">도배르만 앱 연동</span>
                  </div>
                  <div className="w-px h-3 sm:h-4 bg-slate-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">전문가 직접 매칭</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            
            {/* 장식 요소들 - 모바일에서 크기 조정 */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity }
              }}
              className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 md:-top-4 md:-left-4 lg:-top-6 lg:-left-6 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 lg:opacity-70"
            ></motion.div>
            
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity }
              }}
              className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 md:-bottom-4 md:-right-4 lg:-bottom-6 lg:-right-6 w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-60 lg:opacity-70"
            ></motion.div>
            
            {/* 모바일에서는 사이드 장식 요소 숨김 */}
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ 
                duration: 7, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="hidden md:block absolute top-1/2 -right-6 lg:-right-10 w-4 h-4 lg:w-6 lg:h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            ></motion.div>
          </div>
        </motion.div>
      
        {/* 간단한 통계 정보 - 모바일 최적화 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2 py-8 sm:px-4 sm:py-12 md:py-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {/* 누적 견적 요청 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center bg-slate-800/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-slate-700/30"
            >
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">
                {!customerRequestsRequested 
                  ? '1,400+'
                  : isCustomerRequestsLoading 
                    ? '-'
                    : totalRequestCount > 0 
                      ? `${(totalRequestCount+ 43 ).toLocaleString()}+`
                      : '-'}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-muted">누적 견적 요청</div>
            </motion.div>

            {/* 등록 전문가 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center bg-slate-800/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-slate-700/30"
            >
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">300+</div>
              <div className="text-xs sm:text-sm md:text-base text-muted">등록 전문가</div>
            </motion.div>

            {/* 평균 만족도 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center bg-slate-800/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-slate-700/30"
            >
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">4.8★</div>
              <div className="text-xs sm:text-sm md:text-base text-muted">평균 만족도</div>
            </motion.div>

            {/* 평균 응답 시간 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center bg-slate-800/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-slate-700/30"
            >
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">2시간</div>
              <div className="text-xs sm:text-sm md:text-base text-muted">평균 응답 시간</div>
            </motion.div>
          </div>
        </motion.div>

        {/* 메인 컨텐츠 - 왜 도베르만을 선택해야 할까요 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              왜 도배르만을 선택해야 할까요?
            </h2>
            <p className="text-xl text-slate-300">
              검증된 전문가들과 투명한 견적 시스템으로 최고의 도배 서비스를 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 검증된 도배 전문가 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 text-center hover:border-purple-500/30 hover:bg-slate-800/90 transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                검증된 도배 전문가
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                까다로운 심사를 통과한 실력있는 도배 전문가들이 견적을 제공합니다.
              </p>
            </motion.div>

            {/* 빠른 비교견적 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 text-center hover:border-orange-500/30 hover:bg-slate-800/90 transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                빠른 비교견적
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                하나의 요청으로 여러 전문가의 견적을 한번에 확인하고 비교할 수 있습니다.
              </p>
            </motion.div>

            {/* 로그인 없이 간편한 견적요청 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 text-center hover:border-cyan-500/30 hover:bg-slate-800/90 transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-cyan-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                로그인 없이 간편한 견적요청
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                회원가입 없이도 쉽고 빠르게 견적을 요청할 수 있습니다.
              </p>
            </motion.div>

            {/* 무료 전문가 상담 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 text-center hover:border-red-500/30 hover:bg-slate-800/90 transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                무료 전문가 상담
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                도배에 관한 궁금한 점을 전문가에게 무료로 상담받을 수 있습니다.
              </p>
            </motion.div>
          </div>
        </motion.div>

                {/* 전체 견적 요청 미리보기 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="max-w-7xl mx-auto mb-20"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <List className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                최신 견적 요청
              </h2>
            </div>
            <p className="hidden sm:block text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              전국 각지에서 신청된 최신 도배 견적 요청들
            </p>
          </div>

          {/* 견적 요청 리스트 테이블 */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-8">
            {/* 테이블 헤더 - 데스크톱 */}
            <div className="hidden md:block bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-600/50 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-300">
                <div className="col-span-1">번호</div>
                <div className="col-span-2">지역</div>
                <div className="col-span-2">건물유형</div>
                <div className="col-span-2">면적</div>
                <div className="col-span-1">고객명</div>
                <div className="col-span-2">요청일</div>
                <div className="col-span-1">답변</div>
                <div className="col-span-1">상태</div>
              </div>
            </div>

            {/* 테이블 헤더 - 모바일 */}
            <div className="md:hidden bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-600/50 px-2 py-3">
              <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-slate-300">
                <div className="text-center">번호</div>
                <div className="text-center">지역</div>
                <div className="text-center">유형</div>
                <div className="text-center">고객명</div>
                <div className="text-center">요청일</div>
                <div className="text-center">답변</div>
                <div className="text-center">상태</div>
              </div>
            </div>

            {/* 테이블 바디 */}
            <div className="divide-y divide-slate-700/30">
              {!customerRequestsRequested ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-slate-500 mb-4">📋</div>
                  <p className="text-slate-400">실시간 견적 요청 현황을 불러오는 중...</p>
                </div>
              ) : isCustomerRequestsLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-300">견적 요청을 불러오는 중...</p>
                </div>
              ) : customerRequests && customerRequests.length > 0 ? (
                <>
                  {/* 데스크톱 버전 */}
                  <div className="hidden md:block">
                    {customerRequests.map((request: CustomerRequest, index: number) => {
                      // 상태별 설정
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case "검토중":
                            return {
                              color: "from-yellow-500 to-orange-500",
                              bg: "bg-yellow-500/10",
                              text: "text-yellow-400"
                            };
                          case "진행중":
                            return {
                              color: "from-blue-500 to-cyan-500",
                              bg: "bg-blue-500/10",
                              text: "text-blue-400"
                            };
                          case "채택 성공":
                            return {
                              color: "from-emerald-500 to-green-500",
                              bg: "bg-emerald-500/10",
                              text: "text-emerald-400"
                            };
                          default:
                            return {
                              color: "from-gray-500 to-slate-500",
                              bg: "bg-gray-500/10",
                              text: "text-gray-400"
                            };
                        }
                      };

                      const statusConfig = getStatusConfig(request.status);
                      
                      // 고객명 가운데 이름 * 으로 변경
                      const hideMiddleName = (name: string) => {
                        const nameString = name.trim();
                        if(nameString.length > 2) {
                          return nameString.slice(0, 1) + '*'.repeat(nameString.length - 2) + nameString.slice(-1);
                        } else if(nameString.length === 2) {
                          return nameString.slice(0, 1) + '*';
                        }
                        return nameString;
                      };

                      // 날짜 포맷팅
                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        });
                      };

                      // 날짜 더 간편 포맷팅
                      const formatDateSimple = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }).replace(/(\d{4})년 (\d{2})월 (\d{2})일/, '$1.$2.$3');
                      };

                      // 대괄호 제거
                      const removeBrackets = (str: string) => {
                        return str.replace(/[\[\]]/g, '');
                      };

                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 + index * 0.05 }}
                          className="group cursor-pointer hover:bg-slate-700/20 transition-all duration-200"
                          onClick={() => router.push('/quote-request/list')}
                        >
                          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm">
                            {/* 번호 */}
                            <div className="col-span-1">
                              <span className="text-slate-400 font-mono">{request.id}</span>
                            </div>
                            
                            {/* 지역 */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="text-white font-medium">{request.region}</span>
                              </div>
                            </div>
                            
                            {/* 건물유형 */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-300">{removeBrackets(request.buildingType)}</span>
                              </div>
                            </div>
                            
                            {/* 면적 */}
                            <div className="col-span-2">
                              <span className="text-slate-300 font-medium">{request.area}평({request.areaSize}㎡)</span>
                            </div>
                            
                            {/* 고객명 */}
                            <div className="col-span-1">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-300">{hideMiddleName(request.customerName)}</span>
                              </div>
                            </div>
                            
                            {/* 요청일 */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-300">{formatDate(request.requestDate)}</span>
                              </div>
                            </div>
                            
                            {/* 답변 수 */}
                            <div className="col-span-1">
                              <div className="flex items-center justify-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.answerCount > 5 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : request.answerCount > 2 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {request.answerCount}개
                                </span>
                              </div>
                            </div>
                            
                            {/* 상태 */}
                            <div className="col-span-1">
                              <div className="flex items-center justify-center">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                  <div className={`w-1.5 h-1.5 bg-gradient-to-r ${statusConfig.color} rounded-full`}></div>
                                  <span>{request.status}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 모바일 버전 - 테이블 형태 */}
                  <div className="md:hidden">
                    {customerRequests.slice(0, 12).map((request: CustomerRequest, index: number) => {
                      // 상태별 설정
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case "검토중":
                            return {
                              color: "from-yellow-500 to-orange-500",
                              bg: "bg-yellow-500/10",
                              text: "text-yellow-400"
                            };
                          case "진행중":
                            return {
                              color: "from-blue-500 to-cyan-500",
                              bg: "bg-blue-500/10",
                              text: "text-blue-400"
                            };
                          case "채택 성공":
                            return {
                              color: "from-emerald-500 to-green-500",
                              bg: "bg-emerald-500/10",
                              text: "text-emerald-400"
                            };
                          default:
                            return {
                              color: "from-gray-500 to-slate-500",
                              bg: "bg-gray-500/10",
                              text: "text-gray-400"
                            };
                        }
                      };

                      const statusConfig = getStatusConfig(request.status);
                      
                      // 고객명 가운데 이름 * 으로 변경
                      const hideMiddleName = (name: string) => {
                        const nameString = name.trim();
                        if(nameString.length > 2) {
                          return nameString.slice(0, 1) + '*'.repeat(nameString.length - 2) + nameString.slice(-1);
                        } else if(nameString.length === 2) {
                          return nameString.slice(0, 1) + '*';
                        }
                        return nameString;
                      };

                      // 날짜 포맷팅
                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        });
                      };
                      // 날짜 더 간편 포맷팅 (25.11.04 같은 형식과 오늘인 경우 오늘로 표시)
                      const formatDateSimple = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ko-KR', {
                          // year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }).replace(/(\d{2})월 (\d{2})일/, '$1/$2')
                        .replace(/(\d{2})월 (\d{1})일/, '$1/$2')
                        .replace(/(\d{1})월 (\d{1})일/, '$1/$2')
                        .replace(/(\d{1})월 (\d{2})일/, '$1/$2')
                        ;
                        
                      };

                      // 대괄호 제거
                      const removeBrackets = (str: string) => {
                        return str.replace(/[\[\]]/g, '');
                      };

                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 + index * 0.05 }}
                          className="group cursor-pointer hover:bg-slate-700/20 transition-all duration-200 border-b border-slate-700/30 last:border-b-0"
                          onClick={() => router.push('/quote-request/list')}
                        >
                          <div className="grid grid-cols-7 gap-0.5 px-1 py-3 text-xs">
                            {/* 번호 */}
                            <div className="text-center">
                              <span className="text-slate-400 font-mono text-xs">{request.id}</span>
                            </div>
                            
                            {/* 지역 */}
                            <div className="text-center">
                              <span className="text-white font-medium text-xs">{request.region}</span>
                            </div>
                            
                            {/* 유형 */}
                            <div className="text-center">
                              <span className="text-slate-300 text-xs">{removeBrackets(request.buildingType)}</span>
                            </div>
                            
                            {/* 고객명 */}
                            <div className="text-center">
                              <span className="text-slate-300 text-xs">{hideMiddleName(request.customerName)}</span>
                            </div>
                            
                            {/* 요청일 */}
                            <div className="text-center">
                              <span className="text-slate-300 text-xs">{formatDateSimple(request.requestDate)}</span>
                            </div>
                            
                            {/* 답변 */}
                            <div className="text-center">
                              <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                request.answerCount > 5 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : request.answerCount > 2 
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}>
                                {request.answerCount}
                              </span>
                            </div>
                            
                            {/* 상태 */}
                            <div className="text-center">
                              <div className={`inline-flex items-center justify-center px-1 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                <div className={`w-1 h-1 bg-gradient-to-r ${statusConfig.color} rounded-full mr-0.5`}></div>
                                <span className="text-xs whitespace-nowrap">{request.status}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="text-slate-500 mb-4">📋</div>
                  <p className="text-slate-400">현재 등록된 견적 요청이 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {!customerRequestsRequested ? (
              // 데이터 로딩 시작 전 상태
              Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-xl font-bold text-slate-400 mb-1">-</div>
                  <div className="text-xs text-slate-500">로딩 중...</div>
                </motion.div>
              ))
            ) : (
              [
                { 
                  label: "전체 요청", 
                  count: !customerRequestsRequested 
                    ? "1,470+"
                    : isCustomerRequestsLoading 
                      ? '-'
                      : totalRequestCount > 0 
                        ? `${(totalRequestCount+ 43 ).toLocaleString()}+`
                        : '-', 
                  color: "from-blue-500 to-cyan-500", 
                  icon: "📊" 
                },
                { 
                  label: "검토중", 
                  count: statistics ? statistics.reviewingCount.toString() : "156", 
                  color: "from-yellow-500 to-orange-500", 
                  icon: "⏳" 
                },
                { 
                  label: "진행중", 
                  count: statistics ? statistics.adoptedCount.toString() : "89", 
                  color: "from-purple-500 to-violet-500", 
                  icon: "🔄" 
                },
                { 
                  label: "채택 성공", 
                  count: "789", 
                  color: "from-emerald-500 to-green-500", 
                  icon: "✅" 
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 text-center hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                    {stat.count}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </motion.div>
              ))
            )}
          </div>

          {/* 더보기 버튼 */}
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/quote-request/list')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-blue-500/30 border border-blue-500/30"
            >
              <span>전체 견적 요청 보기</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <p className="text-sm text-slate-400 mt-4">
              실시간으로 업데이트되는 전국의 도배 견적 요청 현황을 확인하세요
            </p>
          </div>
        </motion.div>

        {/* 도배 인테리어 영상 섹션 - 사용자 요청 시 로딩 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="max-w-7xl mx-auto mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
              <Youtube className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              도배 인테리어 영상
            </h2>
          </div>

          {isYoutubeLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <Youtube className="w-8 h-8 text-red-400 animate-pulse" />
              </div>
              <p className="text-slate-300">영상을 불러오는 중...</p>
            </div>
          ) : youtubeVideos && youtubeVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {youtubeVideos.slice(0, 10).map((video: YoutubeVideo, index: number) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => window.open(video.url, '_blank')}
                >
                  <div className="relative mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={video.thumbnailUrl}
                      alt={`${video.title} - 도배 관련 유튜브 영상 썸네일`}
                      width={320}
                      height={180}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={index < 3}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-slate-400 text-xs mb-1">
                    {video.channelName}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(video.publishedAt).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Youtube className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">영상을 불러올 수 없습니다.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm mb-4">
              실시간으로 업데이트되는 최신 도배 영상들
            </p>
            <button 
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
              onClick={() => window.open('https://www.youtube.com/results?search_query=도배+인테리어', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              유튜브에서 더보기
            </button>
          </div>
        </motion.div>



        {/* 도배르만 이용 방법 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.6 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              도배르만 이용 방법
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
            {/* 단계 1 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                견적 요청
              </h3>
              <p className="text-slate-400 text-sm">
                간단한 정보 입력
              </p>
            </motion.div>

            {/* 화살표 1 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3 }}
              className="hidden lg:block"
            >
              <ArrowRight className="w-8 h-8 text-purple-400" />
            </motion.div>

            {/* 단계 2 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                견적 확인
              </h3>
              <p className="text-slate-400 text-sm">
                전문가 견적 비교
              </p>
            </motion.div>

            {/* 화살표 2 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="hidden lg:block"
            >
              <ArrowRight className="w-8 h-8 text-orange-400" />
            </motion.div>

            {/* 단계 3 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.6 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                전문가 선택
              </h3>
              <p className="text-slate-400 text-sm">
                최적의 전문가 선택
              </p>
            </motion.div>

            {/* 화살표 3 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.7 }}
              className="hidden lg:block"
            >
              <ArrowRight className="w-8 h-8 text-cyan-400" />
            </motion.div>

            {/* 단계 4 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.8 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                시공 완료
              </h3>
              <p className="text-slate-400 text-sm">
                만족스러운 도배 완료
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* 도배 가이드 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.9, duration: 0.6 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-4">
              도배 가이드
            </h2>
            <p className="text-xl text-slate-300">
              성공적인 도배를 위한 완벽한 가이드
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* FAQ 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.0 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 text-center text-white hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                FAQ
              </h3>
              <p className="text-blue-100 mb-1">
                자주 묻는 질문과
              </p>
              <p className="text-blue-100">
                전문가 답변
              </p>
            </motion.div>

            {/* 준비 체크리스트 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.1 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-center text-white hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <CheckSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                준비 체크리스트
              </h3>
              <p className="text-green-100 mb-1">
                도배 전 필수
              </p>
              <p className="text-green-100">
                준비사항 안내
              </p>
            </motion.div>

            {/* 지역별 정보 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.2 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-center text-white hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                지역별 정보
              </h3>
              <p className="text-purple-100 mb-1">
                전국 지역별
              </p>
              <p className="text-purple-100">
                도배 정보
              </p>
            </motion.div>
          </div>
        </motion.div>

    

        

      </div>
    </div>
  );
}
