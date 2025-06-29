"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  PenToolIcon, 
  SaveIcon, 
  EyeIcon,
  ArrowLeftIcon,
  ImageIcon,
  LinkIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  AlignLeftIcon,
  TagIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from "lucide-react";

const categories = ["시공후기", "견적문의", "정보공유", "질문답변", "자유게시판"];

export default function WritePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "정보공유",
    tags: ""
  });
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 폼 검증
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    } else if (formData.title.length < 5) {
      newErrors.title = "제목은 5자 이상 입력해주세요.";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "내용을 입력해주세요.";
    } else if (formData.content.length < 10) {
      newErrors.content = "내용은 10자 이상 입력해주세요.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 게시글 저장
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 실제로는 API 호출
      // await createPost(formData);
      
      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 성공 시 게시판으로 이동
      router.push('/board');
    } catch (error) {
      console.error('게시글 저장 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 임시 저장
  const handleSaveDraft = () => {
    localStorage.setItem('board_draft', JSON.stringify(formData));
    alert('임시 저장되었습니다.');
  };

  // 임시 저장된 글 불러오기
  const loadDraft = () => {
    const draft = localStorage.getItem('board_draft');
    if (draft) {
      setFormData(JSON.parse(draft));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        <div className="container mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.back()}
                className="flex items-center text-slate-300 hover:text-white transition-colors mr-6"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                뒤로가기
              </motion.button>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <PenToolIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">새 게시글 작성</h1>
                  <p className="text-slate-300">도배 관련 정보를 공유해보세요</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadDraft}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                임시글 불러오기
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors text-sm flex items-center"
              >
                <SaveIcon className="w-4 h-4 mr-1" />
                임시저장
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* 탭 헤더 */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPreview(false)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      !isPreview 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    작성
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPreview(true)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isPreview 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    미리보기
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      등록 중...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      게시글 등록
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* 폼 내용 */}
            <div className="p-6">
              {!isPreview ? (
                /* 작성 모드 */
                <div className="space-y-6">
                  {/* 카테고리 선택 */}
                  <div>
                    <label className="block text-white font-semibold mb-3">카테고리</label>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => (
                        <motion.button
                          key={category}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, category })}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            formData.category === category
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {category}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* 제목 입력 */}
                  <div>
                    <label className="block text-white font-semibold mb-3">제목</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="게시글 제목을 입력하세요"
                      className={`w-full px-4 py-4 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.title 
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' 
                          : 'border-white/20 focus:border-indigo-400 focus:ring-indigo-400/20'
                      }`}
                    />
                    {errors.title && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-400 text-sm"
                      >
                        <AlertCircleIcon className="w-4 h-4 mr-1" />
                        {errors.title}
                      </motion.div>
                    )}
                  </div>

                  {/* 에디터 툴바 */}
                  <div>
                    <label className="block text-white font-semibold mb-3">내용</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      {/* 툴바 */}
                      <div className="flex items-center space-x-2 p-3 border-b border-white/10">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <BoldIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <ItalicIcon className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <ListIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <AlignLeftIcon className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 텍스트 에리어 */}
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="게시글 내용을 입력하세요. 도배 관련 팁, 후기, 질문 등을 자유롭게 공유해주세요."
                        rows={15}
                        className={`w-full px-4 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none resize-none ${
                          errors.content ? 'border-red-400' : ''
                        }`}
                      />
                    </div>
                    {errors.content && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-2 text-red-400 text-sm"
                      >
                        <AlertCircleIcon className="w-4 h-4 mr-1" />
                        {errors.content}
                      </motion.div>
                    )}
                  </div>

                  {/* 태그 입력 */}
                  <div>
                    <label className="block text-white font-semibold mb-3 flex items-center">
                      <TagIcon className="w-4 h-4 mr-2" />
                      태그 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="예: 아파트, 도배, 시공후기, 강남구"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      태그를 입력하면 다른 사용자들이 게시글을 더 쉽게 찾을 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : (
                /* 미리보기 모드 */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* 미리보기 헤더 */}
                  <div className="border-b border-white/10 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                        {formData.category}
                      </span>
                      <div className="text-slate-400 text-sm">
                        미리보기 모드
                      </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {formData.title || "제목을 입력하세요"}
                    </h1>

                    <div className="flex items-center space-x-4 text-slate-300 text-sm">
                      <div>작성자: 현재사용자</div>
                      <div>작성일: {new Date().toLocaleDateString()}</div>
                    </div>

                    {/* 태그 미리보기 */}
                    {formData.tags && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-full"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 미리보기 본문 */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {formData.content || "내용을 입력하세요"}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 