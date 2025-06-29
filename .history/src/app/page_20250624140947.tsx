'use client';


import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Minus, User, Github, Zap, Layers, Play, ExternalLink, ArrowRight, HelpCircle, CheckSquare, MapPin, Star, MapPin as Location, Phone, Award, Clock, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { YoutubeService } from '@/services/youtubeService';
import { YoutubeVideo } from '@/types/api';

// 샘플 API 호출 함수
const fetchUserData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    name: '홍길동',
    email: 'hong@example.com',
    avatar: '👤',
  };
};

export default function Home() {
  const { count, user, increment, decrement, setUser, clearUser } = useStore();
  const router = useRouter();

  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUserData,
    enabled: false,
  });

  // 유튜브 비디오 데이터 로드
  const { data: youtubeVideos, isLoading: isYoutubeLoading } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: async () => {
      const response = await YoutubeService.getVideoList();
      return response.success ? response.data : [];
    },
  });

  const handleLoadUser = () => {
    if (userData) {
      setUser(userData);
    } else {
      refetch();
    }
  };

  return (
    <div className="main-layout">
      <div className="container mx-auto page-wrapper">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 py-1 sm:py-2 md:py-2 lg:py-3 overflow-hidden"
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
              className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
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
              className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-full blur-3xl"
            ></motion.div>
            
            {/* 플로팅 파티클들 */}
            {[...Array(6)].map((_, i) => (
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
                className={`absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full`}
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
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/20 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-300">전국 200+ 전문가 온라인</span>
            </motion.div>

            {/* 메인 타이틀 */}
            <div className="flex  justify-center text-center">
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
              className="text-4xl sm:text-5xl md:text-6xl pr-5 lg:text-7xl mb-2 md:mb-3 inline-block"
            >
              🎯 
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 mb-6 leading-tight tracking-tight"
            >
              무료 도배 비교
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                견적 서비스
              </span>
            </motion.h1>
            </div>

            {/* 서브타이틀 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            >
              전국 200명 이상의 검증된 도배 전문가들과 함께하는
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
                스마트한 비교견적 플랫폼
              </span>
            </motion.p>
            
            {/* 기술 스택 태그들 - 현대적 디자인 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-1"
            >
              {[
                { 
                  icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, 
                  text: 'Next.js 15', 
                  gradient: 'from-blue-500 to-cyan-500',
                  bg: 'from-blue-500/10 to-cyan-500/10',
                  border: 'border-blue-500/30'
                },
                { 
                  icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />, 
                  text: 'Zustand', 
                  gradient: 'from-purple-500 to-pink-500',
                  bg: 'from-purple-500/10 to-pink-500/10',
                  border: 'border-purple-500/30'
                },
                { 
                  icon: <Github className="w-4 h-4 sm:w-5 sm:h-5" />, 
                  text: 'TanStack Query', 
                  gradient: 'from-orange-500 to-red-500',
                  bg: 'from-orange-500/10 to-red-500/10',
                  border: 'border-orange-500/30'
                },
                { 
                  icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />, 
                  text: 'Tailwind CSS', 
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
                    delay: 0.8 + index * 0.1, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-r ${tech.bg} border ${tech.border} px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl cursor-pointer`}
                >
                  {/* 호버 효과 */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${tech.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative flex items-center gap-2 sm:gap-3">
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${tech.gradient} group-hover:scale-110 transition-transform duration-300`}>
                      {tech.icon}
                    </div>
                    <span className={`text-sm sm:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r ${tech.gradient} group-hover:from-white group-hover:to-white transition-all duration-300`}>
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
          className="px-6 py-8 sm:px-8 md:py-12 lg:py-16"
        >
          <div className="relative max-w-4xl mx-auto lg:max-w-4xl">
            {/* 배경 글로우 효과 - 모바일에서 줄임 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl lg:blur-3xl rounded-full scale-105 lg:scale-110"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 blur-xl lg:blur-2xl rounded-full scale-110 lg:scale-125 animate-pulse"></div>
            
            {/* 메인 CTA 카드 - 반응형 패딩 */}
            <div className="relative card-enhanced text-center border-gradient">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-subtle mb-6 md:mb-8 leading-relaxed px-2 sm:px-0">
                  3분만 투자하면<br className="sm:hidden" />
                  <span className="text-gradient-primary font-semibold"> 최대 5개 업체</span>의<br className="sm:hidden" />
                  견적을 무료로 받아보세요
                </p>
                
                {/* 반응형 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-full group relative overflow-hidden shadow-xl hover:shadow-blue-500/30 transition-all duration-300 border border-blue-400/30 min-w-0 sm:min-w-[280px] md:min-w-[320px]"
                  onClick={() => router.push('/quote-request')}
                >
                  {/* 버튼 내부 애니메이션 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* 버튼 텍스트 */}
                  <span className="relative">지금 바로 견적받기</span>
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
                    className="relative text-lg sm:text-xl md:text-2xl"
                  >
                    ✨
                  </motion.div>
                  
                  {/* 버튼 테두리 글로우 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10 scale-105"></div>
                </motion.button>
                
              
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
              className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 lg:-top-6 lg:-left-6 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 lg:opacity-70"
            ></motion.div>
                    {/* 추가 신뢰도 지표 */}
                    <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-slate-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">100% 무료</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">3분 견적</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">로그인 불필요</span>
              </div>
            </motion.div>
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity }
              }}
              className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 lg:-bottom-6 lg:-right-6 w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-60 lg:opacity-70"
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
              className="hidden sm:block absolute top-1/2 -right-6 lg:-right-10 w-4 h-4 lg:w-6 lg:h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            ></motion.div>
            
            <motion.div
              animate={{ 
                y: [10, -10, 10],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{ 
                duration: 9, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="hidden sm:block absolute top-1/4 -left-6 lg:-left-10 w-3 h-3 lg:w-5 lg:h-5 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
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
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">2,340+</div>
              <div className="text-xs sm:text-sm md:text-base text-muted">누적 견적 요청</div>
            </motion.div>

            {/* 등록 전문가 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center bg-slate-800/30 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-slate-700/30"
            >
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary mb-1">200+</div>
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
              왜 도베르만을 선택해야 할까요?
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

        {/* 도배 인테리어 영상 섹션 - 실제 유튜브 API 데이터 */}
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
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
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

        {/* 도배 전문가 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.3, duration: 0.6 }}
          className="max-w-7xl mx-auto mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              🏆 도배 전문가
            </h2>
            <p className="text-xl text-slate-300">
              검증된 전국 최고의 도배 전문가들을 만나보세요
            </p>
          </div>

          {/* 전문가 카드 슬라이더 */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-6 pb-4"
              animate={{ x: [0, -1400, 0] }}
              transition={{ 
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            >
                             {/* 전문가 1 */}
               <motion.div
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
               >
                 {/* 배경 그라데이션 효과 */}
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 <div className="relative z-10">
                   {/* 프로필 섹션 */}
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                       김
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">김도배 전문가</h3>
                       <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                         ))}
                         <span className="text-slate-400 text-sm ml-2">5.0 (127)</span>
                       </div>
                     </div>
                   </div>

                   {/* 전문가 정보 */}
                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2 text-slate-300">
                       <Location className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">서울 강남구</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Award className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">15년 경력 • 인테리어 전문</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">평균 응답시간 2시간</span>
                     </div>
                   </div>

                   {/* 전문 분야 태그 */}
                   <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">아파트 도배</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">원룸 도배</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">상업공간</span>
                   </div>

                   {/* 연락 버튼 */}
                   <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" />
                     견적 문의하기
                   </button>
                 </div>
               </motion.div>

                             {/* 전문가 2 */}
               <motion.div
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                       이
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">이인테리어</h3>
                       <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                         ))}
                         <span className="text-slate-400 text-sm ml-2">4.9 (89)</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2 text-slate-300">
                       <Location className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">경기 수원시</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Award className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">12년 경력 • 친환경 도배</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">평균 응답시간 1시간</span>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">친환경 도배</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">빌라 전문</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">리모델링</span>
                   </div>

                   <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" />
                     견적 문의하기
                   </button>
                 </div>
               </motion.div>

                             {/* 전문가 3 */}
               <motion.div
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                       박
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">박마스터</h3>
                       <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                         ))}
                         <span className="text-slate-400 text-sm ml-2">4.8 (203)</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2 text-slate-300">
                       <Location className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">부산 해운대구</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Award className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">20년 경력 • 고급 도배</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">평균 응답시간 30분</span>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">고급 도배</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">오피스텔</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">펜션</span>
                   </div>

                   <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" />
                     견적 문의하기
                   </button>
                 </div>
               </motion.div>

                             {/* 전문가 4 */}
               <motion.div
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                       최
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">최프로</h3>
                       <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                         ))}
                         <span className="text-slate-400 text-sm ml-2">4.9 (156)</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2 text-slate-300">
                       <Location className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">인천 남동구</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Award className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">18년 경력 • 디자인 도배</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">평균 응답시간 1시간</span>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">디자인 도배</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">카페 인테리어</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">매장</span>
                   </div>

                   <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" />
                     견적 문의하기
                   </button>
                 </div>
               </motion.div>

                             {/* 전문가 5 */}
               <motion.div
                 whileHover={{ scale: 1.05, y: -5 }}
                 className="flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                       정
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white">정장인</h3>
                       <div className="flex items-center gap-1">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                         ))}
                         <span className="text-slate-400 text-sm ml-2">5.0 (78)</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2 text-slate-300">
                       <Location className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">대구 중구</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Award className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">10년 경력 • 신속 시공</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-300">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-sm">평균 응답시간 15분</span>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">신속 시공</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">주택</span>
                     <span className="px-3 py-1 bg-slate-600/30 text-slate-300 rounded-full text-xs">원룸</span>
                   </div>

                   <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" />
                     견적 문의하기
                   </button>
                 </div>
               </motion.div>
            </motion.div>
          </div>

          {/* 더 많은 전문가 보기 버튼 */}
          <div className="text-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 border border-slate-600"
            >
              전체 전문가 보기 →
            </motion.button>
          </div>
        </motion.div>

        

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Zustand 상태 관리 데모 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              🎯 Zustand 상태 관리
            </h2>
            
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {count}
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                전역 상태로 관리되는 카운터
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={decrement}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
                감소
              </button>
              <button
                onClick={increment}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                증가
              </button>
            </div>
          </motion.div>

          {/* TanStack Query 데모 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              🚀 TanStack Query
            </h2>
            
            {user ? (
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">{userData?.avatar || '👤'}</div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {user.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            ) : (
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">❓</div>
                <p className="text-slate-600 dark:text-slate-400">
                  사용자 데이터를 불러와보세요
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleLoadUser}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <User className="w-4 h-4" />
                {isLoading ? '로딩 중...' : '사용자 로드'}
              </button>
              {user && (
                <button
                  onClick={clearUser}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 dark:text-slate-400">
            Framer Motion, Lucide React, Radix UI로 구성된 모던 UI
          </p>
        </motion.div>
      </div>
    </div>
  );
}
