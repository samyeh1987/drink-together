'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  Search,
  PlusCircle,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { fetchUnreadNotificationCount } from '@/lib/api';

export default function TabBar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    (async () => {
      const count = await fetchUnreadNotificationCount(user!.id);
      setUnreadCount(count);
    })();
  }, [user?.id, pathname]); // re-fetch on page change

  // Hide TabBar on form pages, login, and meal detail pages
  const isCreatePage = pathname.includes('/meals/create');
  const isAuthPage = pathname.includes('/auth/');
  const isMealDetailPage = /^\/[^/]+\/meals\/\d+$/.test(pathname);
  const shouldHide = isCreatePage || isAuthPage || isMealDetailPage;
  if (shouldHide) return null;

  const tabs = [
    {
      href: `/${locale}`,
      label: t('nav.home'),
      icon: UtensilsCrossed,
      activeIcon: UtensilsCrossed,
    },
    {
      href: `/${locale}/meals`,
      label: t('nav.meals'),
      icon: Search,
      activeIcon: Search,
    },
    {
      href: `/${locale}/meals/create`,
      label: t('nav.createMeal'),
      icon: PlusCircle,
      activeIcon: PlusCircle,
      isCreate: true,
    },
    {
      href: `/${locale}/notifications`,
      label: t('nav.notifications'),
      icon: Bell,
      activeIcon: Bell,
      badge: Math.max(0, Number(unreadCount) || 0),
    },
    {
      href: `/${locale}/profile`,
      label: t('nav.profile'),
      icon: User,
      activeIcon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/30 safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.href !== `/${locale}` && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            if (tab.isCreate) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 flex items-center justify-center"
                  >
                    <PlusCircle className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-[10px] mt-1 text-gray font-medium">
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-16 h-full"
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-gray-light'
                    )}
                  />
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-coral text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-0.5 transition-colors duration-200',
                    isActive ? 'text-primary font-semibold' : 'text-gray-light font-medium'
                  )}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute -top-px left-3 right-3 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
    </nav>
  );
}
