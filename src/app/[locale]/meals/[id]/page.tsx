'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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
  CheckCircle2,
  UserX,
  Loader2,
} from 'lucide-react';
import { useMealStore } from '@/store/meal-store';
import { useAuthStore } from '@/store/auth-store';
import { joinMeal, leaveMeal, cancelMeal } from '@/lib/api';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-amber-100 text-amber-700',
  ongoing: 'bg-gold/10 text-gold',
  completed: 'bg-gray-100 text-gray',
};

function getCreditLabel(score: number): string {
  if (score >= 120) return 'excellent';
  if (score >= 90) return 'good';
  if (score >= 60) return 'average';
  return 'newbie';
}

const creditStars: Record<string, number> = {
  excellent: 5,
  good: 4,
  average: 3,
  newbie: 1,
};

// Calculate hours until meal
function getHoursUntilMeal(datetime: string): number {
  const now = new Date();
  const mealTime = new Date(datetime);
  return (mealTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}

// Calculate hours since meal ended
function getHoursSinceEnded(datetime: string): number {
  const now = new Date();
  const mealTime = new Date(datetime);
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
  const { user } = useAuthStore();
  const { fetchMealById, currentMeal, isLoading } = useMealStore();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<Record<string, 'attended' | 'no_show' | null>>({});
  const [confirmationSaved, setConfirmationSaved] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const mealId = params.id as string;

  useEffect(() => {
    if (mealId) {
      fetchMealById(mealId);
    }
  }, [mealId, fetchMealById]);

  // Derived state
  const meal = currentMeal as any;
  const isCreator = user?.id === meal?.creator_id;
  const hasJoined = meal?.participants?.some(
    (p: any) => p.user_id === user?.id && (p.status === 'approved' || p.status === 'pending')
  );

  const dateLocale = locale === 'th' ? 'th-TH' : locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  const currentParticipants = (meal?.participants?.filter(
    (p: any) => p.status === 'approved'
  ).length || 0) + 1; // +1 for creator
  const isFull = currentParticipants >= (meal?.max_participants || 0);
  const progressPercent = meal ? Math.min((currentParticipants / (meal.max_participants || 1)) * 100, 100) : 0;
  const hoursUntil = meal ? getHoursUntilMeal(meal.datetime) : 0;
  const hoursSinceEnded = meal ? getHoursSinceEnded(meal.datetime) : 0;
  const notReachedMin = meal ? currentParticipants < (meal.min_participants || 0) : false;
  const canConfirmAttendance = isCreator && meal?.status === 'completed' && hoursSinceEnded > 0 && hoursSinceEnded <= 24;

  const hostPenalty = getHostPenalty(hoursUntil);
  const joinerPenalty = getJoinerPenalty(hoursUntil);

  const handleShare = async () => {
    if (navigator.share && meal) {
      try {
        await navigator.share({
          title: meal.title,
          text: `${meal.title} at ${meal.restaurant_name}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const handleJoinMeal = async () => {
    if (!meal || isFull) return;
    setJoining(true);
    setActionError(null);
    const result = await joinMeal(meal.id);
    setJoining(false);
    if (!result.success) {
      setActionError(result.error || 'Failed to join');
    } else {
      // Refresh meal data
      await fetchMealById(meal.id);
    }
  };

  const handleLeaveMeal = async () => {
    if (!meal) return;
    const result = await leaveMeal(meal.id);
    setShowLeaveModal(false);
    if (result.success) {
      await fetchMealById(meal.id);
    }
  };

  const handleCancelMeal = async () => {
    if (!meal) return;
    const result = await cancelMeal(meal.id);
    setShowCancelModal(false);
    if (result.success) {
      router.push(`/${locale}/meals`);
    }
  };

  const handleConfirmAttendance = () => {
    setConfirmationSaved(true);
  };

  if (isLoading || !meal) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-gray">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const creatorCredit = getCreditLabel(meal.creator?.credit_score || 100);

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
              <p className="text-sm font-medium text-dark">{meal.restaurant_name}</p>
              <p className="text-xs text-gray truncate">{meal.restaurant_address}</p>
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Globe className="w-4 h-4 text-gray flex-shrink-0" />
            {(meal._languages || []).map((lang: { key: string; flag: string }) => (
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
                  {currentParticipants}/{meal.max_participants}
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
                {notReachedMin
                  ? `${(meal.min_participants || 0) - currentParticipants} more to confirm`
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
                {meal._paymentEmoji || ''} {t(`payment.${meal.payment_method}`)}
              </p>
            </div>
            {meal.budget_min && meal.budget_max && (
              <div className="text-right">
                <p className="text-xs text-gray mb-0.5">{t('meal.budget')}</p>
                <p className="text-sm font-semibold text-dark">
                  {t('meal.currency')}{meal.budget_min} - {t('meal.currency')}{meal.budget_max}
                </p>
              </div>
            )}
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
              {/* Creator row (always present) */}
              <div className="flex items-center justify-between p-3 bg-light rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center overflow-hidden">
                    {meal.creator?.avatar_url ? (
                      <img src={meal.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-dark">
                        {(meal.creator?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">{meal.creator?.nickname || 'Host'}</p>
                    <p className="text-[10px] text-primary">{t('attendance.host')}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-mint/15 text-mint border border-mint/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('attendance.attended')}
                </span>
              </div>

              {/* Other participants */}
              {(meal.participants || []).filter((p: any) => p.status === 'approved').map((participant: any, index: number) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-light rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center overflow-hidden">
                      {participant.user?.avatar_url ? (
                        <img src={participant.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-dark">
                          {(participant.user?.nickname || '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{participant.user?.nickname || 'User'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setParticipantStatus(prev => ({ ...prev, [participant.id]: 'attended' }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        participantStatus[participant.id] === 'attended'
                          ? 'bg-mint/15 text-mint border border-mint/30'
                          : 'bg-white text-gray border border-gray-lighter hover:border-mint/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('attendance.attended')}
                    </button>
                    <button
                      onClick={() => setParticipantStatus(prev => ({ ...prev, [participant.id]: 'no_show' }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        participantStatus[participant.id] === 'no_show'
                          ? 'bg-coral/15 text-coral border border-coral/30'
                          : 'bg-white text-gray border border-gray-lighter hover:border-coral/30'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      {t('attendance.noShow')}
                    </button>
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
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center flex-shrink-0 overflow-hidden">
              {meal.creator?.avatar_url ? (
                <img src={meal.creator.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-white">
                  {(meal.creator?.nickname || '?').charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-dark truncate">
                {meal.creator?.nickname || 'Anonymous'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs ${
                  creatorCredit === 'excellent' ? 'text-gold' :
                  creatorCredit === 'good' ? 'text-mint' : 'text-blue-500'
                }`}>
                  {'⭐'.repeat(creditStars[creatorCredit] || 3)}
                </span>
              </div>
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
              {currentParticipants}/{meal.max_participants}
            </span>
          </div>
          {(meal.participants || []).length > 0 ? (
            <div className="flex items-center -space-x-2">
              {/* Creator avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-coral/30 border-2 border-white flex items-center justify-center overflow-hidden"
                title={meal.creator?.nickname || 'Host'}
              >
                {meal.creator?.avatar_url ? (
                  <img src={meal.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-dark">
                    {(meal.creator?.nickname || '?').charAt(0)}
                  </span>
                )}
              </motion.div>
              {/* Participant avatars */}
              {meal.participants
                .filter((p: any) => p.status === 'approved')
                .slice(0, showAllParticipants ? 20 : 4)
                .map((participant: any, index: number) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-mint/20 to-primary/20 border-2 border-white flex items-center justify-center overflow-hidden"
                    title={participant.user?.nickname || 'User'}
                  >
                    {participant.user?.avatar_url ? (
                      <img src={participant.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-dark">
                        {(participant.user?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </motion.div>
                ))
              }
            </div>
          ) : (
            <p className="text-sm text-gray text-center py-2">
              {t('meal.noParticipantsYet') || 'No participants yet. Be the first to join!'}
            </p>
          )}
        </motion.div>

        {/* Description */}
        {meal.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="card p-4"
          >
            <p className="text-xs text-gray mb-2 uppercase tracking-wide">
              {t('meal.description') || 'Description'}
            </p>
            <p className="text-sm text-gray-dark leading-relaxed">
              {meal.description}
            </p>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-lighter/50 safe-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Action error */}
          {actionError && (
            <p className="text-xs text-coral text-center">{actionError}</p>
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
              onClick={handleJoinMeal}
              disabled={isFull || joining || !user}
              className={`btn-primary w-full py-3.5 flex items-center justify-center gap-2 ${
                isFull || !user ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isFull ? (
                <span>{t('meal.participants')} Full</span>
              ) : !user ? (
                <span>{t('auth.signInRequired') || 'Sign in to join'}</span>
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
                  onClick={handleLeaveMeal}
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
    </div>
  );
}
