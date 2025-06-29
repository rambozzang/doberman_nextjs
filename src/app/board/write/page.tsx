"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  PenToolIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  TagIcon
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

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push("/board");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        <div className="container mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center"
          >
            <motion.button
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
          </motion.div>
        </div>
      </section>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-3">카테고리</label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      onClick={() => setFormData({ ...formData, category })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        formData.category === category
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                          : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="게시글 제목을 입력하세요"
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="게시글 내용을 입력하세요..."
                  rows={15}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300 resize-none"
                />
              </div>

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
              </div>

              <motion.button
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                게시글 등록
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
