'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Image as ImageIcon,
  Loader2,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  id: string;
  url: string;
  mealTitle: string;
  restaurant: string;
  author: string;
  authorAvatar?: string;
  likes: number;
  timestamp: string;
  likedByMe?: boolean;
}

export default function GalleryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadPhotos() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('meal_photos')
          .select(`
            id,
            url,
            caption,
            likes_count,
            created_at,
            meal:meals(title, restaurant_name),
            uploader:profiles!meal_photos_uploader_id_fkey(nickname, avatar_url)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            url: p.url,
            mealTitle: p.meal?.title || 'Meal',
            restaurant: p.meal?.restaurant_name || '',
            author: p.uploader?.nickname || 'User',
            authorAvatar: p.uploader?.avatar_url || null,
            likes: p.likes_count || 0,
            timestamp: p.created_at,
          }));
          setPhotos(mapped);
        }
      } catch (err) {
        console.error('Failed to load gallery:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPhotos();
  }, []);

  const toggleLike = (photoId: string) => {
    setLikedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="min-h-screen pb-20 bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-primary/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-xl hover:bg-dark/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-base font-semibold text-white">
            {t('gallery.title')}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-gray-light">{t('common.loading')}</p>
        </div>
      ) : photos.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-gray-light" />
          </div>
          <p className="text-sm text-white font-medium mb-1">
            {locale === 'zh-CN' ? '還沒有照片' : locale === 'th' ? 'ยังไม่มีรูปภาพ' : 'No photos yet'}
          </p>
          <p className="text-xs text-gray-light text-center mt-1">
            {locale === 'zh-CN'
              ? '參加酒局後，拍下歡樂時光，分享給大家吧！'
              : locale === 'th'
                ? 'เข้าร่วมงานดื่ม ถ่ายรูปช่วงเวลาดีๆ และแชร์กับทุกคน!'
                : 'Join a drink, capture the moment, and share it with everyone!'}
          </p>
          <Link
            href={`/${locale}/meals`}
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm mt-6"
          >
            {locale === 'zh-CN' ? '探索酒局' : locale === 'th' ? 'ค้นหางานดื่ม' : 'Explore Drinks'}
          </Link>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-light">
              {photos.length} {t('gallery.photosCount')}
            </p>
          </div>

          {/* Photo Grid - Masonry style */}
          <div className="px-4">
            <div className="columns-2 gap-2.5 space-y-2.5">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="break-inside-avoid"
                >
                  <div className="card overflow-hidden p-0 cursor-pointer group">
                    {/* Photo - varying heights for masonry effect */}
                    <div className={`relative overflow-hidden ${index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.mealTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Like badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                        <Heart
                          className={`w-3 h-3 ${likedPhotos.has(photo.id) ? 'text-coral fill-coral' : 'text-white'}`}
                          fill={likedPhotos.has(photo.id) ? 'currentColor' : 'none'}
                        />
                        <span className="text-[10px] text-white font-medium">
                          {photo.likes}
                        </span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-white truncate">{photo.mealTitle}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary/30 to-coral/30 flex items-center justify-center overflow-hidden">
                            {photo.authorAvatar ? (
                              <img src={photo.authorAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-bold text-white">{photo.author.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-light truncate">{photo.author}</span>
                        </div>
                        <span className="text-[10px] text-gray-light">{relativeTime(photo.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
