"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Settings, 
  Camera,
  Shield,
  Bell,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  profileImage?: string;
  quoteRequestCount: number;
  completedQuotes: number;
}

const ProfilePage = () => {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    joinDate: '',
    quoteRequestCount: 0,
    completedQuotes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('프로필 페이지 - 인증 상태:', { isLoggedIn, authLoading, user });
    
    // 인증 상태 로딩이 완료된 후에만 리다이렉트 체크
    if (!authLoading) {
      if (!isLoggedIn) {
        console.log('로그인되지 않음 - 홈페이지로 리다이렉트');
        // 임시로 리다이렉트 비활성화 (디버깅용)
        // router.push('/');
        // return;
      }
      
      loadUserProfile();
    }
  }, [isLoggedIn, authLoading, router]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const mockProfile: UserProfile = {
        id: user?.customerId?.toString() || '1',
        name: user?.customerName || '홍길동',
        email: user?.customerEmail || 'user@example.com',
        phone: user?.customerPhone || '010-1234-5678',
        address: '서울특별시 강남구 역삼동',
        joinDate: '2024-01-15',
        profileImage: '',
        quoteRequestCount: 5,
        completedQuotes: 3
      };

      setProfileData(mockProfile);
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      toast.error('프로필 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('프로필 저장:', profileData);
      setIsEditing(false);
      toast.success('프로필이 저장되었습니다.');
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      toast.error('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300">
            {authLoading ? '인증 확인 중...' : '프로필을 불러오는 중...'}
          </p>
        </div>
      </div>
    );
  }

  // 인증이 완료되었지만 로그인되지 않은 경우 (리다이렉트 중)
  if (!authLoading && !isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">내 프로필</h1>
            <p className="text-slate-400">개인정보 및 계정 관리</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-2 border border-slate-700/50">
            {[
              { id: 'profile', label: '프로필 정보', icon: <User className="w-4 h-4" /> },
              { id: 'settings', label: '설정', icon: <Settings className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 sticky top-24"
              >
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                      {profileData.profileImage ? (
                        <img 
                          src={profileData.profileImage} 
                          alt="프로필" 
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        profileData.name.charAt(0)
                      )}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors duration-200">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{profileData.name}</h2>
                  <p className="text-slate-400 text-sm">{profileData.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700/30 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{profileData.quoteRequestCount}</div>
                    <div className="text-xs text-slate-400">견적 요청</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{profileData.completedQuotes}</div>
                    <div className="text-xs text-slate-400">완료된 견적</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>가입일: {new Date(profileData.joinDate).toLocaleDateString('ko-KR')}</span>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">개인정보</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                        편집
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-200"
                        >
                          <Save className="w-4 h-4" />
                          저장
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                          취소
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 mb-2">
                        <User className="w-4 h-4" />
                        이름
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-700/30 rounded-xl text-white">{profileData.name}</div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-slate-300 mb-2">
                        <Mail className="w-4 h-4" />
                        이메일
                      </label>
                      <div className="px-4 py-3 bg-slate-700/30 rounded-xl text-slate-400">
                        {profileData.email}
                        <span className="text-xs ml-2">(변경 불가)</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-slate-300 mb-2">
                        <Phone className="w-4 h-4" />
                        전화번호
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-700/30 rounded-xl text-white">{profileData.phone}</div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-slate-300 mb-2">
                        <MapPin className="w-4 h-4" />
                        주소
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-700/30 rounded-xl text-white">{profileData.address}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50"
                >
                  <h3 className="text-xl font-bold text-white mb-6">설정</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-700/30 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <h4 className="text-white font-medium">알림 설정</h4>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-slate-300">견적 응답 알림</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-300">이메일 알림</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-300">SMS 알림</span>
                          <input type="checkbox" className="w-5 h-5 text-blue-600" />
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-green-400" />
                        <h4 className="text-white font-medium">보안 설정</h4>
                      </div>
                      <div className="space-y-3">
                        <button className="flex items-center justify-between w-full text-left hover:bg-slate-600/30 p-2 rounded-lg transition-colors duration-200">
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">비밀번호 변경</span>
                          </div>
                          <span className="text-blue-400">→</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-2xl p-4">
                      <h4 className="text-white font-medium mb-4">계정 관리</h4>
                      <div className="space-y-3">
                        <button className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200">
                          계정 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 