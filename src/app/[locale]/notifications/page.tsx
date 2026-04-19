'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  UserPlus,
  CheckCircle,
  PartyPopper,
  Clock,
  MessageCircle,
  Star,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api';

const iconMap: Record<string, React.ElementType> = {
  'user-plus': UserPlus,
  'check-circle': CheckCircle,
  'party-popper': PartyPopper,
  'clock': Clock,
  'message-circle': MessageCircle,
  'star': Star,
  'alert': AlertTriangle,
};

const iconColors: Record<string, string> = {
  'user-plus': 'bg-blue-100 text-blue-600',
  'check-circle': 'bg-mint/10 text-mint',
  'party-popper': 'bg-gold/10 text-gold',
  'clock': 'bg-orange-100 text-orange-600',
  'message-circle': 'bg-purple-100 text-purple-600',
  'star': 'bg-gold/10 text-gold',
  'alert': 'bg-red-100 text-coral',
};

const typeToIcon: Record<string, string> = {
  join_request: 'user-plus',
  joined: 'check-circle',
  approved: 'check-circle',
  meal_confirmed: 'party-popper',
  deadline: 'clock',
  cancelled: 'alert',
  new_comment: 'message-circle',
  review: 'star',
  credit_change: 'star',
  meal_reminder: 'clock',
  leave: 'alert',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const data = await fetchNotifications(user!.id);
      setNotifications(data);
      setIsLoading(false);
    })();
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    setMarkingAll(true);
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  const handleMarkRead = async (notifId: string) => {
    await markNotificationRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark gap-4 px-4">
        <Bell className="w-12 h-12 text-gray-lighter" />
        <p className="text-gray">
          {locale === 'zh-CN' ? '請先登入查看通知' : 'Please log in to view notifications'}
        </p>
        <Link href={`/${locale}/auth/login`} className="btn-primary px-6 py-2.5 rounded-xl">
          {locale === 'zh-CN' ? '登入' : 'Login'}
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark/80 backdrop-blur-lg border-b border-gray-lighter/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-dark">{t('notification.title')}</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-coral text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('notification.markAllRead')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="px-4 py-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 text-gray-lighter mb-3" />
            <p className="text-sm text-gray-light">
              {locale === 'zh-CN' ? '暫無通知' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const iconType = typeToIcon[notif.type] || 'message-circle';
            const Icon = iconMap[iconType] || Bell;
            const colorClass = iconColors[iconType] || 'bg-gray-100 text-gray';

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={cn(
                  'relative flex gap-3 p-3.5 rounded-xl mb-2 transition-all duration-200 cursor-pointer',
                  notif.read ? 'bg-white' : 'bg-primary/5'
                )}
              >
                {/* Unread dot */}
                {!notif.read && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                )}

                {/* Icon */}
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-dark">{notif.title}</span>{' '}
                    <span className="text-gray">{notif.message}</span>
                  </p>
                  <p className="text-[11px] text-gray-light mt-1">
                    {relativeTime(notif.created_at)}
                  </p>
                </div>

                {/* Click to meal detail if has meal_id */}
                {notif.data?.meal_id && (
                  <Link
                    href={`/${locale}/meals/${notif.data.meal_id}`}
                    className="absolute inset-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
