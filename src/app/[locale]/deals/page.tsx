'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Store,
  Clock,
} from 'lucide-react';

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
          <h1 className="text-base font-semibold text-dark">
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
            <Clock className="w-5 h-5 text-gold" />
            <h2 className="font-bold text-dark text-sm">{t('deals.heroTitle')}</h2>
          </div>
          <p className="text-xs text-gray leading-relaxed">
            {t('deals.heroDesc')}
          </p>
        </motion.div>
      </div>

      {/* Empty state - Coming Soon */}
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-gold" />
        </div>
        <p className="text-sm text-gray font-medium mb-1">
          {locale === 'zh-CN' ? '餐廳優惠即將上線' : locale === 'th' ? 'ข้อเสนอพิเศษจากร้านอาหารเร็วๆนี้' : 'Restaurant deals coming soon'}
        </p>
        <p className="text-xs text-gray-light text-center mt-1">
          {locale === 'zh-CN'
            ? '我們正在與曼谷的合作餐廳洽談中，敬請期待！'
            : locale === 'th'
              ? 'เรากำลังเจรจากับร้านอาหารพันธมิตรในกรุงเทพฯ อยู่ โปรดรอ!'
              : 'We are partnering with restaurants in Bangkok. Stay tuned!'}
        </p>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
