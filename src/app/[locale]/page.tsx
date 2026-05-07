'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Users,
  MessageCircle,
  PartyPopper,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Globe,
  ChevronDown,
  Image as ImageIcon,
  BadgePercent,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchMealStats, fetchOpenMeals } from '@/lib/api';
import CommunityFeed from '@/components/community/CommunityFeed';

// Dynamically import map to avoid SSR issues with leaflet
const NearbyMap = dynamic(() => import('@/components/map/NearbyMap'), { ssr: false });

const CUISINE_EMOJI: Record<string, string> = {
  japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
  western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
  dimsum: '🥟', vegetarian: '🥗', other: '🍴',
};

const FLAG_MAP: Record<string, { key: string; flag: string }> = {
  zh: { key: 'zh', flag: '🇨🇳' }, en: { key: 'en', flag: '🇬🇧' },
  th: { key: 'th', flag: '🇹🇭' }, ja: { key: 'ja', flag: '🇯🇵' }, ko: { key: 'ko', flag: '🇰🇷' },
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-mint/10 text-mint',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
};

const creditColors: Record<string, string> = {
  excellent: 'text-gold',
  good: 'text-mint',
  average: 'text-blue-500',
  newbie: 'text-gray',
};

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [stats, setStats] = useState<{ totalMeals: number; totalUsers: number; activeMeals: number }>({
    totalMeals: 0, totalUsers: 0, activeMeals: 0,
  });
  const [recentMeals, setRecentMeals] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, mealsData] = await Promise.all([
          fetchMealStats(),
          fetchOpenMeals(),
        ]);
        setStats(statsData);
        // Show up to 5 recent open/confirmed meals on homepage
        const display = mealsData
          .filter((m: any) => m.status === 'open' || m.status === 'confirmed')
          .slice(0, 5)
          .map((m: any) => ({
            ...m,
            restaurant: m.restaurant_name,
            current: m._currentParticipants ?? 1,
            max: m.max_participants,
            min: m.min_participants,
            cuisineEmoji: m._cuisineEmoji || CUISINE_EMOJI[m.cuisine_type] || '🍴',
            languages: m._languages || (m.meal_languages || []).map((l: string) => FLAG_MAP[l] || { key: l, flag: '🌍' }),
            paymentEmoji: m._paymentEmoji || '💰',
            creatorName: m.creator?.nickname || 'Foodie',
            creatorCredit: m.creator?.credit_score >= 90 ? 'excellent' : m.creator?.credit_score >= 70 ? 'good' : 'average',
          }));
        setRecentMeals(display);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }
    loadData();
  }, []);

  const locales = [
    { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  ];

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setShowLangMenu(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section - Neon Nightclub Theme */}
      <section className="relative overflow-hidden">
        {/* Background gradient - Neon effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-cream to-mint/10" />
        <div className="absolute top-10 right-5 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-5 left-5 w-64 h-64 bg-mint/20 rounded-full blur-3xl" />

        <div className="relative px-4 pt-6 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/30">
                <Image
                  src="/logo.png"
                  alt="DrinkTogether"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg font-bold text-white">
                Drink<span className="text-primary">Together</span>
              </span>
            </Link>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 p-2 rounded-xl text-gray-light hover:text-white hover:bg-dark/50 transition-all"
              >
                <Globe className="w-5 h-5" />
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 bg-dark/95 backdrop-blur-lg rounded-xl shadow-xl border border-primary/30 py-1.5 min-w-[140px] overflow-hidden"
                    >
                      {locales.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => switchLocale(l.code)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            locale === l.code ? 'bg-primary/20 text-primary font-semibold' : 'text-white hover:bg-dark/50'
                          }`}
                        >
                          <span className="text-base">{l.flag}</span>
                          <span>{l.label}</span>
                          {locale === l.code && (
                            <span className="ml-auto text-primary text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Link
              href={`/${locale}/notifications`}
              className="relative p-2 rounded-xl text-gray-light hover:text-white hover:bg-dark/50 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full animate-pulse" />
            </Link>
          </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
                {t('home.heroTitle').split('').map((char, i) => (
                  <span key={i} className={char === '喝' || char === '一' || char === '人' ? 'text-primary' : char === '酒' ? 'text-mint' : ''}>
                    {char}
                  </span>
                ))}
              </h1>

              <p className="text-base text-gray-light leading-relaxed mb-5">
                {t('home.heroSubtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="flex gap-2.5">
                <Link
                  href={`/${locale}/meals`}
                  className="btn-primary flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('home.heroCta')}</span>
                </Link>
                <Link
                  href={`/${locale}/meals/create`}
                  className="btn-secondary flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('home.heroCreate')}</span>
                </Link>
              </div>
            </motion.div>

            {/* Stats - Neon Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-4 mt-6"
            >
              <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
                <div className="text-lg font-bold text-primary">{stats.totalMeals}</div>
                <div className="text-xs text-gray-light">{locale === 'zh-CN' ? '酒局' : 'Drinks Shared'}</div>
              </div>
              <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
                <div className="text-lg font-bold text-mint">{stats.totalUsers}</div>
                <div className="text-xs text-gray-light">{locale === 'zh-CN' ? '酒友' : 'Drinkers'}</div>
              </div>
              <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
                <div className="text-lg font-bold text-coral">{stats.activeMeals}</div>
                <div className="text-xs text-gray-light">{locale === 'zh-CN' ? '進行中' : 'Active'}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🔒 Map Section Hidden - Uncomment to enable */}
      {/* <section className="py-4">
        <NearbyMap
          mapTitle={t('home.nearbyMapTitle')}
          mapSubtitle={t('home.nearbyMapSubtitle')}
          viewDetailsText={t('home.viewDetails')}
          openMealsText={t('home.openMeals')}
          locale={locale}
        />
      </section> */}

      {/* How It Works - Neon horizontal cards */}
      <section className="py-6">
        <div className="px-4">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('home.howItWorks')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {[
              {
                icon: Users,
                title: t('home.step1Title'),
                desc: t('home.step1Desc'),
                color: 'from-primary to-primary-light',
                bgColor: 'bg-primary/20',
                textColor: 'text-primary',
                step: '01',
              },
              {
                icon: MessageCircle,
                title: t('home.step2Title'),
                desc: t('home.step2Desc'),
                color: 'from-mint to-mint-light',
                bgColor: 'bg-mint/20',
                textColor: 'text-mint',
                step: '02',
              },
              {
                icon: PartyPopper,
                title: t('home.step3Title'),
                desc: t('home.step3Desc'),
                color: 'from-gold to-amber-400',
                bgColor: 'bg-gold/20',
                textColor: 'text-gold',
                step: '03',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-44 snap-start"
              >
                <div className="card p-4 h-full">
                  <div className="text-xs font-black text-gray-light/40 mb-2">{item.step}</div>
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                    <item.icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-light leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bar Deals Banner - Neon Style */}
      <section className="px-4 mb-4">
        <Link href={`/${locale}/deals`}>
          <div className="glass rounded-2xl p-4 cursor-pointer group hover:border-gold/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gold/30 to-gold/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold/20">
                <BadgePercent className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm">{t('home.dealsTitle')}</h3>
                <p className="text-xs text-gray-light mt-0.5">{t('home.dealsSubtitle')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gold flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </section>

      {/* Photo Gallery Banner - Neon Style */}
      <section className="px-4 mb-6">
        <Link href={`/${locale}/gallery`}>
          <div className="glass rounded-2xl p-4 cursor-pointer group hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-coral/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm">{t('home.galleryTitle')}</h3>
                <p className="text-xs text-gray-light mt-0.5">{t('home.gallerySubtitle')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </section>

      {/* Popular Drinks - Neon Cards */}
      <section className="pb-8">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {t('home.popularMeals')}
            </h2>
            <Link
              href={`/${locale}/meals`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light transition-colors"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentMeals.length > 0 ? recentMeals.map((meal: any, i: number) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/${locale}/meals/${meal.id}`}>
                  <div className="card p-4 cursor-pointer group hover:border-primary/50 transition-all">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-[15px] group-hover:text-primary transition-colors truncate">
                          {meal.title}
                        </h3>
                      </div>
                      <span className={`tag text-[11px] ml-2 flex-shrink-0 ${meal.status === 'open' ? 'bg-mint/20 text-mint' : meal.status === 'confirmed' ? 'bg-primary/20 text-primary' : 'bg-gray/20 text-gray-light'}`}>
                        {t(`meal.status.${meal.status}`)}
                      </span>
                    </div>

                    {/* Bar/Restaurant */}
                    <div className="flex items-center gap-1 text-sm text-gray-light mb-2.5">
                      <MapPin className="w-3.5 h-3.5 text-mint flex-shrink-0" />
                      <span className="truncate">{meal.restaurant}</span>
                    </div>

                    {/* Languages + Note row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {meal.languages.map((lang: any) => (
                        <span key={lang.key} className="tag text-[11px] bg-dark/50 text-gray-light">
                          {lang.flag} {t(`language.${lang.key}`)}
                        </span>
                      ))}
                      {meal.note && (
                        <span className="px-2 py-0.5 rounded-md bg-mint/10 text-[11px] text-mint flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {meal.note}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-light">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-light" />
                          <span className="text-xs">
                            {new Date(meal.datetime).toLocaleDateString(locale === 'th' ? 'th-TH' : locale, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className={`text-xs ${meal.current >= meal.min ? 'text-mint font-semibold' : 'text-gray-light'}`}>
                            {meal.current}/{meal.max}
                          </span>
                        </div>
                        <span className="text-sm">{meal.paymentEmoji}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-coral/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">
                            {meal.creatorName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-light">{meal.creatorName}</span>
                        <span className={`text-[10px] ${creditColors[meal.creatorCredit] || 'text-gray-light'}`}>
                          {meal.creatorCredit === 'excellent' ? '⭐⭐⭐⭐⭐' :
                           meal.creatorCredit === 'good' ? '⭐⭐⭐⭐' : '⭐⭐⭐'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8 text-center"
              >
                <div className="text-4xl mb-3">🍸</div>
                <p className="text-sm text-gray-light font-medium">
                  {locale === 'zh-CN' ? '尚未有酒局，快來發起第一場吧！' : locale === 'th' ? 'ยังไม่มีงานเลี้ยง มาเริ่มต้นเลย!' : 'No drinks yet. Be the first to host one!'}
                </p>
                <Link
                  href={`/${locale}/meals/create`}
                  className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm mt-4"
                >
                  <Plus className="w-4 h-4" />
                  {t('home.heroCreate')}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Community Feed - 酒友圈 */}
      <CommunityFeed />

    </div>
  );
}
