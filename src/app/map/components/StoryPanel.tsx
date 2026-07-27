"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Eye, Heart, Loader2, MessageSquare, PenLine, Send, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { VendorService } from "@/services/vendorService";
import { VendorStory, VendorStoryComment } from "@/types/vendor";

interface StoryPanelProps {
  /** null 이면 전체 광장, 값이 있으면 해당 업체의 이야기 */
  vendorId: number | null;
  vendorName?: string | null;
}

export default function StoryPanel({ vendorId, vendorName }: StoryPanelProps) {
  const [stories, setStories] = useState<VendorStory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await VendorService.getStories({ vendorId, page: 0, size: 30 });
    if (res.success && res.data) {
      setStories(res.data.stories ?? []);
      setTotal(res.data.total ?? 0);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    setOpenId(null);
    setWriting(false);
    load();
  }, [load]);

  if (openId != null) {
    return <StoryDetail storyId={openId} onBack={() => setOpenId(null)} onChanged={load} />;
  }

  if (writing) {
    return (
      <StoryWriter
        vendorId={vendorId}
        vendorName={vendorName}
        onCancel={() => setWriting(false)}
        onDone={() => {
          setWriting(false);
          load();
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white">
            {vendorId ? `${vendorName ?? "업체"} 이야기` : "도배 이야기"}
          </h3>
          <p className="text-[11px] text-slate-400">{total.toLocaleString()}개의 글</p>
        </div>
        <button
          onClick={() => setWriting(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <PenLine className="h-3.5 w-3.5" /> 글쓰기
        </button>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && stories.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          아직 글이 없습니다. 첫 이야기를 남겨보세요.
        </p>
      )}

      <ul className="flex-1 divide-y divide-slate-800 overflow-y-auto">
        {stories.map((s) => (
          <li key={s.storyId}>
            <button
              onClick={() => setOpenId(s.storyId)}
              className="w-full px-4 py-3 text-left transition hover:bg-slate-800"
            >
              <p className="truncate text-sm font-medium text-white">{s.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{s.contents}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                <span>{s.writerName}</span>
                {s.crtDtm && <span>{s.crtDtm.slice(0, 10)}</span>}
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {s.commentCnt}
                </span>
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />
                  {s.likeCnt}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {s.viewCnt}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryWriter({
  vendorId,
  vendorName,
  onCancel,
  onDone,
}: {
  vendorId: number | null;
  vendorName?: string | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [writerName, setWriterName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !contents.trim()) {
      toast.error("제목과 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    const res = await VendorService.createStory({
      vendorId,
      title: title.trim(),
      contents: contents.trim(),
      writerName: writerName.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success("글을 등록했습니다.");
      onDone();
    } else {
      toast.error(res.message || res.error || "등록에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 border-b border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> 취소
      </button>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {vendorId && (
          <p className="rounded bg-slate-800 px-3 py-2 text-[11px] text-slate-400">
            {vendorName ?? "업체"} 게시판에 글을 씁니다
          </p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          maxLength={200}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
        />
        <textarea
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          placeholder="내용을 입력하세요"
          rows={10}
          className="w-full resize-none rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
        />
        <input
          value={writerName}
          onChange={(e) => setWriterName(e.target.value)}
          placeholder="표시 이름 (비우면 익명)"
          maxLength={60}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
        />
      </div>
      <div className="border-t border-slate-700 p-3">
        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          등록
        </button>
      </div>
    </div>
  );
}

function StoryDetail({
  storyId,
  onBack,
  onChanged,
}: {
  storyId: number;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [story, setStory] = useState<VendorStory | null>(null);
  const [comments, setComments] = useState<VendorStoryComment[]>([]);
  const [comment, setComment] = useState("");
  const [writerName, setWriterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const load = useCallback(async () => {
    const res = await VendorService.getStoryDetail(storyId);
    if (res.success && res.data) {
      setStory(res.data.story);
      setComments(res.data.comments ?? []);
    }
    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    const res = await VendorService.addComment(storyId, {
      contents: comment.trim(),
      writerName: writerName.trim() || undefined,
    });
    if (res.success) {
      setComment("");
      load();
      onChanged();
    } else {
      toast.error(res.message || res.error || "댓글 등록에 실패했습니다.");
    }
  };

  const like = async () => {
    if (liked) return;
    const res = await VendorService.likeStory(storyId);
    if (res.success) {
      setLiked(true);
      setStory((s) => (s ? { ...s, likeCnt: s.likeCnt + 1 } : s));
    }
  };

  const removeStory = async () => {
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    const res = await VendorService.deleteStory(storyId);
    if (res.success && res.data) {
      toast.success("삭제했습니다.");
      onChanged();
      onBack();
    } else {
      toast.error(res.message || res.error || "삭제에 실패했습니다.");
    }
  };

  const removeComment = async (commentId: number) => {
    const res = await VendorService.deleteComment(commentId);
    if (res.success && res.data) {
      load();
      onChanged();
    } else {
      toast.error(res.message || res.error || "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> 목록
        </button>
        {story?.mine && (
          <button onClick={removeStory} className="text-slate-400 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && story && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-base font-bold text-white">{story.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
            <span>{story.writerName}</span>
            {story.crtDtm && <span>{story.crtDtm.slice(0, 16).replace("T", " ")}</span>}
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {story.viewCnt}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{story.contents}</p>

          <button
            onClick={like}
            disabled={liked}
            className={`mt-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              liked ? "bg-rose-600/30 text-rose-300" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
            {story.likeCnt}
          </button>

          <div className="mt-5 border-t border-slate-800 pt-3">
            <h4 className="mb-2 text-xs font-semibold text-slate-400">댓글 {comments.length}</h4>
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.commentId} className="rounded-lg bg-slate-800 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-slate-200">
                      {c.contents}
                    </p>
                    {c.mine && (
                      <button
                        onClick={() => removeComment(c.commentId)}
                        className="shrink-0 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{c.writerName}</span>
                    {c.crtDtm && <span>{c.crtDtm.slice(0, 16).replace("T", " ")}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-1.5 border-t border-slate-700 p-3">
        <input
          value={writerName}
          onChange={(e) => setWriterName(e.target.value)}
          placeholder="표시 이름 (비우면 익명)"
          maxLength={60}
          className="w-full rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
        />
        <div className="flex gap-1.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="댓글을 입력하세요"
            maxLength={1000}
            className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-blue-500 focus:ring-2"
          />
          <button
            onClick={submitComment}
            className="shrink-0 rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
