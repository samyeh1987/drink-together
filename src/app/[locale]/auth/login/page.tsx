'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-coral" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-mint/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span className="text-3xl">🍽️</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">
            EatTogether
          </h1>
          <p className="text-white/70 text-sm">
            {t('common.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-lg font-bold text-dark text-center mb-6">
            {t('nav.login')}
          </h2>

          {/* Google Login */}
          <button className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-lighter hover:bg-light transition-all duration-200 active:scale-[0.98]">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold text-dark">
              {t('auth.loginWithGoogle')}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-lighter" />
            <span className="text-xs text-gray-light">or</span>
            <div className="flex-1 h-px bg-gray-lighter" />
          </div>

          {/* Email Login */}
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md">
            <Mail className="w-4 h-4" />
            <span>{t('nav.login')} with Email</span>
          </button>

          {/* Email verification notice */}
          <div className="mt-4 p-3 bg-cream rounded-xl">
            <p className="text-xs text-gray leading-relaxed text-center">
              📧 {t('auth.verifyEmailDesc')}
            </p>
          </div>
        </motion.div>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/50 text-xs mt-6"
        >
          By continuing, you agree to our{' '}
          <Link href="#" className="underline hover:text-white/70">{t('footer.terms')}</Link>
          {' '}and{' '}
          <Link href="#" className="underline hover:text-white/70">{t('footer.privacy')}</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
