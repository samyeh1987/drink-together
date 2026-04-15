'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  X,
  SlidersHorizontal,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useMealStore } from '@/store/meal-store';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-gray-100 text-gray',
  ongoing: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700',
};

const creditColors: Record<string, string> = {
  excellent: 'text-gold',
  good: 'text-mint',
  average: 'text-blue-500',
  newbie: 'text-gray',
};

const creditStars: Record<string, string> = {
  excellent: '⭐⭐⭐⭐⭐',
  good: '⭐⭐⭐⭐',
  average: '⭐⭐⭐',
  newbie: '⭐⭐',
};

const CUISINE_OPTIONS = ['japanese', 'thai', 'chinese', 'korean', 'italian', 'hotpot', 'bbq'] as const;
const LANGUAGE_OPTIONS = ['en', 'zh', 'th', 'ja', 'ko'] as const;
const PAYMENT_OPTIONS = ['hostTreats', 'splitBill'] as const;

const CUISINE_EMOJI: Record<string, string> = {
  japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
  western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
  dimsum: '🥟', vegetarian: '🥗', other: '🍴',
};

const PAYMENT_EMOJI: Record<string, string> = {
  hostTreats: '🎉', splitBill: '💰', payOwn: '💳',
};

export default function MealsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { meals, isLoading, fetchMeals } = useMealStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Client-side filtering
  const filteredMeals = meals.filter((meal: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        meal.title.toLowerCase().includes(q) ||
        meal.restaurant_name.toLowerCase().includes(q) ||
        meal.cuisine_type.toLowerCase().includes(q) ||
        meal.note?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (selectedCuisines.length > 0 && !selectedCuisines.includes(meal.cuisine_type)) return false;
    if (selectedLanguages.length > 0) {
      const mealLangs = meal.meal_languages || [];
      if (!selectedLanguages.some((lang) => mealLangs.includes(lang))) return false;
    }
    if (selectedPayments.length > 0 && !selectedPayments.includes(meal.payment_method)) return false;
    return true;
  });

  const activeFilterCount = selectedCuisines.length + selectedLanguages.length + selectedPayments.length;

  const clearAllFilters = () => {
    setSelectedCuisines([]);
    setSelectedLanguages([]);
    setSelectedPayments([]);
    setSearchQuery('');
  };

  const toggleFilter = (category: 'cuisine' | 'language' | 'payment', value: string) => {
    const setter =
      category === 'cuisine' ? setSelectedCuisines
        : category === 'language' ? setSelectedLanguages
        : setSelectedPayments;
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const getCreatorCredit = (score: number) => {
    if (score >= 120) return 'excellent';
    if (score >= 90) return 'good';
    if (score >= 60) return 'average';
    return 'newbie';
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-dark"
            >
              {t('nav.meals')}
            </motion.h1>
            <Link
              href={`/${locale}/meals/create`}
              className="btn-primary text-xs py-2 px-4"
            >
              + {t('nav.createMeal')}
            </Link>
          </div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative mb-2"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="input pl-10 pr-10 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-gray transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          {/* Filter toggle + active tags */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-light text-gray hover:bg-gray-lighter/80'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('common.filter') || 'Filter'}</span>
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter tags - horizontal scroll */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                {selectedCuisines.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleFilter('cuisine', c)}
                    className="tag tag-active text-[11px] flex-shrink-0 gap-1"
                  >
                    {t(`cuisine.${c}`)}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedLanguages.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleFilter('language', l)}
                    className="tag tag-active text-[11px] flex-shrink-0 gap-1"
                  >
                    {t(`language.${l}`)}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedPayments.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleFilter('payment', p)}
                    className="tag tag-active text-[11px] flex-shrink-0 gap-1"
                  >
                    {t(`payment.${p}`)}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-coral font-medium flex-shrink-0 hover:underline"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Filter panel - expandable */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Cuisine */}
                <div>
                  <p className="text-xs font-semibold text-gray mb-2">
                    {t('cuisine.japanese') ? '' : ''}Cuisine / 菜系
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <button
                        key={cuisine}
                        onClick={() => toggleFilter('cuisine', cuisine)}
                        className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                          selectedCuisines.includes(cuisine) ? 'tag-active' : ''
                        }`}
                      >
                        {t(`cuisine.${cuisine}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <p className="text-xs font-semibold text-gray mb-2">
                    {t('meal.languages')}
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleFilter('language', lang)}
                        className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                          selectedLanguages.includes(lang) ? 'tag-active' : ''
                        }`}
                      >
                        {t(`language.${lang}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-xs font-semibold text-gray mb-2">
                    💳 {t('payment.splitBill') ? '' : ''}Payment
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {PAYMENT_OPTIONS.map((pay) => (
                      <button
                        key={pay}
                        onClick={() => toggleFilter('payment', pay)}
                        className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                          selectedPayments.includes(pay) ? 'tag-active' : ''
                        }`}
                      >
                        {t(`payment.${pay}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meal list */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-light rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-light" />
            </div>
            <p className="text-sm text-gray mb-1">{t('common.noResults')}</p>
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary font-medium mt-2 hover:underline"
            >
              {t('common.cancel')} Filters
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMeals.map((meal, i) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                layout
              >
                <Link href={`/${locale}/meals/${meal.id}`}>
                  <div className="card p-4 cursor-pointer group">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-dark text-[15px] group-hover:text-primary transition-colors truncate">
                          {meal.title}
                        </h3>
                      </div>
                      <span
                        className={`tag text-[11px] ml-2 flex-shrink-0 ${
                          statusColors[meal.status] || 'bg-gray-100 text-gray'
                        }`}
                      >
                        {t(`meal.status.${meal.status}`)}
                      </span>
                    </div>

                    {/* Restaurant */}
                    <div className="flex items-center gap-1 text-sm text-gray mb-2.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{(meal as any).restaurant_name}</span>
                    </div>

                    {/* Languages + Note row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {((meal as any)._languages || []).map((lang: { key: string; flag: string }) => (
                        <span key={lang.key} className="tag text-[11px]">
                          {lang.flag} {t(`language.${lang.key}`)}
                        </span>
                      ))}
                      {meal.note && (
                        <span className="px-2 py-0.5 rounded-md bg-light text-[11px] text-gray-light flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {meal.note}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {new Date(meal.datetime).toLocaleDateString(
                              locale === 'th' ? 'th-TH' : locale,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span
                            className={`text-xs ${
                              (meal as any)._currentParticipants >= meal.min_participants
                                ? 'text-mint font-semibold'
                                : ''
                            }`}
                          >
                            {(meal as any)._currentParticipants}/{meal.max_participants}
                          </span>
                        </div>
                        <span className="text-sm">{(meal as any)._paymentEmoji || ''}</span>
                      </div>
                      {meal.creator && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center overflow-hidden">
                            {meal.creator.avatar_url ? (
                              <img src={meal.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-primary">
                                {(meal.creator.nickname || '?').charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray">
                            {meal.creator.nickname || 'Anonymous'}
                          </span>
                          <span
                            className={`text-[10px] ${
                              creditColors[getCreatorCredit(meal.creator.credit_score || 100)] || 'text-gray'
                            }`}
                          >
                            {creditStars[getCreatorCredit(meal.creator.credit_score || 100)] || '⭐⭐⭐'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
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
            {filteredMeals.length} meals found
          </motion.p>
        )}
      </div>
    </div>
  );
}
