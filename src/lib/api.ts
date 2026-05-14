import { createClient } from '@/lib/supabase/client';
import type { Meal, MealParticipant, User, Tag, CreditHistory, Notification, Bar, BarRating, BarCheckin, BarCoinGrant, CoinTransaction, DailyCheckin, ShopItem, ShopOrder, Moment, MomentComment, MessageThread, Message, Follow, UserBlock } from '@/types';

// =============================================
// DB Row types (Supabase query results)
// =============================================

interface MealRow {
  id: string;
  creator_id: string;
  title: string;
  restaurant_name: string;
  restaurant_address: string | null;
  latitude: number | null;
  longitude: number | null;
  cuisine_type: string;
  meal_languages: string[] | null;
  datetime: string;
  deadline: string;
  min_participants: number;
  max_participants: number;
  payment_method: string;
  budget_min: number | null;
  budget_max: number | null;
  description: string | null;
  note: string | null;
  status: string;
  created_at: string;
  creator?: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    credit_score: number | null;
    languages_spoken: string[] | null;
  };
  participants?: Array<{
    id: string;
    meal_id: string;
    user_id: string;
    status: string;
    joined_at: string;
    user?: {
      id: string;
      nickname: string | null;
      avatar_url: string | null;
      credit_score: number | null;
    };
  }>;
  meal_tags?: Array<{ tag: Tag | null }>;
}

interface ProfileRow {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  email: string | null;
  age_range: string | null;
  occupation: string | null;
  bio: string | null;
  languages_spoken: string[] | null;
  credit_score: number;
  email_verified: boolean;
  created_at: string;
  user_tags?: Array<{ tag: Tag }>;
}

interface MyMealRow {
  id: string;
  title: string;
  restaurant_name: string;
  datetime: string;
  status: string;
  cuisine_type: string;
  min_participants: number;
  max_participants: number;
  meal_languages: string[] | null;
  note: string | null;
}

// =============================================
// Meals
// =============================================

export async function fetchOpenMeals(): Promise<Meal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      creator:profiles!meals_creator_id_fkey(id, nickname, avatar_url, credit_score, languages_spoken),
      participants:meal_participants(id, user_id, status)
    `)
    .in('status', ['open', 'confirmed', 'ongoing'])
    .order('datetime', { ascending: true });

  if (error) {
    console.error('fetchOpenMeals error:', error);
    return [];
  }
  return ((data as MealRow[]) || []).map(raw => transformMeal(raw));
}

export async function fetchMealById(mealId: string): Promise<Meal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      creator:profiles!meals_creator_id_fkey(id, nickname, avatar_url, credit_score, languages_spoken),
      participants:meal_participants(
        id, user_id, status, joined_at,
        user:profiles!meal_participants_user_id_fkey(id, nickname, avatar_url, credit_score)
      ),
      meal_tags(
        tag:tags(id, name, category, i18n_key)
      )
    `)
    .eq('id', mealId)
    .single();

  if (error) {
    console.error('fetchMealById error:', error);
    return null;
  }
  return transformMeal(data);
}

export async function createMeal(formData: {
  title: string;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_type: string;
  meal_languages: string[];
  datetime: string;
  deadline: string;
  min_participants: number;
  max_participants: number;
  payment_method: string;
  budget_min: number | null;
  budget_max: number | null;
  description: string;
  note: string | null;
  tags: string[];
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ success: boolean; mealId?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  // Insert meal (deadline defaults to datetime if not set)
  const mealDeadline = formData.deadline || formData.datetime;
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({
      creator_id: user.id,
      title: formData.title,
      restaurant_name: formData.restaurant_name,
      restaurant_address: formData.restaurant_address,
      cuisine_type: formData.cuisine_type,
      meal_languages: formData.meal_languages,
      datetime: formData.datetime,
      deadline: mealDeadline,
      status: 'open',
      min_participants: formData.min_participants,
      max_participants: formData.max_participants,
      payment_method: formData.payment_method,
      budget_min: formData.budget_min ? parseInt(String(formData.budget_min)) : null,
      budget_max: formData.budget_max ? parseInt(String(formData.budget_max)) : null,
      description: formData.description,
      note: formData.note,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
    })
    .select('id')
    .single();

  if (mealError || !meal) {
    const errMsg = mealError?.message || 'Failed to create meal';
    return { success: false, error: errMsg };
  }

  // Insert meal tags if any
  if (formData.tags.length > 0) {
    // First find tag IDs by i18n_key pattern
    const { data: existingTags } = await supabase
      .from('tags')
      .select('id, i18n_key')
      .in('i18n_key', formData.tags.map(t => `tag.${t}`));

    if (existingTags && existingTags.length > 0) {
      const mealTagRows = existingTags.map(tag => ({
        meal_id: meal.id,
        tag_id: tag.id,
      }));
      await supabase.from('meal_tags').insert(mealTagRows);
    }
  }

  return { success: true, mealId: meal.id };
}

export async function joinMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  // Get meal info for notification
  const { data: meal } = await supabase
    .from('meals')
    .select('creator_id, title')
    .eq('id', mealId)
    .single();

  const { error } = await supabase
    .from('meal_participants')
    .insert({
      meal_id: mealId,
      user_id: user.id,
      status: 'approved',
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already joined' };
    return { success: false, error: error.message };
  }

  // Notify meal host (fire-and-forget)
  if (meal && meal.creator_id !== user.id) {
    const [{ data: profile }, { data: hostProfile }] = await Promise.all([
      supabase.from('profiles').select('nickname').eq('id', user.id).single(),
      supabase.from('profiles').select('languages_spoken').eq('id', meal.creator_id).single(),
    ]);
    createNotification({
      userId: meal.creator_id,
      type: 'joined',
      actorName: profile?.nickname || 'Someone',
      mealTitle: meal.title,
      mealId,
      actorId: user.id,
      recipientLanguages: (hostProfile?.languages_spoken as string[]) || [],
    }).catch(() => {});
  }

  return { success: true };
}

export async function leaveMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  // Get meal info for notification
  const { data: meal } = await supabase
    .from('meals')
    .select('creator_id, title')
    .eq('id', mealId)
    .single();

  const { error } = await supabase
    .from('meal_participants')
    .update({ status: 'cancelled' })
    .eq('meal_id', mealId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  // Notify meal host (fire-and-forget)
  if (meal && meal.creator_id !== user.id) {
    const [{ data: profile }, { data: hostProfile }] = await Promise.all([
      supabase.from('profiles').select('nickname').eq('id', user.id).single(),
      supabase.from('profiles').select('languages_spoken').eq('id', meal.creator_id).single(),
    ]);
    createNotification({
      userId: meal.creator_id,
      type: 'leave',
      actorName: profile?.nickname || 'Someone',
      mealTitle: meal.title,
      mealId,
      actorId: user.id,
      recipientLanguages: (hostProfile?.languages_spoken as string[]) || [],
    }).catch(() => {});
  }

  return { success: true };
}

export async function cancelMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get meal info for notification to participants
  const { data: meal } = await supabase
    .from('meals')
    .select('title')
    .eq('id', mealId)
    .single();

  const { error } = await supabase
    .from('meals')
    .update({ status: 'cancelled' })
    .eq('id', mealId);

  if (error) return { success: false, error: error.message };

  // Notify all participants (fire-and-forget)
  if (meal) {
    const { data: participants } = await supabase
      .from('meal_participants')
      .select('user_id')
      .eq('meal_id', mealId)
      .eq('status', 'approved');
    if (participants) {
      // Batch fetch participant languages
      const participantIds = participants.filter(p => p.user_id !== user?.id).map(p => p.user_id);
      let langMap: Record<string, string[]> = {};
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, languages_spoken')
          .in('id', participantIds);
        if (profiles) {
          langMap = profiles.reduce((acc, p) => {
            acc[p.id] = (p.languages_spoken as string[]) || [];
            return acc;
          }, {} as Record<string, string[]>);
        }
      }
      await Promise.all(
        participants
          .filter((p) => p.user_id !== user?.id)
          .map((p) =>
            createNotification({
              userId: p.user_id,
              type: 'cancelled',
              mealTitle: meal.title,
              mealId,
              recipientLanguages: langMap[p.user_id] || [],
            }).catch(() => {})
          )
      );
    }
  }

  return { success: true };
}

export async function fetchMyMeals(userId: string): Promise<Array<MyMealRow & { role: 'host' | 'participant'; current: number; cuisineEmoji: string; languages: Array<{ key: string; flag: string }> }>> {
  const supabase = createClient();

  // Meals where user is creator
  const { data: hosted, error: e1 } = await supabase
    .from('meals')
    .select('id, title, restaurant_name, datetime, status, cuisine_type, min_participants, max_participants, meal_languages, note')
    .eq('creator_id', userId)
    .order('datetime', { ascending: false });

  // Meals where user is participant
  const { data: participated, error: e2 } = await supabase
    .from('meal_participants')
    .select('meal_id, status')
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (e1 || e2 || !hosted || !participated) return [];

  const participatedMealIds = participated.map(p => p.meal_id);

  const { data: joined, error: e3 } = participatedMealIds.length > 0
    ? await supabase
        .from('meals')
        .select('id, title, restaurant_name, datetime, status, cuisine_type, min_participants, max_participants, meal_languages, note')
        .in('id', participatedMealIds)
        .neq('creator_id', userId)
        .order('datetime', { ascending: false })
    : { data: [], error: null };

  if (e3) return [];

  // Get participant counts for all meals
  const allMealIds = [
    ...hosted.map(m => m.id),
    ...(joined || []).map(m => m.id),
  ];

  let countMap: Record<string, number> = {};
  if (allMealIds.length > 0) {
    const { data: counts } = await supabase
      .from('meal_participants')
      .select('meal_id')
      .eq('status', 'approved')
      .in('meal_id', allMealIds);
    if (counts) {
      countMap = counts.reduce((acc, c) => {
        acc[c.meal_id] = (acc[c.meal_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  const CUISINE_EMOJI: Record<string, string> = {
    japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
    western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
    dimsum: '🥟', vegetarian: '🥗', other: '🍴',
  };

  const FLAG_MAP: Record<string, { key: string; flag: string }> = {
    zh: { key: 'zh', flag: '🇨🇳' }, en: { key: 'en', flag: '🇬🇧' },
    th: { key: 'th', flag: '🇹🇭' }, ja: { key: 'ja', flag: '🇯🇵' }, ko: { key: 'ko', flag: '🇰🇷' },
  };

  const result = [
    ...hosted.map(m => ({
      ...m,
      role: 'host' as const,
      current: countMap[m.id] || 1,
      cuisineEmoji: CUISINE_EMOJI[m.cuisine_type] || '🍴',
      languages: (m.meal_languages || []).map((l: string) => FLAG_MAP[l] || { key: l, flag: '🌍' }),
    })),
    ...(joined || []).map(m => ({
      ...m,
      role: 'participant' as const,
      current: countMap[m.id] || 1,
      cuisineEmoji: CUISINE_EMOJI[m.cuisine_type] || '🍴',
      languages: (m.meal_languages || []).map((l: string) => FLAG_MAP[l] || { key: l, flag: '🌍' }),
    })),
  ];

  return result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
}

// =============================================
// Profile
// =============================================

export async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_tags(tag:tags(id, name, category, i18n_key))
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('fetchProfile error:', error);
    return null;
  }

  return {
    ...(data as ProfileRow),
    tags: ((data as ProfileRow).user_tags || []).map(ut => ut.tag),
  } as unknown as User;
}

export async function updateProfile(updates: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', updates.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchCreditHistory(userId: string): Promise<CreditHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('credit_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data as CreditHistory[]) || [];
}

// =============================================
// Stats
// =============================================

export async function fetchMealStats(): Promise<{ totalMeals: number; totalUsers: number; activeMeals: number }> {
  const supabase = createClient();

  const { count: totalMeals } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'cancelled');

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: activeMeals } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'confirmed']);

  return {
    totalMeals: totalMeals || 0,
    totalUsers: totalUsers || 0,
    activeMeals: activeMeals || 0,
  };
}

// =============================================
// Notifications
// =============================================

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('fetchNotifications error:', error);
    return [];
  }
  return (data || []).map((n: Notification) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data || {},
    read: n.read,
    created_at: n.created_at,
  }));
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count || 0;
}

export async function markNotificationRead(notifId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

// Notification message templates by type and locale
type NotifData = { actorName?: string; mealTitle?: string };
const NOTIF_MESSAGES: Record<string, Record<string, { title: (d: NotifData) => string; message: (d: NotifData) => string }>> = {
  joined: {
    'zh-CN': {
      title: (d) => d.actorName || '有人',
      message: (d) => `加入了你的「${d.mealTitle}」`,
    },
    th: {
      title: (d) => d.actorName || 'ใครบางคน',
      message: (d) => `เข้าร่วม "${d.mealTitle}" ของคุณ`,
    },
    en: {
      title: (d) => d.actorName || 'Someone',
      message: (d) => `joined your "${d.mealTitle}"`,
    },
  },
  leave: {
    'zh-CN': {
      title: (d) => d.actorName || '有人',
      message: (d) => `退出了你的「${d.mealTitle}」`,
    },
    th: {
      title: (d) => d.actorName || 'ใครบางคน',
      message: (d) => `ออกจาก "${d.mealTitle}" ของคุณ`,
    },
    en: {
      title: (d) => d.actorName || 'Someone',
      message: (d) => `left your "${d.mealTitle}"`,
    },
  },
  cancelled: {
    'zh-CN': {
      title: () => '飯局已取消',
      message: (d) => `「${d.mealTitle}」已被取消`,
    },
    th: {
      title: () => 'อาหารถูกยกเลิก',
      message: (d) => `"${d.mealTitle}" ถูกยกเลิกแล้ว`,
    },
    en: {
      title: () => 'Meal Cancelled',
      message: (d) => `"${d.mealTitle}" has been cancelled`,
    },
  },
  confirmed: {
    'zh-CN': {
      title: () => '飯局已成立',
      message: (d) => `「${d.mealTitle}」已確認成立`,
    },
    th: {
      title: () => 'อาหารได้รับการยืนยัน',
      message: (d) => `"${d.mealTitle}" ได้รับการยืนยันแล้ว`,
    },
    en: {
      title: () => 'Meal Confirmed',
      message: (d) => `"${d.mealTitle}" has been confirmed`,
    },
  },
  deadline: {
    'zh-CN': {
      title: () => '報名截止提醒',
      message: (d) => `「${d.mealTitle}」即將截止報名`,
    },
    th: {
      title: () => 'เตือนกำหนด',
      message: (d) => `"${d.mealTitle}" ใกล้ถึงเวลาปิดรับสมัคร`,
    },
    en: {
      title: () => 'Deadline Reminder',
      message: (d) => `"${d.mealTitle}" is closing soon`,
    },
  },
};

function pickLocale(languages: string[]): string {
  if (languages.includes('zh-CN')) return 'zh-CN';
  if (languages.includes('zh')) return 'zh-CN';
  if (languages.includes('th')) return 'th';
  return 'en';
}

export async function createNotification(data: {
  userId: string;
  type: string;
  actorName?: string;
  mealTitle?: string;
  mealId?: string;
  actorId?: string;
  recipientLanguages?: string[];
}): Promise<void> {
  const supabase = createClient();

  const locale = pickLocale(data.recipientLanguages || ['en']);
  const typeTemplates = NOTIF_MESSAGES[data.type];
  const templates = typeTemplates?.[locale] || typeTemplates?.['en'] || NOTIF_MESSAGES.cancelled['en'];

  const title = templates.title({ actorName: data.actorName, mealTitle: data.mealTitle });
  const message = templates.message({ actorName: data.actorName, mealTitle: data.mealTitle });

  await supabase.from('notifications').insert({
    user_id: data.userId,
    type: data.type,
    title,
    message,
    data: {
      meal_id: data.mealId || null,
      actor_id: data.actorId || null,
    },
  });
}

// =============================================
// Avatar Upload
// =============================================

export async function uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed' };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Image must be smaller than 2MB' };
  }

  // Generate unique filename: {userId}/{timestamp}.{ext}
  // Policy requires first folder to be user ID: auth.uid()::text = (storage.foldername(name))[1]
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  // Update profile with avatar_url
  const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-photos/${filePath}`;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('Avatar URL update error:', updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true, url: avatarUrl };
}

// =============================================
// Transform helpers
// =============================================

function transformMeal(raw: MealRow): Meal {
  const CUISINE_EMOJI: Record<string, string> = {
    japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
    western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
    dimsum: '🥟', vegetarian: '🥗', other: '🍴',
  };

  const FLAG_MAP: Record<string, { key: string; flag: string }> = {
    zh: { key: 'zh', flag: '🇨🇳' }, en: { key: 'en', flag: '🇬🇧' },
    th: { key: 'th', flag: '🇹🇭' }, ja: { key: 'ja', flag: '🇯🇵' }, ko: { key: 'ko', flag: '🇰🇷' },
  };

  const PAYMENT_EMOJI: Record<string, string> = {
    hostTreats: '🎉', splitBill: '💰', payOwn: '💳',
  };

  const creator = raw.creator ? {
    id: raw.creator.id,
    email: '',
    nickname: raw.creator.nickname,
    avatar_url: raw.creator.avatar_url,
    age_range: null,
    occupation: null,
    bio: null,
    languages_spoken: raw.creator.languages_spoken || [],
    credit_score: raw.creator.credit_score || 100,
    email_verified: true,
    created_at: '',
    tags: [],
  } : undefined;

  const participants = raw.participants?.map((p) => ({
    id: p.id,
    meal_id: p.meal_id,
    user_id: p.user_id,
    status: p.status,
    joined_at: p.joined_at,
    user: p.user ? {
      id: p.user.id,
      email: '',
      nickname: p.user.nickname,
      avatar_url: p.user.avatar_url,
      age_range: null,
      occupation: null,
      bio: null,
      languages_spoken: [],
      credit_score: p.user.credit_score || 100,
      email_verified: true,
      created_at: '',
      tags: [],
    } : undefined,
  })) || [];

  const tags = raw.meal_tags?.map((mt) => mt.tag).filter(Boolean) || [];

  return {
    id: raw.id,
    creator_id: raw.creator_id,
    title: raw.title,
    restaurant_name: raw.restaurant_name,
    restaurant_address: raw.restaurant_address || '',
    latitude: raw.latitude,
    longitude: raw.longitude,
    cuisine_type: raw.cuisine_type,
    meal_languages: raw.meal_languages || [],
    datetime: raw.datetime,
    deadline: raw.deadline,
    min_participants: raw.min_participants,
    max_participants: raw.max_participants,
    payment_method: raw.payment_method,
    budget_min: raw.budget_min,
    budget_max: raw.budget_max,
    description: raw.description || '',
    note: raw.note,
    status: raw.status,
    created_at: raw.created_at,
    creator,
    participants,
    tags,
    // Extra display fields for backward compat
    _cuisineEmoji: CUISINE_EMOJI[raw.cuisine_type] || '🍴',
    _paymentEmoji: PAYMENT_EMOJI[raw.payment_method] || '💰',
    _currentParticipants: (participants?.filter((p: any) => p.status === 'approved').length || 0) + 1, // +1 for creator
    _languages: (raw.meal_languages || []).map((l: string) => FLAG_MAP[l] || { key: l, flag: '🌍' }),
  } as Meal & {
    _cuisineEmoji: string;
    _paymentEmoji: string;
    _currentParticipants: number;
    _languages: Array<{ key: string; flag: string }>;
  };
}

// =============================================
// Bars (酒吧)
// =============================================

interface BarRow {
  id: string;
  name: string;
  name_en: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string | null;
  opening_hours: Record<string, string> | null;
  min_spend: number | null;
  cover_image_url: string | null;
  images: string[] | null;
  average_rating: number;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchBars(filters?: {
  city?: string;
  category?: string;
  search?: string;
}): Promise<Bar[]> {
  const supabase = createClient();
  let query = supabase
    .from('bars')
    .select('*')
    .eq('is_active', true)
    .order('rating_count', { ascending: false });

  if (filters?.city && filters.city !== 'all') {
    query = query.eq('city', filters.city);
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchBars error:', error);
    return [];
  }
  return ((data as BarRow[]) || []).map(transformBar);
}

export async function fetchBarById(barId: string): Promise<Bar | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bars')
    .select('*')
    .eq('id', barId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('fetchBarById error:', error);
    return null;
  }
  return transformBar(data as BarRow);
}

export async function checkinBar(barId: string, latitude: number, longitude: number): Promise<{
  success: boolean;
  error?: string;
  coins?: number;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH' };

  // Check if already checked in today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data: existing } = await supabase
    .from('bar_checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('bar_id', barId)
    .eq('checkin_date', today)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'TODAY' };
  }

  // Get bar location to verify distance (500m)
  const { data: bar } = await supabase
    .from('bars')
    .select('latitude, longitude')
    .eq('id', barId)
    .single();

  if (bar) {
    const dist = haversineDistance(latitude, longitude, bar.latitude, bar.longitude);
    if (dist > 500) {
      return { success: false, error: 'DISTANCE' };
    }
  }

  // Insert checkin — the AFTER INSERT trigger (on_bar_checkin) will
  // automatically call grant_coins to award 5 coins
  const { error } = await supabase
    .from('bar_checkins')
    .insert({
      user_id: user.id,
      bar_id: barId,
      latitude,
      longitude,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'TODAY' };
    return { success: false, error: error.message };
  }

  return { success: true, coins: 5 };
}

export async function rateBar(barId: string, data: {
  environment_rating: number;
  service_rating: number;
  value_rating: number;
  comment: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH' };

  // Check if already rated
  const { data: existing } = await supabase
    .from('bar_ratings')
    .select('id')
    .eq('user_id', user.id)
    .eq('bar_id', barId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'EXISTS' };
  }

  // Insert rating
  const { error } = await supabase
    .from('bar_ratings')
    .insert({
      user_id: user.id,
      bar_id: barId,
      environment_rating: data.environment_rating,
      service_rating: data.service_rating,
      value_rating: data.value_rating,
      comment: data.comment,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'EXISTS' };
    return { success: false, error: error.message };
  }

  // Update bar average rating (transaction-safe via RPC would be better, but doing client-side for now)
  const { data: ratings } = await supabase
    .from('bar_ratings')
    .select('environment_rating, service_rating, value_rating')
    .eq('bar_id', barId);

  if (ratings && ratings.length > 0) {
    const avgEnv = ratings.reduce((s: number, r: any) => s + r.environment_rating, 0) / ratings.length;
    const avgSvc = ratings.reduce((s: number, r: any) => s + r.service_rating, 0) / ratings.length;
    const avgVal = ratings.reduce((s: number, r: any) => s + r.value_rating, 0) / ratings.length;
    const avgRating = ((avgEnv + avgSvc + avgVal) / 3);

    await supabase
      .from('bars')
      .update({
        average_rating: Math.round(avgRating * 100) / 100,
        rating_count: ratings.length,
      })
      .eq('id', barId);
  }

  return { success: true };
}

export async function fetchBarRatings(barId: string, limit = 20): Promise<BarRating[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bar_ratings')
    .select(`
      *,
      user:profiles!bar_ratings_user_id_fkey(id, nickname, avatar_url)
    `)
    .eq('bar_id', barId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchBarRatings error:', error);
    return [];
  }
  return (data as BarRating[]) || [];
}

export async function fetchMyBarCheckinToday(barId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('bar_checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('bar_id', barId)
    .eq('checkin_date', today)
    .maybeSingle();

  return !!data;
}

export async function fetchMyBarRating(barId: string): Promise<BarRating | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('bar_ratings')
    .select('*')
    .eq('user_id', user.id)
    .eq('bar_id', barId)
    .maybeSingle();

  if (error) return null;
  return data as BarRating;
}

export async function fetchTodayCheckinCount(barId: string): Promise<number> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('bar_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('bar_id', barId)
    .eq('checkin_date', today);

  if (error) return 0;
  return count || 0;
}

// =============================================
// Helpers
// =============================================

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function transformBar(raw: BarRow): Bar {
  return {
    id: raw.id,
    name: raw.name,
    name_en: raw.name_en || null,
    address: raw.address,
    city: raw.city as Bar['city'],
    latitude: raw.latitude,
    longitude: raw.longitude,
    category: raw.category as Bar['category'],
    description: raw.description || '',
    opening_hours: raw.opening_hours || {},
    min_spend: raw.min_spend,
    cover_image_url: raw.cover_image_url,
    images: raw.images || [],
    average_rating: raw.average_rating,
    rating_count: raw.rating_count,
    is_active: raw.is_active,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// =============================================
// Coins (金幣)
// =============================================

interface CoinTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  source_type: string;
  source_id: string | null;
  description: string;
  is_daily_task: boolean;
  created_at: string;
}

export async function fetchCoinTransactions(limit = 30): Promise<CoinTransaction[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchCoinTransactions error:', error);
    return [];
  }
  return (data as CoinTransactionRow[]).map(row => ({
    ...row,
    source_type: row.source_type as CoinTransaction['source_type'],
  }));
}

export async function dailyCheckin(): Promise<{
  success: boolean;
  coins?: number;
  streakDays?: number;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in
  const { data: existing } = await supabase
    .from('daily_checkins')
    .select('id, streak_days, coins_earned')
    .eq('user_id', user.id)
    .eq('checkin_date', today)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'TODAY', streakDays: existing.streak_days };
  }

  // Insert checkin record — the BEFORE INSERT trigger (on_daily_checkin) will:
  // 1. Calculate streak_days and is_streak_bonus automatically
  // 2. Call grant_coins RPC to award coins
  const { data, error } = await supabase
    .from('daily_checkins')
    .insert({
      user_id: user.id,
      checkin_date: today,
      coins_earned: 10, // default, trigger will override
      streak_days: 1,   // default, trigger will override
      is_streak_bonus: false,
    })
    .select('streak_days, coins_earned, is_streak_bonus')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'TODAY', streakDays: 0 };
    return { success: false, error: error.message };
  }

  return { success: true, coins: data.coins_earned, streakDays: data.streak_days };
}

export async function fetchTodayCheckinStatus(): Promise<{
  hasCheckedIn: boolean;
  streakDays: number;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hasCheckedIn: false, streakDays: 0 };

  const today = new Date().toISOString().split('T')[0];

  const { data: todayCheckin } = await supabase
    .from('daily_checkins')
    .select('streak_days')
    .eq('user_id', user.id)
    .eq('checkin_date', today)
    .maybeSingle();

  if (todayCheckin) {
    return { hasCheckedIn: true, streakDays: todayCheckin.streak_days };
  }

  // Get streak from yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const { data: yesterdayCheckin } = await supabase
    .from('daily_checkins')
    .select('streak_days')
    .eq('user_id', user.id)
    .eq('checkin_date', yesterday)
    .maybeSingle();

  return {
    hasCheckedIn: false,
    streakDays: yesterdayCheckin?.streak_days || 0,
  };
}

// =============================================
// Shop (商城)
// =============================================

interface ShopItemRow {
  id: string;
  name_zh: string;
  name_en: string;
  name_th: string;
  description_zh: string;
  description_en: string;
  description_th: string;
  category: string;
  coin_price: number;
  stock: number;
  image_url: string | null;
  terms: string;
  is_active: boolean;
  is_featured: boolean;
  valid_days: number;
  created_at: string;
  updated_at: string;
}

export async function fetchShopItems(category?: string): Promise<ShopItem[]> {
  const supabase = createClient();

  let query = supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('coin_price', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchShopItems error:', error);
    return [];
  }

  return (data as ShopItemRow[]).map(row => ({
    ...row,
    category: row.category as ShopItem['category'],
  }));
}

export async function redeemShopItem(itemId: string): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  // Call RPC to handle atomic redeem (check balance + deduct + create order)
  const { data, error } = await supabase.rpc('redeem_shop_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  });

  if (error) {
    console.error('redeem_shop_item error:', error);
    if (error.message.includes('Insufficient')) {
      return { success: false, error: 'BALANCE' };
    }
    if (error.message.includes('Out of stock')) {
      return { success: false, error: 'STOCK' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, orderId: data };
}

export async function fetchMyShopOrders(): Promise<ShopOrder[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shop_orders')
    .select(`
      *,
      item:shop_items(id, name_zh, name_en, name_th, image_url, coin_price, valid_days)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('fetchMyShopOrders error:', error);
    return [];
  }
  return (data as ShopOrder[]) || [];
}

// =============================================
// Moments (動態)
// =============================================

interface MomentRow {
  id: string;
  user_id: string;
  content: string;
  images: string[] | null;
  visibility: string;
  mood_tag: string | null;
  bar_id: string | null;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  likes_count: number;
  comments_count: number;
  reports_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  user?: { id: string; nickname: string | null; avatar_url: string | null; level: number | null };
  bar?: { id: string; name: string; name_en: string | null };
}

interface MomentCommentRow {
  id: string;
  moment_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
  // Joined
  user?: { id: string; nickname: string | null; avatar_url: string | null };
  // Nested
  replies?: MomentCommentRow[];
}

export async function fetchMoments(options?: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<Moment[]> {
  const supabase = createClient();

  let query = supabase
    .from('moments')
    .select(`
      *,
      user:profiles!moments_user_id_fkey(id, nickname, avatar_url, level),
      bar:bars!moments_bar_id_fkey(id, name, name_en)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) {
    console.error('fetchMoments error:', error);
    return [];
  }

  return ((data as MomentRow[]) || []).map(transformMoment);
}

export async function fetchMomentById(momentId: string): Promise<Moment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('moments')
    .select(`
      *,
      user:profiles!moments_user_id_fkey(id, nickname, avatar_url, level),
      bar:bars!moments_bar_id_fkey(id, name, name_en)
    `)
    .eq('id', momentId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error('fetchMomentById error:', error);
    return null;
  }
  return transformMoment(data as MomentRow);
}

export async function createMoment(data: {
  content: string;
  images?: string[];
  visibility?: 'public' | 'friends' | 'party_only';
  mood_tag?: string | null;
  bar_id?: string | null;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ success: boolean; momentId?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  if (!data.content.trim() && (!data.images || data.images.length === 0)) {
    return { success: false, error: 'EMPTY' };
  }

  const { error: insertError, data: moment } = await supabase
    .from('moments')
    .insert({
      user_id: user.id,
      content: data.content.trim(),
      images: data.images || [],
      visibility: data.visibility || 'public',
      mood_tag: data.mood_tag || null,
      bar_id: data.bar_id || null,
      location_name: data.location_name || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('createMoment error:', insertError);
    return { success: false, error: insertError.message };
  }

  // Grant coins via RPC (+15 coins for posting a moment)
  const { error: grantError } = await supabase.rpc('grant_coins', {
    p_user_id: user.id,
    p_amount: 15,
    p_source_type: 'system_post_moment',
    p_source_id: moment.id,
    p_description: '发布动态奖励',
    p_is_daily_task: true,
  });

  if (grantError) {
    console.error('grant_coins for moment error:', grantError);
  }

  // Note: posts_count is automatically updated by the on_moment_created trigger

  return { success: true, momentId: moment.id };
}

export async function deleteMoment(momentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('moments')
    .update({ is_deleted: true })
    .eq('id', momentId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function likeMoment(momentId: string): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, isLiked: false, error: 'AUTH' };

  const { error } = await supabase
    .from('moment_likes')
    .insert({ user_id: user.id, moment_id: momentId });

  if (error) {
    if (error.code === '23505') {
      return { success: true, isLiked: true }; // Already liked
    }
    return { success: false, isLiked: false, error: error.message };
  }

  // Note: likes_count is automatically updated by the on_moment_liked trigger

  return { success: true, isLiked: true };
}

export async function unlikeMoment(momentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('moment_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('moment_id', momentId);

  if (error) return { success: false, error: error.message };

  // Update likes_count
  void supabase.rpc('increment_moment_likes', { p_moment_id: momentId, p_delta: -1 });

  return { success: true };
}

export async function checkMomentLiked(momentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('moment_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('moment_id', momentId)
    .maybeSingle();

  return !!data;
}

export async function fetchComments(momentId: string): Promise<MomentComment[]> {
  const supabase = createClient();

  // Fetch top-level comments
  const { data, error } = await supabase
    .from('moment_comments')
    .select(`
      *,
      user:profiles!moment_comments_user_id_fkey(id, nickname, avatar_url)
    `)
    .eq('moment_id', momentId)
    .is('parent_id', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchComments error:', error);
    return [];
  }

  // Fetch replies for all comments
  const commentIds = (data || []).map((c: MomentCommentRow) => c.id);
  let replies: Record<string, MomentCommentRow[]> = {};

  if (commentIds.length > 0) {
    const { data: repliesData } = await supabase
      .from('moment_comments')
      .select(`
        *,
        user:profiles!moment_comments_user_id_fkey(id, nickname, avatar_url)
      `)
      .in('parent_id', commentIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (repliesData) {
      replies = (repliesData as MomentCommentRow[]).reduce((acc, r) => {
        if (!acc[r.parent_id!]) acc[r.parent_id!] = [];
        acc[r.parent_id!].push(r);
        return acc;
      }, {} as Record<string, MomentCommentRow[]>);
    }
  }

  return ((data as MomentCommentRow[]) || []).map(row => ({
    id: row.id,
    moment_id: row.moment_id,
    user_id: row.user_id,
    content: row.content,
    parent_id: row.parent_id,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    user: row.user ? { id: row.user.id, nickname: row.user.nickname, avatar_url: row.user.avatar_url } as any : undefined,
    replies: (replies[row.id] || []).map(r => ({
      id: r.id,
      moment_id: r.moment_id,
      user_id: r.user_id,
      content: r.content,
      parent_id: r.parent_id,
      is_deleted: r.is_deleted,
      created_at: r.created_at,
      user: r.user ? { id: r.user.id, nickname: r.user.nickname, avatar_url: r.user.avatar_url } as any : undefined,
    })),
  })) as MomentComment[];
}

export async function addComment(momentId: string, content: string, parentId?: string): Promise<{
  success: boolean;
  commentId?: string;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  if (!content.trim()) return { success: false, error: 'EMPTY' };

  const { data, error } = await supabase
    .from('moment_comments')
    .insert({
      moment_id: momentId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('addComment error:', error);
    return { success: false, error: error.message };
  }

  // Note: comments_count is automatically updated by the on_moment_commented trigger

  return { success: true, commentId: data.id };
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { data: comment } = await supabase
    .from('moment_comments')
    .select('moment_id')
    .eq('id', commentId)
    .single();

  const { error } = await supabase
    .from('moment_comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

export async function reportMoment(momentId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: user.id,
      moment_id: momentId,
      reason,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'EXISTS' };
    return { success: false, error: error.message };
  }

  return { success: true };
}

function transformMoment(raw: MomentRow): Moment {
  return {
    id: raw.id,
    user_id: raw.user_id,
    content: raw.content,
    images: raw.images || [],
    visibility: raw.visibility as Moment['visibility'],
    mood_tag: raw.mood_tag,
    bar_id: raw.bar_id,
    location_name: raw.location_name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    likes_count: raw.likes_count,
    comments_count: raw.comments_count,
    reports_count: raw.reports_count,
    is_deleted: raw.is_deleted,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    user: raw.user ? {
      id: raw.user.id,
      email: '',
      nickname: raw.user.nickname,
      avatar_url: raw.user.avatar_url,
      level: (raw.user.level as any) || 1,
      age_range: null,
      gender: null,
      birth_year: null,
      nationality: null,
      zodiac: null,
      height: null,
      weight: null,
      bio: null,
      languages_spoken: [],
      phone: null,
      phone_verified: false,
      credit_score: 100,
      email_verified: true,
      status: 'active',
      total_coins: 0,
      daily_coin_earned: 0,
      daily_coin_reset_date: '',
      completed_meals_count: 0,
      hosted_meals_count: 0,
      posts_count: 0,
      recommend_count: 0,
      last_credit_recovery_date: '',
      credit_recovery_this_month: 0,
      block_count: 0,
      report_received_count: 0,
      invite_count: 0,
      invited_by: null,
      created_at: '',
      updated_at: '',
      tags: [],
    } : undefined,
    bar: raw.bar ? {
      id: raw.bar.id,
      name: raw.bar.name,
      name_en: raw.bar.name_en || null,
      address: '',
      city: 'bangkok',
      latitude: 0,
      longitude: 0,
      category: 'bar',
      description: '',
      opening_hours: {},
      min_spend: null,
      cover_image_url: null,
      images: [],
      average_rating: 0,
      rating_count: 0,
      is_active: true,
      created_at: '',
      updated_at: '',
    } : undefined,
  };
}

// =============================================
// Chat / Messages (私信)
// =============================================

interface MessageThreadRow {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  created_at: string;
  // Joined
  participant_a_user?: { id: string; nickname: string | null; avatar_url: string | null; level: number | null };
  participant_b_user?: { id: string; nickname: string | null; avatar_url: string | null; level: number | null };
}

interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  image_urls: string[] | null;
  metadata: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  // Joined
  sender?: { id: string; nickname: string | null; avatar_url: string | null };
}

export async function fetchThreads(limit = 50): Promise<MessageThread[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('message_threads')
    .select(`
      *,
      participant_a_user:profiles!message_threads_participant_a_fkey(id, nickname, avatar_url, level),
      participant_b_user:profiles!message_threads_participant_b_fkey(id, nickname, avatar_url, level)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchThreads error:', error);
    return [];
  }

  return ((data as MessageThreadRow[]) || []).map(row => transformThread(row, user.id));
}

export async function getOrCreateThread(otherUserId: string): Promise<{
  success: boolean;
  threadId?: string;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };
  if (user.id === otherUserId) return { success: false, error: 'SELF' };

  // Try to find existing thread (UNIQUE constraint on participant_a, participant_b)
  // Since the constraint is (participant_a, participant_b), need to check both orderings
  const { data: existing } = await supabase
    .from('message_threads')
    .select('id')
    .or(`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    return { success: true, threadId: existing.id };
  }

  // Create new thread - ensure participant_a < participant_b for consistent ordering
  const [a, b] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

  const { data, error } = await supabase
    .from('message_threads')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Concurrent insert race — fetch the existing one
      const { data: retry } = await supabase
        .from('message_threads')
        .select('id')
        .or(`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`)
        .maybeSingle();
      return retry ? { success: true, threadId: retry.id } : { success: false, error: error.message };
    }
    console.error('getOrCreateThread error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, threadId: data.id };
}

export async function fetchMessages(threadId: string, options?: {
  limit?: number;
  before?: string; // cursor: created_at of last message
}): Promise<Message[]> {
  const supabase = createClient();

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, nickname, avatar_url)
    `)
    .eq('thread_id', threadId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  const limit = options?.limit || 30;
  if (options?.before) {
    query = query.lt('created_at', options.before);
  }
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('fetchMessages error:', error);
    return [];
  }

  return ((data as MessageRow[]) || [])
    .reverse() // Reverse to get chronological order
    .map(transformMessage);
}

export async function sendMessage(threadId: string, content: string, messageType: string = 'text', imageUrls: string[] = [], metadata: Record<string, unknown> = {}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  if (!content.trim() && imageUrls.length === 0) {
    return { success: false, error: 'EMPTY' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      content: content.trim(),
      message_type: messageType,
      image_urls: imageUrls,
      metadata,
    })
    .select('id')
    .single();

  if (error) {
    console.error('sendMessage error:', error);
    return { success: false, error: error.message };
  }

  // Update thread's last_message_at
  void supabase
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId);

  return { success: true, messageId: data.id };
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('sender_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchLastMessage(threadId: string): Promise<Message | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, nickname, avatar_url)
    `)
    .eq('thread_id', threadId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data ? transformMessage(data as MessageRow) : null;
}

function transformThread(raw: MessageThreadRow, currentUserId: string): MessageThread {
  const isParticipantA = raw.participant_a === currentUserId;
  const otherUser = isParticipantA ? raw.participant_b_user : raw.participant_a_user;

  return {
    id: raw.id,
    participant_a: raw.participant_a,
    participant_b: raw.participant_b,
    last_message_at: raw.last_message_at,
    created_at: raw.created_at,
    participant_a_user: raw.participant_a_user ? {
      id: raw.participant_a_user.id,
      email: '',
      nickname: raw.participant_a_user.nickname,
      avatar_url: raw.participant_a_user.avatar_url,
      age_range: null,
      gender: null,
      birth_year: null,
      nationality: null,
      zodiac: null,
      height: null,
      weight: null,
      bio: null,
      languages_spoken: [],
      phone: null,
      phone_verified: false,
      credit_score: 100,
      email_verified: true,
      status: 'active',
      level: (raw.participant_a_user.level as any) || 1,
      total_coins: 0,
      daily_coin_earned: 0,
      daily_coin_reset_date: '',
      completed_meals_count: 0,
      hosted_meals_count: 0,
      posts_count: 0,
      recommend_count: 0,
      last_credit_recovery_date: '',
      credit_recovery_this_month: 0,
      block_count: 0,
      report_received_count: 0,
      invite_count: 0,
      invited_by: null,
      created_at: '',
      updated_at: '',
      tags: [],
    } : undefined,
    participant_b_user: raw.participant_b_user ? {
      id: raw.participant_b_user.id,
      email: '',
      nickname: raw.participant_b_user.nickname,
      avatar_url: raw.participant_b_user.avatar_url,
      age_range: null,
      gender: null,
      birth_year: null,
      nationality: null,
      zodiac: null,
      height: null,
      weight: null,
      bio: null,
      languages_spoken: [],
      phone: null,
      phone_verified: false,
      credit_score: 100,
      email_verified: true,
      status: 'active',
      level: (raw.participant_b_user.level as any) || 1,
      total_coins: 0,
      daily_coin_earned: 0,
      daily_coin_reset_date: '',
      completed_meals_count: 0,
      hosted_meals_count: 0,
      posts_count: 0,
      recommend_count: 0,
      last_credit_recovery_date: '',
      credit_recovery_this_month: 0,
      block_count: 0,
      report_received_count: 0,
      invite_count: 0,
      invited_by: null,
      created_at: '',
      updated_at: '',
      tags: [],
    } : undefined,
    // Compute unread count (will be updated by real-time or polling)
    unread_count: 0,
    // Client convenience: the other participant as a direct reference
    _otherUser: otherUser ? {
      id: otherUser.id,
      nickname: otherUser.nickname,
      avatar_url: otherUser.avatar_url,
      level: otherUser.level,
    } : undefined,
  } as MessageThread & { _otherUser?: { id: string; nickname: string | null; avatar_url: string | null; level: number | null } };
}

function transformMessage(raw: MessageRow): Message {
  return {
    id: raw.id,
    thread_id: raw.thread_id,
    sender_id: raw.sender_id,
    content: raw.content,
    message_type: raw.message_type as Message['message_type'],
    image_urls: raw.image_urls || [],
    metadata: raw.metadata || {},
    is_deleted: raw.is_deleted,
    created_at: raw.created_at,
    sender: raw.sender ? {
      id: raw.sender.id,
      email: '',
      nickname: raw.sender.nickname,
      avatar_url: raw.sender.avatar_url,
      age_range: null,
      gender: null,
      birth_year: null,
      nationality: null,
      zodiac: null,
      height: null,
      weight: null,
      bio: null,
      languages_spoken: [],
      phone: null,
      phone_verified: false,
      credit_score: 100,
      email_verified: true,
      status: 'active',
      level: 1,
      total_coins: 0,
      daily_coin_earned: 0,
      daily_coin_reset_date: '',
      completed_meals_count: 0,
      hosted_meals_count: 0,
      posts_count: 0,
      recommend_count: 0,
      last_credit_recovery_date: '',
      credit_recovery_this_month: 0,
      block_count: 0,
      report_received_count: 0,
      invite_count: 0,
      invited_by: null,
      created_at: '',
      updated_at: '',
      tags: [],
    } as any : undefined,
  };
}

// =============================================
// Social (社交關係 — Follow / Block / Report)
// =============================================

export async function followUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };
  if (user.id === targetUserId) return { success: false, error: 'SELF' };

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetUserId });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already following
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function unfollowUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function blockUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };
  if (user.id === targetUserId) return { success: false, error: 'SELF' };

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: targetUserId });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already blocked
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function unblockUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchFollowers(userId: string, limit = 50): Promise<Follow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:profiles!follows_follower_id_fkey(id, nickname, avatar_url, level, bio)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchFollowers error:', error);
    return [];
  }

  return ((data || []) as any[]).map((row: any) => ({
    follower_id: row.follower?.id || '',
    following_id: userId,
    created_at: '',
    follower: row.follower,
  }));
}

export async function fetchFollowing(userId: string, limit = 50): Promise<Follow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:profiles!follows_following_id_fkey(id, nickname, avatar_url, level, bio)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchFollowing error:', error);
    return [];
  }

  return ((data || []) as any[]).map((row: any) => ({
    follower_id: userId,
    following_id: row.following?.id || '',
    created_at: '',
    following: row.following,
  }));
}

export async function checkFollowStatus(targetUserId: string): Promise<{
  isFollowing: boolean;
  isMutual: boolean;
  isBlocked: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id === targetUserId) {
    return { isFollowing: false, isMutual: false, isBlocked: false };
  }

  const [followRes, reverseFollowRes, blockRes] = await Promise.all([
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle(),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', targetUserId)
      .eq('following_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_blocks')
      .select('blocker_id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)
      .maybeSingle(),
  ]);

  return {
    isFollowing: !!followRes.data,
    isMutual: !!followRes.data && !!reverseFollowRes.data,
    isBlocked: !!blockRes.data,
  };
}

export async function fetchBlockedUsers(limit = 50): Promise<UserBlock[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_blocks')
    .select(`
      blocked:profiles!user_blocks_blocked_id_fkey(id, nickname, avatar_url)
    `)
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchBlockedUsers error:', error);
    return [];
  }

  return ((data || []) as any[]).map((row: any) => ({
    blocker_id: user.id,
    blocked_id: row.blocked?.id || '',
    created_at: '',
    blocked_user: row.blocked,
  }));
}

export async function reportUser(targetUserId: string, reason: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH' };
  if (user.id === targetUserId) return { success: false, error: 'SELF' };

  const { error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reason,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'EXISTS' };
    return { success: false, error: error.message };
  }

  // Note: report_received_count is automatically handled by the on_report_resolved trigger
  // when admin changes status to 'resolved'

  return { success: true };
}

export async function fetchFollowerCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) return 0;
  return count || 0;
}

export async function fetchFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) return 0;
  return count || 0;
}
