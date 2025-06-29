'use client';


import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Minus, User, Github, Zap, Layers, Play, ExternalLink, ArrowRight, HelpCircle, CheckSquare, MapPin, Star, MapPin as Location, Phone, Award, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const handleLoadUser = () => {
    if (userData) {
      setUser(userData);
    } else {
      refetch();
    }
  };

  return (
    <div className="main-layout">
      <div className="container-custom page-wrapper">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero-section text-center section-spacing"
        >
          <h1 className="text-display font-bold text-white mb-6 text-gradient-primary">
            무료 도배 비교 견적 서비스
          </h1>
          <p className="text-body-lg text-subtle mb-8 max-w-3xl mx-auto">
            전국 200명 이상의 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { icon: <Zap className="w-5 h-5" />, text: 'Next.js 15' },
              { icon: <Layers className="w-5 h-5" />, text: 'Zustand' },
              { icon: <Github className="w-5 h-5" />, text: 'TanStack Query' },
              { icon: <User className="w-5 h-5" />, text: 'Tailwind CSS' },
            ].map((tech, index) => (
              <motion.div
                key={tech.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex items-center gap-2 card-glass px-4 py-2 rounded-full"
              >
                <div className="text-primary">{tech.icon}</div>
                <span className="text-caption text-white font-medium">
                  {tech.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 무료 견적 받기 CTA - 중앙 집중형 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center justify-center min-h-[15vh] px-4"
        >
          <div className="relative max-w-2xl w-full">
            {/* 배경 글로우 효과 - 더 강화 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-3xl rounded-full scale-110"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 blur-2xl rounded-full scale-125 animate-pulse"></div>
            
            {/* 메인 CTA 카드 - 더 큰 패딩과 크기 */}
            <div className="relative card-enhanced text-center border-gradient">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="px-8 py-12 md:px-12 md:py-16"
              >
                {/* 이모지와 제목을 더 크게 */}
                <div className="mb-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl md:text-7xl mb-4 inline-block"
                  >
                    🎯
                  </motion.div>
                  <h2 className="text-h1 md:text-display font-bold text-white mb-6">
                    무료 견적 받기
                  </h2>
                </div>
                
                <p className="text-body-lg md:text-xl text-subtle mb-10 leading-relaxed">
                  3분만 투자하면<br className="md:hidden" />
                  <span className="text-gradient-primary font-semibold"> 최대 5개 업체</span>의<br className="md:hidden" />
                  견적을 무료로 받아보세요
                </p>
                
                {/* 특별한 버튼 - 개선된 스타일 */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-4 px-16 py-4 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-full group relative overflow-hidden shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 min-w-[300px] border border-blue-400/30"
                  onClick={() => router.push('/quote-request')}
                >
                  {/* 버튼 내부 애니메이션 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* 버튼 텍스트 */}
                  <span className="relative">지금 바로 견적받기</span>
                  <motion.div
                    animate={{ 
                      x: [0, 5, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    className="relative text-2xl"
                  >
                    ✨
                  </motion.div>
                  
                  {/* 버튼 테두리 글로우 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10 scale-110"></div>
                </motion.button>
                
                {/* 부가 정보 - 더 큰 간격과 크기 */}
                <div className="flex flex-wrap justify-center gap-8 mt-5">
                  <motion.div 
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm md:text-base text-muted font-medium">100% 무료</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm md:text-base text-muted font-medium">로그인 불필요</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-3"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                    <span className="text-sm md:text-base text-muted font-medium">3분 소요</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* 장식 요소들 - 더 많고 다양하게 */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity }
              }}
              className="absolute -top-6 -left-6 w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-70"
            ></motion.div>
            
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity }
              }}
              className="absolute -bottom-6 -right-6 w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-70"
            ></motion.div>
            
            <motion.div
              animate={{ 
                y: [-15, 15, -15],
                opacity: [0.4, 0.9, 0.4]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 -right-10 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            ></motion.div>
            
            <motion.div
              animate={{ 
                y: [15, -15, 15],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 -left-10 w-5 h-5 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
            ></motion.div>
          </div>
        </motion.div>
      
        {/* 간단한 통계 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-4xl mx-auto py-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* 누적 견적 요청 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">2,340+</div>
              <div className="text-xs md:text-sm text-muted">누적 견적 요청</div>
            </motion.div>

            {/* 등록 전문가 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">200+</div>
              <div className="text-xs md:text-sm text-muted">등록 전문가</div>
            </motion.div>

            {/* 평균 만족도 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">4.8★</div>
              <div className="text-xs md:text-sm text-muted">평균 만족도</div>
            </motion.div>

            {/* 평균 응답 시간 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">2시간</div>
              <div className="text-xs md:text-sm text-muted">평균 응답 시간</div>
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

          <div className="grid-responsive">
            {/* 검증된 도배 전문가 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card-enhanced text-center hover:glow-effect"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-h4 font-bold text-white mb-4">
                검증된 도배 전문가
              </h3>
              <p className="text-body text-muted leading-relaxed">
                까다로운 심사를 통과한 실력있는 도배 전문가들이 견적을 제공합니다.
              </p>
            </motion.div>

            {/* 빠른 비교견적 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="card-enhanced text-center hover:glow-effect"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-orange-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-h4 font-bold text-white mb-4">
                빠른 비교견적
              </h3>
              <p className="text-body text-muted leading-relaxed">
                하나의 요청으로 여러 전문가의 견적을 한번에 확인하고 비교할 수 있습니다.
              </p>
            </motion.div>

            {/* 로그인 없이 간편한 견적요청 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="card-enhanced text-center hover:glow-effect"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-cyan-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-h4 font-bold text-white mb-4">
                로그인 없이 간편한 견적요청
              </h3>
              <p className="text-body text-muted leading-relaxed">
                회원가입 없이도 쉽고 빠르게 견적을 요청할 수 있습니다.
              </p>
            </motion.div>

            {/* 무료 전문가 상담 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="card-enhanced text-center hover:glow-effect"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-600 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-h4 font-bold text-white mb-4">
                무료 전문가 상담
              </h3>
              <p className="text-body text-muted leading-relaxed">
                도배에 관한 궁금한 점을 전문가에게 무료로 상담받을 수 있습니다.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* 도배 인테리어 영상 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="max-w-7xl mx-auto mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              도배 인테리어 영상
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
               style={{ gap: 'var(--spacing-4)' }}>
            {/* 영상 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="text-xs">도배 시공 영상</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    12:34
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                도배 대신 인테리어필름! #시트지도배 어떻게 생각하시나요?
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                행복대일리
              </p>
              <p className="text-slate-500 text-xs">
                6월 20일 17:47
              </p>
            </motion.div>

            {/* 영상 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-orange-600 to-yellow-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🎨</div>
                    <div className="text-xs">도배vs필름</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    8:15
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                도배vs필름, 차이점 3가지
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                집다한 연구소
              </p>
              <p className="text-slate-500 text-xs">
                6월 17일 7:15
              </p>
            </motion.div>

            {/* 영상 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">✨</div>
                    <div className="text-xs">Before & After</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    15:22
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                방2 거실1 영등포 도배 #도배서울
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                수리수리 도수리
              </p>
              <p className="text-slate-500 text-xs">
                6월 16일 19:13
              </p>
            </motion.div>

            {/* 영상 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🤔</div>
                    <div className="text-xs">도배 고민</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    9:47
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                비용때문에 합지도배 한다고 요? #일상인테리어 #tx인테리어
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                일상인테리어 지영디자인
              </p>
              <p className="text-slate-500 text-xs">
                6월 18일 13:33
              </p>
            </motion.div>

            {/* 영상 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🏡</div>
                    <div className="text-xs">전체 도배</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    6:28
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                LH 전세 저임 도동작구 상도동 도배
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                다인인테리어
              </p>
              <p className="text-slate-500 text-xs">
                6월 18일 9:15
              </p>
            </motion.div>

            {/* 영상 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">📢</div>
                    <div className="text-xs">인테리어 보라</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    11:45
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                인테리어보라 010-2218-8549 충북봉화 인테리어 시공
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                인테리어보라
              </p>
              <p className="text-slate-500 text-xs">
                6월 19일 6:07
              </p>
            </motion.div>

            {/* 영상 7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-xs">자신있는 확신</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    7:33
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                자신있는 확신의 마감재를하겠습니다하지만이도배기해드릴게요
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                부산도배왕TV
              </p>
              <p className="text-slate-500 text-xs">
                6월 19일 0:23
              </p>
            </motion.div>

            {/* 영상 8 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="text-xs">다인인테리어</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    14:12
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                다인인테리어 (010.9120.9127) 파사드 인테리어
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                다인인테리어_포항 도배전문업체
              </p>
              <p className="text-slate-500 text-xs">
                6월 16일 23:03
              </p>
            </motion.div>

            {/* 영상 9 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="text-xs">대전롯데캐슬</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    10:55
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                대전롯데캐슬골든 119동 방3개 도배 시공#대전도배
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                도배해
              </p>
              <p className="text-slate-500 text-xs">
                6월 16일 18:53
              </p>
            </motion.div>

            {/* 영상 10 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
              className="group cursor-pointer"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
            >
              <div className="relative mb-3 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center z-10">
                    <div className="text-2xl mb-2">🎬</div>
                    <div className="text-xs">도배 완공</div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    8:42
                  </div>
                </div>
              </div>
              <h3 className="text-white text-sm font-medium mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                도배 완공드네 서울 가양어린 완공 포스팅
              </h3>
              <p className="text-slate-400 text-xs mb-1">
                일상공방TV
              </p>
              <p className="text-slate-500 text-xs">
                6월 17일 19:04
              </p>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm mb-4">
              마우스를 올리면 자동 스크롤이 멈춥니다
            </p>
            <button 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
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
