'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  meal_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  mealId: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentSection({ mealId }: CommentSectionProps) {
  const locale = useLocale();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('meal_comments')
      .select('*, profiles(nickname, avatar_url, id)')
      .eq('meal_id', mealId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (mealId) {
      loadComments();
    }
  }, [mealId]);

  const handleSubmit = async () => {
    if (!user?.id || !newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('meal_comments')
        .insert({
          meal_id: mealId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (!error) {
        setNewComment('');
        await loadComments();
      }
    } catch {
      // silent fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('meal_comments')
        .delete()
        .eq('id', commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      // silent fail
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray uppercase tracking-wide flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          {locale === 'zh-CN' ? '留言區' : 'Comments'}
          {comments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-light text-[10px] font-bold text-dark">
              {comments.length}
            </span>
          )}
        </p>
      </div>

      {/* Comments list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-gray-light animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-light text-center py-4">
            {locale === 'zh-CN' ? '還沒有留言' : locale === 'th' ? 'ยังไม่มีความคิดเห็น' : 'No comments yet'}
          </p>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-2.5"
              >
                {/* Avatar */}
                <Link href={`/${locale}/user/${comment.user_id}`} className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center overflow-hidden">
                    {comment.profiles?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">
                        {(comment.profiles?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/${locale}/user/${comment.user_id}`}>
                      <span className="text-xs font-semibold text-dark hover:text-primary transition-colors">
                        {comment.profiles?.nickname || 'User'}
                      </span>
                    </Link>
                    <span className="text-[10px] text-gray-light">{relativeTime(comment.created_at)}</span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto p-0.5 rounded-md hover:bg-coral/10 text-gray-lighter hover:text-coral transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray mt-0.5 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      {user ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={locale === 'zh-CN' ? '說點什麼...' : 'Say something...'}
            maxLength={500}
            className="input flex-1 py-2 text-xs"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newComment.trim()}
            className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-light text-center py-2">
          {locale === 'zh-CN' ? '登入後即可留言' : 'Log in to comment'}
        </p>
      )}
    </motion.div>
  );
}
