// Meal status enum
export type MealStatus = 
  | 'pending'
  | 'open'
  | 'closed'
  | 'confirmed'
  | 'cancelled'
  | 'ongoing'
  | 'completed';

// Participant status
export type ParticipantStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'no_show';

// Cuisine types
export type CuisineType = 
  | 'japanese' | 'thai' | 'chinese' | 'korean' | 'italian'
  | 'western' | 'hotpot' | 'bbq' | 'buffet' | 'seafood'
  | 'dimsum' | 'vegetarian' | 'other';

// Meal languages
export type MealLanguage = 'zh' | 'en' | 'th' | 'ja' | 'ko' | 'other';

// Payment methods
export type PaymentMethod = 'hostTreats' | 'splitBill' | 'payOwn';

// Credit levels
export type CreditLevel = 'excellent' | 'good' | 'average' | 'newbie' | 'low';

// Locale
export type Locale = 'en' | 'zh-CN' | 'th';

// User
export interface User {
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
  tags: Tag[];
}

// Tag
export interface Tag {
  id: string;
  name: string;
  category: string;
  i18n_key: string;
}

// Meal
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
  creator?: User;
  participants?: MealParticipant[];
  tags?: Tag[];
}

// Meal participant
export interface MealParticipant {
  id: string;
  meal_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
  user?: User;
}

// Notification
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

// Credit history
export interface CreditHistory {
  id: string;
  user_id: string;
  event_type: string;
  points_change: number;
  reason: string;
  meal_id: string | null;
  created_at: string;
}

// Review
export interface Review {
  id: string;
  meal_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Meal form data
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
