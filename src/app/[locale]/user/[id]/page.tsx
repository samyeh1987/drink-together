'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  UtensilsCrossed,
  Users,
  Award,
  Loader2,
} from 'lucide-react';
import { fetchProfile, fetchMyMeals } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const languageFlags: Record<string, string> = {
  zh: '🇨🇳',
  en: '🇬🇧',
  th: '🇹🇭',
  ja: '🇯🇵',
  ko: '🇰🇷',
};

const genderEmoji: Record<string, string> = {
  male: '👨',
  female: '👩',
  prefer_not_to_say: '✨',
  other: '✨',
};

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
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [mealsHosted, setMealsHosted] = useState(0);
  const [mealsJoined, setMealsJoined] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;
  const creditInfo = profile ? getCreditLevel(profile.credit_score || 100) : null;
  const interests = (profile?.tags || [])
    .filter((tag: any) => tag?.category === 'interest')
    .map((tag: any) => tag?.i18n_key?.replace('tag.', '') || tag?.name);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [profileData, myMeals] = await Promise.all([
        fetchProfile(userId),
        fetchMyMeals(userId),
      ]);
      setProfile(profileData);
      if (myMeals) {
        setMealsHosted(myMeals.filter((m: any) => m.role === 'host').length);
        setMealsJoined(myMeals.filter((m: any) => m.role === 'participant').length);
      }
      setIsLoading(false);
    })();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4 px-4">
        <p className="text-gray">
          {locale === 'zh-CN' ? '找不到此用戶' : locale === 'th' ? 'ไม่พบผู้ใช้นี้' : 'User not found'}
        </p>
        <Link href={`/${locale}`} className="btn-primary px-6 py-2.5 rounded-xl">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-cream">
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
            <p className="mt-1 text-sm text-white/80 flex items-center gap-1.5">
              {profile.gender && <span>{genderEmoji[profile.gender] || ''}</span>}
              {profile.occupation && <span>{profile.occupation}</span>}
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
              {locale === 'zh-CN' ? '還沒有自我介紹' : 'No bio yet'}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-light">
            {profile.age_range && <span>{profile.age_range}</span>}
            {profile.languages_spoken?.length > 0 && (
              <>
                {(profile.age_range || profile.email) && <span>•</span>}
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
          {/* Meals Hosted */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div className="text-xl font-bold text-dark">{mealsHosted}</div>
            <div className="text-xs text-gray">{t('profile.mealsHosted')}</div>
          </div>

          {/* Meals Joined */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-mint/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-mint" />
            </div>
            <div className="text-xl font-bold text-dark">{mealsJoined}</div>
            <div className="text-xs text-gray">{t('profile.mealsJoined')}</div>
          </div>

          {/* Credit Score */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gold/10 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl font-bold text-dark">{profile.credit_score || 100}</div>
            <div className="text-xs text-gray">{t('profile.creditScore')}</div>
          </div>
        </motion.div>

        {/* Credit Level Card */}
        {creditInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card p-4 mb-4"
          >
            <h3 className="font-bold text-dark mb-3">{t('credit.title')}</h3>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/10 to-coral/10 rounded-xl">
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
            <h3 className="font-bold text-dark mb-3">{t('profile.interests')}</h3>
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
            <h3 className="font-bold text-dark mb-3">{t('profile.languagesSpoken')}</h3>
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
