'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If not coming from a verified reset link, show the request form instead
  const [mode, setMode] = useState<'request' | 'reset'>(verified ? 'reset' : 'request');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const supabase = createClient();

  // Check if user has a valid session (from reset link)
  useEffect(() => {
    if (verified) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          // No session, they came here without a valid link
          setMode('request');
        }
      });
    }
  }, [verified, supabase.auth]);

  // Request password reset email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail) return;
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(requestEmail, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/${locale}/auth/reset-password?verified=1`,
    });

    if (error) {
      setError(error.message);
    } else {
      setRequestSent(true);
    }
    setIsLoading(false);
  };

  // Submit new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/meals`);
      }, 2000);
    }
    setIsLoading(false);
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
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {mode === 'request' ? 'Forgot Password?' : 'Set New Password'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {/* ── REQUEST MODE ── */}
          {mode === 'request' && !requestSent && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-gray-500 text-sm text-center mb-4">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  required
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !requestEmail}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* ── REQUEST SENT ── */}
          {mode === 'request' && requestSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-3"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-gray-800">Check your inbox!</p>
              <p className="text-sm text-gray-400">
                We sent a password reset link to <strong>{requestEmail}</strong>.<br />
                It expires in 1 hour.
              </p>
            </motion.div>
          )}

          {/* ── RESET MODE ── */}
          {mode === 'reset' && !success && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-gray-500 text-sm text-center mb-4">
                Choose a new password for your account.
              </p>

              {/* New password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <p className={`text-xs ${password === confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                  {password === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}

          {/* ── SUCCESS ── */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-3"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-gray-800">Password updated!</p>
              <p className="text-sm text-gray-400">Redirecting you to the app...</p>
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </motion.div>
          )}

          {/* Back to login */}
          {!success && (
            <>
              <div className="my-4 h-px bg-gray-100" />
              <Link
                href={`/${locale}/auth/login`}
                className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          🍽️ EatTogether — Don&apos;t eat alone
        </p>
      </motion.div>
    </div>
  );
}
