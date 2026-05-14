'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Edit3,
  Star,
  UtensilsCrossed,
  Users,
  Award,
  ChevronRight,
  ClipboardList,
  LogOut,
  Loader2,
  Coins,
  BookOpen,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchProfile, fetchCreditHistory, fetchMyMeals, fetchFollowerCount, fetchFollowingCount } from '@/lib/api';
import ProfileForm from '@/components/profile/ProfileForm';
import { cn } from '@/lib/utils';


// Language display mapping
const languageFlags: Record<string, string> = {
  zh: '🇨🇳',
  en: '🇬🇧',
  th: '🇹🇭',
  ja: '🇯🇵',
  ko: '🇰🇷',
};

// Zodiac emoji mapping
const ZODIAC_EMOJI: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

// Gender emoji (stored in occupation or not used)
// const genderEmoji: Record<string, string> = { ... };

// Credit level calculation
function getCreditLevel(score: number): { level: string; stars: number; color: string } {
  if (score >= 100) return { level: 'excellent', stars: 5, color: 'text-gold' };
  if (score >= 80) return { level: 'good', stars: 4, color: 'text-mint' };
  if (score >= 50) return { level: 'average', stars: 3, color: 'text-blue-500' };
  if (score >= 20) return { level: 'newbie', stars: 2, color: 'text-gray' };
  return { level: 'low', stars: 1, color: 'text-coral' };
}

// User level info (Lv.1~Lv.5)
const LEVEL_INFO: Record<number, {
  name: Record<string, string>;
  nameEn: string;
  emoji: string;
  gradient: string;
  requirement: Record<string, string>;
}> = {
  1: {
    name: { 'zh-CN': '新手酒友', th: 'มือใหม่', en: 'Newbie' },
    nameEn: 'Newbie',
    emoji: '🍻',
    gradient: 'from-gray-500 to-gray-600',
    requirement: { 'zh-CN': '預設等級', th: 'ระดับเริ่มต้น', en: 'Default level' },
  },
  2: {
    name: { 'zh-CN': '入門喝客', th: 'ดื่มเข้าใจ', en: 'Beginner' },
    nameEn: 'Beginner',
    emoji: '🍸',
    gradient: 'from-blue-500 to-cyan-400',
    requirement: { 'zh-CN': '完成 3 場酒局', th: 'เข้าร่วม 3 งาน', en: 'Complete 3 drinks' },
  },
  3: {
    name: { 'zh-CN': '熟客酒鬼', th: 'เซียนดื่ม', en: 'Regular' },
    nameEn: 'Regular',
    emoji: '🥃',
    gradient: 'from-purple-500 to-pink-400',
    requirement: { 'zh-CN': '10 場 + 5 篇動態', th: '10 งาน + 5 โพสต์', en: '10 drinks + 5 posts' },
  },
  4: {
    name: { 'zh-CN': '派對達人', th: 'ปาร์ตี้มาสเตอร์', en: 'Party Master' },
    nameEn: 'Party Master',
    emoji: '🎉',
    gradient: 'from-orange-500 to-yellow-400',
    requirement: { 'zh-CN': '25 場 + 3 次發起 + 評分≥4.2', th: '25 งาน + 3 จัด + คะแนน≥4.2', en: '25 drinks + 3 hosted + rating≥4.2' },
  },
  5: {
    name: { 'zh-CN': '傳奇酒神', th: 'ตำนานเหล้า', en: 'Legend' },
    nameEn: 'Legend',
    emoji: '👑',
    gradient: 'from-yellow-400 to-amber-500',
    requirement: { 'zh-CN': '50 場 + 推薦 10 次 + 帳號≥90天', th: '50 งาน + 10 แนะนำ + บัญชี≥90วัน', en: '50 drinks + 10 recommends + 90d account' },
  },
};

function getUserLevelInfo(level: number, locale: string) {
  const info = LEVEL_INFO[level] || LEVEL_INFO[1];
  const nextInfo = LEVEL_INFO[level + 1];
  return {
    ...info,
    displayName: info.name[locale] || info.nameEn,
    displayReq: info.requirement[locale] || info.requirement.en,
    nextLevel: nextInfo ? {
      level: level + 1,
      name: nextInfo.name[locale] || nextInfo.nameEn,
      requirement: nextInfo.requirement[locale] || nextInfo.requirement.en,
    } : null,
  };
}

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, signOut, isLoading: authLoading } = useAuthStore();
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [mealsHosted, setMealsHosted] = useState(0);
  const [mealsJoined, setMealsJoined] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<{ id: string; url: string }[]>([]);

  const creditInfo = getCreditLevel(user?.credit_score || 100);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [history, myMeals, fCount, fwingCount] = await Promise.all([
        fetchCreditHistory(user!.id),
        fetchMyMeals(user!.id),
        fetchFollowerCount(user!.id),
        fetchFollowingCount(user!.id),
      ]);
      setCreditHistory(history);
      setMealsHosted(myMeals.filter((m: any) => m.role === 'host').length);
      setMealsJoined(myMeals.filter((m: any) => m.role === 'participant').length);
      setFollowerCount(fCount);
      setFollowingCount(fwingCount);

      // Fetch recent photos from user's moments
      try {
        const { fetchMoments } = await import('@/lib/api');
        const result = await fetchMoments({ userId: user.id, limit: 10 });
        if (result && result.length > 0) {
          const photos: { id: string; url: string }[] = [];
          result.forEach((m: any) => {
            if (m.images && m.images.length > 0) {
              m.images.forEach((url: string, imgIdx: number) => {
                photos.push({ id: `${m.id}-${imgIdx}`, url });
              });
            }
          });
          setRecentPhotos(photos.slice(0, 6));
        }
      } catch (e) {
        // silently ignore
      }
    })();
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark gap-4 px-4">
        <p className="text-gray">{locale === 'zh-CN' ? '請先登入查看個人資料' : 'Please log in to view profile'}</p>
        <Link href={`/${locale}/auth/login`} className="btn-primary px-6 py-2.5 rounded-xl">
          {locale === 'zh-CN' ? '登入' : 'Login'}
        </Link>
      </div>
    );
  }

  const interests = (user.tags || [])
    .filter((tag: any) => tag?.category === 'interest')
    .map((tag: any) => tag?.i18n_key?.replace('tag.', '') || tag?.name);

  return (
    <div className="min-h-screen pb-20 bg-dark">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-primary to-coral pt-8 pb-16 px-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => signOut().then(() => router.push(`/${locale}/auth/login`))}
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setShowEditForm(true)} className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
            <Edit3 className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-lg">
              {user.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {(user.nickname || '?').charAt(0)}
                </span>
              )}
            </div>

            {/* Name & Bio */}
            <h1 className="mt-4 text-2xl font-bold text-white">{user.nickname || 'Anonymous'}</h1>
            {/* Level Badge */}
            {(() => {
              const lvl = getUserLevelInfo((user as any).level || 1, locale);
              return (
                <div className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${lvl.gradient}`}>
                  <span className="text-sm">{lvl.emoji}</span>
                  <span className="text-xs font-bold text-white">Lv.{(user as any).level || 1} {lvl.displayName}</span>
                </div>
              );
            })()}
            <p className="mt-1 text-sm text-white/80 flex items-center gap-1.5">
              {(user as any).occupation && <span>{(user as any).occupation}</span>}
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
          {user.bio ? (
            <p className="text-sm text-gray leading-relaxed">{user.bio}</p>
          ) : (
            <p className="text-sm text-gray-light italic">{locale === 'zh-CN' ? '還沒有自我介紹' : 'No bio yet'}</p>
          )}

          {/* Detail tags row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {user.age_range && (
              <span className="tag bg-white/10 text-gray text-xs">🔢 {user.age_range}</span>
            )}
            {(user as any).city && (
              <span className="tag bg-white/10 text-gray text-xs">📍 {(user as any).city}</span>
            )}
            {(user as any).occupation && (
              <span className="tag bg-white/10 text-gray text-xs">💼 {(user as any).occupation}</span>
            )}
            {(user as any).zodiac && (
              <span className="tag bg-primary/20 text-primary text-xs">
                {ZODIAC_EMOJI[(user as any).zodiac]} {(user as any).zodiac.charAt(0).toUpperCase() + (user as any).zodiac.slice(1)}
              </span>
            )}
            {(user as any).height && (
              <span className="tag bg-white/10 text-gray text-xs">📏 {(user as any).height} cm</span>
            )}
            {(user as any).weight && (
              <span className="tag bg-white/10 text-gray text-xs">⚖️ {(user as any).weight} kg</span>
            )}
            {(user as any).birthday && (
              <span className="tag bg-gold/20 text-gold text-xs">
                🎂 {new Date((user as any).birthday).toLocaleDateString(
                  locale === 'zh-CN' ? 'zh-TW' : 'en-US',
                  { month: 'short', day: 'numeric' }
                )}
              </span>
            )}
          </div>
        </motion.div>

        {/* Photo Gallery - shows photos from user's moments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">{t('profile.photos')}</h3>
            <Link href={`/${locale}/user/${user.id}/moments`} className="text-xs text-primary">
              {locale === 'zh-CN' ? '查看全部' : 'View all'} →
            </Link>
          </div>
          {recentPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-xl overflow-hidden bg-light"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-light text-center py-4">
              {locale === 'zh-CN' ? '發布動態時附上照片，會顯示在這裡' : 'Add photos to your moments to see them here'}
            </p>
          )}
        </motion.div>

        {/* Level Progress Card */}
        {(() => {
          const currentLevel = (user as any).level || 1;
          const levelInfo = getUserLevelInfo(currentLevel, locale);
          if (currentLevel >= 5) {
            // Max level - show achievement card
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="card p-4 mb-4 border-gold/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gold">{locale === 'zh-CN' ? '等級成就' : 'Level Achievement'}</h3>
                </div>
                <div className="p-3 glass rounded-xl text-center">
                  <span className="text-3xl">{levelInfo.emoji}</span>
                  <p className="mt-1 text-sm font-bold text-gold">{levelInfo.displayName}</p>
                  <p className="text-xs text-gray-light mt-0.5">
                    {locale === 'zh-CN' ? '已達最高等級！🎉' : 'Max level reached! 🎉'}
                  </p>
                </div>
              </motion.div>
            );
          }
          const nextLevelInfo = getUserLevelInfo(currentLevel + 1, locale);
          const completedMeals = user.completed_meals_count || 0;
          const hostedMeals = user.hosted_meals_count || 0;
          const postsCount = user.posts_count || 0;
          const recommendCount = user.recommend_count || 0;
          const accountAge = user.created_at
            ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Calculate progress items for next level
          const progressItems: { label: string; current: number; target: number; unit: string }[] = [];
          if (currentLevel === 1) {
            progressItems.push({ label: locale === 'zh-CN' ? '完成酒局' : 'Drinks', current: completedMeals, target: 3, unit: '' });
            if (completedMeals >= 3) {
              progressItems.push({ label: locale === 'zh-CN' ? '發布動態' : 'Posts', current: postsCount, target: 5, unit: '' });
            }
          } else if (currentLevel === 2) {
            progressItems.push({ label: locale === 'zh-CN' ? '完成酒局' : 'Drinks', current: completedMeals, target: 10, unit: '' });
            progressItems.push({ label: locale === 'zh-CN' ? '發布動態' : 'Posts', current: postsCount, target: 5, unit: '' });
          } else if (currentLevel === 3) {
            progressItems.push({ label: locale === 'zh-CN' ? '完成酒局' : 'Drinks', current: completedMeals, target: 25, unit: '' });
            progressItems.push({ label: locale === 'zh-CN' ? '發起酒局' : 'Hosted', current: hostedMeals, target: 3, unit: '' });
          } else if (currentLevel === 4) {
            progressItems.push({ label: locale === 'zh-CN' ? '完成酒局' : 'Drinks', current: completedMeals, target: 50, unit: '' });
            progressItems.push({ label: locale === 'zh-CN' ? '推薦次數' : 'Recommends', current: recommendCount, target: 10, unit: '' });
            progressItems.push({ label: locale === 'zh-CN' ? '帳號天數' : 'Account age', current: accountAge, target: 90, unit: locale === 'zh-CN' ? '天' : 'd' });
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="card p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{locale === 'zh-CN' ? '升級進度' : 'Level Progress'}</h3>
                <Link href={`/${locale}/rules`} className="text-xs text-primary flex items-center gap-1">
                  {locale === 'zh-CN' ? '等級規則' : 'Rules'}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Current → Next level indicator */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${levelInfo.gradient} flex items-center justify-center`}>
                  <span className="text-sm">{levelInfo.emoji}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-1.5 rounded-full bg-gray/30">
                    {/* Overall progress bar based on how many requirements are met */}
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-coral transition-all duration-500"
                      style={{ width: `${Math.min(100, (progressItems.filter(i => i.current >= i.target).length / progressItems.length) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${nextLevelInfo.gradient} flex items-center justify-center opacity-60`}>
                  <span className="text-sm">{nextLevelInfo.emoji}</span>
                </div>
              </div>

              {/* Next level name + reward */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-light">
                  {locale === 'zh-CN' ? '下一等級：' : 'Next: '}
                  <span className="font-bold text-white">{nextLevelInfo.displayName}</span>
                </span>
                <span className="text-xs text-gold">
                  🪙 +{currentLevel === 2 ? 100 : currentLevel === 3 ? 200 : currentLevel === 4 ? 500 : 1000}
                </span>
              </div>

              {/* Progress items */}
              <div className="space-y-2.5">
                {progressItems.map((item) => {
                  const pct = Math.min(100, (item.current / item.target) * 100);
                  const done = item.current >= item.target;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-light">{item.label}</span>
                        <span className={`text-xs font-bold ${done ? 'text-mint' : 'text-white'}`}>
                          {item.current}{item.unit}/{item.target}{item.unit}
                          {done && ' ✓'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray/30">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-mint' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {/* Followers */}
          <Link href={`/${locale}/user/${user.id}/followers`}>
            <div className="card p-3 text-center cursor-pointer group hover:border-primary/50 transition-all">
              <div className="w-10 h-10 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold text-primary">{followerCount}</div>
              <div className="text-xs text-gray-light">{t('social.followers')}</div>
            </div>
          </Link>

          {/* Following */}
          <Link href={`/${locale}/user/${user.id}/following`}>
            <div className="card p-3 text-center cursor-pointer group hover:border-mint/50 transition-all">
              <div className="w-10 h-10 mx-auto rounded-xl bg-mint/20 flex items-center justify-center mb-2">
                <UserCheck className="w-5 h-5 text-mint" />
              </div>
              <div className="text-xl font-bold text-mint">{followingCount}</div>
              <div className="text-xs text-gray-light">{t('social.following')}</div>
            </div>
          </Link>

          {/* Credit Score */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gold/20 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl font-bold text-gold">{user.credit_score || 100}</div>
            <div className="text-xs text-gray-light">{t('profile.creditScore')}</div>
          </div>
        </motion.div>

        {/* Quick Access - My Coins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.27 }}
          className="mb-3"
        >
          <Link href={`/${locale}/coins`}>
            <div className="card p-4 flex items-center justify-between cursor-pointer group hover:border-gold/50 transition-all border-gold/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('coins.title')}</h3>
                  <p className="text-xs text-gold">
                    🪙 {(user as any).total_coins || 0} {t('coins.item.coins')}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-light group-hover:text-gold transition-colors" />
            </div>
          </Link>
        </motion.div>

        {/* Quick Access - My Moments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.29 }}
          className="mb-3"
        >
          <Link href={`/${locale}/user/${user.id}/moments`}>
            <div className="card p-4 flex items-center justify-between cursor-pointer group hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('moments.myMoments')}</h3>
                  <p className="text-xs text-gray-light">
                    {(user as any).posts_count || 0} {t('moments.title')}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-light group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </motion.div>

        {/* Quick Access - My Meals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.31 }}
          className="mb-4"
        >
          <Link href={`/${locale}/meals/my`}>
            <div className="card p-4 flex items-center justify-between cursor-pointer group hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{t('nav.myMeals')}</h3>
                  <p className="text-xs text-gray-light">
                    {mealsHosted + mealsJoined} {locale === 'zh-CN' ? '\u500b\u9152\u5c40' : 'drinks'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-light group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </motion.div>

        {/* Credit Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">{t('credit.title')}</h3>
            <Link href={`/${locale}/rules`} className="text-xs text-primary flex items-center gap-1">
              {t('credit.rules')}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Credit Level Display */}
          <div className="flex items-center gap-3 mb-4 p-3 glass rounded-xl">
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
                {user.credit_score || 100} {t('profile.creditScore')}
              </div>
            </div>
          </div>

          {/* Credit History */}
          <h4 className="text-xs font-semibold text-gray-light mb-2">{t('profile.creditHistory')}</h4>
          <div className="space-y-2">
            {creditHistory.length > 0 ? creditHistory.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      (item.points_change || 0) > 0 ? 'text-mint' : 'text-coral'
                    }`}
                  >
                    {(item.points_change || 0) > 0 ? `+${item.points_change}` : item.points_change}
                  </span>
                  <span className="text-xs text-gray-light">{item.reason || item.event_type || ''}</span>
                </div>
                <span className="text-xs text-gray-light">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            )) : (
              <p className="text-xs text-gray-light py-2 text-center">
                {locale === 'zh-CN' ? '暫無紀錄' : 'No history yet'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-4 mb-4"
        >
          <h3 className="font-bold text-white mb-3">{t('profile.interests')}</h3>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? interests.map((interest: string) => (
              <span key={interest} className="tag bg-primary/20 text-primary">
                {t(`tag.${interest}`)}
              </span>
            )) : (
              <span className="text-xs text-gray-light">
                {locale === 'zh-CN' ? '還沒有興趣標籤' : 'No interests yet'}
              </span>
            )}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card p-4 mb-4"
        >
          <h3 className="font-bold text-white mb-3">{t('profile.languagesSpoken')}</h3>
          <div className="flex flex-wrap gap-2">
            {(user.languages_spoken || []).map((lang: string) => (
              <span key={lang} className="tag bg-dark/50 text-gray-light">
                {languageFlags[lang]} {t(`language.${lang}`)}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Contact Info */}
        {((user as any).line_id || (user as any).whatsapp) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="card p-4 mb-4"
          >
            <h3 className="font-bold text-white mb-3">{locale === 'zh-CN' ? '聯繫方式' : 'Contact'}</h3>
            <div className="space-y-2">
              {(user as any).line_id && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-light w-16">LINE</span>
                  <span className="text-sm text-white font-mono">{(user as any).line_id}</span>
                </div>
              )}
              {(user as any).whatsapp && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-light w-16">WhatsApp</span>
                  <span className="text-sm text-white font-mono">{(user as any).whatsapp}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <ProfileForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} />
    </div>
  );
}
