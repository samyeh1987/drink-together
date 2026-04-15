'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Users,
  Clock,
  Tag,
  ChevronRight,
  Sparkles,
  BadgePercent,
} from 'lucide-react';

// Demo restaurant deal data
const RESTAURANT_DEALS = [
  {
    id: 'r1',
    name: 'Ninja Izakaya',
    nameTh: 'นินจา อิซากายะ',
    area: 'Thonglor',
    rating: 4.5,
    cuisineEmoji: '🍣',
    cuisine: 'japanese',
    image: 'https://picsum.photos/seed/rest1/600/400',
    description: 'Authentic Japanese izakaya with over 100 sake selections. Perfect for after-work drinks and late-night dining.',
    promotion: '20% off total bill',
    promoTag: '20% OFF',
    isActive: true,
    meals: [
      { id: 'm1', title: 'Sake Tasting Night 🍶', date: '2026-04-25', time: '19:00', spots: 3, maxSpots: 8, price: 599 },
      { id: 'm2', title: 'Chef\'s Omakase Table 🔪', date: '2026-04-27', time: '18:30', spots: 1, maxSpots: 6, price: 1299 },
    ],
  },
  {
    id: 'r2',
    name: 'Haidilao Hotpot',
    nameTh: 'ไห่ตี๋เหลา',
    area: 'Siam Paragon',
    rating: 4.8,
    cuisineEmoji: '🫕',
    cuisine: 'hotpot',
    image: 'https://picsum.photos/seed/rest2/600/400',
    description: 'Premium Chinese hotpot with exceptional service. Known for their famous noodle dance and complimentary snacks.',
    promotion: 'Free drink + dessert per person',
    promoTag: 'FREE DRINK',
    isActive: true,
    meals: [
      { id: 'm3', title: 'Hotpot Social Night 🫕', date: '2026-04-26', time: '19:00', spots: 5, maxSpots: 10, price: 699 },
    ],
  },
  {
    id: 'r3',
    name: 'La Monita Taqueria',
    nameTh: 'ลา โมนีตา',
    area: 'Sukhumvit 39',
    rating: 4.3,
    cuisineEmoji: '🌮',
    cuisine: 'mexican',
    image: 'https://picsum.photos/seed/rest3/600/400',
    description: 'The most authentic Mexican tacos in Bangkok. Fresh ingredients imported from Mexico, handmade tortillas daily.',
    promotion: 'Complimentary margarita for each guest',
    promoTag: 'FREE MARGARITA',
    isActive: true,
    meals: [
      { id: 'm4', title: 'Taco Tuesday Fiesta 🌮', date: '2026-04-29', time: '18:00', spots: 4, maxSpots: 8, price: 499 },
      { id: 'm5', title: 'Mexican Brunch & Mimosas 🥂', date: '2026-05-03', time: '11:00', spots: 6, maxSpots: 10, price: 399 },
    ],
  },
  {
    id: 'r4',
    name: 'Appia Italian',
    nameTh: 'อัปเปีย อิตาเลียน',
    area: 'Ekkamai',
    rating: 4.6,
    cuisineEmoji: '🍝',
    cuisine: 'italian',
    image: 'https://picsum.photos/seed/rest4/600/400',
    description: 'Cozy Italian trattoria serving homemade pasta and wood-fired pizza. Award-winning wine list from Italian vineyards.',
    promotion: 'Complimentary appetizer platter for groups of 4+',
    promoTag: 'GROUP DEAL',
    isActive: true,
    meals: [
      { id: 'm6', title: 'Pasta Making Night 🍝', date: '2026-04-30', time: '18:00', spots: 2, maxSpots: 6, price: 899 },
    ],
  },
];

export default function DealsPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="min-h-screen pb-20 bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <h1 className="text-base font-semibold text-dark flex items-center gap-2">
            <BadgePercent className="w-4 h-4 text-gold" />
            {t('deals.title')}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gold/15 via-coral/10 to-primary/10 rounded-2xl p-5 border border-gold/15"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="font-bold text-dark text-sm">{t('deals.heroTitle')}</h2>
          </div>
          <p className="text-xs text-gray leading-relaxed mb-3">
            {t('deals.heroDesc')}
          </p>
          <div className="flex items-center gap-3 text-xs text-dark">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-mint" />
              {RESTAURANT_DEALS.filter(r => r.isActive).length} {t('deals.activeRestaurants')}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {RESTAURANT_DEALS.reduce((sum, r) => sum + r.meals.length, 0)} {t('deals.upcomingMeals')}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Restaurant Deal Cards */}
      <div className="px-4 pt-2 space-y-4">
        {RESTAURANT_DEALS.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08 }}
          >
            <div className="card overflow-hidden p-0">
              {/* Restaurant Image */}
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Promo Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-coral text-white text-[10px] font-bold shadow-sm">
                    {restaurant.promoTag}
                  </span>
                </div>

                {/* Active indicator */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-mint/90 text-white text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t('deals.active')}
                </div>

                {/* Bottom info on image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{restaurant.cuisineEmoji}</span>
                    <div>
                      <h3 className="text-white font-bold text-sm">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold fill-gold" />
                          <span className="text-white/90 text-[11px]">{restaurant.rating}</span>
                        </div>
                        <span className="text-white/60 text-[11px]">•</span>
                        <span className="text-white/90 text-[11px] flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {restaurant.area}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Description */}
                <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-2">
                  {restaurant.description}
                </p>

                {/* Promotion highlight */}
                <div className="flex items-center gap-2 p-3 bg-gold/10 rounded-xl mb-4 border border-gold/15">
                  <Tag className="w-4 h-4 text-gold flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark">{t('deals.promotion')}</p>
                    <p className="text-xs text-gold-dark font-medium">{restaurant.promotion}</p>
                  </div>
                </div>

                {/* Upcoming meals from this restaurant */}
                <div className="mb-3">
                  <p className="text-xs text-gray mb-2 font-medium">
                    {t('deals.upcomingMeals')} ({restaurant.meals.length})
                  </p>
                  <div className="space-y-2">
                    {restaurant.meals.map((meal) => (
                      <Link key={meal.id} href={`/${locale}/meals/${meal.id}`}>
                        <div className="flex items-center justify-between p-3 bg-light rounded-xl cursor-pointer group hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark truncate group-hover:text-primary transition-colors">
                              {meal.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-gray flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(meal.date).toLocaleDateString(locale === 'th' ? 'th-TH' : locale, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-gray flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {meal.time}
                              </span>
                              <span className="text-[10px] text-gray flex items-center gap-0.5">
                                <Users className="w-3 h-3" />
                                {meal.spots}/{meal.maxSpots}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">฿{meal.price}</p>
                              <p className="text-[9px] text-gray">{t('deals.perPerson')}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-light group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* View all restaurant meals */}
                <Link href={`/${locale}/meals`}>
                  <div className="flex items-center justify-center gap-1 py-2 text-xs text-primary font-medium hover:underline">
                    <span>{t('deals.viewAllMeals')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
