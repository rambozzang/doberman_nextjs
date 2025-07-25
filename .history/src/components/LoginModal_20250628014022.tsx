"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Phone, User, Lock } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "react-hot-toast";
import ForgotPasswordModal from "./ForgotPasswordModal";

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
        // 토스트는 Header에서 처리하므로 여기서는 제거
        onLoginSuccess?.();
        onClose();
      } else {
        toast.error(response.error || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      toast.error("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPasswordModal(false);
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
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    신청 시 입력한 정보로 로그인 가능합니다.
                  </p>
                  <p className="text-red-400 text-xs sm:text-sm mt-1">
                    *정확 요청시 자동 회원가입이 됩니다.
                  </p>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Phone Number */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
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