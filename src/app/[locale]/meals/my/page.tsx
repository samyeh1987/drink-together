'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Users,
  UtensilsCrossed,
  X,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchMyMeals, leaveMeal } from '@/lib/api';

type TabKey = 'all' | 'hosting' | 'joined' | 'completed';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-gray-100 text-gray',
  ongoing: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700',
};

const roleColors: Record<string, string> = {
  host: 'bg-primary/10 text-primary',
  participant: 'bg-mint/10 text-mint',
};

// Stable meal card component (defined outside to avoid re-mount on state change)
function MealCard({
  meal,
  locale,
  t,
  onCancelJoin,
}: {
  meal: any;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  onCancelJoin?: (mealId: string) => void;
}) {
  const [showCancel, setShowCancel] = useState(false);

  const isActive = meal.status === 'open' || meal.status === 'pending' || meal.status === 'confirmed';
  const isParticipant = meal.role === 'participant';

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleDateString(
      locale === 'th' ? 'th-TH' : locale,
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="card overflow-hidden">
        {/* Card Header with emoji + title + status */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{meal.cuisineEmoji}</span>
              <h3 className="font-bold text-dark text-[15px] truncate">{meal.title}</h3>
            </div>
          </div>

          {/* Status + Role badges */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`tag text-[11px] ${roleColors[meal.role] || 'bg-gray-100 text-gray'}`}>
              {meal.role === 'host' ? t('meal.creator') : t('meal.joined')}
            </span>
            <span className={`tag text-[11px] ${statusColors[meal.status] || 'bg-gray-100 text-gray'}`}>
              {t(`meal.status.${meal.status}`)}
            </span>
            {meal.note && (
              <span className="tag text-[11px] bg-light text-gray">
                💬 {meal.note.length > 20 ? meal.note.slice(0, 20) + '...' : meal.note}
              </span>
            )}
          </div>

          {/* Restaurant */}
          <div className="flex items-center gap-1.5 text-sm text-gray mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-light" />
            <span className="truncate">{meal.restaurant_name}</span>
          </div>

          {/* Date + Time */}
          <div className="flex items-center gap-1.5 text-sm text-gray mb-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-gray-light" />
            <span>{formatDate(meal.datetime)}</span>
          </div>

          {/* Languages + Participants row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(meal.languages || []).map((lang: { key: string; flag: string }) => (
                <span key={lang.key} className="tag text-[11px]">
                  {lang.flag} {t(`language.${lang.key}`)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Users className="w-3.5 h-3.5 text-gray-light" />
              <span className="text-xs text-mint font-semibold">
                {meal.current}/{meal.max_participants || meal.max}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer - Action Buttons */}
        <div className="border-t border-gray-lighter/50 px-4 py-2.5 bg-dark/30">
          {isActive && isParticipant && !showCancel && (
            <div className="flex items-center justify-between">
              <Link href={`/${locale}/meals/${meal.id}`} className="flex-1">
                <button className="w-full py-2 text-sm font-medium text-primary">
                  {t('myMeals.viewMeal')} →
                </button>
              </Link>
              <button
                onClick={() => setShowCancel(true)}
                className="ml-3 flex items-center gap-1 py-2 text-xs text-coral font-medium"
              >
                <X className="w-3.5 h-3.5" />
                {t('myMeals.cancelJoin')}
              </button>
            </div>
          )}

          {isActive && isParticipant && showCancel && (
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs text-gray">{t('myMeals.cancelJoinConfirm')}</p>
              <button
                onClick={() => setShowCancel(false)}
                className="px-3 py-1.5 text-xs text-gray font-medium bg-light rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowCancel(false);
                  onCancelJoin?.(meal.id);
                }}
                className="px-3 py-1.5 text-xs text-white font-medium bg-coral rounded-lg"
              >
                {t('common.confirm')}
              </button>
            </div>
          )}

          {isActive && meal.role === 'host' && (
            <Link href={`/${locale}/meals/${meal.id}`} className="block">
              <button className="w-full py-2 text-sm font-medium text-primary">
                {t('myMeals.viewMeal')} →
              </button>
            </Link>
          )}

          {!isActive && (
            <Link href={`/${locale}/meals/${meal.id}`} className="block">
              <button className="w-full py-2 text-sm font-medium text-gray">
                {t('myMeals.viewMeal')} →
              </button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MyMealsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      fetchMyMeals(user.id)
        .then(setMeals)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: t('myMeals.all') },
    { key: 'hosting', label: t('myMeals.hosting') },
    { key: 'joined', label: t('myMeals.joined') },
    { key: 'completed', label: t('myMeals.completed') },
  ];

  const filteredMeals = meals.filter((meal) => {
    switch (activeTab) {
      case 'hosting':
        return meal.role === 'host';
      case 'joined':
        return meal.role === 'participant';
      case 'completed':
        return meal.status === 'completed';
      default:
        return true;
    }
  });

  const handleCancelJoin = async (mealId: string) => {
    const result = await leaveMeal(mealId);
    if (result.success && user?.id) {
      // Refresh the list
      const updated = await fetchMyMeals(user.id);
      setMeals(updated);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-dark mb-4"
          >
            {t('nav.myMeals')}
          </motion.h1>

          {/* Tab pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 snap-start transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-light text-gray hover:bg-gray-lighter/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal list */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : !user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-light rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-7 h-7 text-gray-light" />
            </div>
            <p className="text-sm text-gray mb-1">{t('auth.signInRequired') || 'Please sign in first'}</p>
          </motion.div>
        ) : filteredMeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-light rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-7 h-7 text-gray-light" />
            </div>
            <p className="text-sm text-gray mb-1">{t('myMeals.noMeals')}</p>
            <p className="text-xs text-gray-light">
              {activeTab === 'all'
                ? t('myMeals.noMealsDesc')
                : t('myMeals.noMealsDescFiltered')}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} locale={locale} t={t} onCancelJoin={handleCancelJoin} />
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredMeals.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-light mt-6 mb-4"
          >
            {t('myMeals.mealsFound', { count: filteredMeals.length })}
          </motion.p>
        )}
      </div>
    </div>
  );
}
