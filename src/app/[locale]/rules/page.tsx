'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, ShieldCheck, X } from 'lucide-react';

function PenaltyBadge({ penalty, severe }: { penalty: string; severe?: boolean }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
      severe ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
    }`}>
      {penalty}
    </span>
  );
}

function RuleRow({ time, penalty, desc, severe }: {
  time: string; penalty: string; desc: string; severe?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-lighter/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark">{time}</p>
        <p className="text-xs text-gray mt-0.5">{desc}</p>
      </div>
      <PenaltyBadge penalty={penalty} severe={severe} />
    </div>
  );
}

export default function CancelRulesPage() {
  const t = useTranslations();
  const locale = useLocale();

  const rules = [
    { time: t('cancelRules.host48h'), penalty: t('cancelRules.host48hPenalty'), desc: t('cancelRules.host48hDesc') },
    { time: t('cancelRules.host24h'), penalty: t('cancelRules.host24hPenalty'), desc: t('cancelRules.host24hDesc') },
    { time: t('cancelRules.host2h'), penalty: t('cancelRules.host2hPenalty'), desc: t('cancelRules.host2hDesc'), severe: true },
    { time: t('cancelRules.hostNear'), penalty: t('cancelRules.hostNearPenalty'), desc: t('cancelRules.hostNearDesc'), severe: true },
    { time: t('cancelRules.hostAfter'), penalty: t('cancelRules.hostAfterPenalty'), desc: t('cancelRules.hostAfterDesc'), severe: true },
  ];

  const joinerRules = [
    { time: t('cancelRules.joiner48h'), penalty: t('cancelRules.joiner48hPenalty'), desc: t('cancelRules.joiner48hDesc') },
    { time: t('cancelRules.joiner24h'), penalty: t('cancelRules.joiner24hPenalty'), desc: t('cancelRules.joiner24hDesc') },
    { time: t('cancelRules.joiner2h'), penalty: t('cancelRules.joiner2hPenalty'), desc: t('cancelRules.joiner2hDesc'), severe: true },
    { time: t('cancelRules.joinerNear'), penalty: t('cancelRules.joinerNearPenalty'), desc: t('cancelRules.joinerNearDesc'), severe: true },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href={`/${locale}/profile`}
            className="p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <h1 className="text-base font-semibold text-dark">{t('cancelRules.title')}</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/50"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{t('cancelRules.subtitle')}</p>
        </motion.div>

        {/* Host Cancel Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <X className="w-4 h-4 text-coral" />
            <h2 className="font-bold text-dark text-sm">{t('cancelRules.hostCancelTitle')}</h2>
          </div>
          <div className="space-y-0">
            {rules.map((rule, i) => (
              <RuleRow key={i} {...rule} />
            ))}
          </div>
        </motion.div>

        {/* Joiner Leave Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-dark text-sm">{t('cancelRules.joinerLeaveTitle')}</h2>
          </div>
          <div className="space-y-0">
            {joinerRules.map((rule, i) => (
              <RuleRow key={i} {...rule} />
            ))}
          </div>
        </motion.div>

        {/* Special Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <h2 className="font-bold text-dark text-sm mb-3">{t('cancelRules.specialTitle')}</h2>
          <div className="space-y-3">
            {[
              t('cancelRules.special1'),
              t('cancelRules.special2'),
              t('cancelRules.special3'),
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-mint font-bold">{i + 1}</span>
                </span>
                <p className="text-sm text-gray-dark leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
