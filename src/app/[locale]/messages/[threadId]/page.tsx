'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  MoreVertical,
  X,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { getOrCreateThread } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

// Format time for chat bubbles
function formatMessageTime(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return t('chat.timeJustNow');
  if (diffMin < 60) return t('chat.timeMinutesAgo', { minutes: diffMin });
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Yesterday or older: show date + time
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `${t('chat.timeYesterday')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Level badge component
function LevelBadge({ level }: { level?: number | null }) {
  if (!level) return null;
  const colors: Record<number, string> = {
    1: 'bg-gray/30 text-gray',
    2: 'bg-green-500/20 text-green-400',
    3: 'bg-blue-500/20 text-blue-400',
    4: 'bg-purple-500/20 text-purple-400',
    5: 'bg-gold/20 text-gold',
  };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold', colors[level] || colors[1])}>
      Lv.{level}
    </span>
  );
}

// Image Viewer Modal
function ImageViewer({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  t,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  t: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12">
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white text-sm">
          {t('chat.imageViewer.current', { current: currentIndex + 1, total: images.length })}
        </span>
        <div className="w-10" />
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        {currentIndex > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        {currentIndex < images.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Chat Bubble component
function ChatBubble({
  message,
  isMine,
  t,
  onDelete,
  onViewImage,
}: {
  message: Message;
  isMine: boolean;
  t: any;
  onDelete: (id: string) => void;
  onViewImage: (urls: string[], index: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  if (message.is_deleted) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray/50 italic">
          {isMine ? t('chat.deleteSuccess') : 'Message deleted'}
        </span>
      </div>
    );
  }

  // Party Invite Card
  if (message.message_type === 'party_invite') {
    const meta = message.metadata as any;
    return (
      <div className={cn('flex mb-3', isMine ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%] bg-dark-lighter rounded-2xl overflow-hidden border border-primary/20">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t('chat.partyInvite.title')}</span>
          </div>
          <div className="px-3 py-2">
            <p className="text-white text-sm">{meta?.mealTitle || message.content}</p>
            <div className="flex gap-2 mt-2">
              <button className="text-xs bg-primary text-white px-3 py-1 rounded-full">
                {t('chat.partyInvite.join')}
              </button>
              <button className="text-xs bg-gray/20 text-gray px-3 py-1 rounded-full">
                {t('chat.partyInvite.viewDetails')}
              </button>
            </div>
          </div>
          <div className="text-right px-3 pb-1">
            <span className="text-[10px] text-gray/50">
              {formatMessageTime(message.created_at, t)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Shop Share Card
  if (message.message_type === 'shop_share') {
    const meta = message.metadata as any;
    return (
      <div className={cn('flex mb-3', isMine ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%] bg-dark-lighter rounded-2xl overflow-hidden border border-gold/20">
          <div className="flex items-center gap-2 px-3 py-2 bg-gold/10">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-gold">{t('chat.shopShare.title')}</span>
          </div>
          <div className="px-3 py-2">
            <p className="text-white text-sm">{meta?.itemName || message.content}</p>
            <button className="text-xs text-primary mt-1">
              {t('chat.shopShare.viewItem')} →
            </button>
          </div>
          <div className="text-right px-3 pb-1">
            <span className="text-[10px] text-gray/50">
              {formatMessageTime(message.created_at, t)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Image message
  if (message.message_type === 'image' && message.image_urls && message.image_urls.length > 0) {
    return (
      <div className={cn('flex mb-3', isMine ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%]">
          <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
            {message.image_urls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onViewImage(message.image_urls!, idx)}
              />
            ))}
          </div>
          {message.content && (
            <p className={cn('text-sm mt-1', isMine ? 'text-right text-gray' : 'text-gray')}>
              {message.content}
            </p>
          )}
          <p className={cn('text-[10px] text-gray/50 mt-0.5', isMine ? 'text-right' : 'text-left')}>
            {formatMessageTime(message.created_at, t)}
          </p>
        </div>
      </div>
    );
  }

  // Text message
  return (
    <div className={cn('flex mb-3', isMine ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[75%] relative group">
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
            isMine
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-dark-lighter text-white border border-gray/10 rounded-bl-md'
          )}
        >
          {message.content}
        </div>
        <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMine ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-gray/50">
            {formatMessageTime(message.created_at, t)}
          </span>
          {isMine && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
            >
              <MoreVertical className="w-3 h-3 text-gray/50" />
            </button>
          )}
        </div>

        {/* Delete menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-0 -top-8 bg-dark-lighter border border-gray/20 rounded-lg shadow-lg overflow-hidden z-10"
            >
              <button
                onClick={() => {
                  onDelete(message.id);
                  setShowMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-coral hover:bg-coral/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                {t('chat.deleteMessage')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const { user } = useAuthStore();
  const {
    currentThreadId,
    messages,
    messagesLoading,
    hasMoreMessages,
    isLoadingMore,
    sendingMessage,
    toasts,
    openThread,
    loadMoreMessages,
    send,
    removeMessage,
    removeToast,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<{ nickname: string | null; avatar_url: string | null; level: number | null } | null>(null);
  const [imageViewer, setImageViewer] = useState<{ urls: string[]; index: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);

  // Open thread on mount
  useEffect(() => {
    if (threadId) {
      openThread(threadId);
      // Fetch thread to get other user info
      getThreadOtherUser(threadId);
    }
    return () => {
      useChatStore.getState().clearCurrentThread();
    };
  }, [threadId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, scrolledToBottom]);

  // Detect scroll position for "load more"
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setScrolledToBottom(isNearBottom);

    // Load more when near top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  async function getThreadOtherUser(tid: string) {
    // We can get other user info from the threads list
    const { threads } = useChatStore.getState();
    const thread = threads.find((th) => th.id === tid);
    if (thread) {
      const other = (thread as any)._otherUser;
      if (other) {
        setOtherUser(other);
        return;
      }
    }

    // Fallback: fetch thread fresh (lightweight)
    // For now we'll rely on the store having it
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sendingMessage) return;

    setInputText('');
    await send(text, 'text');
    setScrolledToBottom(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Reset

    // Convert to DataURL
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await send('', 'image', [dataUrl]);
      setScrolledToBottom(true);
    };
    reader.readAsDataURL(file);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-primary/20">
        <div className="flex items-center gap-3 px-3 h-14">
          <button
            onClick={() => router.push(`/${locale}/messages`)}
            className="p-1 -ml-1 text-gray hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-dark-lighter flex items-center justify-center overflow-hidden flex-shrink-0">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">
                  {otherUser?.nickname?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-white truncate">
                {otherUser?.nickname || 'Chat'}
              </span>
              <LevelBadge level={otherUser?.level} />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        )}

        {/* Loading state */}
        {messagesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-dark-lighter flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-gray" />
            </div>
            <p className="text-white font-medium">{t('chat.emptyChat')}</p>
            <p className="text-gray text-sm mt-1">{t('chat.emptyChatDesc')}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              // Show date separator when date changes
              const showDate = idx === 0 || !isSameDay(messages[idx - 1].created_at, msg.created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[10px] text-gray/50 bg-dark-lighter px-3 py-1 rounded-full">
                        {formatDateLabel(msg.created_at, t)}
                      </span>
                    </div>
                  )}
                  <ChatBubble
                    message={msg}
                    isMine={isMine}
                    t={t}
                    onDelete={removeMessage}
                    onViewImage={(urls, index) => setImageViewer({ urls, index })}
                  />
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 glass border-t border-primary/20 safe-bottom">
        <div className="flex items-end gap-2 px-3 py-2.5">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray hover:text-primary transition-colors flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Text input */}
          <div className="flex-1 bg-dark-lighter rounded-2xl border border-gray/10 px-3.5 py-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typePlaceholder')}
              rows={1}
              className="w-full bg-transparent text-white text-sm placeholder-gray resize-none outline-none max-h-24 leading-relaxed"
              style={{ minHeight: '20px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '20px';
                target.style.height = Math.min(target.scrollHeight, 96) + 'px';
              }}
            />
          </div>

          {/* Send button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!inputText.trim() || sendingMessage}
            className={cn(
              'p-2.5 rounded-full flex-shrink-0 transition-colors',
              inputText.trim()
                ? 'bg-primary text-white'
                : 'bg-dark-lighter text-gray/50'
            )}
          >
            {sendingMessage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {imageViewer && (
          <ImageViewer
            images={imageViewer.urls}
            currentIndex={imageViewer.index}
            onClose={() => setImageViewer(null)}
            onPrev={() => setImageViewer((v) => v ? { ...v, index: v.index - 1 } : null)}
            onNext={() => setImageViewer((v) => v ? { ...v, index: v.index + 1 } : null)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg',
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-coral/90 text-white'
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helpers
function isSameDay(d1: string, d2: string): boolean {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}

function formatDateLabel(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return t('chat.timeJustNow');
  if (date.toDateString() === yesterday.toDateString()) return t('chat.timeYesterday');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
