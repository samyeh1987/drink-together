'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Edit3,
  Star,
  UtensilsCrossed,
  Users,
  Award,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

// Demo profile data
const profile = {
  nickname: 'Sarah K.',
  email: 'sarah@example.com',
  avatar: null,
  bio: 'Digital nomad from Taiwan, currently based in Bangkok. Love exploring new restaurants and meeting people from all over the world! 🌏',
  ageRange: '25-30',
  occupation: 'Designer',
  languagesSpoken: ['zh', 'en', 'th'],
  interests: ['foodie', 'digitalNomad', 'languageExchange', 'photography'],
  creditScore: 128,
  mealsHosted: 12,
  mealsJoined: 8,
  creditHistory: [
    { event: '+10', reason: 'Hosted a meal', date: '2026-04-10' },
    { event: '+5', reason: 'Completed a meal', date: '2026-04-08' },
    { event: '-5', reason: 'Late cancellation', date: '2026-04-01' },
    { event: '+10', reason: 'Email verified', date: '2026-03-25' },
  ],
};

// Language display mapping
const languageFlags: Record<string, string> = {
  zh: '🇨🇳',
  en: '🇬🇧',
  th: '🇹🇭',
  ja: '🇯🇵',
  ko: '🇰🇷',
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
  const creditInfo = getCreditLevel(profile.creditScore);

  return (
    <div className="min-h-screen pb-20 bg-cream">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-primary to-coral pt-8 pb-16 px-4">
        <div className="absolute top-4 right-4">
          <button className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
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
              <span className="text-3xl font-bold text-white">
                {profile.nickname.charAt(0)}
              </span>
            </div>

            {/* Name & Bio */}
            <h1 className="mt-4 text-2xl font-bold text-white">{profile.nickname}</h1>
            <p className="mt-1 text-sm text-white/80">{profile.occupation}</p>
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
          <p className="text-sm text-gray leading-relaxed">{profile.bio}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-light">
            <span>{profile.ageRange}</span>
            <span>•</span>
            <span>{profile.email}</span>
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
          <Link href={`/${locale}/meals/my?tab=hosting`}>
            <div className="card p-3 text-center cursor-pointer group">
              <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold text-dark">{profile.mealsHosted}</div>
              <div className="text-xs text-gray">{t('profile.mealsHosted')}</div>
            </div>
          </Link>

          {/* Meals Joined */}
          <Link href={`/${locale}/meals/my?tab=joined`}>
            <div className="card p-3 text-center cursor-pointer group">
              <div className="w-10 h-10 mx-auto rounded-xl bg-mint/10 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-mint" />
              </div>
              <div className="text-xl font-bold text-dark">{profile.mealsJoined}</div>
              <div className="text-xs text-gray">{t('profile.mealsJoined')}</div>
            </div>
          </Link>

          {/* Credit Score */}
          <div className="card p-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gold/10 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gold" />
            </div>
            <div className="text-xl font-bold text-dark">{profile.creditScore}</div>
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
                    {profile.mealsHosted + profile.mealsJoined} {t('myMeals.mealsFound', { count: profile.mealsHosted + profile.mealsJoined })}
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
            <button className="text-xs text-primary flex items-center gap-1">
              {t('credit.rules')}
              <ChevronRight className="w-3 h-3" />
            </button>
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
                {profile.creditScore} {t('profile.creditScore')}
              </div>
            </div>
          </div>

          {/* Credit History */}
          <h4 className="text-xs font-semibold text-gray mb-2">{t('profile.creditHistory')}</h4>
          <div className="space-y-2">
            {profile.creditHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-lighter/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      item.event.startsWith('+') ? 'text-mint' : 'text-coral'
                    }`}
                  >
                    {item.event}
                  </span>
                  <span className="text-xs text-gray">{item.reason}</span>
                </div>
                <span className="text-xs text-gray-light">{item.date}</span>
              </div>
            ))}
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
            {profile.interests.map((interest) => (
              <span key={interest} className="tag tag-active">
                {t(`tag.${interest}`)}
              </span>
            ))}
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
            {profile.languagesSpoken.map((lang) => (
              <span key={lang} className="tag">
                {languageFlags[lang]} {t(`language.${lang}`)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
