"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Phone, User, Mail, Lock } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import SocialAuthService from '@/services/socialAuthService';
import { toast } from "react-hot-toast";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  onRegisterSuccess,
  onSwitchToLogin 
}) => {
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // useAuth 훅 사용
  const { register, isLoading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.phone || !formData.name || !formData.email || !formData.password) {
      console.log("모든 필드를 입력해주세요.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      console.log("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (formData.password.length < 6) {
      console.log("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log("올바른 이메일 형식을 입력해주세요.");
      return false;
    }

    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(formData.phone)) {
      console.log("올바른 전화번호 형식을 입력해주세요. (예: 01012345678)");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await register({
        customerPhone: formData.phone,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPassword: formData.password,
      });

      if (response.success) {
        // 토스트는 Header에서 처리하므로 여기서는 제거
        onRegisterSuccess?.();
        onClose();
        // 폼 초기화
        setFormData({
          phone: "",
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        console.log(response.error || "회원가입에 실패했습니다.");
        alert(response.error);
        return;
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      console.log("회원가입 중 오류가 발생했습니다.");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await SocialAuthService.initiateGoogleLogin();
    } catch (error) {
      console.error('Google 회원가입 시작 오류:', error);
      toast.error('Google 회원가입을 시작할 수 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  const handleKakaoSignUp = async () => {
    try {
      await SocialAuthService.initiateKakaoLogin();
    } catch (error) {
      console.error('Kakao 회원가입 시작 오류:', error);
      toast.error('Kakao 회원가입을 시작할 수 없습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          className="relative w-full max-w-md mx-4 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  회원가입
                </h2>
                <p className="text-slate-400 text-sm">
                  새로운 계정을 만들어 서비스를 이용해보세요.
                </p>
              </motion.div>
            </div>

            {/* 소셜 회원가입 섹션 */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-400 mb-4">간편 가입</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Google 회원가입 버튼 */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="flex items-center justify-center py-3 px-4 bg-white/10 hover:bg-white/20 border border-slate-500 rounded-lg text-white transition-all duration-200 font-medium gap-2 group hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.09,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.941l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-1.85,4.216-3.197,5.849l0,0l6.373,5.103C37.007,36.067,44,29.24,44,20.083z"/>
                    </svg>
                    <span className="text-sm">Google</span>
                  </motion.button>

                  {/* Kakao 회원가입 버튼 */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    type="button"
                    onClick={handleKakaoSignUp}
                    className="flex items-center justify-center py-3 px-4 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-500/50 rounded-lg text-yellow-300 transition-all duration-200 font-medium gap-2 group hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                      <path fill="currentColor" d="M24 4c-11.046 0-20 7.402-20 16.534 0 6.206 4.136 11.575 10.242 14.205-.322 2.154-1.784 7.561-1.823 7.801 0 0-.062.548.356.691.418.143 1.017-.252 1.635-.779 1.771-1.542 9.436-8.329 12.879-11.379 2.159.177 4.353.271 6.711.271 11.046 0 20-7.402 20-16.534C44 11.402 35.046 4 24 4z"/>
                    </svg>
                    <span className="text-sm">Kakao</span>
                  </motion.button>
                </div>
              </div>
              
              {/* 구분선 */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 border-t border-slate-600"></div>
                <p className="text-xs text-slate-400 font-medium">또는</p>
                <div className="flex-1 border-t border-slate-600"></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Phone Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  전화번호 *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="01012345678"
                    maxLength={11}
                  />
                </div>
              </motion.div>

              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  이름 *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="홍길동"
                    maxLength={10}
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  이메일 *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="example@email.com"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  비밀번호 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-16 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="최소 6자 이상"
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-16 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="비밀번호를 다시 입력하세요"
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Switch to Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-500 hover:text-purple-500 text-sm transition-colors font-medium"
                >
                  이미 계정이 있으신가요? 로그인하기
                </button>
              </div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex space-x-4 pt-4"
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg rounded-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>가입 중...</span>
                    </div>
                  ) : (
                    "회원가입"
                  )}
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegisterModal; 