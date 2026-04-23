'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Image as ImageIcon, X, Send, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/client';

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  user: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
  };
  has_liked?: boolean;
}

async function fetchCommunityPosts(userId?: string): Promise<Post[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      id, user_id, content, image_url, likes_count, created_at,
      user:profiles!user_id(id, nickname, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  if (userId) {
    // Check which posts the current user has liked
    const postIds = data.map((p: any) => p.id);
    const { data: likes } = await supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    const likedSet = new Set((likes || []).map((l: any) => l.post_id));
    return data.map((p: any) => ({
      ...p,
      user: Array.isArray(p.user) ? p.user[0] : p.user,
      has_liked: likedSet.has(p.id),
    })) as Post[];
  }

  return (data as any[]).map((p: any) => ({ ...p, has_liked: false })) as Post[];
}

async function toggleLike(postId: string, userId: string, hasLiked: boolean) {
  const supabase = createClient();
  if (hasLiked) {
    await supabase.from('community_post_likes').delete().match({ post_id: postId, user_id: userId });
  } else {
    await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
  }
}

async function createPost(userId: string, content: string, imageUrl?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ user_id: userId, content: content || null, image_url: imageUrl || null })
    .select(`
      id, user_id, content, image_url, likes_count, created_at,
      user:profiles!user_id(id, nickname, avatar_url)
    `)
    .single();
  return { data, error };
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchCommunityPosts(user?.id);
      setPosts(data);
      setLoading(false);
    })();
  }, [user?.id]);

  const handleLike = async (post: Post) => {
    if (!user?.id) return;
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, has_liked: !p.has_liked, likes_count: p.has_liked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ));
    await toggleLike(post.id, user.id, post.has_liked || false);
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
        const ext = imageFile.name.split('.').pop();
        const path = `community/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
          imageUrl = publicUrl;
        }
      }

      const { data, error } = await createPost(user.id, content.trim(), imageUrl);
      if (!error && data) {
        setPosts(prev => [{ ...data as any, has_liked: false }, ...prev]);
        setContent('');
        setImagePreview(null);
        setImageFile(null);
        setShowCompose(false);
      }
    } catch (err) {
      console.error('Post error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 pb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            🍻 {locale === 'zh-CN' ? '酒友圈' : 'Drink Circle'}
          </h2>
          <p className="text-xs text-gray mt-0.5">
            {locale === 'zh-CN' ? '分享你的喝酒時刻' : 'Share your drinking moments'}
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 text-primary text-sm font-medium border border-primary/30 hover:bg-primary/30 transition-colors"
          >
            <Camera className="w-4 h-4" />
            {locale === 'zh-CN' ? '發布' : 'Post'}
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
            {locale === 'zh-CN' ? '還沒有貼文，來第一個發布吧！' : 'No posts yet. Be the first!'}
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
                <Link href={`/${locale}/user/${post.user?.id}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-coral/40 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                    {post.user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(post.user?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${locale}/user/${post.user?.id}`}>
                    <p className="text-sm font-semibold text-white truncate hover:text-primary transition-colors">
                      {post.user?.nickname || 'Anonymous'}
                    </p>
                  </Link>
                  <p className="text-[11px] text-gray">{timeAgo(post.created_at, locale)}</p>
                </div>
              </div>

              {/* Content */}
              {post.content && (
                <p className="text-sm text-white/90 leading-relaxed mb-3">{post.content}</p>
              )}

              {/* Image */}
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full rounded-xl object-cover max-h-64 mb-3"
                />
              )}

              {/* Like button */}
              <div className="flex items-center gap-2">
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
                  {post.likes_count}
                </button>
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
                  {locale === 'zh-CN' ? '分享到酒友圈' : 'Share to Drink Circle'}
                </h3>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (!content.trim() && !imageFile)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {locale === 'zh-CN' ? '發布' : 'Post'}
                </button>
              </div>

              {/* Avatar + textarea */}
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{(user?.nickname || '?').charAt(0)}</span>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={locale === 'zh-CN' ? '今晚喝了什麼好酒？分享一下...' : 'What are you drinking tonight? Share it...'}
                  rows={4}
                  maxLength={300}
                  className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray resize-none outline-none focus:border-primary/40"
                />
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="relative mb-4 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="" className="w-full max-h-48 object-cover" />
                  <button
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {/* Add photo button */}
              {!imagePreview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl border border-white/20 text-sm text-gray hover:text-white transition-colors w-full justify-center"
                >
                  <ImageIcon className="w-4 h-4" />
                  {locale === 'zh-CN' ? '添加照片' : 'Add Photo'}
                </button>
              )}

              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <div className="h-6 safe-bottom" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
