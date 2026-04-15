'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
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
  X,
  AlertTriangle,
  ShieldCheck,
  Camera,
  CheckCircle2,
  UserX,
  Image as ImageIcon,
  Eye,
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
  status: 'completed',
  creatorName: 'Sarah K.',
  creatorCredit: 'good',
  creatorMeals: 12,
  participants: [
    { name: 'Sarah K.', avatar: null, attended: true, confirmed: true },
    { name: 'Alex W.', avatar: null, attended: true, confirmed: true },
    { name: 'Mike L.', avatar: null, attended: false, confirmed: true },
    { name: 'Yuki T.', avatar: null, attended: true, confirmed: true },
  ],
  photos: [
    'https://picsum.photos/seed/meal1/600/600',
    'https://picsum.photos/seed/meal2/600/600',
    'https://picsum.photos/seed/meal3/600/600',
  ],
};

// Demo: current user is the creator
const isCreator = true;
// Demo: current user has joined
const hasJoined = true;

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-amber-100 text-amber-700',
  ongoing: 'bg-gold/10 text-gold',
  completed: 'bg-gray-100 text-gray',
};

const creditStars: Record<string, number> = {
  excellent: 5,
  good: 4,
  average: 3,
  newbie: 1,
};

// Calculate hours until meal
function getHoursUntilMeal(): number {
  const now = new Date();
  const mealTime = new Date(meal.datetime);
  return (mealTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}

// Calculate hours since meal ended
function getHoursSinceEnded(): number {
  const now = new Date();
  const mealTime = new Date(meal.datetime);
  return (now.getTime() - mealTime.getTime()) / (1000 * 60 * 60);
}

// Calculate penalty for host
function getHostPenalty(hours: number): { penalty: number; canCancel: boolean } {
  if (hours < 0) return { penalty: 0, canCancel: false };
  if (hours < 2) return { penalty: -25, canCancel: false };
  if (hours < 24) return { penalty: -15, canCancel: true };
  if (hours < 48) return { penalty: -8, canCancel: true };
  return { penalty: -3, canCancel: true };
}

// Calculate penalty for joiner
function getJoinerPenalty(hours: number): { penalty: number; canLeave: boolean } {
  if (hours < 0) return { penalty: 0, canLeave: false };
  if (hours < 2) return { penalty: -20, canLeave: false };
  if (hours < 24) return { penalty: -10, canLeave: true };
  if (hours < 48) return { penalty: -5, canLeave: true };
  return { penalty: -2, canLeave: true };
}

export default function MealDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [participantStatus, setParticipantStatus] = useState<Record<string, 'attended' | 'no_show' | null>>(
    Object.fromEntries(meal.participants.map((p, i) => [i, p.attended ? 'attended' : 'no_show']))
  );
  const [confirmationSaved, setConfirmationSaved] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  const dateLocale = locale === 'th' ? 'th-TH' : locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  const isFull = meal.current >= meal.max;
  const progressPercent = Math.min((meal.current / meal.max) * 100, 100);
  const hoursUntil = getHoursUntilMeal();
  const hoursSinceEnded = getHoursSinceEnded();
  const notReachedMin = meal.current < meal.min;
  const canConfirmAttendance = isCreator && meal.status === 'completed' && hoursSinceEnded > 0 && hoursSinceEnded <= 24;

  const hostPenalty = getHostPenalty(hoursUntil);
  const joinerPenalty = getJoinerPenalty(hoursUntil);

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

  const handleCancelMeal = () => {
    setShowCancelModal(false);
    router.push(`/${locale}`);
  };

  const handleConfirmAttendance = () => {
    setConfirmationSaved(true);
  };

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoViewer(true);
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

        {/* Attendance Confirmation (Host only, within 24h after meal) */}
        {canConfirmAttendance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="card p-4 border-2 border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-dark text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {t('attendance.title')}
                </h3>
                <p className="text-xs text-gray mt-1">{t('attendance.subtitle')}</p>
              </div>
              <span className="tag text-xs bg-primary/10 text-primary">
                {t('attendance.timeLeft', { hours: Math.max(0, Math.round(24 - hoursSinceEnded)) })}
              </span>
            </div>

            {/* Participant List with toggle */}
            <div className="space-y-2">
              {meal.participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-light rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-dark">
                        {participant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{participant.name}</p>
                      {index === 0 && (
                        <p className="text-[10px] text-primary">{t('attendance.host')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setParticipantStatus(prev => ({ ...prev, [index]: 'attended' }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        participantStatus[index] === 'attended'
                          ? 'bg-mint/15 text-mint border border-mint/30'
                          : 'bg-white text-gray border border-gray-lighter hover:border-mint/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('attendance.attended')}
                    </button>
                    {index !== 0 && (
                      <button
                        onClick={() => setParticipantStatus(prev => ({ ...prev, [index]: 'no_show' }))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          participantStatus[index] === 'no_show'
                            ? 'bg-coral/15 text-coral border border-coral/30'
                            : 'bg-white text-gray border border-gray-lighter hover:border-coral/30'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        {t('attendance.noShow')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={handleConfirmAttendance}
              className="btn-primary w-full py-3 mt-4"
            >
              {confirmationSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('attendance.saved')}
                </span>
              ) : (
                t('attendance.save')
              )}
            </button>
          </motion.div>
        )}

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
            {meal.participants.slice(0, showAllParticipants ? meal.participants.length : 5).map((participant, index) => (
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
            {meal.participants.length > 5 && !showAllParticipants && (
              <button
                onClick={() => setShowAllParticipants(true)}
                className="w-10 h-10 rounded-full bg-light border-2 border-white flex items-center justify-center"
              >
                <span className="text-xs font-semibold text-gray">
                  +{meal.participants.length - 5}
                </span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Meal Photos (for completed meals) */}
        {meal.status === 'completed' && meal.photos && meal.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-dark text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                {t('mealPhotos.title')}
              </h3>
              <span className="text-xs text-gray">{meal.photos.length} {t('mealPhotos.photos')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {meal.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => openPhotoViewer(index)}
                  className="aspect-square rounded-xl overflow-hidden bg-light relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Meal photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
              {/* Upload button (demo) */}
              <button className="aspect-square rounded-xl border-2 border-dashed border-gray-lighter flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Camera className="w-5 h-5 text-gray-light" />
                <span className="text-[10px] text-gray-light">{t('mealPhotos.addPhoto')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-lighter/50 safe-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Completed meal: Upload photos / View gallery */}
          {meal.status === 'completed' && (
            <Link href={`/${locale}/gallery`}>
              <button className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>{t('mealPhotos.viewGallery')}</span>
              </button>
            </Link>
          )}

          {/* Creator: Cancel Meal button */}
          {isCreator && meal.status === 'open' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-outline w-full py-3 flex items-center justify-center gap-2 text-coral border-coral/30 hover:bg-coral/5"
            >
              <X className="w-5 h-5" />
              <span>{t('meal.cancel')}</span>
            </button>
          )}

          {/* Joiner: Leave button */}
          {!isCreator && hasJoined && meal.status === 'open' && (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="btn-outline w-full py-3 flex items-center justify-center gap-2 text-coral border-coral/30 hover:bg-coral/5"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{t('meal.leave')}</span>
            </button>
          )}

          {/* Join button (non-participant) */}
          {!isCreator && !hasJoined && meal.status === 'open' && (
            <button
              className={`btn-primary w-full py-3.5 flex items-center justify-center gap-2 ${
                isFull ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isFull}
            >
              {isFull ? (
                <span>{t('meal.participants')} Full</span>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>{t('meal.join')}</span>
                </>
              )}
            </button>
          )}

          {/* View Cancel Rules link */}
          {(isCreator || hasJoined) && meal.status !== 'completed' && (
            <Link href={`/${locale}/rules`} className="block">
              <div className="text-center text-xs text-gray py-1">
                {t('credit.rules')} →
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Cancel Meal Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 pb-8 safe-bottom"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-bold text-dark text-center mb-2">
                {t('cancelConfirm.title')}
              </h3>
              <p className="text-sm text-gray text-center mb-4">
                {t('cancelConfirm.message')}
              </p>

              {/* Penalty Warning */}
              <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200/50">
                {notReachedMin ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-mint" />
                    <p className="text-sm text-mint font-medium">{t('cancelConfirm.noPenalty')}</p>
                  </div>
                ) : !hostPenalty.canCancel ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-coral" />
                    <p className="text-sm text-coral font-medium">{t('cancelConfirm.cannotCancel')}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-amber-700">
                      {t('cancelConfirm.penalty')}：{' '}
                      <span className="font-bold">{hostPenalty.penalty} {t('credit.title')}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-outline flex-1 py-3"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCancelMeal}
                  disabled={!hostPenalty.canCancel}
                  className={`btn-primary flex-1 py-3 ${
                    !hostPenalty.canCancel ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t('cancelConfirm.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Meal Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeaveModal(false)} />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 pb-8 safe-bottom"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-dark text-center mb-2">
                {t('cancelConfirm.titleLeave')}
              </h3>
              <p className="text-sm text-gray text-center mb-4">
                {t('cancelConfirm.messageLeave')}
              </p>

              {/* Penalty Warning */}
              <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200/50">
                {notReachedMin ? (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-mint" />
                    <p className="text-sm text-mint font-medium">{t('cancelConfirm.noPenalty')}</p>
                  </div>
                ) : !joinerPenalty.canLeave ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-coral" />
                    <p className="text-sm text-coral font-medium">{t('cancelConfirm.cannotLeave')}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-amber-700">
                      {t('cancelConfirm.penalty')}：{' '}
                      <span className="font-bold">{joinerPenalty.penalty} {t('credit.title')}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="btn-outline flex-1 py-3"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  disabled={!joinerPenalty.canLeave}
                  className={`btn-primary flex-1 py-3 ${
                    !joinerPenalty.canLeave ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t('cancelConfirm.confirmLeave')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {showPhotoViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setShowPhotoViewer(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {/* Navigation arrows */}
            {selectedPhotoIndex > 0 && (
              <button
                onClick={() => setSelectedPhotoIndex(prev => prev - 1)}
                className="absolute left-4 p-2 rounded-full bg-white/20 text-white z-10"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
            )}
            {selectedPhotoIndex < meal.photos.length - 1 && (
              <button
                onClick={() => setSelectedPhotoIndex(prev => prev + 1)}
                className="absolute right-4 p-2 rounded-full bg-white/20 text-white z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <motion.div
              key={selectedPhotoIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full flex items-center justify-center p-8"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.photos[selectedPhotoIndex]}
                alt={`Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </motion.div>
            {/* Photo counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/20 text-white text-xs">
              {selectedPhotoIndex + 1} / {meal.photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
