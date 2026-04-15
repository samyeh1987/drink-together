import { createClient } from '@/lib/supabase/client';
import type { Meal, MealParticipant, User, Tag, CreditHistory } from '@/types';

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
  return ((data as any[]) || []).map(raw => transformMeal(raw));
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
    return { success: false, error: mealError?.message || 'Failed to create meal' };
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

  return { success: true };
}

export async function leaveMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('meal_participants')
    .update({ status: 'cancelled' })
    .eq('meal_id', mealId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cancelMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('meals')
    .update({ status: 'cancelled' })
    .eq('id', mealId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchMyMeals(userId: string): Promise<any[]> {
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
    ...data,
    tags: (data.user_tags || []).map((ut: any) => ut.tag),
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
// Transform helpers
// =============================================

function transformMeal(raw: any): Meal {
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

  const participants = raw.participants?.map((p: any) => ({
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

  const tags = raw.meal_tags?.map((mt: any) => mt.tag).filter(Boolean) || [];

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
  } as any;
}
