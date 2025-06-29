"use client";

import { useState } from "react";
import { 
  MessageSquareIcon, 
  PlusIcon, 
  SearchIcon,
  ThumbsUpIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ReplyIcon,
  SendIcon,
  BookmarkIcon,
  ShareIcon,
  PinIcon
} from "lucide-react";

// 게시글 타입 정의
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

// 샘플 데이터
const samplePosts: Post[] = [
  {
    id: 1,
    title: "아파트 도배 시공 후기 - 강남구 타워팰리스",
    content: "3개월 전에 도배 시공을 완료했는데, 정말 만족스러운 결과였습니다. 전문가분이 꼼꼼하게 작업해주셔서 모서리 처리까지 완벽했어요. 특히 습도가 높은 여름철이었는데도 벽지가 들뜨지 않고 잘 붙어있습니다.",
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
        content: "저도 같은 지역에서 도배 예정인데 어떤 업체에서 하셨나요?",
        author: "궁금한사람",
        createdAt: "2024-01-16",
        likes: 5,
        replies: [
          {
            id: 1,
            content: "도배르만에서 연결해주신 김OO 기사님이었어요. 정말 꼼꼼하게 해주셨습니다!",
            author: "김도배",
            createdAt: "2024-01-16",
            likes: 3
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "도배 비용 문의 - 30평 아파트 전체",
    content: "30평 아파트 전체 도배를 계획 중입니다. 요즘 시세가 어느 정도인지 궁금해요. 벽지는 중급 정도로 생각하고 있고, 기존 벽지 제거도 포함해서 견적을 받고 싶습니다.",
    author: "새집주인",
    category: "견적문의",
    createdAt: "2024-01-14",
    views: 189,
    likes: 15,
    dislikes: 0,
    isPinned: false,
    tags: ["30평", "아파트", "견적", "전체도배"],
    comments: [
      {
        id: 2,
        content: "지역이 어디신가요? 지역별로 가격 차이가 꽤 있어요.",
        author: "도배전문가",
        createdAt: "2024-01-14",
        likes: 8,
        replies: []
      }
    ]
  }
];

const categories = ["전체", "시공후기", "견적문의", "정보공유", "질문답변", "자유게시판"];

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "정보공유",
    tags: ""
  });
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // 게시글 필터링
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "전체" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 게시글 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortBy) {
      case "latest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "popular":
        return b.likes - a.likes;
      case "views":
        return b.views - a.views;
      default:
        return 0;
    }
  });

  // 새 게시글 작성
  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    const post: Post = {
      id: Date.now(),
      title: newPost.title,
      content: newPost.content,
      author: "현재사용자", // 실제로는 로그인한 사용자 정보
      category: newPost.category,
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      likes: 0,
      dislikes: 0,
      isPinned: false,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      comments: []
    };

    setPosts([post, ...posts]);
    setNewPost({ title: "", content: "", category: "정보공유", tags: "" });
    setIsWriting(false);
  };

  // 댓글 추가
  const handleAddComment = (postId: number) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      content: newComment,
      author: "현재사용자",
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      replies: []
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));
    setNewComment("");
  };

  // 게시글 조회수 증가
  const handleViewPost = (post: Post) => {
    setPosts(posts.map(p => 
      p.id === post.id 
        ? { ...p, views: p.views + 1 }
        : p
    ));
    setSelectedPost({ ...post, views: post.views + 1 });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <section className="w-full bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/50 relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/25">
              <MessageSquareIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                도배 커뮤니티
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              도배 전문가와 고객이 함께하는<br />
              정보 공유 및 소통 공간
            </p>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow w-full bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-12">
          {!selectedPost && !isWriting ? (
            <>
              {/* 검색 및 필터 바 */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  {/* 검색창 */}
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="제목, 내용, 작성자로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
                    />
                  </div>

                  {/* 정렬 옵션 */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition-all duration-300"
                  >
                    <option value="latest">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="views">조회순</option>
                  </select>

                  {/* 글쓰기 버튼 */}
                  <button
                    onClick={() => window.location.href = '/board/write'}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center hover:scale-105"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    글쓰기
                  </button>
                </div>

                {/* 카테고리 필터 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 게시글 목록 */}
              <div className="space-y-4">
                {sortedPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                      post.isPinned ? 'ring-2 ring-amber-500/30 bg-amber-500/5' : ''
                    }`}
                    onClick={() => handleViewPost(post)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 제목 및 고정 표시 */}
                        <div className="flex items-center mb-2">
                          {post.isPinned && (
                            <PinIcon className="w-4 h-4 text-amber-400 mr-2" />
                          )}
                          <h3 className="text-lg font-semibold text-white hover:text-indigo-300 transition-colors">
                            {post.title}
                          </h3>
                        </div>

                        {/* 내용 미리보기 */}
                        <p className="text-slate-300 mb-3 line-clamp-2">
                          {post.content.substring(0, 100)}...
                        </p>

                        {/* 태그 */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 메타 정보 */}
                        <div className="flex items-center text-sm text-slate-400 space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-1" />
                            {post.author}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {post.createdAt}
                          </div>
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            {post.views}
                          </div>
                          <div className="flex items-center">
                            <MessageSquareIcon className="w-4 h-4 mr-1" />
                            {post.comments.length}
                          </div>
                        </div>
                      </div>

                      {/* 카테고리 및 좋아요 */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          {post.category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-green-400">
                            <ThumbsUpIcon className="w-4 h-4 mr-1" />
                            {post.likes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : isWriting ? (
            /* 글쓰기 폼 */
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">새 게시글 작성</h2>
                <button
                  onClick={() => setIsWriting(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 카테고리 선택 */}
                <div>
                  <label className="block text-white font-semibold mb-2">카테고리</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-white font-semibold mb-2">제목</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="게시글 제목을 입력하세요"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-white font-semibold mb-2">내용</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="게시글 내용을 입력하세요"
                    rows={10}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 resize-none"
                  />
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-white font-semibold mb-2">태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="예: 아파트, 도배, 시공후기"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleCreatePost}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    게시글 등록
                  </button>
                  <button
                    onClick={() => setIsWriting(false)}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 게시글 상세 보기 */
            selectedPost && (
              <div className="space-y-6">
                {/* 뒤로가기 */}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex items-center text-slate-300 hover:text-white transition-colors mb-6"
                >
                  ← 목록으로 돌아가기
                </button>

                {/* 게시글 내용 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  {/* 헤더 */}
                  <div className="border-b border-white/10 pb-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                        {selectedPost.category}
                      </span>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <div className="flex items-center">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {selectedPost.views}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {selectedPost.createdAt}
                        </div>
                      </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {selectedPost.title}
                    </h1>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-300">
                        <UserIcon className="w-5 h-5 mr-2" />
                        {selectedPost.author}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center text-green-400 hover:text-green-300 transition-colors">
                          <ThumbsUpIcon className="w-5 h-5 mr-1" />
                          {selectedPost.likes}
                        </button>
                        <button className="flex items-center text-slate-400 hover:text-slate-300 transition-colors">
                          <BookmarkIcon className="w-5 h-5" />
                        </button>
                        <button className="flex items-center text-slate-400 hover:text-slate-300 transition-colors">
                          <ShareIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* 태그 */}
                    {selectedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedPost.tags.map((tag, index) => (
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

                  {/* 본문 */}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <MessageSquareIcon className="w-5 h-5 mr-2" />
                    댓글 ({selectedPost.comments.length})
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
                      <button
                        onClick={() => handleAddComment(selectedPost.id)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center hover:scale-105"
                      >
                        <SendIcon className="w-4 h-4 mr-2" />
                        등록
                      </button>
                    </div>
                  </div>

                  {/* 댓글 목록 */}
                  <div className="space-y-4">
                    {selectedPost.comments.map((comment) => (
                      <div key={comment.id} className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-slate-300">
                            <UserIcon className="w-4 h-4 mr-2" />
                            {comment.author}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-slate-400">
                            <span>{comment.createdAt}</span>
                            <button className="flex items-center hover:text-green-400 transition-colors">
                              <ThumbsUpIcon className="w-4 h-4 mr-1" />
                              {comment.likes}
                            </button>
                            <button className="flex items-center hover:text-indigo-400 transition-colors">
                              <ReplyIcon className="w-4 h-4 mr-1" />
                              답글
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-200">{comment.content}</p>

                        {/* 대댓글 */}
                        {comment.replies.length > 0 && (
                          <div className="ml-6 mt-4 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-white/5 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center text-slate-300">
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    {reply.author}
                                  </div>
                                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                                    <span>{reply.createdAt}</span>
                                    <button className="flex items-center hover:text-green-400 transition-colors">
                                      <ThumbsUpIcon className="w-4 h-4 mr-1" />
                                      {reply.likes}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-slate-200 text-sm">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
} 