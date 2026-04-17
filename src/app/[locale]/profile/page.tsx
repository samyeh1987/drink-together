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
  Plus,
  X,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchProfile, fetchCreditHistory, fetchMyMeals } from '@/lib/api';
import ProfileForm from '@/components/profile/ProfileForm';

// Language display mapping
const languageFlags: Record<string, string> = {
  zh: '🇨🇳',
  en: '🇬🇧',
  th: '🇹🇭',
  ja: '🇯🇵',
  ko: '🇰🇷',
};

// Gender emoji
const genderEmoji: Record<string, string> = {
  male: '👨',
  female: '👩',
  prefer_not_to_say: '✨',
  other: '✨',
};

// Credit level calculation
function getCreditLevel(score: number): { level: string; stars: number; color: string } {
  if (score >= 100) return { level: 'excellent', stars: 5, color: 'text-gold' };
  if (score >= 80) return { level: 'good', stars: 4, color: 'text-mint' };
  if (score >= 50) return { level: 'average', stars: 3, color: 'text-blue-500' };
  if (score >= 20) return { level: 'newbie', stars: 2, color: 'text-gray' };
  return { level: 'low', stars: 1, color: 'text-coral' };
}

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [mealsHosted, setMealsHosted] = useState(0);
  const [mealsJoined, setMealsJoined] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const creditInfo = getCreditLevel(user?.credit_score || 100);
  const photoSlots = 6;

  useEffect(() => {
    // Wait a tick for AuthProvider to populate user
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [history, myMeals] = await Promise.all([
        fetchCreditHistory(user!.id),
        fetchMyMeals(user!.id),
      ]);
      setCreditHistory(history);
      setMealsHosted(myMeals.filter((m: any) => m.role === 'host').length);
      setMealsJoined(myMeals.filter((m: any) => m.role === 'participant').length);
    })();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4 px-4">
        <p className="text-gray">{locale === 'zh-CN' ? '請先登入查看個人資料' : 'Please log in to view profile'}</p>
        <Link href={`/${locale}/auth/login`} className="btn-primary px-6 py-2.5 rounded-xl">
          {locale === 'zh-CN' ? '登入' : 'Login'}
        </Link>
      </div>
    );
  }

  const photos: string[] = (user as any).photos || [];
  const interests = (user.tags || [])
    .filter((tag: any) => tag?.category === 'interest')
    .map((tag: any) => tag?.i18n_key?.replace('tag.', '') || tag?.name);

  return (
    <div className="min-h-screen pb-20 bg-cream">
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
            <p className="mt-1 text-sm text-white/80 flex items-center gap-1.5">
              {(user as any).gender && <span>{genderEmoji[(user as any).gender] || ''}</span>}
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
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-light">
            {user.age_range && <span>{user.age_range}</span>}
            {user.age_range && user.email && <span>•</span>}
            {user.email && <span>{user.email}</span>}
          </div>
        </motion.div>

        {/* Photo Gallery - coming soon placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-dark">{t('profile.photos')}</h3>
            <span className="text-xs text-gray">{photos.length}/{photoSlots}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl overflow-hidden bg-light relative group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <button className="p-1.5 rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5 text-coral" />
                  </button>
                </div>
              </div>
            ))}
            {/* Add photo slots */}
            {Array.from({ length: photoSlots - photos.length }).map((_, index) => (
              <button
                key={`add-${index}`}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-lighter flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-light" />
                <span className="text-[10px] text-gray-light">{t('profile.addPhoto')}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-light text-center mt-2">{t('profile.photoLimit')}</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {/* Meals Hosted */}
          <Link href={`/${locale}/meals/my?tab=hosting`}>
            <div className="card p-3 text-center cursor-pointer group">
              <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold text-dark">{mealsHosted}</div>
              <div className="text-xs text-gray">{t('profile.mealsHosted')}</div>
            </div>
          </Link>

          {/* Meals Joined */}
          <Link href={`/${locale}/meals/my?tab=joined`}>
            <div className="card p-3 text-center cursor-pointer group">
              <div className="w-10 h-10 mx-auto rounded-xl bg-mint/10 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-mint" />
              </div>
              <div className="text-xl font-bold text-dark">{mealsJoined}</div>
              <div className="text-xs text-gray">{t('profile.mealsJoined')}</div>
            </div>
          </Link>

          {/* Credit Score */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gold/10 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl font-bold text-dark">{user.credit_score || 100}</div>
            <div className="text-xs text-gray">{t('profile.creditScore')}</div>
          </div>
        </motion.div>

        {/* Quick Access - My Meals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-4"
        >
          <Link href={`/${locale}/meals/my`}>
            <div className="card p-4 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-sm">{t('nav.myMeals')}</h3>
                  <p className="text-xs text-gray-light">
                    {mealsHosted + mealsJoined} {t('myMeals.mealsFound', { count: mealsHosted + mealsJoined })}
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
            <h3 className="font-bold text-dark">{t('credit.title')}</h3>
            <Link href={`/${locale}/rules`} className="text-xs text-primary flex items-center gap-1">
              {t('credit.rules')}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Credit Level Display */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-gold/10 to-coral/10 rounded-xl">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < creditInfo.stars ? creditInfo.color : 'text-gray-lighter'
                  }`}
                  fill={i < creditInfo.stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <div className="flex-1">
              <div className="font-bold text-dark capitalize">
                {t(`credit.${creditInfo.level}`)}
              </div>
              <div className="text-xs text-gray">
                {user.credit_score || 100} {t('profile.creditScore')}
              </div>
            </div>
          </div>

          {/* Credit History */}
          <h4 className="text-xs font-semibold text-gray mb-2">{t('profile.creditHistory')}</h4>
          <div className="space-y-2">
            {creditHistory.length > 0 ? creditHistory.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-lighter/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      (item.points_change || 0) > 0 ? 'text-mint' : 'text-coral'
                    }`}
                  >
                    {(item.points_change || 0) > 0 ? `+${item.points_change}` : item.points_change}
                  </span>
                  <span className="text-xs text-gray">{item.reason || item.event_type || ''}</span>
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
          <h3 className="font-bold text-dark mb-3">{t('profile.interests')}</h3>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? interests.map((interest: string) => (
              <span key={interest} className="tag tag-active">
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
          className="card p-4"
        >
          <h3 className="font-bold text-dark mb-3">{t('profile.languagesSpoken')}</h3>
          <div className="flex flex-wrap gap-2">
            {(user.languages_spoken || []).map((lang: string) => (
              <span key={lang} className="tag">
                {languageFlags[lang]} {t(`language.${lang}`)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} />
    </div>
  );
}
