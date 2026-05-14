'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Send, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { fetchMoments, createMoment, likeMoment } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

// Lock body scroll when compose modal is open
function useBodyScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [lock]);
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === 'zh-CN') {
    if (mins < 1) return '剛剛';
    if (mins < 60) return `${mins}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    return `${days}天前`;
  } else if (locale === 'th') {
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins}นาทีที่แล้ว`;
    if (hours < 24) return `${hours}ชั่วโมงที่แล้ว`;
    return `${days}วันที่แล้ว`;
  } else {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export default function CommunityFeed() {
  const locale = useLocale();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when compose modal opens
  useBodyScrollLock(showCompose);

  useEffect(() => {
    (async () => {
      const result = await fetchMoments({ limit: 20 });
      if (result && result.length > 0) {
        setPosts(result);
      }
      setLoading(false);
    })();
  }, []);

  const handleLike = async (post: any) => {
    if (!user?.id) return;
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, has_liked: !p.has_liked, likes_count: p.has_liked ? (p.likes_count || 0) - 1 : (p.likes_count || 0) + 1 }
        : p
    ));
    await likeMoment(post.id);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async () => {
    if (!user?.id || (!content.trim() && !imageFile)) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${ext}`;
        const path = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('moment-photos')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          alert('Upload failed: ' + uploadError.message);
        } else {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          imageUrl = `${supabaseUrl}/storage/v1/object/public/moment-photos/${path}`;
        }
      }

      const result = await createMoment({
        content: content.trim(),
        images: imageUrl ? [imageUrl] : [],
      });
      if (result.success) {
        // Re-fetch moments to get the new post
        const updated = await fetchMoments({ limit: 20 });
        if (updated && updated.length > 0) {
          setPosts(updated);
        }
        setContent('');
        setImagePreview(null);
        setImageFile(null);
        setShowCompose(false);
      } else {
        alert(result.error || 'Post failed');
      }
    } catch (err) {
      console.error('Post error:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const canPost = content.trim() || imageFile;

  return (
    <section className="px-4 pb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            🍻 {locale === 'zh-CN' ? '酒友圈' : locale === 'th' ? 'วงการดื่ม' : 'Drink Circle'}
          </h2>
          <p className="text-xs text-gray mt-0.5">
            {locale === 'zh-CN' ? '分享你的喝酒時刻' : locale === 'th' ? 'แชร์ช่วงเวลาดื่มของคุณ' : 'Share your drinking moments'}
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 text-primary text-sm font-medium border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            <Camera className="w-4 h-4" />
            {locale === 'zh-CN' ? '發布' : locale === 'th' ? 'โพสต์' : 'Post'}
          </button>
        )}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">🍸</p>
          <p className="text-gray text-sm">
            {locale === 'zh-CN' ? '還沒有貼文，來第一個發布吧！' : locale === 'th' ? 'ยังไม่มีโพสต์ เป็นคนแรกเลย!' : 'No posts yet. Be the first!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4"
            >
              {/* User info row */}
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/${locale}/user/${post.user_id}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-coral/40 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                    {post.author?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(post.author?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${locale}/user/${post.user_id}`}>
                    <p className="text-sm font-semibold text-white truncate hover:text-primary transition-colors">
                      {post.author?.nickname || 'Anonymous'}
                    </p>
                  </Link>
                  <p className="text-[11px] text-gray">{timeAgo(post.created_at, locale)}</p>
                </div>
              </div>

              {/* Content - image-first when both exist */}
              {post.images && post.images.length > 0 ? (
                // Photo post: image on top
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.images[0]}
                    alt=""
                    className="w-full rounded-xl object-cover max-h-72 mb-2"
                  />
                  {post.content && (
                    <p className="text-sm text-white/90 leading-relaxed -mt-1">{post.content}</p>
                  )}
                </>
              ) : (
                // Text-only post: styled differently
                <div className="relative pl-4">
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-coral rounded-full" />
                  <p className="text-sm text-white/90 leading-relaxed italic">{post.content}</p>
                </div>
              )}

              {/* Like button + mood */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleLike(post)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                    post.has_liked
                      ? 'bg-coral/20 text-coral'
                      : 'glass border-white/10 text-gray hover:text-coral'
                  }`}
                >
                  <Heart
                    className="w-3.5 h-3.5"
                    fill={post.has_liked ? 'currentColor' : 'none'}
                  />
                  {post.likes_count || 0}
                </button>
                {post.mood && (
                  <span className="text-xs text-gray-light">
                    {post.mood}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCompose(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-dark rounded-t-3xl p-5 pb-safe"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setShowCompose(false)}>
                  <X className="w-5 h-5 text-gray" />
                </button>
                <h3 className="font-bold text-white">
                  {locale === 'zh-CN' ? '分享到酒友圈' : locale === 'th' ? 'แชร์ไปยังวงการดื่ม' : 'Share to Drink Circle'}
                </h3>
                <button
                  onClick={() => {
                    if (submitting) return;
                    if (!canPost) {
                      alert(locale === 'zh-CN' ? '請填寫文字或加入照片' : 'Please add text or a photo');
                      return;
                    }
                    handleSubmit();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {locale === 'zh-CN' ? '發布' : locale === 'th' ? 'โพสต์' : 'Post'}
                </button>
              </div>

              {/* Avatar row with photo button */}
              <div className="flex gap-3 mb-3 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{(user?.nickname || '?').charAt(0)}</span>
                  )}
                </div>

                {/* Image upload / preview area */}
                {!imagePreview ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl border border-dashed border-white/30 text-sm text-gray hover:text-white hover:border-primary/50 transition-colors flex-1"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    {locale === 'zh-CN' ? '加入照片' : locale === 'th' ? 'เพิ่มรูปภาพ' : 'Add Photo'}
                  </button>
                ) : (
                  <div className="flex-1 relative rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="" className="w-full h-32 object-cover" />
                    <button
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={locale === 'zh-CN' ? '說說你的喝酒故事...' : locale === 'th' ? 'เล่าเรื่องการดื่มของคุณ...' : 'Share your drinking story...'}
                rows={3}
                maxLength={300}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray resize-none outline-none focus:border-primary/40 mb-3"
              />

              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <div className="h-6 safe-bottom" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
