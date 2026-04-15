'use client';

import { useTranslations } from 'next-intl';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    type: 'join_request',
    title: 'Alex W.',
    message: 'wants to join your "Friday Night Izakaya"',
    time: '2 hours ago',
    read: false,
    iconType: 'user-plus' as const,
  },
  {
    id: '2',
    type: 'approved',
    title: "You're in!",
    message: 'Sarah approved your request for "Italian Wine Night"',
    time: '5 hours ago',
    read: false,
    iconType: 'check-circle' as const,
  },
  {
    id: '3',
    type: 'meal_confirmed',
    title: 'Meal Confirmed',
    message: '"Dim Sum Brunch" has reached minimum participants!',
    time: '1 day ago',
    read: true,
    iconType: 'party-popper' as const,
  },
  {
    id: '4',
    type: 'deadline',
    title: 'Deadline Soon',
    message: '"Korean BBQ Night" registration closes in 3 hours',
    time: '1 day ago',
    read: true,
    iconType: 'clock' as const,
  },
  {
    id: '5',
    type: 'new_comment',
    title: 'Mike L.',
    message: 'commented on "Thai Street Food Tour"',
    time: '2 days ago',
    read: true,
    iconType: 'message-circle' as const,
  },
  {
    id: '6',
    type: 'review',
    title: 'New Review',
    message: 'Yuki T. left a 5-star review for "Thai Street Food Tour"',
    time: '3 days ago',
    read: true,
    iconType: 'star' as const,
  },
];

const iconMap: Record<string, React.ElementType> = {
  'user-plus': UserPlus,
  'check-circle': CheckCircle,
  'party-popper': PartyPopper,
  'clock': Clock,
  'message-circle': MessageCircle,
  'star': Star,
};

const iconColors: Record<string, string> = {
  'user-plus': 'bg-blue-100 text-blue-600',
  'check-circle': 'bg-mint/10 text-mint',
  'party-popper': 'bg-gold/10 text-gold',
  'clock': 'bg-orange-100 text-orange-600',
  'message-circle': 'bg-purple-100 text-purple-600',
  'star': 'bg-gold/10 text-gold',
};

export default function NotificationsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-lg border-b border-gray-lighter/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-dark">{t('notification.title')}</h1>
          <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors">
            <CheckCheck className="w-4 h-4" />
            <span>{t('notification.markAllRead')}</span>
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="px-4 py-3">
        {DEMO_NOTIFICATIONS.map((notif, i) => {
          const Icon = iconMap[notif.iconType] || Bell;
          const colorClass = iconColors[notif.iconType] || 'bg-gray-100 text-gray';

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex gap-3 p-3.5 rounded-xl mb-2 transition-all duration-200',
                notif.read ? 'bg-white' : 'bg-primary/5'
              )}
            >
              {/* Unread dot */}
              {!notif.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
              )}

              {/* Icon */}
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                <Icon className="w-4.5 h-4.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-semibold text-dark">{notif.title}</span>{' '}
                    <span className="text-gray">{notif.message}</span>
                  </p>
                </div>
                <p className="text-[11px] text-gray-light mt-1">{notif.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
