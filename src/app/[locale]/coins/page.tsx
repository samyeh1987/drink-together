'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Gift,
  ShoppingBag,
  ChevronRight,
  Check,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { useCoinStore } from '@/store/coin-store';
import type { CoinSourceType } from '@/types';

const TASK_KEYS = [
  { key: 'dailyLogin', icon: '📱', coins: 5 },
  { key: 'dailyCheckin', icon: '✅', coins: 10 },
  { key: 'postMoment', icon: '📸', coins: 15 },
  { key: 'moment10Likes', icon: '❤️', coins: 20 },
  { key: 'joinMeal', icon: '🍻', coins: 20 },
  { key: 'hostMeal', icon: '🎉', coins: 30 },
  { key: 'rateMeal', icon: '⭐', coins: 15 },
  { key: 'barCheckin', icon: '📍', coins: 5 },
  { key: 'inviteFriend', icon: '👋', coins: 50 },
  { key: 'completeProfile', icon: '👤', coins: 30 },
  { key: 'levelUp', icon: '🆙', coins: 50 },
  { key: 'firstMeal', icon: '🥂', coins: 20 },
] as const;

const SOURCE_ICONS: Record<string, string> = {
  system_daily_checkin: '✅',
  system_daily_login: '📱',
  system_complete_profile: '👤',
  system_first_meal: '🥂',
  system_level_up: '🆙',
  system_invite: '👋',
  system_streak_bonus: '🔥',
  system_post_moment: '📸',
  system_moment_10_likes: '❤️',
  system_host_meal: '🎉',
  system_join_meal: '🍻',
  system_rate_meal: '⭐',
  system_bar_checkin: '📍',
  bar_grant: '🍻',
  shop_purchase: '🛍️',
  admin_adjust: '⚙️',
  activity_reward: '🎁',
};

export default function CoinsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const {
    totalCoins,
    dailyCoinEarned,
    dailyLimit,
    hasCheckedInToday,
    streakDays,
    isCheckingIn,
    transactions,
    fetchBalance,
    performCheckin,
    fetchTransactions,
  } = useCoinStore();

  const [showCoins, setShowCoins] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => setShowCoins(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckin = async () => {
    const result = await performCheckin();
    if (result.success && result.coins) {
      // Quick celebration
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : locale === 'th' ? 'th' : 'en', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return t('bar.days.yesterday') || 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : locale === 'th' ? 'th' : 'en', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isDailyLimitReached = dailyCoinEarned >= dailyLimit;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-white"
          >
            {t('coins.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-xs text-gray-light mt-0.5"
          >
            {t('coins.shopDesc')}
          </motion.p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-dark border border-gold/30 p-5"
        >
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gold/5 rounded-full blur-xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-xs text-gold/80 font-medium">{t('coins.balance')}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-4xl font-black text-gold"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: showCoins ? 1 : 0.8, opacity: showCoins ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {totalCoins.toLocaleString()}
              </motion.span>
              <span className="text-sm text-gold/60">{t('coins.item.coins')}</span>
            </div>

            {/* Daily progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-light">
                  {t('coins.todayEarned')}: {dailyCoinEarned}
                </span>
                <span className={`text-xs font-medium ${isDailyLimitReached ? 'text-coral' : 'text-gold/80'}`}>
                  {dailyCoinEarned}{t('coins.dailyLimit')}
                </span>
              </div>
              <div className="h-2 bg-dark/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isDailyLimitReached ? 'bg-coral' : 'bg-gradient-to-r from-gold to-gold-light'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dailyCoinEarned / dailyLimit) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {isDailyLimitReached && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-coral mt-1"
                >
                  {t('coins.dailyLimitReached')}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Checkin Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="card p-4 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  hasCheckedInToday ? 'bg-mint/20' : 'bg-primary/20'
                }`}>
                  {hasCheckedInToday ? (
                    <Check className="w-4 h-4 text-mint" />
                  ) : (
                    <Gift className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('coins.checkin')}</p>
                  {streakDays > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-coral" />
                      <span className="text-[11px] text-coral font-medium">{streakDays} {t('coins.streakDays')}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCheckin}
                disabled={hasCheckedInToday || isCheckingIn}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  hasCheckedInToday
                    ? 'bg-dark/50 text-mint border border-mint/30'
                    : 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95'
                }`}
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : hasCheckedInToday ? (
                  t('coins.checkedInToday')
                ) : (
                  `${t('coins.checkinButton')} ✅`
                )}
              </button>
            </div>
          </motion.div>

          {/* Shop Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href={`/${locale}/coins/shop`}>
              <div className="card p-4 h-full cursor-pointer group hover:border-gold/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-gold" />
                  </div>
                  <p className="text-sm font-semibold text-white">{t('coins.shop')}</p>
                </div>
                <p className="text-xs text-gray-light mb-3 line-clamp-1">
                  {t('coins.shopDesc')}
                </p>
                <div className="flex items-center gap-1 text-xs text-gold font-medium group-hover:translate-x-1 transition-transform">
                  <span>{t('coins.goToShop')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Streak Bonus Info */}
        {streakDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-3.5 border-coral/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-coral" />
              <span className="text-sm font-semibold text-coral">{t('coins.streakBonus')}</span>
            </div>
            <p className="text-xs text-gray-light">{t('coins.streakBonusDesc')}</p>
            <p className="text-xs text-gray/50 mt-1">
              🔥 {streakDays}/7 · {7 - (streakDays % 7)}d to next bonus
            </p>
          </motion.div>
        )}

        {/* Daily Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-base font-bold text-white mb-3">{t('coins.taskList.title')}</h2>
          <div className="card p-0 overflow-hidden divide-y divide-gray/10">
            {TASK_KEYS.map((task, i) => (
              <div key={task.key} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {t(`coins.taskList.${task.key}`)}
                  </p>
                  <p className="text-[11px] text-gray-light truncate">
                    {t(`coins.taskList.${task.key}Desc`)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-gold font-bold text-sm flex-shrink-0">
                  <Coins className="w-3 h-3" />
                  <span>{t('coins.taskList.coins', { amount: task.coins })}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">{t('coins.transactions')}</h2>
            {transactions.length > 0 && (
              <span className="text-xs text-gray-light">{transactions.length} records</span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-dark/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 text-gray/40" />
              </div>
              <p className="text-sm text-gray-light">{t('coins.noTransactions')}</p>
              <p className="text-xs text-gray/50 mt-1">{t('coins.noTransactionsDesc')}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden divide-y divide-gray/10">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    tx.amount > 0 ? 'bg-mint/10' : 'bg-coral/10'
                  }`}>
                    {SOURCE_ICONS[tx.source_type] || '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {t(`coins.source.${tx.source_type}`, { defaultValue: tx.description })}
                    </p>
                    <p className="text-[11px] text-gray-light">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 font-bold text-sm flex-shrink-0">
                    {tx.amount > 0 ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-mint" />
                        <span className="text-mint">+{tx.amount}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-coral" />
                        <span className="text-coral">{tx.amount}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
