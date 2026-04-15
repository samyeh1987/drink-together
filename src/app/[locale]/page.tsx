'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

// Demo meal data for UI preview
const DEMO_MEALS = [
  {
    id: '1',
    title: 'Friday Night Izakaya 🍶',
    restaurant: 'Ninja Izakaya, Thonglor',
    cuisine: 'japanese',
    cuisineEmoji: '🍣',
    languages: [{ key: 'en', flag: '🇬🇧' }, { key: 'th', flag: '🇹🇭' }],
    datetime: '2026-04-18T19:00:00',
    current: 4,
    min: 3,
    max: 8,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: 'Language Exchange',
    status: 'open',
    creatorName: 'Sarah K.',
    creatorCredit: 'good',
    creatorAvatar: null,
  },
  {
    id: '2',
    title: 'Weekend Hotpot Feast 🫕',
    restaurant: 'Haidilao, Siam Paragon',
    cuisine: 'hotpot',
    cuisineEmoji: '🫕',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'en', flag: '🇬🇧' }],
    datetime: '2026-04-19T18:30:00',
    current: 2,
    min: 4,
    max: 10,
    payment: 'splitBill',
    paymentEmoji: '💰',
    note: 'Startup Sharing',
    status: 'open',
    creatorName: 'Alex W.',
    creatorCredit: 'excellent',
    creatorAvatar: null,
  },
  {
    id: '3',
    title: 'Best Pad Thai in Town 🍜',
    restaurant: 'Thipsamai, Old Town',
    cuisine: 'thai',
    cuisineEmoji: '🍜',
    languages: [{ key: 'en', flag: '🇬🇧' }],
    datetime: '2026-04-17T12:00:00',
    current: 5,
    min: 2,
    max: 6,
    payment: 'payOwn',
    paymentEmoji: '💳',
    note: null,
    status: 'confirmed',
    creatorName: 'Somchai P.',
    creatorCredit: 'good',
    creatorAvatar: null,
  },
  {
    id: '4',
    title: 'Korean BBQ Night 🔥',
    restaurant: 'Maple House, Ari',
    cuisine: 'korean',
    cuisineEmoji: '🍖',
    languages: [{ key: 'zh', flag: '🇨🇳' }, { key: 'ko', flag: '🇰🇷' }],
    datetime: '2026-04-20T19:30:00',
    current: 3,
    min: 4,
    max: 8,
    payment: 'hostTreats',
    paymentEmoji: '🎉',
    note: 'Expat Meetup',
    status: 'open',
    creatorName: 'Mike L.',
    creatorCredit: 'average',
    creatorAvatar: null,
  },
];

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

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section - Mobile First */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cream to-coral/5" />
        <div className="absolute top-10 right-5 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-5 left-5 w-64 h-64 bg-mint/10 rounded-full blur-3xl" />

        <div className="relative px-4 pt-6 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <UtensilsCrossed className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-dark">
                Eat<span className="text-primary">Together</span>
              </span>
            </div>
            <Link
              href={`/${locale}/notifications`}
              className="relative p-2 rounded-xl text-gray hover:text-dark hover:bg-white/50 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
            </Link>
          </div>

          {/* Hero Content */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-extrabold text-dark leading-tight mb-3">
                {t('home.heroTitle').split('').map((char, i) => (
                  <span key={i} className={char === '吃' || char === '一' || char === '人' ? 'text-primary' : ''}>
                    {char}
                  </span>
                ))}
              </h1>

              <p className="text-base text-gray leading-relaxed mb-5">
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

            {/* Stats - Horizontal scroll on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-4 mt-6"
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                <div className="text-lg font-bold text-dark">1,200+</div>
                <div className="text-xs text-gray">{locale === 'zh-CN' ? '飯局' : 'Meals Shared'}</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                <div className="text-lg font-bold text-dark">500+</div>
                <div className="text-xs text-gray">{locale === 'zh-CN' ? '飯友' : 'Foodies'}</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 flex-1 text-center shadow-sm">
                <div className="text-lg font-bold text-dark">50+</div>
                <div className="text-xs text-gray">{locale === 'zh-CN' ? '菜系' : 'Cuisines'}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Compact horizontal cards */}
      <section className="py-6">
        <div className="px-4">
          <h2 className="text-lg font-bold text-dark mb-4">
            {t('home.howItWorks')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {[
              {
                icon: Users,
                title: t('home.step1Title'),
                desc: t('home.step1Desc'),
                color: 'from-primary to-primary-light',
                bgColor: 'bg-primary/10',
                textColor: 'text-primary',
                step: '01',
              },
              {
                icon: MessageCircle,
                title: t('home.step2Title'),
                desc: t('home.step2Desc'),
                color: 'from-mint to-mint-light',
                bgColor: 'bg-mint/10',
                textColor: 'text-mint',
                step: '02',
              },
              {
                icon: PartyPopper,
                title: t('home.step3Title'),
                desc: t('home.step3Desc'),
                color: 'from-gold to-amber-400',
                bgColor: 'bg-gold/10',
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
                  <div className="text-xs font-black text-gray-lighter/60 mb-2">{item.step}</div>
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                    <item.icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <h3 className="text-sm font-bold text-dark mb-1">{item.title}</h3>
                  <p className="text-xs text-gray leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant Deals Banner */}
      <section className="px-4 mb-6">
        <div className="bg-gradient-to-r from-gold/15 via-gold/10 to-coral/10 rounded-2xl p-4 border border-gold/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-dark text-sm">{t('home.dealsTitle')}</h3>
              <p className="text-xs text-gray mt-0.5">{t('home.dealsComingSoon')}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gold flex-shrink-0" />
          </div>
        </div>
      </section>

      {/* Popular Meals - Single column on mobile */}
      <section className="pb-8">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">
              {t('home.popularMeals')}
            </h2>
            <Link
              href={`/${locale}/meals`}
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {DEMO_MEALS.map((meal, i) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/${locale}/meals/${meal.id}`}>
                  <div className="card p-4 cursor-pointer group">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-dark text-[15px] group-hover:text-primary transition-colors truncate">
                          {meal.title}
                        </h3>
                      </div>
                      <span className={`tag text-[11px] ml-2 flex-shrink-0 ${statusColors[meal.status] || 'bg-gray-100 text-gray'}`}>
                        {t(`meal.status.${meal.status}`)}
                      </span>
                    </div>

                    {/* Restaurant */}
                    <div className="flex items-center gap-1 text-sm text-gray mb-2.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{meal.restaurant}</span>
                    </div>

                    {/* Languages + Note row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {meal.languages.map((lang) => (
                        <span key={lang.key} className="tag text-[11px]">
                          {lang.flag} {t(`language.${lang.key}`)}
                        </span>
                      ))}
                      {meal.note && (
                        <span className="px-2 py-0.5 rounded-md bg-light text-[11px] text-gray-light flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {meal.note}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
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
                          <span className={`text-xs ${meal.current >= meal.min ? 'text-mint font-semibold' : ''}`}>
                            {meal.current}/{meal.max}
                          </span>
                        </div>
                        <span className="text-sm">{meal.paymentEmoji}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {meal.creatorName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray">{meal.creatorName}</span>
                        <span className={`text-[10px] ${creditColors[meal.creatorCredit] || 'text-gray'}`}>
                          {meal.creatorCredit === 'excellent' ? '⭐⭐⭐⭐⭐' :
                           meal.creatorCredit === 'good' ? '⭐⭐⭐⭐' : '⭐⭐⭐'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
