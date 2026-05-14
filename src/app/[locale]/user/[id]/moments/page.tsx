'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Heart, MessageCircle, BookOpen } from 'lucide-react';
import { fetchMoments } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Moment } from '@/types';

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  const t = useTranslations();
  if (mins < 1) return t('moments.timeJustNow');
  if (mins < 60) return t('moments.timeMinutesAgo', { minutes: mins });
  if (hours < 24) return t('moments.timeHoursAgo', { hours });
  if (days < 7) return t('moments.timeDaysAgo', { days });
  if (weeks < 4) return t('moments.timeWeeksAgo', { weeks });
  return new Date(dateStr).toLocaleDateString();
}

export default function UserMomentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const data = await fetchMoments({ userId, limit: 50 });
      setMoments(data);
      if (data.length > 0 && data[0].user) {
        setOwner(data[0].user);
      }
      setIsLoading(false);
    })();
  }, [userId]);

  const title = isOwnProfile
    ? t('moments.myMoments')
    : owner
      ? t('moments.userMoments', { name: owner.nickname })
      : t('moments.myMoments');

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark/80 backdrop-blur-xl border-b border-gray-lighter/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl text-gray hover:text-dark hover:bg-gray-lighter/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-dark">{title}</h1>
        </div>
      </div>

      {/* Moments List */}
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : moments.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-lighter mx-auto mb-3" />
            <p className="text-sm text-gray">{t('moments.noMoments')}</p>
            <p className="text-xs text-gray-light mt-1">{t('moments.noMomentsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moments.map((moment, index) => (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-4"
              >
                {/* Content */}
                {moment.content && (
                  <p className="text-sm text-gray leading-relaxed mb-3 whitespace-pre-wrap">
                    {moment.content}
                  </p>
                )}

                {/* Images grid */}
                {moment.images && moment.images.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${
                    moment.images.length === 1 ? 'grid-cols-1' :
                    moment.images.length === 2 ? 'grid-cols-2' :
                    moment.images.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}>
                    {moment.images.slice(0, 6).map((img, i) => (
                      <div
                        key={i}
                        className={`rounded-xl overflow-hidden ${
                          moment.images!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {moment.images.length > 6 && (
                      <div className="aspect-square rounded-xl bg-gray-lighter/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray">+{moment.images.length - 6}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mood tag & Location */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {moment.mood_tag && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {t(`moments.moodTag.${moment.mood_tag}`)}
                    </span>
                  )}
                  {moment.bar && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
                      📍 {moment.bar.name}
                    </span>
                  )}
                  {moment.location_name && !moment.bar && (
                    <span className="text-xs text-gray-light">
                      📍 {moment.location_name}
                    </span>
                  )}
                </div>

                {/* Stats & Time */}
                <div className="flex items-center justify-between text-xs text-gray-light">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {moment.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {moment.comments_count}
                    </span>
                  </div>
                  <TimeAgo dateStr={moment.created_at} locale={locale} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to use useTranslations hook
function TimeAgo({ dateStr, locale }: { dateStr: string; locale: string }) {
  const t = useTranslations();
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  let text: string;
  if (mins < 1) text = t('moments.timeJustNow');
  else if (mins < 60) text = t('moments.timeMinutesAgo', { minutes: mins });
  else if (hours < 24) text = t('moments.timeHoursAgo', { hours });
  else if (days < 7) text = t('moments.timeDaysAgo', { days });
  else if (weeks < 4) text = t('moments.timeWeeksAgo', { weeks });
  else text = new Date(dateStr).toLocaleDateString();

  return <span>{text}</span>;
}
