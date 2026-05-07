// Admin data types and constants
// Demo data has been removed — pages now show empty states until connected to Supabase.

// ─── Users ───────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  age_range: string | null;
  occupation: string | null;
  bio: string | null;
  languages_spoken: string[];
  credit_score: number;
  email_verified: boolean;
  created_at: string;
  status: 'active' | 'banned' | 'suspended';
  total_meals_hosted: number;
  total_meals_joined: number;
  no_show_count: number;
  last_active: string;
}

export const DEMO_USERS: AdminUser[] = [];

// ─── Meals ───────────────────────────────────────────
export interface AdminMeal {
  id: string;
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
  status: string;
  created_at: string;
  creator_name: string;
  current_participants: number;
  reports_count: number;
  is_restaurant_hosted: boolean;
}

export const DEMO_MEALS: AdminMeal[] = [];

// ─── Restaurants ─────────────────────────────────────
export interface AdminRestaurant {
  id: string;
  name: string;
  name_local: string;
  address: string;
  cuisine_type: string;
  phone: string;
  email: string;
  contact_person: string;
  latitude: number;
  longitude: number;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  total_meals_hosted: number;
  total_deals: number;
  description: string;
  avatar_url: string | null;
  deals: RestaurantDeal[];
}

export interface RestaurantDeal {
  id: string;
  title: string;
  description: string;
  original_price: number;
  deal_price: number;
  min_pax: number;
  max_pax: number;
  valid_until: string;
  status: 'active' | 'expired' | 'draft';
}

export const DEMO_RESTAURANTS: AdminRestaurant[] = [];

// ─── Reports ─────────────────────────────────────────
export interface AdminReport {
  id: string;
  reporter_name: string;
  reporter_email: string;
  reported_user_name: string | null;
  reported_user_email: string | null;
  meal_title: string;
  meal_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export const REPORT_REASONS = [
  'no_show',
  'harassment',
  'inappropriate_behavior',
  'spam',
  'fake_profile',
  'safety_concern',
  'other',
] as const;

export const DEMO_REPORTS: AdminReport[] = [];

// ─── Photos ──────────────────────────────────────────
export interface AdminPhoto {
  id: string;
  meal_id: string;
  meal_title: string;
  uploader_name: string;
  uploader_email: string;
  url: string;
  caption: string | null;
  likes_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const DEMO_PHOTOS: AdminPhoto[] = [];

// ─── Status Colors ───────────────────────────────────
export const ADMIN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  banned: 'bg-red-100 text-red-600',
  suspended: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-600',
  resolved: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  dismissed: 'bg-gray-100 text-gray-500',
  approved: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  rejected: 'bg-red-100 text-red-600',
  featured: 'bg-[#FFD700]/20 text-[#B8860B]',
  draft: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-gray-100 text-gray-500',
  ongoing: 'bg-yellow-100 text-yellow-700',
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  no_show: 'No Show',
  harassment: 'Harassment',
  inappropriate_behavior: 'Inappropriate Behavior',
  spam: 'Spam / Promotion',
  fake_profile: 'Fake Profile',
  safety_concern: 'Safety Concern',
  other: 'Other',
};

export const CUISINE_EMOJI: Record<string, string> = {
  japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
  western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
  dimsum: '🥟', vegetarian: '🥗', other: '🍴',
};

// ─── Recommended Bars ───────────────────────────────────
export interface RecommendedBar {
  id: string;
  name: string;
  name_local: string;
  address: string;
  city: 'bangkok' | 'pattaya' | 'chiangmai' | 'phuket';
  phone: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const CITY_EMOJI: Record<string, string> = {
  bangkok: '🏙️',
  pattaya: '🌴',
  chiangmai: '🏯',
  phuket: '🏝️',
};

export const CITY_LABELS: Record<string, string> = {
  bangkok: '曼谷',
  pattaya: '芭堤雅',
  chiangmai: '清邁',
  phuket: '普吉島',
};
