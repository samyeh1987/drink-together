'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, ArrowLeft, ChevronRight, Loader2, Image, Users } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

// Format relative time for thread list
function formatThreadTime(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('chat.timeJustNow');
  if (diffMin < 60) return t('chat.timeMinutesAgo', { minutes: diffMin });
  if (diffHours < 24) return t('chat.timeHoursAgo', { hours: diffHours });

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t('chat.timeYesterday');
  }

  if (diffDays < 7) return t('chat.timeDaysAgo', { days: diffDays });
  return date.toLocaleDateString();
}

// Get the other user from a thread
function getOtherUser(thread: any) {
  return thread._otherUser || null;
}

// Truncate message preview
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

export default function MessagesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const { threads, threadsLoading, fetchThreads } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      fetchThreads();
    }
  }, [user?.id, fetchThreads]);

  // Derive unread counts from thread.last_message sender_id
  const totalUnread = threads.reduce((sum, thread) => {
    const lastMsg = (thread as any).last_message;
    if (lastMsg && lastMsg.sender_id !== user?.id && thread.unread_count) {
      return sum + (thread.unread_count || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-primary/20">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold text-white">
            {t('chat.title')}
            {totalUnread > 0 && (
              <span className="ml-2 text-sm font-medium text-primary">
                ({totalUnread})
              </span>
            )}
          </h1>
          {/* Future: new message button */}
        </div>
      </div>

      {/* Thread List */}
      {threadsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-20 h-20 rounded-full bg-dark-lighter flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-gray" />
          </div>
          <p className="text-white font-semibold mb-2">{t('chat.noThreads')}</p>
          <p className="text-gray text-sm text-center">{t('chat.noThreadsDesc')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray/10">
          <AnimatePresence>
            {threads.map((thread, index) => {
              const other = getOtherUser(thread);
              const lastMsg = (thread as any).last_message;
              const lastContent = lastMsg
                ? lastMsg.message_type === 'image'
                  ? `[${t('chat.messageType.image')}]`
                  : truncate(lastMsg.content || '', 40)
                : '';

              return (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    href={`/${locale}/messages/${thread.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-dark-lighter/50 transition-colors active:bg-dark-lighter"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-dark-lighter flex items-center justify-center overflow-hidden">
                        {other?.avatar_url ? (
                          <img
                            src={other.avatar_url}
                            alt={other.nickname || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {other?.nickname?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">
                          {other?.nickname || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray flex-shrink-0 ml-2">
                          {thread.last_message_at
                            ? formatThreadTime(thread.last_message_at, t)
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm text-gray truncate pr-2">
                          {lastMsg?.sender_id === user?.id && (
                            <span className="text-gray/60">{t('chat.you')}: </span>
                          )}
                          {lastContent}
                        </p>
                        {thread.unread_count && thread.unread_count > 0 ? (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold px-1">
                            {thread.unread_count > 99 ? '99+' : thread.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray/50 flex-shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
