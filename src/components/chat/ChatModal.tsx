"use client";

import React, { useRef, useMemo, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { ChatMessage, ChatApiMessage } from './types';
import { CustomerRequestAnswer } from '@/types/api';
import { useChatAuth } from '@/hooks/useChatAuth';
import { resolveChatFileUrl, isImageFile, getFileName } from '@/lib/chatFile';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatPartner: CustomerRequestAnswer | undefined;
  messages: ChatApiMessage[];
  newMessage: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  isConnected: boolean;
  connectionError: string | null;
  isTyping: boolean;
  uploadingFile: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  // 읽음 처리 관련 함수들
  observeMessage?: (element: HTMLElement) => void;
  unobserveMessage?: (element: HTMLElement) => void;
  // 이전 메시지 페이징
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

/** 같은 사람이 이 시간 이내에 연속으로 보내면 하나의 말풍선 묶음으로 취급 */
const GROUPING_WINDOW_MS = 60 * 1000;
/** 하단에서 이 거리 이내면 "맨 아래를 보고 있다"고 판단 */
const NEAR_BOTTOM_THRESHOLD = 80;
/** 상단에서 이 거리 이내로 올라오면 이전 메시지를 더 불러온다 */
const LOAD_MORE_THRESHOLD = 120;

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  chatPartner,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  onFileUpload,
  isLoading,
  isConnected,
  connectionError,
  isTyping,
  uploadingFile,
  messagesEndRef,
  observeMessage,
  unobserveMessage,
  hasMoreMessages = false,
  isLoadingMore = false,
  onLoadMore
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { chatAuth } = useChatAuth();

  // 스크롤 상태 - 사용자가 이전 대화를 읽는 중에 화면이 끌려가지 않도록 관리
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);
  const didInitialScrollRef = useRef(false);

  const partnerName = chatPartner?.user?.userName || chatPartner?.userName || '도배전문가';

  // API 메시지를 UI용 메시지로 변환 (내용도 첨부파일도 없는 것만 제외)
  const convertedMessages = useMemo(() => {
    return messages
      .filter(apiMessage => (apiMessage.message && apiMessage.message.trim() !== '') || apiMessage.filePath)
      .map((apiMessage): ChatMessage => ({
        id: apiMessage.messageId.toString(),
        senderId: apiMessage.senderId,
        senderName: apiMessage.senderType === 'WEB' ? '나' : partnerName,
        senderType: apiMessage.senderType === 'WEB' ? 'customer' : 'expert',
        message: apiMessage.message || '',
        filePath: apiMessage.filePath ?? null,
        timestamp: apiMessage.createdAt,
        isRead: apiMessage.isRead,
        // 임시 ID(Date.now())로 만든 낙관적 메시지는 아직 서버 확인 전
        isPending: apiMessage.messageId > 1000000000000
      }));
  }, [messages, partnerName]);

  const isMine = useCallback(
    (message: ChatMessage) => message.senderId === chatAuth.userId || message.senderType === 'customer',
    [chatAuth.userId]
  );

  // 읽음 표시는 "내가 보낸 마지막 메시지"에만 노출 (매 메시지마다 표시하면 노이즈가 심함)
  const lastMyMessageId = useMemo(() => {
    for (let i = convertedMessages.length - 1; i >= 0; i--) {
      if (isMine(convertedMessages[i])) return convertedMessages[i].id;
    }
    return null;
  }, [convertedMessages, isMine]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setUnseenCount(0);
  }, []);

  // 스크롤 위치 추적 + 상단 도달 시 이전 메시지 로드
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isAtBottomRef.current = nearBottom;
    setIsAtBottom(nearBottom);
    if (nearBottom) setUnseenCount(0);

    if (el.scrollTop < LOAD_MORE_THRESHOLD && hasMoreMessages && !isLoadingMore && onLoadMore) {
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
      onLoadMore();
    }
  }, [hasMoreMessages, isLoadingMore, onLoadMore]);

  // 메시지 변화에 따른 스크롤 처리
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    const prevCount = prevMessageCountRef.current;
    const count = convertedMessages.length;
    prevMessageCountRef.current = count;

    // 이전 메시지를 앞에 붙인 경우 - 보고 있던 위치를 그대로 유지
    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      el.scrollTop = el.scrollTop + (el.scrollHeight - prevScrollHeightRef.current);
      return;
    }

    // 최초 진입 - 애니메이션 없이 곧바로 최신 메시지로
    if (!didInitialScrollRef.current && count > 0) {
      didInitialScrollRef.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }

    if (count <= prevCount) return;

    const last = convertedMessages[count - 1];
    // 내가 보낸 메시지이거나 이미 맨 아래를 보고 있으면 따라 내려간다
    if (isMine(last) || isAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      // 위쪽 대화를 읽는 중이면 끌어내리지 않고 배지로만 알린다
      setUnseenCount(prev => prev + (count - prevCount));
    }
  }, [convertedMessages, isOpen, isMine]);

  // 모달을 닫으면 스크롤 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      didInitialScrollRef.current = false;
      prevMessageCountRef.current = 0;
      isPrependingRef.current = false;
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setUnseenCount(0);
    }
  }, [isOpen]);

  // 입력창 높이 자동 조절 (최대 5줄)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Enter 전송 / Shift+Enter 줄바꿈
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중 Enter는 무시해야 마지막 글자가 중복 입력되지 않는다
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && isConnected && !uploadingFile) {
        onSendMessage();
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 시간 포맷 (말풍선 옆 표시)
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // 날짜 구분선 라벨
  const formatDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  const isSameDay = (a: string, b: string) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  // 연결 상태 표시
  const getConnectionStatus = () => {
    if (connectionError) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">연결 오류</span>
        </div>
      );
    }
    if (!isConnected) {
      return (
        <div className="flex items-center gap-1 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">연결 중...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-xs font-medium">온라인</span>
      </div>
    );
  };

  // 첨부파일 렌더링 - 이미지는 미리보기, 그 외는 다운로드 카드
  const renderAttachment = (message: ChatMessage, mine: boolean) => {
    if (!message.filePath) return null;

    const url = resolveChatFileUrl(message.filePath);
    const name = message.message?.trim() || getFileName(message.filePath);

    if (isImageFile(message.filePath)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* 원본 크기를 알 수 없어 next/image 대신 img 사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            loading="lazy"
            className="max-w-full max-h-64 rounded-xl object-cover"
          />
        </a>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className={`flex items-center gap-2 min-w-0 ${mine ? 'text-white' : 'text-white'}`}
      >
        <span className="text-lg flex-shrink-0">📎</span>
        <span className="text-sm underline underline-offset-2 truncate">{name}</span>
      </a>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      {/*
        모바일에서는 전체 화면(dvh 기준), 데스크톱에서는 카드형.
        고정 700px을 쓰면 모바일 브라우저에서 입력창이 화면 밖으로 밀려난다.
      */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 sm:rounded-3xl w-full max-w-md h-[100dvh] sm:h-[min(700px,88vh)] flex flex-col shadow-2xl shadow-black/50 animate-in fade-in-0 sm:zoom-in-95 duration-200">
        {/* 채팅 헤더 */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 sm:rounded-t-3xl backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{partnerName.charAt(0)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{partnerName}</h3>
              <div className="flex items-center gap-2 text-xs">
                {getConnectionStatus()}
                {chatPartner?.cost && (
                  <span className="text-blue-300 font-medium whitespace-nowrap">
                    견적: {chatPartner.cost.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="채팅 닫기"
            className="group w-10 h-10 flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <span className="text-white text-xl group-hover:rotate-90 transition-transform duration-200">×</span>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-1 bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm"
          >
            {/* 이전 메시지 로딩 인디케이터 */}
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {!isLoadingMore && !hasMoreMessages && convertedMessages.length > 0 && (
              <div className="text-center text-slate-600 text-xs pb-2">대화의 시작입니다</div>
            )}

            {isLoading && convertedMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-slate-400 font-medium">메시지를 불러오는 중...</div>
                </div>
              </div>
            ) : convertedMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center px-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-slate-300 font-medium mb-2">{partnerName}님과의 대화를 시작해보세요</p>
                  <p className="text-slate-500 text-sm">시공 일정, 현장 사진, 추가 견적을 편하게 물어보실 수 있어요.</p>
                </div>
              </div>
            ) : (
              convertedMessages.map((message, index) => {
                const mine = isMine(message);
                const prev = index > 0 ? convertedMessages[index - 1] : null;
                const next = index < convertedMessages.length - 1 ? convertedMessages[index + 1] : null;

                const showDateDivider = !prev || !isSameDay(prev.timestamp, message.timestamp);

                // 같은 사람이 짧은 간격으로 연속 전송하면 시간은 마지막에만 표시
                const isLastOfGroup =
                  !next ||
                  isMine(next) !== mine ||
                  !isSameDay(next.timestamp, message.timestamp) ||
                  new Date(next.timestamp).getTime() - new Date(message.timestamp).getTime() > GROUPING_WINDOW_MS;

                const isFirstOfGroup =
                  showDateDivider ||
                  !prev ||
                  isMine(prev) !== mine ||
                  new Date(message.timestamp).getTime() - new Date(prev.timestamp).getTime() > GROUPING_WINDOW_MS;

                const showReadReceipt = mine && message.id === lastMyMessageId;
                const hasText = message.message.trim() !== '' && !message.filePath;

                return (
                  <React.Fragment key={message.id}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center py-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                          {formatDateLabel(message.timestamp)}
                        </span>
                      </div>
                    )}

                    <div
                      ref={(el) => {
                        // 상대방 메시지에만 Intersection Observer 적용 (읽음 처리용)
                        if (el && !mine && observeMessage) {
                          el.dataset.messageId = message.id;
                          el.dataset.isRead = message.isRead.toString();
                          observeMessage(el);
                          return () => unobserveMessage?.(el);
                        }
                      }}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'} message-item ${mine ? 'own-message' : ''} ${isFirstOfGroup ? 'pt-2' : ''}`}
                      data-message-id={message.id}
                      data-is-read={message.isRead.toString()}
                    >
                      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[82%] min-w-0`}>
                        {isFirstOfGroup && !mine && (
                          <span className="text-[11px] text-slate-400 mb-1 px-1">{partnerName}</span>
                        )}
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl shadow-lg backdrop-blur-sm max-w-full ${
                            mine
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                              : 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/20 rounded-bl-md'
                          } ${message.isPending ? 'opacity-60' : ''} ${message.filePath && isImageFile(message.filePath) ? 'p-1.5' : ''}`}
                        >
                          {message.filePath ? (
                            renderAttachment(message, mine)
                          ) : (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.message}
                            </div>
                          )}
                          {/* 이미지에 캡션이 함께 온 경우 */}
                          {message.filePath && isImageFile(message.filePath) && hasText && (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words px-2 pt-1.5 pb-0.5">
                              {message.message}
                            </div>
                          )}
                        </div>

                        {(isLastOfGroup || showReadReceipt) && (
                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-slate-500">
                            {showReadReceipt && (
                              <span className={message.isPending ? 'text-slate-500' : message.isRead ? 'text-blue-400 font-medium' : 'text-slate-400'}>
                                {message.isPending ? '전송 중' : message.isRead ? '읽음' : '안읽음'}
                              </span>
                            )}
                            {isLastOfGroup && <span>{formatTime(message.timestamp)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* 타이핑 인디케이터 */}
            {isTyping && (
              <div className="flex justify-start pt-2">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400 text-xs mr-2">입력 중</span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* 스크롤 타겟 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 새 메시지 알림 - 위쪽 대화를 읽는 중에 새 메시지가 왔을 때 */}
          {!isAtBottom && (
            <button
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-colors animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            >
              {unseenCount > 0 ? `새 메시지 ${unseenCount}개` : '맨 아래로'}
              <span>↓</span>
            </button>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm sm:rounded-b-3xl flex-shrink-0">
          <div className="flex items-end gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx"
              className="hidden"
            />

            <button
              onClick={handleFileButtonClick}
              type="button"
              disabled={uploadingFile || !isConnected}
              aria-label="사진 · 파일 첨부"
              className="group flex-shrink-0 w-11 h-11 bg-gradient-to-br from-slate-700/50 to-slate-600/50 hover:from-slate-600/60 hover:to-slate-500/60 border border-white/20 hover:border-white/30 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              title="사진 · 파일 첨부"
            >
              <span className="text-slate-300 group-hover:text-white transition-colors duration-200 text-lg">
                {uploadingFile ? '⏳' : '📎'}
              </span>
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onChange={onMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={
                !isConnected ? '연결 중...' : uploadingFile ? '파일 업로드 중...' : '메시지를 입력하세요 (Shift+Enter 줄바꿈)'
              }
              disabled={!isConnected || uploadingFile}
              className="flex-1 min-w-0 min-h-[44px] max-h-[120px] resize-none py-3 px-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base sm:text-sm placeholder-slate-400 transition-all duration-200"
            />

            <button
              onClick={onSendMessage}
              type="button"
              disabled={!newMessage.trim() || !isConnected || uploadingFile}
              aria-label="메시지 전송"
              className="group flex-shrink-0 w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
            >
              <span className="text-white text-lg group-hover:scale-110 transition-transform duration-200">➤</span>
            </button>
          </div>

          {/* 상태 표시 */}
          {(uploadingFile || !isConnected || connectionError) && (
            <div className="mt-2 text-xs text-center animate-in fade-in-0 duration-300">
              {uploadingFile && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>파일 업로드 중...</span>
                </div>
              )}
              {!isConnected && !uploadingFile && (
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>서버에 연결 중...</span>
                </div>
              )}
              {connectionError && (
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <span>⚠️</span>
                  <span>연결 오류: {connectionError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
