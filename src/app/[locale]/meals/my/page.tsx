'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Users,
  Filter,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react';

// Demo data for My Meals page
const myMeals = [
  {
    id: '1',
    title: 'Friday Night Izakaya 🍶',
    restaurant: 'Ninja Izakaya, Thonglor',
    datetime: '2026-04-18T19:00:00',
    status: 'open',
    role: 'host',
    current: 4,
    max: 8,
    cuisineEmoji: '🍣',
    languages: [{ key: 'en', flag: '🇬🇧' }],
  },
  {
    id: '2',
    title: 'Dim Sum Brunch 🥟',
    restaurant: 'Tim Ho Wan, Central Embassy',
    datetime: '2026-04-15T10:00:00',
    status: 'completed',
    role: 'participant',
    current: 6,
    max: 6,
    cuisineEmoji: '🥟',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'en', flag: '🇬🇧' }],
  },
  {
    id: '3',
    title: 'Italian Wine Night 🍷',
    restaurant: 'Appia, Ekkamai',
    datetime: '2026-04-22T19:00:00',
    status: 'open',
    role: 'participant',
    current: 2,
    max: 6,
    cuisineEmoji: '🍕',
    languages: [{ key: 'en', flag: '🇬🇧' }],
  },
  {
    id: '4',
    title: 'Thai Street Food Tour 🛵',
    restaurant: 'Yaowarat (Chinatown)',
    datetime: '2026-04-12T18:00:00',
    status: 'completed',
    role: 'host',
    current: 5,
    max: 8,
    cuisineEmoji: '🍜',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }],
  },
];

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

export default function MyMealsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'hosting', label: 'Hosting' },
    { key: 'joined', label: 'Joined' },
    { key: 'completed', label: 'Completed' },
  ];

  // Filter meals based on active tab
  const filteredMeals = myMeals.filter((meal) => {
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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          {/* Title row */}
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-dark mb-4"
          >
            {t('nav.myMeals')}
          </motion.h1>

          {/* Tab pills - horizontal scroll */}
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
        {filteredMeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-light rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-7 h-7 text-gray-light" />
            </div>
            <p className="text-sm text-gray mb-1">No meals found</p>
            <p className="text-xs text-gray-light">
              {activeTab === 'all'
                ? 'Start by hosting or joining a meal!'
                : `You don't have any ${activeTab} meals yet.`}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMeals.map((meal, i) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/${locale}/meals/${meal.id}`}>
                  <div className="card p-4 cursor-pointer group">
                    {/* Top Row: Title + Status + Role */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-lg">{meal.cuisineEmoji}</span>
                        <h3 className="font-bold text-dark text-[15px] group-hover:text-primary transition-colors truncate">
                          {meal.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`tag text-[11px] ${
                            roleColors[meal.role] || 'bg-gray-100 text-gray'
                          }`}
                        >
                          {meal.role === 'host' ? t('meal.creator') : t('meal.joined')}
                        </span>
                        <span
                          className={`tag text-[11px] ${
                            statusColors[meal.status] || 'bg-gray-100 text-gray'
                          }`}
                        >
                          {t(`meal.status.${meal.status}`)}
                        </span>
                      </div>
                    </div>

                    {/* Restaurant */}
                    <div className="flex items-center gap-1 text-sm text-gray mb-2.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{meal.restaurant}</span>
                    </div>

                    {/* Languages row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {meal.languages.map((lang) => (
                        <span key={lang.key} className="tag text-[11px]">
                          {lang.flag} {t(`language.${lang.key}`)}
                        </span>
                      ))}
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
                          <span className="text-xs text-mint font-semibold">
                            {meal.current}/{meal.max}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-light">
                        <ChevronRight className="w-4 h-4" />
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
            {filteredMeals.length} {filteredMeals.length === 1 ? 'meal' : 'meals'} found
          </motion.p>
        )}
      </div>
    </div>
  );
}
