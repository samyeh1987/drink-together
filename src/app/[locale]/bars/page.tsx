'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  X,
  SlidersHorizontal,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useBarStore } from '@/store/bar-store';
import type { BarCategory, BarCity } from '@/types';

const BAR_CATEGORIES: BarCategory[] = [
  'bar', 'cocktail_lounge', 'pub', 'club', 'karaoke',
  'rooftop', 'jazz', 'craft_beer', 'wine_bar', 'speakeasy', 'other',
];

const BAR_CITIES: BarCity[] = ['bangkok', 'kuala_lumpur'];

const CATEGORY_ICONS: Record<string, string> = {
  bar: '🍸', cocktail_lounge: '🥂', pub: '🍺', club: '🎶',
  karaoke: '🎤', rooftop: '🌃', jazz: '🎷', craft_beer: '🍻',
  wine_bar: '🍷', speakeasy: '🤫', other: '🍾',
};

export default function BarsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const {
    bars, isLoading, filters,
    setFilters, resetFilters, fetchBars,
  } = useBarStore();

  const [showFilters, setShowFilters] = useState(false);

  const fetchBarsWithDebounce = useCallback(() => {
    fetchBars();
  }, [fetchBars]);

  useEffect(() => {
    fetchBarsWithDebounce();
  }, [filters.city, filters.category, fetchBarsWithDebounce]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBarsWithDebounce();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, fetchBarsWithDebounce]);

  const activeFilterCount =
    (filters.city !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    resetFilters();
  };

  const toggleCity = (city: BarCity) => {
    setFilters({ city: filters.city === city ? 'all' : city });
  };

  const toggleCategory = (cat: BarCategory) => {
    setFilters({ category: filters.category === cat ? 'all' : cat });
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span className="text-gold text-xs">
        {'★'.repeat(full)}{half ? '☆' : ''}{'☆'.repeat(empty)}
      </span>
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
              className="text-xl font-bold text-white"
            >
              {t('bar.title')}
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-xs text-gray-light mb-3"
          >
            {t('bar.subtitle')}
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="relative mb-2"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-light" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder={t('bar.search')}
              className="input bg-dark/50 border-gray/30 text-white placeholder:text-gray-light pl-10 pr-10 py-2.5 text-sm"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: '' })}
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
                  ? 'bg-primary/20 text-primary'
                  : 'bg-dark/50 text-gray-light hover:bg-dark/70'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('common.filter')}</span>
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                {filters.city !== 'all' && (
                  <button
                    onClick={() => toggleCity(filters.city as BarCity)}
                    className="tag bg-primary/20 text-primary text-[11px] flex-shrink-0 gap-1"
                  >
                    {t(`bar.city.${filters.city}`)}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.category !== 'all' && (
                  <button
                    onClick={() => toggleCategory(filters.category as BarCategory)}
                    className="tag bg-coral/20 text-coral text-[11px] flex-shrink-0 gap-1"
                  >
                    {CATEGORY_ICONS[filters.category]} {t(`bar.category.${filters.category}`)}
                    <X className="w-3 h-3" />
                  </button>
                )}
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

        {/* Filter panel */}
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
                {/* City filter */}
                <div>
                  <p className="text-xs font-semibold text-gray-light mb-2">
                    📍 City
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setFilters({ city: 'all' })}
                      className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                        filters.city === 'all' ? 'bg-mint/20 text-mint' : 'bg-dark/50 text-gray-light'
                      }`}
                    >
                      {t('bar.allCities')}
                    </button>
                    {BAR_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => toggleCity(city)}
                        className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                          filters.city === city ? 'bg-mint/20 text-mint' : 'bg-dark/50 text-gray-light'
                        }`}
                      >
                        {t(`bar.city.${city}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <p className="text-xs font-semibold text-gray-light mb-2">
                    🍸 Type
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setFilters({ category: 'all' })}
                      className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                        filters.category === 'all' ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-light'
                      }`}
                    >
                      {t('bar.allCategories')}
                    </button>
                    {BAR_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                          filters.category === cat ? 'bg-primary/20 text-primary' : 'bg-dark/50 text-gray-light'
                        }`}
                      >
                        {CATEGORY_ICONS[cat]} {t(`bar.category.${cat}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bar list */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-gray-light">{t('common.loading')}</p>
          </div>
        ) : bars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-gray-light" />
            </div>
            <p className="text-sm text-gray-light mb-1">{t('bar.noResults')}</p>
            <p className="text-xs text-gray/60 mb-3">{t('bar.noResultsDesc')}</p>
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary font-medium hover:text-primary-light transition-colors"
            >
              {t('common.cancel')} {t('common.filter')}
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {bars.map((bar, i) => (
              <motion.div
                key={bar.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <Link href={`/${locale}/bars/${bar.id}`}>
                  <div className="card p-0 cursor-pointer group hover:border-primary/50 transition-all overflow-hidden">
                    {/* Cover image */}
                    <div className="relative h-36 w-full bg-gradient-to-br from-primary/20 to-dark overflow-hidden">
                      {bar.cover_image_url ? (
                        <img
                          src={bar.cover_image_url}
                          alt={bar.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-30">{CATEGORY_ICONS[bar.category] || '🍸'}</span>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Category badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[11px] text-white font-medium border border-white/10">
                          {CATEGORY_ICONS[bar.category]} {t(`bar.category.${bar.category}`)}
                        </span>
                      </div>
                      {/* City badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-mint font-medium border border-mint/20">
                          📍 {t(`bar.city.${bar.city}`)}
                        </span>
                      </div>
                      {/* Bottom info on image */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-bold text-white text-[16px] truncate drop-shadow-lg">
                          {locale === 'th' && bar.name_en ? bar.name_en : bar.name}
                        </h3>
                        {bar.name_en && locale !== 'en' && bar.name !== bar.name_en && (
                          <p className="text-white/70 text-[11px] truncate">{bar.name_en}</p>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3.5">
                      {/* Rating + checkins */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                          <span className="text-sm font-bold text-gold">{bar.average_rating > 0 ? bar.average_rating.toFixed(1) : '-'}</span>
                          {bar.rating_count > 0 && (
                            <span className="text-[11px] text-gray-light">({bar.rating_count})</span>
                          )}
                        </div>
                        {bar.min_spend && (
                          <span className="text-[11px] text-gray-light">
                            💰 ฿{bar.min_spend.toLocaleString()}+
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <div className="flex items-center gap-1 text-xs text-gray-light">
                        <MapPin className="w-3 h-3 text-mint flex-shrink-0" />
                        <span className="truncate">{bar.address}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                          {bar.images.length > 0 && (
                            <span className="tag text-[10px] bg-dark/50 text-gray-light flex-shrink-0">
                              📸 {bar.images.length}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-light group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Results count */}
        {bars.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-light mt-6 mb-4"
          >
            {bars.length} {t('bar.title').toLowerCase()}
          </motion.p>
        )}
      </div>
    </div>
  );
}
