"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Metadata } from "next";
import { 
  MessageSquareIcon, 
  ThumbsUpIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  BookmarkIcon,
  ShareIcon,
  ReplyIcon,
  SendIcon,
  ArrowLeftIcon,
  MoreHorizontalIcon
} from "lucide-react";

// 타입 정의 (메인 페이지와 동일)
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  createdAt: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: Comment[];
  isPinned: boolean;
  tags: string[];
}

interface Comment {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  replies: Reply[];
}

interface Reply {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
}

// 샘플 데이터 (실제로는 API에서 가져올 데이터)
const samplePost: Post = {
  id: 1,
  title: "아파트 도배 시공 후기 - 강남구 타워팰리스",
  content: `3개월 전에 도배 시공을 완료했는데, 정말 만족스러운 결과였습니다. 

전문가분이 꼼꼼하게 작업해주셔서 모서리 처리까지 완벽했어요. 특히 습도가 높은 여름철이었는데도 벽지가 들뜨지 않고 잘 붙어있습니다.

시공 과정에서 인상 깊었던 점들:
1. 사전 상담 시 벽지 샘플을 직접 가져와서 보여주심
2. 가구 이동 서비스까지 포함되어 있어서 편리했음
3. 시공 후 청소까지 깔끔하게 해주심
4. A/S 보장 기간도 1년으로 넉넉함

가격도 다른 업체 대비 합리적이었고, 무엇보다 결과물이 정말 만족스럽습니다. 
도배를 고민하시는 분들께 추천드려요!`,
  author: "김도배",
  category: "시공후기",
  createdAt: "2024-01-15",
  views: 245,
  likes: 28,
  dislikes: 2,
  isPinned: true,
  tags: ["아파트", "강남구", "시공후기", "만족"],
  comments: [
    {
      id: 1,
      content: "저도 같은 지역에서 도배 예정인데 어떤 업체에서 하셨나요? 견적은 어느 정도 나왔는지도 궁금해요.",
      author: "궁금한사람",
      createdAt: "2024-01-16",
      likes: 5,
      replies: [
        {
          id: 1,
          content: "도배르만에서 연결해주신 김OO 기사님이었어요. 정말 꼼꼼하게 해주셨습니다! 견적은 개인적으로 메시지 보내드릴게요.",
          author: "김도배",
          createdAt: "2024-01-16",
          likes: 3
        },
        {
          id: 2,
          content: "저도 정보 공유 부탁드려요! 같은 지역이라 관심이 많습니다.",
          author: "도배준비중",
          createdAt: "2024-01-17",
          likes: 1
        }
      ]
    },
    {
      id: 2,
      content: "사진도 올려주시면 좋을 것 같아요! 어떤 패턴으로 하셨는지 궁금합니다.",
      author: "인테리어러버",
      createdAt: "2024-01-17",
      likes: 8,
      replies: []
    },
    {
      id: 3,
      content: "A/S 보장 1년이면 정말 좋네요. 다른 업체들은 보통 6개월인 경우가 많던데...",
      author: "도배고민중",
      createdAt: "2024-01-18",
      likes: 4,
      replies: [
        {
          id: 3,
          content: "맞아요! 그래서 더 믿음이 갔어요. 만약 문제가 생겨도 안심이죠.",
          author: "김도배",
          createdAt: "2024-01-18",
          likes: 2
        }
      ]
    }
  ]
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [newReply, setNewReply] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // 실제로는 API에서 게시글 데이터를 가져옴
    // const postId = params.id;
    // fetchPost(postId).then(setPost);
    
    // 임시로 샘플 데이터 사용
    setPost(samplePost);
  }, [params.id]);

  const handleAddComment = () => {
    if (!newComment.trim() || !post) return;

    const comment: Comment = {
      id: Date.now(),
      content: newComment,
      author: "현재사용자",
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      replies: []
    };

    setPost({
      ...post,
      comments: [...post.comments, comment]
    });
    setNewComment("");
  };

  const handleAddReply = (commentId: number) => {
    if (!newReply.trim() || !post) return;

    const reply: Reply = {
      id: Date.now(),
      content: newReply,
      author: "현재사용자",
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0
    };

    setPost({
      ...post,
      comments: post.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    });
    setNewReply("");
    setReplyingTo(null);
  };

  const handleLike = () => {
    if (!post) return;
    
    setPost({
      ...post,
      likes: isLiked ? post.likes - 1 : post.likes + 1
    });
    setIsLiked(!isLiked);
  };

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        <div className="container mx-auto px-4 py-8 relative">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center text-slate-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            뒤로가기
          </motion.button>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 게시글 내용 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            {/* 게시글 헤더 */}
            <div className="border-b border-white/10 pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                  {post.category}
                </span>
                <div className="flex items-center space-x-4">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <MoreHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {post.title}
              </h1>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {post.createdAt}
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="w-5 h-5 mr-2" />
                    {post.views}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 text-slate-400 hover:text-green-400'
                    }`}
                  >
                    <ThumbsUpIcon className="w-5 h-5 mr-1" />
                    {post.likes}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-2 rounded-lg transition-colors ${
                      isBookmarked 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-white/10 text-slate-400 hover:text-yellow-400'
                    }`}
                  >
                    <BookmarkIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 게시글 본문 */}
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          </motion.div>

          {/* 댓글 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <MessageSquareIcon className="w-5 h-5 mr-2" />
              댓글 ({post.comments.length})
            </h3>

            {/* 댓글 작성 */}
            <div className="mb-8">
              <div className="flex space-x-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  rows={3}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddComment}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center"
                >
                  <SendIcon className="w-4 h-4 mr-2" />
                  등록
                </motion.button>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {post.comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 rounded-xl p-6"
                >
                  {/* 댓글 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-slate-300">
                      <UserIcon className="w-4 h-4 mr-2" />
                      <span className="font-semibold">{comment.author}</span>
                      <span className="text-slate-400 text-sm ml-3">{comment.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center text-slate-400 hover:text-green-400 transition-colors">
                        <ThumbsUpIcon className="w-4 h-4 mr-1" />
                        {comment.likes}
                      </button>
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        <ReplyIcon className="w-4 h-4 mr-1" />
                        답글
                      </button>
                    </div>
                  </div>

                  {/* 댓글 내용 */}
                  <p className="text-slate-200 mb-4">{comment.content}</p>

                  {/* 답글 작성 폼 */}
                  {replyingTo === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <div className="flex space-x-3">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="답글을 입력하세요..."
                          rows={2}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 text-sm resize-none"
                        />
                        <div className="flex flex-col space-y-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddReply(comment.id)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            등록
                          </motion.button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-sm rounded-lg transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 대댓글 목록 */}
                  {comment.replies.length > 0 && (
                    <div className="ml-6 space-y-4 border-l-2 border-white/10 pl-6">
                      {comment.replies.map((reply, replyIndex) => (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + replyIndex * 0.1 }}
                          className="bg-white/5 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-slate-300">
                              <UserIcon className="w-4 h-4 mr-2" />
                              <span className="font-semibold text-sm">{reply.author}</span>
                              <span className="text-slate-400 text-xs ml-3">{reply.createdAt}</span>
                            </div>
                            <button className="flex items-center text-slate-400 hover:text-green-400 transition-colors">
                              <ThumbsUpIcon className="w-3 h-3 mr-1" />
                              <span className="text-xs">{reply.likes}</span>
                            </button>
                          </div>
                          <p className="text-slate-200 text-sm">{reply.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 