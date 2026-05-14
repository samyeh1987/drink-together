'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  UtensilsCrossed,
  Users,
  Award,
  Loader2,
  UserPlus,
  UserMinus,
  UserCheck,
  Ban,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { fetchProfile, fetchMyMeals, getOrCreateThread, fetchFollowerCount, fetchFollowingCount } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useSocialStore } from '@/store/social-store';

const languageFlags: Record<string, string> = {
  zh: '\ud83c\udde8\ud83c\uddf3',
  en: '\ud83c\uddec\ud83c\udde7',
  th: '\ud83c\uddf9\ud83c\udded',
  ja: '\ud83c\uddef\ud83c\uddf5',
  ko: '\ud83c\uddf0\ud83c\uddf7',
};

const genderEmoji: Record<string, string> = {
  male: '\ud83d\udc68',
  female: '\ud83d\udc69',
  prefer_not_to_say: '\u2728',
  other: '\u2728',
};

const REPORT_REASONS = ['harassment', 'spam', 'inappropriate', 'fake', 'other'] as const;

// User level info (Lv.1~Lv.5) - shared with profile page
const LEVEL_INFO: Record<number, {
  name: Record<string, string>;
  nameEn: string;
  emoji: string;
  gradient: string;
}> = {
  1: { name: { 'zh-CN': '新手酒友', th: 'มือใหม่', en: 'Newbie' }, nameEn: 'Newbie', emoji: '🍻', gradient: 'from-gray-500 to-gray-600' },
  2: { name: { 'zh-CN': '入門喝客', th: 'ดื่มเข้าใจ', en: 'Beginner' }, nameEn: 'Beginner', emoji: '🍸', gradient: 'from-blue-500 to-cyan-400' },
  3: { name: { 'zh-CN': '熟客酒鬼', th: 'เซียนดื่ม', en: 'Regular' }, nameEn: 'Regular', emoji: '🥃', gradient: 'from-purple-500 to-pink-400' },
  4: { name: { 'zh-CN': '派對達人', th: 'ปาร์ตี้มาสเตอร์', en: 'Party Master' }, nameEn: 'Party Master', emoji: '🎉', gradient: 'from-orange-500 to-yellow-400' },
  5: { name: { 'zh-CN': '傳奇酒神', th: 'ตำนานเหล้า', en: 'Legend' }, nameEn: 'Legend', emoji: '👑', gradient: 'from-yellow-400 to-amber-500' },
};

function getUserLevelInfo(level: number, locale: string) {
  const info = LEVEL_INFO[level] || LEVEL_INFO[1];
  return { ...info, displayName: info.name[locale] || info.nameEn };
}

function getCreditLevel(score: number): { level: string; stars: number; color: string } {
  if (score >= 100) return { level: 'excellent', stars: 5, color: 'text-gold' };
  if (score >= 80) return { level: 'good', stars: 4, color: 'text-mint' };
  if (score >= 50) return { level: 'average', stars: 3, color: 'text-blue-500' };
  if (score >= 20) return { level: 'newbie', stars: 2, color: 'text-gray' };
  return { level: 'low', stars: 1, color: 'text-coral' };
}

export default function UserProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const {
    followStatusMap,
    isLoadingFollow,
    loadFollowStatus,
    follow,
    unfollow,
    block,
    unblock,
    report,
  } = useSocialStore();

  const [profile, setProfile] = useState<any>(null);
  const [mealsHosted, setMealsHosted] = useState(0);
  const [mealsJoined, setMealsJoined] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isOwnProfile = currentUser?.id === userId;
  const creditInfo = profile ? getCreditLevel(profile.credit_score || 100) : null;
  const interests = (profile?.tags || [])
    .filter((tag: any) => tag?.category === 'interest')
    .map((tag: any) => tag?.i18n_key?.replace('tag.', '') || tag?.name);

  const followStatus = followStatusMap[userId];
  const isFollowing = followStatus?.isFollowing || false;
  const isMutual = followStatus?.isMutual || false;
  const isBlocked = followStatus?.isBlocked || false;
  const isFollowLoading = isLoadingFollow[userId] || false;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [profileData, myMeals, fCount, fwingCount] = await Promise.all([
        fetchProfile(userId),
        fetchMyMeals(userId),
        fetchFollowerCount(userId),
        fetchFollowingCount(userId),
      ]);
      setProfile(profileData);
      setFollowerCount(fCount);
      setFollowingCount(fwingCount);
      if (myMeals) {
        setMealsHosted(myMeals.filter((m: any) => m.role === 'host').length);
        setMealsJoined(myMeals.filter((m: any) => m.role === 'participant').length);
      }

      // Load follow status for other users
      if (!isOwnProfile) {
        await loadFollowStatus(userId);
      }

      setIsLoading(false);
    })();
  }, [userId, isOwnProfile, loadFollowStatus]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleFollow = async () => {
    const success = await follow(userId);
    if (success) {
      showToast(t('social.followSuccess'));
      setFollowerCount((c) => c + 1);
    }
  };

  const handleUnfollow = async () => {
    const success = await unfollow(userId);
    if (success) {
      showToast(t('social.unfollowSuccess'));
      setFollowerCount((c) => Math.max(0, c - 1));
    }
  };

  const handleBlock = async () => {
    const success = await block(userId);
    if (success) {
      showToast(t('social.blockSuccess'));
      setShowBlockConfirm(false);
      setShowMoreMenu(false);
    }
  };

  const handleUnblock = async () => {
    const success = await unblock(userId);
    if (success) {
      showToast(t('social.unblockSuccess'));
      setShowMoreMenu(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    const result = await report(userId, reportReason);
    if (result) {
      showToast(t('social.reportSuccess'));
      setShowReportModal(false);
      setReportReason('');
    } else {
      showToast(t('social.reportFail'), 'error');
    }
    setShowMoreMenu(false);
  };

  const handleSendMessage = async () => {
    const result = await getOrCreateThread(userId);
    if (result.success && result.threadId) {
      router.push(`/${locale}/messages/${result.threadId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark gap-4 px-4">
        <p className="text-gray">
          {locale === 'zh-CN' ? '\u627e\u4e0d\u5230\u6b64\u7528\u6236' : locale === 'th' ? '\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e19\u0e35\u0e49' : 'User not found'}
        </p>
        <Link href={`/${locale}`} className="btn-primary px-6 py-2.5 rounded-xl">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-dark">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center shadow-lg ${
              toast.type === 'success' ? 'bg-mint/90 text-gray-900' : 'bg-coral/90 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="w-full max-w-md bg-light rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{t('social.reportUser')}</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 text-gray hover:text-white">
                <X className="w-5 h-5" />
              </button>
              </div>
              <p className="text-sm text-gray mb-4">{t('social.reportReason')}</p>
              <div className="space-y-2 mb-6">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                      reportReason === reason
                        ? 'bg-primary text-white'
                        : 'bg-dark-card text-gray hover:bg-white/10'
                    }`}
                  >
                    {t(`social.reportReasons.${reason}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="w-full btn-primary py-3 rounded-xl disabled:opacity-40"
              >
                {t('social.reportUser')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Confirm Modal */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm bg-light rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-3">{t('social.block')}</h3>
              <p className="text-sm text-gray mb-6">{t('social.blockConfirm')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray/20 text-gray text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 py-2.5 rounded-xl bg-coral text-white text-sm font-medium"
                >
                  {t('social.block')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-primary to-coral pt-8 pb-16 px-4">
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <Link href={`/${locale}/profile`}>
              <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs hover:bg-white/30 transition-colors">
                {t('common.edit')}
              </span>
            </Link>
          </div>
        )}

        {!isOwnProfile && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {/* Dropdown menu */}
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-12 right-4 z-50 w-48 bg-light rounded-xl shadow-xl border border-gray/20 overflow-hidden"
                  >
                    {isBlocked ? (
                      <button
                        onClick={handleUnblock}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray hover:bg-gray-lighter/10 transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        {t('social.unblock')}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => { setShowBlockConfirm(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-coral hover:bg-coral/10 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          {t('social.block')}
                        </button>
                        <button
                          onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray hover:bg-gray-lighter/10 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          {t('social.reportUser')}
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-lg">
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {(profile.nickname || '?').charAt(0)}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="mt-4 text-2xl font-bold text-white">{profile.nickname || 'Anonymous'}</h1>
            {/* Level Badge */}
            {(() => {
              const lvl = getUserLevelInfo(profile.level || 1, locale);
              return (
                <div className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${lvl.gradient}`}>
                  <span className="text-sm">{lvl.emoji}</span>
                  <span className="text-xs font-bold text-white">Lv.{profile.level || 1} {lvl.displayName}</span>
                </div>
              );
            })()}
            <p className="mt-1 text-sm text-white/80 flex items-center gap-1.5">
              {profile.gender && <span>{genderEmoji[profile.gender] || ''}</span>}
              {profile.occupation && <span>{profile.occupation}</span>}
              {isMutual && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs text-white ml-1">
                  {t('social.mutualFollow')}
                </span>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10">
        {/* Bio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-4 mb-4"
        >
          {profile.bio ? (
            <p className="text-sm text-gray leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-gray-light italic">
              {locale === 'zh-CN' ? '\u9084\u6c92\u6709\u81ea\u6211\u4ecb\u7d39' : 'No bio yet'}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-light">
            {profile.age_range && <span>{profile.age_range}</span>}
            {profile.languages_spoken?.length > 0 && (
              <>
                {(profile.age_range || profile.email) && <span>\u2022</span>}
                <span>
                  {profile.languages_spoken.map((lang: string) => `${languageFlags[lang] || ''}`).join(' ')}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {/* Followers */}
          <Link
            href={`/${locale}/user/${userId}/followers`}
            className="card p-3 text-center block"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-xl font-bold text-white">{followerCount}</div>
            <div className="text-xs text-gray-light">{t('social.followers')}</div>
          </Link>

          {/* Following */}
          <Link
            href={`/${locale}/user/${userId}/following`}
            className="card p-3 text-center block"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-mint/10 flex items-center justify-center mb-2">
              <UserCheck className="w-5 h-5 text-mint" />
            </div>
            <div className="text-xl font-bold text-white">{followingCount}</div>
            <div className="text-xs text-gray-light">{t('social.following')}</div>
          </Link>

          {/* Credit Score */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gold/10 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl font-bold text-white">{profile.credit_score || 100}</div>
            <div className="text-xs text-gray-light">{t('profile.creditScore')}</div>
          </div>
        </motion.div>

        {/* Action buttons for other users */}
        {!isOwnProfile && !isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex gap-3 mb-4"
          >
            {/* Follow / Unfollow */}
            {isFollowing ? (
              <button
                onClick={handleUnfollow}
                disabled={isFollowLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-lighter/30 text-sm font-medium text-gray hover:bg-gray-lighter/10 transition-colors disabled:opacity-50"
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4" />
                )}
                {t('social.unfollow')}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {t('social.follow')}
              </button>
            )}

            {/* Message */}
            <button
              onClick={handleSendMessage}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-lighter/30 text-sm font-medium text-gray hover:bg-gray-lighter/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* View Moments */}
            <Link
              href={`/${locale}/user/${userId}/moments`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-lighter/30 text-sm font-medium text-gray hover:bg-gray-lighter/10 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Blocked banner */}
        {!isOwnProfile && isBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-4 mb-4 text-center"
          >
            <Ban className="w-8 h-8 text-coral mx-auto mb-2" />
            <p className="text-sm text-gray">{t('social.blocked')}</p>
            <button
              onClick={handleUnblock}
              className="mt-2 text-sm text-primary font-medium"
            >
              {t('social.unblock')}
            </button>
          </motion.div>
        )}

        {/* Credit Level Card */}
        {creditInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card p-4 mb-4"
          >
            <h3 className="font-bold text-white mb-3">{t('credit.title')}</h3>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/10 to-coral/10 rounded-xl">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < creditInfo.stars ? creditInfo.color : 'text-gray'
                    }`}
                    fill={i < creditInfo.stars ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white capitalize">
                  {t(`credit.${creditInfo.level}`)}
                </div>
                <div className="text-xs text-gray-light">
                  {profile.credit_score || 100} {t('profile.creditScore')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="card p-4 mb-4"
          >
            <h3 className="font-bold text-white mb-3">{t('profile.interests')}</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string) => (
                <span key={interest} className="tag tag-active">
                  {t(`tag.${interest}`)}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Languages */}
        {(profile.languages_spoken || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card p-4"
          >
            <h3 className="font-bold text-white mb-3">{t('profile.languagesSpoken')}</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.languages_spoken || []).map((lang: string) => (
                <span key={lang} className="tag">
                  {languageFlags[lang]} {t(`language.${lang}`)}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
