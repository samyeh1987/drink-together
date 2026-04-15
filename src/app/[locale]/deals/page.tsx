'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, Gift, UtensilsCrossed } from 'lucide-react';

export default function DealsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen pb-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-sm"
      >
        {/* Animated icon */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-20 h-20 bg-gradient-to-br from-gold/20 to-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Gift className="w-10 h-10 text-gold" />
        </motion.div>

        <h1 className="text-2xl font-bold text-dark mb-3">
          {t('home.dealsTitle')}
        </h1>
        <p className="text-gray leading-relaxed mb-6">
          {t('home.dealsComingSoon')}
        </p>

        {/* Feature previews */}
        <div className="space-y-3">
          {[
            { icon: '🎁', text: 'Exclusive restaurant discounts' },
            { icon: '🍕', text: 'Partner restaurant recommendations' },
            { icon: '💵', text: 'Meal vouchers and coupons' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-dark">{item.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Coming soon badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          <span>Coming Soon</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
