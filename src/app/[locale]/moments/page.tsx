'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  ImagePlus,
  X,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Flag,
  Globe,
  Users,
  Beer,
  Repeat2,
  Copy,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useMomentStore } from '@/store/moment-store';
import { useAuthStore } from '@/store/auth-store';
import type { Moment, MomentComment } from '@/types';

// Mood tag options with emojis
const MOOD_OPTIONS = [
  { key: 'happy', emoji: '😊' },
  { key: 'excited', emoji: '🎉' },
  { key: 'relaxed', emoji: '😌' },
  { key: 'thoughtful', emoji: '🤔' },
  { key: 'nostalgic', emoji: '🌅' },
  { key: 'cheers', emoji: '🍻' },
] as const;

// Visibility options
const VISIBILITY_OPTIONS = [
  { key: 'public', icon: Globe },
  { key: 'friends', icon: Users },
  { key: 'party_only', icon: Beer },
] as const;

// Format relative time
function formatRelativeTime(dateStr: string, t: any): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return t('moments.timeJustNow');
  if (minutes < 60) return t('moments.timeMinutesAgo', { minutes });
  if (hours < 24) return t('moments.timeHoursAgo', { hours });
  if (days < 7) return t('moments.timeDaysAgo', { days });
  return t('moments.timeWeeksAgo', { weeks });
}

// Single Moment Card
function MomentCard({ moment, t, onOpenComments }: { moment: Moment; t: any; onOpenComments: (m: Moment) => void }) {
  const { toggleLike, deleteMoment } = useMomentStore();
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const isOwner = user?.id === moment.user_id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 mb-3"
      >
        {/* Header: User info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {moment.user?.avatar_url ? (
                <img src={moment.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (moment.user?.nickname || '?')[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-dark truncate">
                  {moment.user?.nickname || 'Anonymous'}
                </span>
                <span className="tag text-[10px] px-1.5 py-0.5">
                  Lv.{moment.user?.level || 1}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatRelativeTime(moment.created_at, t)}</span>
                {moment.mood_tag && (
                  <span>{MOOD_OPTIONS.find(m => m.key === moment.mood_tag)?.emoji}</span>
                )}
              </div>
            </div>
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={18} className="text-gray-400" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[120px]"
                >
                  {!isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <Flag size={14} />
                      {t('moments.report')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/moments/${moment.id}`);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Copy size={14} />
                    {t('moments.share')}
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm(t('moments.deleteConfirm'))) {
                          deleteMoment(moment.id);
                        }
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      {t('moments.delete')}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Location */}
        {moment.bar && (
          <div className="flex items-center gap-1 text-xs text-primary mb-2">
            <MapPin size={12} />
            <span>{t('moments.atBar', { bar: moment.bar.name })}</span>
          </div>
        )}
        {!moment.bar && moment.location_name && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <MapPin size={12} />
            <span>{moment.location_name}</span>
          </div>
        )}

        {/* Content */}
        {moment.content && (
          <p className="text-sm text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap">
            {moment.content}
          </p>
        )}

        {/* Images */}
        {moment.images && moment.images.length > 0 && (
          <div
            className={`grid gap-1.5 mb-3 rounded-xl overflow-hidden ${
              moment.images.length === 1 ? 'grid-cols-1' :
              moment.images.length === 2 ? 'grid-cols-2' :
              moment.images.length <= 4 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}
          >
            {moment.images.slice(0, 9).map((img, idx) => (
              <div
                key={idx}
                className={`relative cursor-pointer ${
                  moment.images!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
                } ${moment.images!.length === 3 && idx === 0 ? 'row-span-2' : ''} ${
                  moment.images!.length > 4 && idx >= 4 ? 'hidden' : ''
                }`}
                onClick={() => {
                  setCurrentImageIdx(idx);
                  setShowImageViewer(true);
                }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {idx === 3 && moment.images!.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{moment.images!.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={() => toggleLike(moment.id)}
              className="flex items-center gap-1.5 group"
            >
              <motion.div
                whileTap={{ scale: 1.3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Heart
                  size={18}
                  className={`transition-colors ${
                    moment.is_liked
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-400 group-hover:text-red-400'
                  }`}
                />
              </motion.div>
              {moment.likes_count > 0 && (
                <span className="text-xs text-gray-500">{moment.likes_count}</span>
              )}
            </button>

            {/* Comment */}
            <button
              onClick={() => onOpenComments(moment)}
              className="flex items-center gap-1.5 group"
            >
              <MessageCircle
                size={18}
                className="text-gray-400 group-hover:text-primary transition-colors"
              />
              {moment.comments_count > 0 && (
                <span className="text-xs text-gray-500">{moment.comments_count}</span>
              )}
            </button>

            {/* Share */}
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/moments/${moment.id}`)}
              className="flex items-center gap-1.5 group"
            >
              <Repeat2 size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Visibility indicator */}
          <div className="flex items-center gap-1 text-gray-300">
            {moment.visibility === 'public' && <Globe size={12} />}
            {moment.visibility === 'friends' && <Users size={12} />}
            {moment.visibility === 'party_only' && <Beer size={12} />}
          </div>
        </div>
      </motion.div>

      {/* Image Viewer Overlay */}
      <AnimatePresence>
        {showImageViewer && moment.images && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setShowImageViewer(false)} className="p-2">
                <X size={24} />
              </button>
              <span className="text-sm">
                {t('moments.imageViewer.current', {
                  current: currentImageIdx + 1,
                  total: moment.images.length,
                })}
              </span>
              <div className="w-10" />
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              {currentImageIdx > 0 && (
                <button
                  onClick={() => setCurrentImageIdx(i => i - 1)}
                  className="absolute left-2 p-2 text-white/70 hover:text-white"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              <img
                src={moment.images[currentImageIdx]}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {currentImageIdx < moment.images.length - 1 && (
                <button
                  onClick={() => setCurrentImageIdx(i => i + 1)}
                  className="absolute right-2 p-2 text-white/70 hover:text-white"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Comment Section (Bottom Sheet style)
function CommentSection({ moment, onClose }: { moment: Moment; onClose: () => void }) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const { comments, isSubmittingComment, replyTo, addComment, deleteComment, setReplyTo } = useMomentStore();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOwner = user?.id === moment.user_id;

  useEffect(() => {
    inputRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    // Scroll to bottom when comments change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const parentId = replyTo?.commentId || undefined;
    const result = await addComment(moment.id, input, parentId);
    if (result.success) {
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h3 className="font-bold text-dark">
            {t('moments.comments', { count: moment.comments_count })}
          </h3>
          <button onClick={onClose} className="p-1">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Comments list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('moments.commentPlaceholder')}
            </div>
          )}

          {comments.map(comment => (
            <div key={comment.id}>
              {/* Main comment */}
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden">
                  {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (comment.user?.nickname || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-dark">
                      {comment.user?.nickname || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatRelativeTime(comment.created_at, t)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                  <button
                    onClick={() => setReplyTo({ commentId: comment.id, nickname: comment.user?.nickname || 'User' })}
                    className="text-xs text-gray-400 mt-1 hover:text-primary"
                  >
                    {t('moments.reply')}
                  </button>
                </div>
                {(comment.user_id === user?.id || isOwner) && (
                  <button
                    onClick={() => {
                      if (confirm(t('moments.commentDeleteConfirm'))) {
                        deleteComment(comment.id);
                      }
                    }}
                    className="text-gray-300 hover:text-red-400 self-start mt-1"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 mt-2 space-y-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mint to-coral flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 overflow-hidden">
                        {reply.user?.avatar_url ? (
                          <img src={reply.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (reply.user?.nickname || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-dark">
                            {reply.user?.nickname || 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatRelativeTime(reply.created_at, t)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{reply.content}</p>
                      </div>
                      {(reply.user_id === user?.id || isOwner) && (
                        <button
                          onClick={() => {
                            if (confirm(t('moments.commentDeleteConfirm'))) {
                              deleteComment(reply.id);
                            }
                          }}
                          className="text-gray-300 hover:text-red-400 self-start mt-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply indicator */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 bg-gray-50 border-t border-gray-100"
            >
              <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <span>{t('moments.replyTo', { name: replyTo.nickname })}</span>
                <button onClick={() => setReplyTo(null)}>
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              replyTo
                ? t('moments.replyTo', { name: replyTo.nickname })
                : t('moments.commentPlaceholder')
            }
            className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isSubmittingComment}
            className="p-2 rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
          >
            {isSubmittingComment ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Compose Modal
function ComposeModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const { createMoment, isComposing } = useMomentStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'party_only'>('public');
  const [moodTag, setMoodTag] = useState<string | null>(null);
  const [showMoods, setShowMoods] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMoodEmoji = moodTag ? MOOD_OPTIONS.find(m => m.key === moodTag)?.emoji : null;

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return;
    const result = await createMoment({
      content,
      images: images.length > 0 ? images : undefined,
      visibility,
      mood_tag: moodTag,
    });
    if (result.success) {
      onClose();
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 9 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-500">{t('common.cancel')}</button>
          <h3 className="font-bold text-dark">{t('moments.create')}</h3>
          <button
            onClick={handlePost}
            disabled={isComposing || (!content.trim() && images.length === 0)}
            className="text-sm font-bold text-primary disabled:opacity-40"
          >
            {isComposing ? <Loader2 size={16} className="animate-spin inline" /> : t('moments.post')}
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('moments.placeholder')}
            maxLength={500}
            className="w-full min-h-[120px] text-sm text-gray-800 outline-none resize-none placeholder:text-gray-300"
          />

          {/* Mood tag */}
          <div className="flex items-center gap-2 mt-2">
            {selectedMoodEmoji && (
              <span className="tag text-xs">
                {selectedMoodEmoji} {t(`moments.moodTag.${moodTag}`)}
              </span>
            )}
            <button
              onClick={() => setShowMoods(!showMoods)}
              className="text-xs text-primary"
            >
              {showMoods ? t('common.cancel') : t('moments.moodTag.placeholder')}
            </button>
          </div>

          <AnimatePresence>
            {showMoods && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 mt-2 flex-wrap"
              >
                {MOOD_OPTIONS.map(mood => (
                  <button
                    key={mood.key}
                    onClick={() => {
                      setMoodTag(moodTag === mood.key ? null : mood.key);
                      setShowMoods(false);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      moodTag === mood.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{t(`moments.moodTag.${mood.key}`)}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  onClick={handleImageUpload}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1"
                >
                  <Camera size={20} className="text-gray-300" />
                  <span className="text-[10px] text-gray-400">
                    {images.length}/9
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Character count */}
          <div className="text-right text-[10px] text-gray-300 mt-2">
            {content.length}/500
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={handleImageUpload}
              disabled={images.length >= 9}
              className="p-2 rounded-full text-primary disabled:opacity-40"
            >
              <ImagePlus size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Visibility */}
            <div className="relative">
              <button
                onClick={() => setShowVisibility(!showVisibility)}
                className="flex items-center gap-1 text-xs text-gray-500"
              >
                {VISIBILITY_OPTIONS.find(v => v.key === visibility) && (() => {
                  const Icon = VISIBILITY_OPTIONS.find(v => v.key === visibility)!.icon;
                  return <Icon size={16} />;
                })()}
                <span>{t(`moments.visibility.${visibility}`)}</span>
              </button>
              <AnimatePresence>
                {showVisibility && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px]"
                  >
                    {VISIBILITY_OPTIONS.map(v => {
                      const Icon = v.icon;
                      return (
                        <button
                          key={v.key}
                          onClick={() => {
                            setVisibility(v.key);
                            setShowVisibility(false);
                          }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${
                            visibility === v.key ? 'text-primary font-medium' : 'text-gray-600'
                          }`}
                        >
                          <Icon size={16} />
                          {t(`moments.visibility.${v.key}`)}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <span className="text-[10px] text-gray-400">
            {t('moments.coinReward')}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main Page
export default function MomentsPage() {
  const t = useTranslations();
  const {
    moments,
    isLoading,
    isLoadingMore,
    hasMore,
    showCompose,
    toast,
    fetchMoments,
    loadMore,
    setShowCompose,
    setCurrentMoment,
    clearToast,
  } = useMomentStore();
  const { user } = useAuthStore();
  const [commentMoment, setCommentMoment] = useState<Moment | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  const handleOpenComments = useCallback((moment: Moment) => {
    setCommentMoment(moment);
    setCurrentMoment(moment);
  }, [setCurrentMoment]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-dark">{t('moments.title')}</h1>
            <p className="text-xs text-gray-400">{t('moments.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-full text-sm"
          >
            <Plus size={16} />
            <span>{t('moments.create')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="text-sm text-gray-400">{t('common.loading')}</span>
          </div>
        ) : moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Sparkles size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">{t('moments.noMoments')}</p>
            <p className="text-gray-300 text-xs">{t('moments.noMomentsDesc')}</p>
          </motion.div>
        ) : (
          <div>
            {moments.map(moment => (
              <MomentCard
                key={moment.id}
                moment={moment}
                t={t}
                onOpenComments={handleOpenComments}
              />
            ))}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoadingMore && <Loader2 size={20} className="animate-spin text-primary" />}
              </div>
            )}

            {!hasMore && moments.length > 0 && (
              <div className="text-center py-4 text-xs text-gray-300">
                - {t('common.noResults')} -
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating action button */}
      {!showCompose && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          onClick={() => setShowCompose(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-mint text-white shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      </AnimatePresence>

      {/* Comment Section */}
      <AnimatePresence>
        {commentMoment && (
          <CommentSection
            moment={commentMoment}
            onClose={() => setCommentMoment(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium z-50 shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {t(`moments.${toast.message}`)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
