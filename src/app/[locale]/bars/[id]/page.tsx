'use client';

import { useState, useEffect, use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Navigation,
  Share2,
  Heart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useBarStore } from '@/store/bar-store';
import { checkinBar, rateBar } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { BarRating } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  bar: '🍸', cocktail_lounge: '🥂', pub: '🍺', club: '🎶',
  karaoke: '🎤', rooftop: '🌃', jazz: '🎷', craft_beer: '🍻',
  wine_bar: '🍷', speakeasy: '🤫', other: '🍾',
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function BarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    currentBar: bar,
    ratings,
    isLoading,
    hasCheckedInToday,
    hasRated,
    todayCheckinCount,
    fetchBarById,
    fetchRatings,
    checkCheckinStatus,
    checkRatingStatus,
    fetchTodayCheckinCount,
  } = useBarStore();

  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ratingForm, setRatingForm] = useState({
    environment_rating: 0,
    service_rating: 0,
    value_rating: 0,
    comment: '',
  });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingResult, setRatingResult] = useState<string | null>(null);

  // Fetch bar data
  useEffect(() => {
    if (id) {
      fetchBarById(id);
      fetchRatings(id);
      checkCheckinStatus(id);
      checkRatingStatus(id);
      fetchTodayCheckinCount(id);
    }
  }, [id, fetchBarById, fetchRatings, checkCheckinStatus, checkRatingStatus, fetchTodayCheckinCount]);

  // Checkin handler
  const handleCheckin = async () => {
    if (!bar || checkinLoading) return;
    setCheckinLoading(true);
    setCheckinResult(null);

    try {
      // Request geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const result = await checkinBar(
        bar.id,
        position.coords.latitude,
        position.coords.longitude,
      );

      if (result.success) {
        setCheckinResult(t('bar.checkinSuccess', { coins: result.coins || 5 }));
        await checkCheckinStatus(bar.id);
        await fetchTodayCheckinCount(bar.id);
      } else {
        const errorMap: Record<string, string> = {
          AUTH: t('bar.checkinFailAuth'),
          TODAY: t('bar.checkinFailToday'),
          DISTANCE: t('bar.checkinFailDistance'),
        };
        setCheckinResult(errorMap[result.error || ''] || t('bar.checkinFailError'));
      }
    } catch {
      setCheckinResult(t('bar.checkinFailError'));
    } finally {
      setCheckinLoading(false);
      setTimeout(() => setCheckinResult(null), 4000);
    }
  };

  // Rating handler
  const handleSubmitRating = async () => {
    if (!bar || ratingLoading) return;
    if (ratingForm.environment_rating === 0 || ratingForm.service_rating === 0 || ratingForm.value_rating === 0) {
      setRatingResult('Please rate all 3 categories');
      return;
    }

    setRatingLoading(true);
    setRatingResult(null);

    const result = await rateBar(bar.id, ratingForm);
    if (result.success) {
      setRatingResult(t('bar.rateSuccess'));
      await fetchRatings(bar.id);
      await fetchBarById(bar.id);
      await checkRatingStatus(bar.id);
      setTimeout(() => {
        setShowRatingModal(false);
        setRatingForm({ environment_rating: 0, service_rating: 0, value_rating: 0, comment: '' });
        setRatingResult(null);
      }, 1500);
    } else {
      const errorMap: Record<string, string> = {
        AUTH: t('bar.rateFailAuth'),
        EXISTS: t('bar.rateFailExists'),
      };
      setRatingResult(errorMap[result.error || ''] || t('bar.rateFailError'));
    }
    setRatingLoading(false);
  };

  // Opening hours
  const isOpenNow = () => {
    if (!bar?.opening_hours) return false;
    const day = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const hours = bar.opening_hours[day];
    if (!hours || hours === 'closed' || hours === 'Closed' || hours === '休息' || hours === 'หยุด') return false;

    const [open, close] = hours.split('-').map((s) => s.trim());
    if (!open || !close) return false;

    const now = new Date();
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;

    // Handle overnight (e.g., 18:00-02:00)
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  const renderStars = (rating: number, size = 'sm') => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    const sizeClass = size === 'sm' ? 'text-xs' : 'text-base';
    return (
      <span className={`text-gold ${sizeClass}`}>
        {'★'.repeat(full)}{half ? '☆' : ''}{'☆'.repeat(empty)}
      </span>
    );
  };

  if (isLoading && !bar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!bar) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7 text-gray-light" />
        </div>
        <p className="text-sm text-gray-light">Bar not found</p>
        <Link href={`/${locale}/bars`} className="text-sm text-primary font-medium mt-3">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const allImages = bar.cover_image_url
    ? [bar.cover_image_url, ...bar.images.filter((img) => img !== bar.cover_image_url)]
    : bar.images;

  return (
    <div className="min-h-screen pb-8">
      {/* Cover Image */}
      <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-dark">
        {allImages.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={allImages[currentImageIndex]}
                alt={`${bar.name} photo ${currentImageIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            {/* Image navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === currentImageIndex
                          ? 'bg-white w-4 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                          : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-20">{CATEGORY_ICONS[bar.category] || '🍸'}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D1A] via-transparent to-[#0D0D1A]/30" />

        {/* Top action buttons */}
        <div className="absolute top-12 left-4 right-4 flex justify-between z-10">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <Heart className="w-4.5 h-4.5" />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <Share2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bar Info */}
      <div className="px-4 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Name & Category */}
          <h1 className="text-2xl font-black text-white mb-1">
            {locale === 'th' && bar.name_en ? bar.name_en : bar.name}
          </h1>
          {bar.name_en && locale !== 'en' && bar.name !== bar.name_en && (
            <p className="text-sm text-primary font-medium mb-2">{bar.name_en}</p>
          )}
          <p className="text-sm text-gray-light mb-3">
            {CATEGORY_ICONS[bar.category]} {t(`bar.category.${bar.category}`)} · 📍 {t(`bar.city.${bar.city}`)}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-base font-bold text-gold">{bar.average_rating > 0 ? bar.average_rating.toFixed(1) : '-'}</span>
              <span className="text-xs text-gray-light">({bar.rating_count} {t('bar.ratings')})</span>
            </div>
            {bar.min_spend && (
              <span className="text-sm text-gray-light">
                💰 ฿{bar.min_spend.toLocaleString()}+ {t('bar.minSpend')}
              </span>
            )}
            {isOpenNow() && (
              <span className="px-2 py-0.5 rounded-full bg-mint/20 text-mint text-xs font-semibold">
                {t('bar.openNow')}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5 px-4 mb-4">
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          href={`https://www.google.com/maps/dir/?api=1&destination=${bar.latitude},${bar.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
        >
          <Navigation className="w-4 h-4" />
          {t('bar.navigate')}
        </motion.a>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setShowRatingModal(true)}
          disabled={hasRated}
          className={`flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
            hasRated
              ? 'border-mint/30 bg-mint/10 text-mint'
              : 'border-primary/30 bg-dark text-primary hover:bg-primary/10'
          }`}
        >
          <Star className={`w-4 h-4 ${hasRated ? 'fill-mint' : ''}`} />
          {hasRated ? t('bar.checkedIn') : t('bar.rate')}
        </motion.button>
      </div>

      {/* Check-in Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mb-4"
      >
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 to-coral/15 border border-primary/40 flex items-center gap-3 shadow-lg shadow-primary/5">
          <span className="text-3xl">🍺</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">{t('bar.checkinBanner')}</p>
            <p className="text-[11px] text-gray-light mt-0.5">
              {t('bar.checkinBannerDesc', { coins: 5 })}
            </p>
            {todayCheckinCount > 0 && (
              <p className="text-[11px] text-mint mt-0.5">
                🎉 {t('bar.todayCheckins')}: {todayCheckinCount}
              </p>
            )}
          </div>
          {hasCheckedInToday ? (
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-mint/20 text-mint text-xs font-semibold flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('bar.checkedIn')}
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checkinLoading || !user}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold flex-shrink-0 hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkinLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('bar.checkin')
              )}
            </button>
          )}
        </div>

        {/* Checkin result toast */}
        <AnimatePresence>
          {checkinResult && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`mt-2 px-3.5 py-2 rounded-xl text-xs font-medium ${
                checkinResult.includes('+') || checkinResult.includes('✓') || checkinResult.includes('成功')
                  ? 'bg-mint/20 text-mint'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {checkinResult}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info Cards */}
      <div className="px-4 mb-4">
        <div className="glass border border-gray/30 rounded-2xl overflow-hidden">
          {/* Opening Hours */}
          {bar.opening_hours && Object.keys(bar.opening_hours).length > 0 && (
            <div className="p-4 border-b border-gray/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-2">{t('bar.openingHours')}</p>
                  <div className="space-y-1">
                    {DAY_ORDER.map((day) => {
                      const hours = bar.opening_hours[day];
                      if (!hours) return null;
                      const isToday = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day;
                      return (
                        <div key={day} className={`flex items-center justify-between text-xs ${isToday ? 'text-mint font-medium' : 'text-gray-light'}`}>
                          <span>{t(`bar.days.${day}`)}</span>
                          <span>
                            {hours === 'closed' || hours === 'Closed' || hours === '休息' || hours === 'หยุด'
                              ? t('bar.days.closed')
                              : hours}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          <div className="p-4 border-b border-gray/20">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">{t('bar.address')}</p>
                <p className="text-xs text-gray-light">{bar.address}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {bar.description && (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">✨</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">{t('bar.description')}</p>
                  <p className="text-xs text-gray-light leading-relaxed whitespace-pre-line">{bar.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photos Gallery */}
      {allImages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <h2 className="text-sm font-bold text-white">📸 {t('bar.photos')}</h2>
            {allImages.length > 1 && (
              <span className="text-[11px] text-gray-light">
                {t('bar.viewAllPhotos', { count: allImages.length })}
              </span>
            )}
          </div>
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {allImages.map((img, i) => (
              <div
                key={i}
                className="min-w-[140px] h-[100px] rounded-xl overflow-hidden flex-shrink-0 border border-gray/20 cursor-pointer"
                onClick={() => setCurrentImageIndex(i)}
              >
                <img
                  src={img}
                  alt={`${bar.name} photo ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">💬 {t('bar.reviews')}</h2>
          {ratings.length > 0 && (
            <span className="text-[11px] text-gray-light">
              {t('bar.viewAllReviews', { count: bar.rating_count })}
            </span>
          )}
        </div>

        {ratings.length === 0 ? (
          <div className="glass border border-gray/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm text-gray-light mb-1">{t('bar.noReviews')}</p>
            <p className="text-xs text-gray/60">{t('bar.noReviewsDesc')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ratings.slice(0, 5).map((rating: BarRating) => {
              const avgRating = (rating.environment_rating + rating.service_rating + rating.value_rating) / 3;
              return (
                <div key={rating.id} className="glass border border-gray/20 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-coral/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {rating.user?.avatar_url ? (
                        <img src={rating.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {(rating.user?.nickname || '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {rating.user?.nickname || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-gray-light">
                        {new Date(rating.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    {renderStars(avgRating)}
                  </div>

                  {/* Rating breakdown */}
                  <div className="flex gap-3 mb-2">
                    <span className="text-[10px] text-gray-light">
                      {t('bar.rateEnvironment')} {rating.environment_rating}/5
                    </span>
                    <span className="text-[10px] text-gray-light">
                      {t('bar.rateService')} {rating.service_rating}/5
                    </span>
                    <span className="text-[10px] text-gray-light">
                      {t('bar.rateValue')} {rating.value_rating}/5
                    </span>
                  </div>

                  {rating.comment && (
                    <p className="text-xs text-gray-light leading-relaxed">{rating.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !ratingLoading && setShowRatingModal(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-dark border-t border-primary/30 rounded-t-3xl p-5 max-w-lg mx-auto safe-bottom"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray/50 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">{t('bar.rate')}</h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="w-8 h-8 rounded-full bg-dark border border-gray/30 flex items-center justify-center text-gray-light hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rating inputs */}
              <div className="space-y-4 mb-5">
                {/* Environment */}
                <div>
                  <p className="text-sm font-medium text-gray-light mb-2">🌟 {t('bar.rateEnvironment')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setRatingForm((prev) => ({ ...prev, environment_rating: v }))}
                        className="text-2xl transition-transform hover:scale-110"
                      >
                        {v <= ratingForm.environment_rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service */}
                <div>
                  <p className="text-sm font-medium text-gray-light mb-2">😎 {t('bar.rateService')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setRatingForm((prev) => ({ ...prev, service_rating: v }))}
                        className="text-2xl transition-transform hover:scale-110"
                      >
                        {v <= ratingForm.service_rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <p className="text-sm font-medium text-gray-light mb-2">💰 {t('bar.rateValue')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setRatingForm((prev) => ({ ...prev, value_rating: v }))}
                        className="text-2xl transition-transform hover:scale-110"
                      >
                        {v <= ratingForm.value_rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <p className="text-sm font-medium text-gray-light mb-2">{t('bar.rateComment')}</p>
                  <textarea
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder={t('bar.rateCommentPlaceholder')}
                    className="input bg-dark/50 border-gray/30 text-white placeholder:text-gray-light py-2.5 text-sm min-h-[80px] resize-none"
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Result message */}
              {ratingResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium ${
                    ratingResult.includes('成功') || ratingResult.includes('成功')
                      ? 'bg-mint/20 text-mint'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {ratingResult}
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmitRating}
                disabled={ratingLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {ratingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('bar.rateSubmit')
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
