'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Filter,
  MessageCircle,
  X,
  SlidersHorizontal,
} from 'lucide-react';

// Demo meal data for UI preview
const DEMO_MEALS = [
  {
    id: '1',
    title: 'Friday Night Izakaya 🍶',
    restaurant: 'Ninja Izakaya, Thonglor',
    cuisine: 'japanese',
    cuisineEmoji: '🍣',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }],
    datetime: '2026-04-18T19:00:00',
    current: 4,
    min: 3,
    max: 8,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: 'Language Exchange',
    status: 'open',
    creatorName: 'Sarah K.',
    creatorCredit: 'good',
  },
  {
    id: '2',
    title: 'Weekend Hotpot Feast 🫕',
    restaurant: 'Haidilao, Siam Paragon',
    cuisine: 'hotpot',
    cuisineEmoji: '🫕',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'en', flag: '🇬🇧' }],
    datetime: '2026-04-19T18:30:00',
    current: 2,
    min: 4,
    max: 10,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: 'Startup Sharing',
    status: 'open',
    creatorName: 'Alex W.',
    creatorCredit: 'excellent',
  },
  {
    id: '3',
    title: 'Best Pad Thai in Town 🍜',
    restaurant: 'Thipsamai, Old Town',
    cuisine: 'thai',
    cuisineEmoji: '🍜',
    languages: [{ key: 'en', flag: '🇬🇧' }],
    datetime: '2026-04-17T12:00:00',
    current: 5,
    min: 2,
    max: 6,
    payment: 'payOwn',
    paymentEmoji: '💳',
    note: null,
    status: 'confirmed',
    creatorName: 'Somchai P.',
    creatorCredit: 'good',
  },
  {
    id: '4',
    title: 'Korean BBQ Night 🔥',
    restaurant: 'Maple House, Ari',
    cuisine: 'korean',
    cuisineEmoji: '🍖',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'ko', flag: '🇰🇷' }],
    datetime: '2026-04-20T19:30:00',
    current: 3,
    min: 4,
    max: 8,
    payment: 'hostTreats',
    paymentEmoji: '🎉',
    note: 'Expat Meetup',
    status: 'open',
    creatorName: 'Mike L.',
    creatorCredit: 'average',
  },
  {
    id: '5',
    title: 'Sunday Brunch & Coffee ☕',
    restaurant: 'Roast, Thonglor',
    cuisine: 'italian',
    cuisineEmoji: '🍝',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }, { key: 'ja', flag: '🇯🇵' }],
    datetime: '2026-04-19T10:30:00',
    current: 6,
    min: 2,
    max: 8,
    payment: 'payOwn',
    paymentEmoji: '💳',
    note: null,
    status: 'ongoing',
    creatorName: 'Emma T.',
    creatorCredit: 'excellent',
  },
  {
    id: '6',
    title: 'Dim Sum Morning 🥟',
    restaurant: 'Tim Ho Wan, CentralWorld',
    cuisine: 'chinese',
    cuisineEmoji: '🥟',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'en', flag: '🇬🇧' }],
    datetime: '2026-04-21T09:00:00',
    current: 1,
    min: 2,
    max: 6,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: null,
    status: 'pending',
    creatorName: 'David C.',
    creatorCredit: 'good',
  },
  {
    id: '7',
    title: 'Tacos & Margaritas Night 🌮',
    restaurant: 'La Monita, Sukhumvit',
    cuisine: 'mexican',
    cuisineEmoji: '🌮',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }],
    datetime: '2026-04-22T20:00:00',
    current: 5,
    min: 3,
    max: 10,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: 'Latin Night',
    status: 'open',
    creatorName: 'Carlos R.',
    creatorCredit: 'good',
  },
  {
    id: '8',
    title: 'Thai Home Cooking Class 🍛',
    restaurant: 'Silom Cooking Studio',
    cuisine: 'thai',
    cuisineEmoji: '🍛',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }, { key: 'zh', flag: '🇨🇳' }],
    datetime: '2026-04-23T11:00:00',
    current: 3,
    min: 4,
    max: 8,
    payment: 'hostTreats',
    paymentEmoji: '🎉',
    note: 'Cooking Together',
    status: 'open',
    creatorName: 'Noy S.',
    creatorCredit: 'excellent',
  },
];

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

// Filter options
const CUISINE_OPTIONS = ['japanese', 'thai', 'chinese', 'korean', 'italian', 'hotpot', 'mexican'] as const;
const LANGUAGE_OPTIONS = ['en', 'zh', 'th', 'ja', 'ko'] as const;
const PAYMENT_OPTIONS = ['hostTreats', 'splitBill', 'payOwn'] as const;

export default function MealsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter logic
  const filteredMeals = DEMO_MEALS.filter((meal) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        meal.title.toLowerCase().includes(q) ||
        meal.restaurant.toLowerCase().includes(q) ||
        meal.cuisine.toLowerCase().includes(q) ||
        meal.note?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Cuisine filter
    if (selectedCuisines.length > 0 && !selectedCuisines.includes(meal.cuisine)) {
      return false;
    }
    // Language filter
    if (selectedLanguages.length > 0) {
      const mealLangs = meal.languages.map((l) => l.key);
      if (!selectedLanguages.some((lang) => mealLangs.includes(lang))) return false;
    }
    // Payment filter
    if (selectedPayments.length > 0 && !selectedPayments.includes(meal.payment)) {
      return false;
    }
    return true;
  });

  const activeFilterCount =
    selectedCuisines.length + selectedLanguages.length + selectedPayments.length;

  const clearAllFilters = () => {
    setSelectedCuisines([]);
    setSelectedLanguages([]);
    setSelectedPayments([]);
    setSearchQuery('');
  };

  const toggleFilter = (
    category: 'cuisine' | 'language' | 'payment',
    value: string,
  ) => {
    const setter =
      category === 'cuisine'
        ? setSelectedCuisines
        : category === 'language'
          ? setSelectedLanguages
          : setSelectedPayments;
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
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
        {filteredMeals.length === 0 ? (
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
                      <span className="truncate">{meal.restaurant}</span>
                    </div>

                    {/* Languages + Note row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {meal.languages.map((lang) => (
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
                              meal.current >= meal.min
                                ? 'text-mint font-semibold'
                                : ''
                            }`}
                          >
                            {meal.current}/{meal.max}
                          </span>
                        </div>
                        <span className="text-sm">{meal.paymentEmoji}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {meal.creatorName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray">
                          {meal.creatorName}
                        </span>
                        <span
                          className={`text-[10px] ${
                            creditColors[meal.creatorCredit] || 'text-gray'
                          }`}
                        >
                          {creditStars[meal.creatorCredit] || '⭐⭐⭐'}
                        </span>
                      </div>
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
