"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Phone, User } from "lucide-react";
import { AuthService } from "@/services/authService";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      console.log("이름을 입력해주세요.");
      alert("이름을 입력해주세요.");
      return;
    }
    
    if (!formData.customerPhone.trim()) {
      console.log("핸드폰 번호를 입력해주세요.");
      alert("핸드폰 번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await AuthService.forgotPassword({
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
      });
      if (response.success) {
        alert("등록된 이메일로 임시 비밀번호를 발송했습니다.\n" + response.data?.customerEmail);
        console.log(response.message || "등록된 이메일로 임시 비밀번호를 발송했습니다.");
        onClose();
        // 폼 초기화
        setFormData({ customerName: "", customerPhone: "" });
      } else {
        console.log(response.error || "비밀번호 찾기에 실패했습니다.");
        alert(response.error);
      }
    } catch (error) {
      console.error("비밀번호 찾기 오류:", error);
      console.log("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ customerName: "", customerPhone: "" });
    onClose();
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
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md mx-4 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
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
                  비밀번호 찾기1
                </h2>
                <p className="text-slate-400 text-sm">
                  이름과 전화번호를 입력하시면 등록된 이메일로 <br />안내를 받으실 수 
                  있습니다.
                </p>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  이름
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="이름을 입력하세요"
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                    {formData.customerName.length}/20
                  </div>
                </div>
              </motion.div>

              {/* Phone Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  핸드폰 번호
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="핸드폰 번호를 입력하세요"
                    maxLength={11}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                    {formData.customerPhone.length}/11
                  </div>
                </div>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex space-x-4 pt-4"
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200"
                >
                  돌아가기
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.customerName.trim() || !formData.customerPhone.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg rounded-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>처리 중...</span>
                    </div>
                  ) : (
                    "비밀번호 찾기"
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

export default ForgotPasswordModal; 