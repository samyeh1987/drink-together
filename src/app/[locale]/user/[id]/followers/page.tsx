'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, UserPlus, UserMinus, UserCheck } from 'lucide-react';
import { fetchFollowers, fetchFollowerCount, followUser, unfollowUser, checkFollowStatus } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function FollowersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [followers, setFollowers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [data, count] = await Promise.all([fetchFollowers(userId), fetchFollowerCount(userId)]);
      setFollowers(data);
      setTotalCount(count);
      setIsLoading(false);
    })();
  }, [userId]);

  const handleFollow = async (targetId: string) => {
    setLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    await followUser(targetId);
    setFollowStatusMap((prev) => ({ ...prev, [targetId]: true }));
    setLoadingMap((prev) => ({ ...prev, [targetId]: false }));
  };

  const handleUnfollow = async (targetId: string) => {
    setLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    await unfollowUser(targetId);
    setFollowStatusMap((prev) => ({ ...prev, [targetId]: false }));
    setLoadingMap((prev) => ({ ...prev, [targetId]: false }));
  };

  const checkAndSetStatus = async (targetId: string) => {
    const status = await checkFollowStatus(targetId);
    setFollowStatusMap((prev) => ({ ...prev, [targetId]: status.isFollowing }));
  };

  // Check follow status for each follower on mount
  useEffect(() => {
    if (!currentUser || !followers.length) return;
    followers.forEach((f) => {
      if (f.follower?.id && f.follower.id !== currentUser.id) {
        checkAndSetStatus(f.follower.id);
      }
    });
  }, [followers, currentUser]);

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
          <div>
            <h1 className="font-bold text-dark">{t('social.followers')}</h1>
            <p className="text-xs text-gray">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-20">
            <UserCheck className="w-12 h-12 text-gray-lighter mx-auto mb-3" />
            <p className="text-sm text-gray">{t('social.noFollowers')}</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {followers.map((item: any, index: number) => {
              const user = item.follower;
              if (!user) return null;
              const isFollowing = followStatusMap[user.id] || false;
              const isSelf = currentUser?.id === user.id;
              const isLoadingFollow = loadingMap[user.id] || false;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 py-3 border-b border-gray-lighter/5 last:border-0"
                >
                  <Link href={`/${locale}/user/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {(user.nickname || '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{user.nickname || 'Anonymous'}</p>
                      {user.bio && (
                        <p className="text-xs text-gray truncate">{user.bio}</p>
                      )}
                    </div>
                  </Link>
                  {!isSelf && (
                    <button
                      onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                      disabled={isLoadingFollow}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                        isFollowing
                          ? 'border border-gray-lighter/30 text-gray hover:bg-gray-lighter/10'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {isLoadingFollow ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-3 h-3" />
                          {t('social.following')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          {t('social.follow')}
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
