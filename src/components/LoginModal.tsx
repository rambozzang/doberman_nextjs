"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Phone, User, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useAuth } from '@/providers/AuthProvider';
import SocialAuthService from '@/services/socialAuthService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  // useAuth 훅 사용
  const { login, isLoading } = useAuth();

  // 팝업창으로부터 메시지 수신 처리
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 확인
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'SOCIAL_LOGIN_SUCCESS') {
        toast.success(event.data.message, {
          duration: 3000,
          position: 'top-center',
        });
        onLoginSuccess?.();
        onClose();
      } else if (event.data.type === 'SOCIAL_LOGIN_ERROR') {
        toast.error(event.data.message, {
          duration: 3000,
          position: 'top-center',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onLoginSuccess, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await login({
        customerPhone: formData.phone,
        customerName: formData.name,
        customerPassword: formData.password,
      });

      if (response.success) {
        // 로그인 성공 토스트 메시지 표시
        toast.success("로그인이 완료되었습니다!", {
          duration: 3000,
          position: 'top-center',
        });
        onLoginSuccess?.();
        onClose();
      } else {
        console.log(response.error || "로그인에 실패했습니다.");
        toast.error(response.error || "로그인에 실패했습니다.", {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      toast.error("로그인 중 오류가 발생했습니다.", {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPasswordModal(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await SocialAuthService.initiateGoogleLogin();
    } catch (error) {
      console.error('Google 로그인 시작 오류:', error);
      toast.error('Google 로그인을 시작할 수 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const handleKakaoLogin = async () => {
    try {
      await SocialAuthService.initiateKakaoLogin();
    } catch (error) {
      console.error('Kakao 로그인 시작 오류:', error);
      toast.error('Kakao 로그인을 시작할 수 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-sm sm:max-w-md mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 touch-target"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    로그인 - 신청 내역 확인
                  </h2>                  
                  <p className="text-red-400 text-xs sm:text-sm mt-1">
                    *견적 요청시 자동 회원가입이 됩니다.
                  </p>
                </motion.div>
              </div>

              {/* Social Login Section */}
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="flex items-center w-full mb-6">
                  <div className="flex-1 border-t border-slate-600"></div>
                  <p className="text-sm text-slate-400 px-3">소셜 로그인</p>
                  <div className="flex-1 border-t border-slate-600"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {/* Google Login Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center py-3 px-4 bg-white/10 hover:bg-white/20 border border-slate-500 rounded-lg text-white transition-all duration-200 font-medium gap-2 group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.09,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.941l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-1.85,4.216-3.197,5.849l0,0l6.373,5.103C37.007,36.067,44,29.24,44,20.083z"/>
                    </svg>
                    <span className="hidden sm:inline text-sm">Google</span>
                  </motion.button>
 
                  {/* Kakao Login Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleKakaoLogin}
                    className="flex items-center justify-center py-3 px-4 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-500/50 rounded-lg text-yellow-300 transition-all duration-200 font-medium gap-2 group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                      <path fill="currentColor" d="M24 4c-11.046 0-20 7.402-20 16.534 0 6.206 4.136 11.575 10.242 14.205-.322 2.154-1.784 7.561-1.823 7.801 0 0-.062.548.356.691.418.143 1.017-.252 1.635-.779 1.771-1.542 9.436-8.329 12.879-11.379 2.159.177 4.353.271 6.711.271 11.046 0 20-7.402 20-16.534C44 11.402 35.046 4 24 4z"/>
                    </svg>
                    <span className="hidden sm:inline text-sm">Kakao</span>
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Phone Number */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center w-full mb-6">
                  <div className="flex-1 border-t border-slate-600"></div>
                  <p className="text-sm text-slate-400 px-3">또는</p>
                  <div className="flex-1 border-t border-slate-600"></div>
                </div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-mobile"
                      placeholder="전화번호를 입력하세요"
                      maxLength={11}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                      {formData.phone.length}/11
                    </div>
                  </div>
                </motion.div>

                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    이름
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-mobile"
                      placeholder="이름을 입력하세요"
                      maxLength={10}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                      {formData.name.length}/10
                    </div>
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    패스워드
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 sm:pl-12 pr-16 py-3 sm:py-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 input-mobile"
                      placeholder="패스워드를 입력하세요"
                      maxLength={200}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors touch-target p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                      {formData.password.length}/200
                    </div>
                  </div>
                </motion.div>

                {/* Forgot Password & Register */}
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-blue-500 hover:text-purple-500 text-sm transition-colors font-medium block"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-green-500 hover:text-green-400 text-sm transition-colors font-medium"
                  >
                    아직 계정이 없으신가요? 회원가입하기
                  </button>
                </div>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex space-x-4 pt-4"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.phone || !formData.name || !formData.password}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg rounded-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>로그인 중...</span>
                      </div>
                    ) : (
                      "로그인"
                    )}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={handleCloseForgotPassword}
      />
    </>
  );
};

export default LoginModal; 