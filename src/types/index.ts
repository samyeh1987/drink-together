// ============================================================
// DrinkTogether — TypeScript Type Definitions
// 對齊 012_drinktogether_v2_schema.sql + 功能邏輯規劃 v1.2
// ============================================================

// --- Enums ---

export type MealStatus =
  | 'pending'
  | 'open'
  | 'closed'
  | 'confirmed'
  | 'cancelled'
  | 'ongoing'
  | 'completed';

export type ParticipantStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'no_show';

export type CuisineType =
  | 'cocktail'
  | 'beer'
  | 'whisky'
  | 'wine'
  | 'sake'
  | 'draft'
  | 'shot'
  | 'mocktail'
  | 'champagne'
  | 'other';

export type MealLanguage = 'zh-CN' | 'en' | 'th' | 'other';

export type PaymentMethod = 'hostTreats' | 'splitBill' | 'payOwn';

export type UserLevel = 1 | 2 | 3 | 4 | 5;

export type UserStatus = 'active' | 'banned' | 'suspended';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type CreditLevel = 'excellent' | 'good' | 'average' | 'newbie' | 'low';

export type Locale = 'en' | 'zh-CN' | 'th';

export type MomentVisibility = 'public' | 'friends' | 'party_only';

export type BarCategory =
  | 'bar'
  | 'cocktail_lounge'
  | 'pub'
  | 'club'
  | 'karaoke'
  | 'rooftop'
  | 'jazz'
  | 'craft_beer'
  | 'wine_bar'
  | 'speakeasy'
  | 'other';

export type BarCity = 'bangkok' | 'kuala_lumpur';

export type MessageType = 'text' | 'image' | 'party_invite' | 'shop_share';

export type CoinSourceType =
  | 'system_daily_checkin'
  | 'system_complete_profile'
  | 'system_first_meal'
  | 'system_level_up'
  | 'system_invite'
  | 'system_daily_login'
  | 'system_streak_bonus'
  | 'system_post_moment'
  | 'system_moment_10_likes'
  | 'system_host_meal'
  | 'system_join_meal'
  | 'system_rate_meal'
  | 'system_bar_checkin'
  | 'bar_grant'
  | 'shop_purchase'
  | 'admin_adjust'
  | 'activity_reward';

export type ShopItemCategory = 'food' | 'drink' | 'entertainment' | 'spa' | 'other';

export type ShopOrderStatus = 'active' | 'redeemed' | 'expired' | 'refunded';

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type CreditEventType =
  | 'create_meal'
  | 'join_meal'
  | 'complete_meal'
  | 'cancel_meal'
  | 'late_cancel'
  | 'no_show'
  | 'write_review'
  | 'receive_review';

// --- Core Models ---

export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  age_range: string | null;
  gender: Gender | null;
  birth_year: number | null;
  nationality: string | null;
  zodiac: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  languages_spoken: string[];
  phone: string | null;
  phone_verified: boolean;
  credit_score: number;
  email_verified: boolean;
  status: UserStatus;
  level: UserLevel;
  total_coins: number;
  daily_coin_earned: number;
  daily_coin_reset_date: string;
  completed_meals_count: number;
  hosted_meals_count: number;
  posts_count: number;
  recommend_count: number;
  last_credit_recovery_date: string;
  credit_recovery_this_month: number;
  block_count: number;
  report_received_count: number;
  invite_count: number;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  // Computed (not from DB, derived)
  is_following?: boolean;
  is_blocked?: boolean;
  is_mutual_follow?: boolean;
}

// Backward compatible alias
export type User = Profile;

export interface Tag {
  id: string;
  name: string;
  category: string;
  i18n_key: string;
}

// --- Meal (酒局) ---

export interface Meal {
  id: string;
  creator_id: string;
  title: string;
  restaurant_name: string;
  restaurant_address: string;
  latitude: number | null;
  longitude: number | null;
  cuisine_type: CuisineType;
  meal_languages: MealLanguage[];
  datetime: string;
  deadline: string;
  min_participants: number;
  max_participants: number;
  payment_method: PaymentMethod;
  budget_min: number | null;
  budget_max: number | null;
  description: string;
  note: string | null;
  status: MealStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  participants?: MealParticipant[];
  tags?: Tag[];
}

export interface MealParticipant {
  id: string;
  meal_id: string;
  user_id: string;
  status: ParticipantStatus;
  apply_count: number; // 1 or 2 (v1.2 規則：同一酒局最多申請 2 次)
  joined_at: string;
  user?: Profile;
}

export interface MealFormData {
  title: string;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_type: CuisineType;
  meal_languages: MealLanguage[];
  datetime: string;
  deadline: string;
  min_participants: number;
  max_participants: number;
  payment_method: PaymentMethod;
  budget_min: number | null;
  budget_max: number | null;
  description: string;
  note: string | null;
  tags: string[];
}

// --- Review ---

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  meal_id: string | null;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
}

// --- Credit ---

export interface CreditHistory {
  id: string;
  user_id: string;
  event_type: CreditEventType;
  points_change: number;
  reason: string;
  meal_id: string | null;
  created_at: string;
}

// --- Notification ---

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// --- Bar (酒吧) ---

export interface Bar {
  id: string;
  name: string;
  name_en: string | null;
  address: string;
  city: BarCity;
  latitude: number;
  longitude: number;
  category: BarCategory;
  description: string;
  opening_hours: Record<string, string>;
  min_spend: number | null;
  cover_image_url: string | null;
  images: string[];
  average_rating: number;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarCheckin {
  id: string;
  user_id: string;
  bar_id: string;
  latitude: number;
  longitude: number;
  is_hidden: boolean;
  auto_checkout_at: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  user?: Profile;
  bar?: Bar;
}

export interface BarRating {
  id: string;
  user_id: string;
  bar_id: string;
  environment_rating: number;
  service_rating: number;
  value_rating: number;
  comment: string;
  created_at: string;
  user?: Profile;
}

// --- Social (Follow / Block) ---

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
  // Joined
  follower?: Profile;
  following?: Profile;
}

export interface UserBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// --- Moment (動態) ---

export interface Moment {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  visibility: MomentVisibility;
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
  user?: Profile;
  bar?: Bar;
  // Client-side
  is_liked?: boolean;
}

export interface MomentLike {
  user_id: string;
  moment_id: string;
  created_at: string;
  user?: Profile;
}

export interface MomentComment {
  id: string;
  moment_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
  user?: Profile;
  // Nested
  replies?: MomentComment[];
}

// --- Messages (私信) ---

export interface MessageThread {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  created_at: string;
  // Joined
  participant_a_user?: Profile;
  participant_b_user?: Profile;
  last_message?: Message;
  // Client-side
  unread_count?: number;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  image_urls: string[];
  metadata: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  sender?: Profile;
}

// --- Coins (金幣) ---

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;       // positive = earned, negative = spent
  balance_after: number;
  source_type: CoinSourceType;
  source_id: string | null;
  description: string;
  is_daily_task: boolean;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  coins_earned: number;
  streak_days: number;
  is_streak_bonus: boolean;
  created_at: string;
}

export interface BarCoinGrant {
  id: string;
  bar_id: string;
  user_id: string;
  coins: number;
  reason: string;
  granted_by: string;
  created_at: string;
  bar?: Bar;
  user?: Profile;
}

// --- Shop (商城) ---

export interface ShopItem {
  id: string;
  name_zh: string;
  name_en: string;
  name_th: string;
  description_zh: string;
  description_en: string;
  description_th: string;
  category: ShopItemCategory;
  coin_price: number;
  stock: number;        // -1 = unlimited
  image_url: string | null;
  terms: string;
  is_active: boolean;
  is_featured: boolean;
  valid_days: number;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  user_id: string;
  item_id: string;
  coins_spent: number;
  qr_code: string;
  status: ShopOrderStatus;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string;
  refund_coins: number | null;
  refund_reason: string | null;
  created_at: string;
  item?: ShopItem;
}

// --- Report (舉報) ---

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  moment_id: string | null;
  bar_id: string | null;
  reason: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter?: Profile;
  reported_user?: Profile;
}

// --- Legacy types (backward compatible) ---

export type MealFormDataLegacy = MealFormData;
