export const APP_NAME = 'EatTogether';
export const APP_TAGLINE = 'Don\'t Eat Alone';

// Colors
export const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryDark: '#E55A2B',
  cream: '#FFF8F0',
  mint: '#2EC4B6',
  coral: '#FF6B6B',
  gold: '#FFD700',
  dark: '#1A1A2E',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
} as const;

// Cuisine types with i18n keys and emojis
export const CUISINE_TYPES = [
  { key: 'japanese', emoji: '🍣' },
  { key: 'thai', emoji: '🍜' },
  { key: 'chinese', emoji: '🥡' },
  { key: 'korean', emoji: '🍖' },
  { key: 'italian', emoji: '🍕' },
  { key: 'western', emoji: '🥩' },
  { key: 'hotpot', emoji: '🫕' },
  { key: 'bbq', emoji: '🔥' },
  { key: 'buffet', emoji: '🍽️' },
  { key: 'seafood', emoji: '🦐' },
  { key: 'dimsum', emoji: '🥟' },
  { key: 'vegetarian', emoji: '🥗' },
  { key: 'other', emoji: '🍴' },
] as const;

// Meal languages with flags
export const MEAL_LANGUAGES = [
  { key: 'zh', flag: '🇨🇳' },
  { key: 'en', flag: '🇬🇧' },
  { key: 'th', flag: '🇹🇭' },
  { key: 'ja', flag: '🇯🇵' },
  { key: 'ko', flag: '🇰🇷' },
  { key: 'other', flag: '🌍' },
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  { key: 'hostTreats', emoji: '🎉' },
  { key: 'splitBill', emoji: '💰' },
  { key: 'payOwn', emoji: '💳' },
] as const;

// Meal tags
export const MEAL_TAGS = [
  { key: 'firstTime', emoji: '🆕' },
  { key: 'welcomeNewbie', emoji: '👋' },
  { key: 'expat', emoji: '✈️' },
  { key: 'digitalNomad', emoji: '💻' },
  { key: 'foodie', emoji: '😋' },
  { key: 'languageExchange', emoji: '🗣️' },
  { key: 'networking', emoji: '🤝' },
  { key: 'startup', emoji: '🚀' },
] as const;

// Credit levels
export const CREDIT_LEVELS = [
  { min: 150, key: 'excellent', emoji: '⭐⭐⭐⭐⭐', color: '#FFD700', label: 'Super Diner' },
  { min: 100, key: 'good', emoji: '⭐⭐⭐⭐', color: '#2EC4B6', label: 'Great Diner' },
  { min: 60, key: 'average', emoji: '⭐⭐⭐', color: '#3B82F6', label: 'Regular Diner' },
  { min: 30, key: 'newbie', emoji: '⭐⭐', color: '#9CA3AF', label: 'Newbie Diner' },
  { min: 0, key: 'low', emoji: '⚠️', color: '#F59E0B', label: 'Credit Insufficient' },
] as const;

// Meal status colors
export const MEAL_STATUS_COLORS: Record<string, string> = {
  pending: '#9CA3AF',
  open: '#3B82F6',
  closed: '#8B5CF6',
  confirmed: '#2EC4B6',
  cancelled: '#EF4444',
  ongoing: '#F59E0B',
  completed: '#6B7280',
};

// Interest tags
export const INTEREST_TAGS = [
  '美食', '旅行', '摄影', '运动', '音乐', '电影', '阅读', '游戏',
  '美食', '咖啡', '酒', '创业', '科技', '设计', '健身', '瑜伽',
  'Food', 'Travel', 'Photography', 'Sports', 'Music', 'Movies', 'Reading', 'Gaming',
  'Coffee', 'Wine', 'Startups', 'Tech', 'Design', 'Fitness', 'Yoga',
  'อาหาร', 'ท่องเที่ยว', 'ถ่ายภาพ', 'กีฬา', 'ดนตรี', 'หนัง', 'อ่านหนังสือ', 'เกม',
  'กาแฟ', 'ไวน์', 'สตาร์ทอัพ', 'เทคโนโลยี', 'ดีไซน์', 'ฟิตเนส', 'โยคะ',
] as const;

// Locales
export const LOCALES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
] as const;

// Pagination
export const PAGE_SIZE = 12;

// Default deadline offset (hours before meal)
export const DEFAULT_DEADLINE_HOURS = 6;

// Max meal participants
export const MAX_PARTICIPANTS = 12;
export const MIN_PARTICIPANTS = 2;
