'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const email = searchParams.get('email') ?? '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResendError('');
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?next=/${locale}/meals`,
      },
    });
    if (error) {
      setResendError(error.message);
    } else {
      setResent(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-coral" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-mint/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <Mail className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="text-xl font-bold text-gray-800 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a confirmation link to</p>
          {email && (
            <p className="text-primary font-semibold text-sm mb-5 break-all">{email}</p>
          )}
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Click the link in the email to verify your account and get started.
            The link expires in 24 hours.
          </p>

          {/* Resend */}
          {!resent ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Didn&apos;t receive the email?</p>
              {email ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {resending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend confirmation email
                </button>
              ) : (
                <p className="text-xs text-gray-400">
                  Check your spam folder or go back to sign up again.
                </p>
              )}
              {resendError && (
                <p className="text-xs text-red-500">{resendError}</p>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-green-50 rounded-xl text-green-600 text-sm"
            >
              ✅ Email resent! Check your inbox.
            </motion.div>
          )}

          {/* Divider */}
          <div className="my-5 h-px bg-gray-100" />

          {/* Tips */}
          <div className="text-left space-y-2 mb-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Tips</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>📁 Check your spam / junk folder</li>
              <li>⏱️ The link may take a few minutes to arrive</li>
              <li>🔄 Make sure the email address is correct</li>
            </ul>
          </div>

          {/* Back link */}
          <Link
            href={`/${locale}/auth/login`}
            className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        {/* Branding */}
        <p className="text-center text-white/50 text-xs mt-6">
          🍽️ EatTogether — Don&apos;t eat alone
        </p>
      </motion.div>
    </div>
  );
}
