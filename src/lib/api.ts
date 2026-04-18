import { createClient } from '@/lib/supabase/client';
import type { Meal, MealParticipant, User, Tag, CreditHistory, Notification } from '@/types';

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

  // Insert meal
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
      deadline: formData.deadline,
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
    alert(`[createMeal DB Error]\nCode: ${mealError?.code}\nMessage: ${errMsg}\nDetails: ${mealError?.details || 'N/A'}\nHint: ${mealError?.hint || 'N/A'}`);
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
  } as User;
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
const NOTIF_MESSAGES: Record<string, Record<string, { title: string; message: (data: { actorName?: string; mealTitle?: string }) => string }>> = {
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
    _currentParticipants: participants.length,
    _languages: (raw.meal_languages || []).map((l: string) => FLAG_MAP[l] || { key: l, flag: '🌍' }),
  } as Meal & {
    _cuisineEmoji: string;
    _paymentEmoji: string;
    _currentParticipants: number;
    _languages: Array<{ key: string; flag: string }>;
  };
}
