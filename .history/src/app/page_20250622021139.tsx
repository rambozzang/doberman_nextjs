'use client';


import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Minus, User, Zap, Layers, Play, ArrowRight, HelpCircle, CheckSquare, MapPin } from 'lucide-react';
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

const videoData = [
  {
    id: 1,
    title: '이젠 하나하나 도배까지 할나',
    channel: '카카카',
    duration: '6월 2일 18:30',
    thumbnail: '🏠',
    category: '도배 시공 영상'
  },
  {
    id: 2,
    title: 'LH 전세 지원 도배 창문 서울시',
    channel: '다인인테리어',
    duration: '6월 5일 10:32',
    thumbnail: '🏡',
    category: 'LH 전세 지원'
  },
  {
    id: 3,
    title: '셀프 인테리어가 어려운 이유 #',
    channel: '집다한 연구소',
    duration: '6월 5일 10:00',
    thumbnail: '🎨',
    category: '셀프 인테리어'
  },
  {
    id: 4,
    title: '유튜브 도배 쇼리 쇼리쇼 #',
    channel: '대경인테리어',
    duration: '6월 5일 22:15',
    thumbnail: '📹',
    category: '유튜브 도배'
  },
  {
    id: 5,
    title: '"이것만 봐도 도배 절리 확 올',
    channel: '부산도배왕TV',
    duration: '6월 2일 10:32',
    thumbnail: '⚡',
    category: '도배 절리'
  }
];

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
    <div className="min-h-full bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        
        {/* 히어로 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-12"
        >
          {/* 배경 이미지 영역 */}
          <div className="relative h-64 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/80 to-slate-900/80"></div>
            <div className="relative z-10 h-full flex flex-col justify-center px-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                무료 도배 비교견적 서비스
              </h1>
              <p className="text-xl text-gray-300">
                도배르만과 함께 더 나은 공간을 만들어보세요.
              </p>
            </div>
          </div>

          {/* 메인 CTA */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              전국 200명 이상의 도배 전문가들과 함께하는
            </h2>
            <p className="text-blue-400 text-lg mb-8">
              간단한 정보만 입력하시면 24시간 내 견적을 받아보실 수 있습니다
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => router.push('/quote-request')}
            >
              <Plus className="w-5 h-5 mr-2" />
              무료 견적 받기
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </div>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">200+</div>
              <div className="text-gray-400">검증된 전문가</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">24시간</div>
              <div className="text-gray-400">빠른 견적</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">100%</div>
              <div className="text-gray-400">무료 서비스</div>
            </div>
          </div>
        </motion.div>

        {/* 도배 인테리어 영상 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center mb-6">
            <Play className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">도배 인테리어 영상</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {videoData.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ y: -4 }}
                className="video-card"
              >
                <div className="video-thumbnail">
                  <div className="text-4xl">{video.thumbnail}</div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {video.category}
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <div>{video.channel}</div>
                    <div>{video.duration}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 도베르만 이용 방법 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">도베르만 이용 방법</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3 className="step-title">견적 요청</h3>
              <p className="step-description">간단한 정보 입력</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3 className="step-title">견적 확인</h3>
              <p className="step-description">전문가 견적 비교</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3 className="step-title">전문가 선택</h3>
              <p className="step-description">최적의 전문가 선택</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3 className="step-title">시공 완료</h3>
              <p className="step-description">만족스러운 도배 완료</p>
            </div>
          </div>
        </motion.div>

        {/* 도배 가이드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">도배 가이드</h2>
            <p className="text-gray-400">성공적인 도배를 위한 완벽한 가이드</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="guide-card">
              <div className="guide-icon">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">FAQ</h3>
              <p className="text-gray-400 text-sm mb-2">자주 묻는 질문과</p>
              <p className="text-gray-400 text-sm">전문가 답변</p>
            </div>
            
            <div className="guide-card">
              <div className="guide-icon">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">준비 체크리스트</h3>
              <p className="text-gray-400 text-sm mb-2">도배 전 필수</p>
              <p className="text-gray-400 text-sm">준비사항 안내</p>
            </div>
            
            <div className="guide-card">
              <div className="guide-icon">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">지역별 정보</h3>
              <p className="text-gray-400 text-sm mb-2">전국 지역별</p>
              <p className="text-gray-400 text-sm">도배 정보</p>
            </div>
          </div>
        </motion.div>

        {/* 기존 Zustand, TanStack Query 데모 (간소화) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-400" />
              Zustand 상태 관리
            </h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-blue-400">{count}</span>
              <span className="text-gray-400">전역 상태로 관리되는 카운터</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={decrement}
                className="btn-secondary flex items-center"
              >
                <Minus className="w-4 h-4 mr-2" />
                감소
              </button>
              <button
                onClick={increment}
                className="btn-secondary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                증가
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-purple-400" />
              TanStack Query
            </h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">
                {user ? user.avatar : '❓'}
              </span>
              <span className="text-gray-400">
                {user ? `안녕하세요, ${user.name}님!` : '사용자 데이터를 불러와보세요'}
              </span>
            </div>
            <button
              onClick={handleLoadUser}
              disabled={isLoading}
              className="btn-secondary flex items-center w-full justify-center"
            >
              <User className="w-4 h-4 mr-2" />
              {isLoading ? '로딩중...' : '사용자 로드'}
            </button>
          </motion.div>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>Framer Motion, Lucide React, Radix UI로 구성된 모던 UI</p>
        </div>
      </div>
    </div>
  );
}
