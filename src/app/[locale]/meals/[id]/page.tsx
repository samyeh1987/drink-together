'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Globe,
  ChevronRight,
} from 'lucide-react';

// Demo meal data
const meal = {
  id: '1',
  title: 'Friday Night Izakaya 🍶',
  restaurant: 'Ninja Izakaya, Thonglor',
  address: '123 Sukhumvit 55, Bangkok',
  cuisine: 'japanese',
  cuisineEmoji: '🍣',
  languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }],
  datetime: '2026-04-18T19:00:00',
  deadline: '2026-04-18T13:00:00',
  current: 4,
  min: 3,
  max: 8,
  payment: 'splitBill',
  paymentEmoji: '💰',
  budgetMin: 500,
  budgetMax: 1000,
  note: 'Language Exchange - let\'s practice English and Thai over great food!',
  description: 'Looking forward to a fun evening of Japanese food and language exchange. Everyone is welcome!',
  status: 'open',
  creatorName: 'Sarah K.',
  creatorCredit: 'good',
  creatorMeals: 12,
  participants: [
    { name: 'Sarah K.', avatar: null },
    { name: 'Alex W.', avatar: null },
    { name: 'Mike L.', avatar: null },
    { name: 'Yuki T.', avatar: null },
  ],
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-amber-100 text-amber-700',
  ongoing: 'bg-gold/10 text-gold',
  completed: 'bg-gray-100 text-gray',
};

const creditStars: Record<string, string> = {
  excellent: 5,
  good: 4,
  average: 3,
  newbie: 1,
};

export default function MealDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();

  const dateLocale = locale === 'th' ? 'th-TH' : locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  const isFull = meal.current >= meal.max;
  const progressPercent = Math.min((meal.current / meal.max) * 100, 100);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meal.title,
          text: `${meal.title} at ${meal.restaurant}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={`/${locale}/meals`}
            className="p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <h1 className="text-base font-semibold text-dark truncate">
            {t('meal.title')}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 -mr-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <Share2 className="w-5 h-5 text-dark" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Meal Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-4"
        >
          {/* Title + Status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-xl font-bold text-dark leading-tight">
                {meal.title}
              </h2>
            </div>
            <span className={`tag text-xs flex-shrink-0 ${statusColors[meal.status] || 'bg-gray-100 text-gray'}`}>
              {t(`meal.status.${meal.status}`)}
            </span>
          </div>

          {/* Restaurant */}
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark">{meal.restaurant}</p>
              <p className="text-xs text-gray truncate">{meal.address}</p>
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Globe className="w-4 h-4 text-gray flex-shrink-0" />
            {meal.languages.map((lang) => (
              <span key={lang.key} className="tag text-xs tag-active">
                {lang.flag} {t(`language.${lang.key}`)}
              </span>
            ))}
          </div>

          {/* Note/Topic */}
          {meal.note && (
            <div className="flex items-start gap-2 p-3 bg-light rounded-xl">
              <p className="text-sm text-gray-dark leading-relaxed">
                {meal.note}
              </p>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-4 space-y-4"
        >
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray mb-0.5">{t('meal.dateTime')}</p>
              <p className="text-sm font-medium text-dark">
                {new Date(meal.datetime).toLocaleDateString(dateLocale, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-dark">
              <Clock className="w-4 h-4 text-gray" />
              <span>
                {new Date(meal.datetime).toLocaleTimeString(dateLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Participants with Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-mint" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray">{t('meal.participants')}</p>
                <p className={`text-xs font-semibold ${isFull ? 'text-coral' : 'text-mint'}`}>
                  {meal.current}/{meal.max}
                </p>
              </div>
              <div className="h-2 bg-light rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className={`h-full rounded-full ${isFull ? 'bg-coral' : 'bg-mint'}`}
                />
              </div>
              <p className="text-xs text-gray mt-1">
                {meal.min - meal.current > 0
                  ? `${meal.min - meal.current} more to confirm`
                  : 'Minimum reached'}
              </p>
            </div>
          </div>

          {/* Payment + Budget */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray mb-0.5">{t('meal.paymentMethod')}</p>
              <p className="text-sm font-medium text-dark">
                {meal.paymentEmoji} {t(`payment.${meal.payment}`)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray mb-0.5">{t('meal.budget')}</p>
              <p className="text-sm font-semibold text-dark">
                {t('meal.currency')}{meal.budgetMin} - {t('meal.currency')}{meal.budgetMax}
              </p>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-coral" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray mb-0.5">{t('meal.deadline')}</p>
              <p className="text-sm font-medium text-dark">
                {new Date(meal.deadline).toLocaleDateString(dateLocale, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                {new Date(meal.deadline).toLocaleTimeString(dateLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Creator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="card p-4"
        >
          <p className="text-xs text-gray mb-3 uppercase tracking-wide">
            {t('meal.creator')}
          </p>
          <div className="flex items-center gap-3">
            {/* Avatar with initials */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-white">
                {meal.creatorName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-dark truncate">
                {meal.creatorName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs ${
                  meal.creatorCredit === 'excellent' ? 'text-gold' :
                  meal.creatorCredit === 'good' ? 'text-mint' : 'text-blue-500'
                }`}>
                  {'⭐'.repeat(creditStars[meal.creatorCredit] || 3)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{meal.creatorMeals}</p>
              <p className="text-xs text-gray">{t('meal.participants')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-light flex-shrink-0" />
          </div>
        </motion.div>

        {/* Participants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray uppercase tracking-wide">
              {t('meal.participants')}
            </p>
            <span className="text-xs text-mint font-medium">
              {meal.current}/{meal.max}
            </span>
          </div>
          <div className="flex items-center -space-x-2">
            {meal.participants.slice(0, 5).map((participant, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-mint/20 to-primary/20 border-2 border-white flex items-center justify-center"
                title={participant.name}
              >
                <span className="text-xs font-bold text-dark">
                  {participant.name.charAt(0)}
                </span>
              </motion.div>
            ))}
            {meal.participants.length > 5 && (
              <div className="w-10 h-10 rounded-full bg-light border-2 border-white flex items-center justify-center">
                <span className="text-xs font-semibold text-gray">
                  +{meal.participants.length - 5}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-lighter/50 safe-bottom">
        <div className="max-w-lg mx-auto">
          <button
            className={`btn-primary w-full py-3.5 flex items-center justify-center gap-2 ${
              isFull || meal.status === 'closed' || meal.status === 'cancelled'
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={isFull || meal.status === 'closed' || meal.status === 'cancelled'}
          >
            {isFull ? (
              <span>{t('meal.participants')} Full</span>
            ) : meal.status === 'closed' || meal.status === 'cancelled' ? (
              <span>{t('meal.status.' + meal.status)}</span>
            ) : (
              <>
                <Users className="w-5 h-5" />
                <span>{t('meal.join')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
