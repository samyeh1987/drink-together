'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Loader2,
  Camera,
} from 'lucide-react';
import { fetchMoments, likeMoment } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface GalleryPhoto {
  id: string;
  url: string;
  content: string;
  author: string;
  authorAvatar?: string;
  authorId: string;
  likes: number;
  timestamp: string;
  likedByMe?: boolean;
  momentId: string;
}

export default function GalleryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPhotos() {
      try {
        // Fetch moments with images from the moments table
        const result = await fetchMoments({ limit: 50 });
        if (result && result.length > 0) {
          // Filter only moments that have images, then flatten into photo grid
          const mapped: GalleryPhoto[] = [];
          result.forEach((m: any) => {
            if (m.images && m.images.length > 0) {
              m.images.forEach((url: string, imgIdx: number) => {
                mapped.push({
                  id: `${m.id}-${imgIdx}`,
                  url,
                  content: m.content || '',
                  author: m.author?.nickname || 'User',
                  authorAvatar: m.author?.avatar_url || undefined,
                  authorId: m.user_id,
                  likes: m.likes_count || 0,
                  timestamp: m.created_at,
                  likedByMe: m.has_liked || false,
                  momentId: m.id,
                });
              });
            }
          });
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

  const toggleLike = async (photo: GalleryPhoto) => {
    if (!user?.id) return;
    const newLiked = !photo.likedByMe;
    // Optimistic update
    setPhotos(prev => prev.map(p =>
      p.id === photo.id
        ? { ...p, likedByMe: newLiked, likes: newLiked ? p.likes + 1 : p.likes - 1 }
        : p
    ));
    await likeMoment(photo.momentId);
  };

  function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return locale === 'zh-CN' ? '剛剛' : 'just now';
    if (minutes < 60) return locale === 'zh-CN' ? `${minutes}分鐘前` : `${minutes}m ago`;
    if (hours < 24) return locale === 'zh-CN' ? `${hours}小時前` : `${hours}h ago`;
    if (days < 7) return locale === 'zh-CN' ? `${days}天前` : `${days}d ago`;
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
            {locale === 'zh-CN' ? '酒友相簿' : locale === 'th' ? 'แกลเลอรี' : 'Gallery'}
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
              ? '發布動態時附上照片，一起分享喝酒時刻！'
              : locale === 'th'
                ? 'แชร์รูปภาพในโมเมนต์ของคุณ!'
                : 'Add photos to your moments and share the fun!'}
          </p>
          <Link
            href={`/${locale}/moments`}
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm mt-6"
          >
            {locale === 'zh-CN' ? '查看動態' : locale === 'th' ? 'ดูโมเมนต์' : 'View Moments'}
          </Link>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-light">
              {photos.length} {locale === 'zh-CN' ? '張照片' : locale === 'th' ? 'รูปภาพ' : 'photos'}
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
                        alt={photo.content || 'Gallery photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Like badge */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(photo); }}
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                      >
                        <Heart
                          className={`w-3 h-3 ${photo.likedByMe ? 'text-coral' : 'text-white'}`}
                          fill={photo.likedByMe ? 'currentColor' : 'none'}
                        />
                        <span className="text-[10px] text-white font-medium">
                          {photo.likes}
                        </span>
                      </button>
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      {photo.content && (
                        <p className="text-xs text-white/80 line-clamp-2 mb-1.5">{photo.content}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Link href={`/${locale}/user/${photo.authorId}`} className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary/30 to-coral/30 flex items-center justify-center overflow-hidden">
                            {photo.authorAvatar ? (
                              <img src={photo.authorAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-bold text-white">{photo.author.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-light truncate">{photo.author}</span>
                        </Link>
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
