-- ============================================================
-- EatTogether Database Schema
-- Migration: 001_initial_schema.sql
-- Date: 2026-04-16
-- Description: All core tables for EatTogether platform
-- ============================================================

-- =============================================
-- 1. Users (profiles)
-- =============================================
-- Note: Supabase Auth handles authentication (email, password_hash, etc.)
-- This table stores extended profile data linked to auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  age_range TEXT CHECK (age_range IN ('18-24', '25-30', '31-35', '36-40', '40+')),
  occupation TEXT,
  bio TEXT,
  languages_spoken TEXT[] NOT NULL DEFAULT '{}',
  credit_score INTEGER NOT NULL DEFAULT 100,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update email_verified when user confirms email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- =============================================
-- 2. Tags (interests)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'interest', 'personality', 'other')),
  i18n_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. User Tags (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_tags (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- =============================================
-- 4. Meals
-- =============================================
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cuisine_type TEXT NOT NULL CHECK (cuisine_type IN (
    'japanese', 'thai', 'chinese', 'korean', 'italian',
    'western', 'hotpot', 'bbq', 'buffet', 'seafood',
    'dimsum', 'vegetarian', 'other'
  )),
  meal_languages TEXT[] NOT NULL DEFAULT '{"en"}',
  datetime TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  min_participants INTEGER NOT NULL DEFAULT 2,
  max_participants INTEGER NOT NULL DEFAULT 8,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('hostTreats', 'splitBill', 'payOwn')),
  budget_min INTEGER,
  budget_max INTEGER,
  description TEXT NOT NULL DEFAULT '',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'open', 'closed', 'confirmed', 'cancelled', 'ongoing', 'completed'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for meal listings (by datetime desc, status)
CREATE INDEX IF NOT EXISTS idx_meals_datetime ON public.meals(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_meals_status ON public.meals(status);
CREATE INDEX IF NOT EXISTS idx_meals_creator ON public.meals(creator_id);
CREATE INDEX IF NOT EXISTS idx_meals_location ON public.meals USING GIST (
  ll_to_earth(COALESCE(latitude, 13.7563), COALESCE(longitude, 100.5018))
);

-- =============================================
-- 5. Meal Tags (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.meal_tags (
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (meal_id, tag_id)
);

-- =============================================
-- 6. Meal Participants
-- =============================================
CREATE TABLE IF NOT EXISTS public.meal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled', 'no_show'
  )),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_meal ON public.meal_participants(meal_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.meal_participants(user_id);

-- =============================================
-- 7. Reviews
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meal_id, reviewer_id, reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_meal ON public.reviews(meal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);

-- =============================================
-- 8. Reports
-- =============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- =============================================
-- 9. Notifications
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- =============================================
-- 10. Credit History
-- =============================================
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_user ON public.credit_history(user_id);

-- =============================================
-- 11. Restaurant Deals (Phase 3 - pre-build)
-- =============================================
CREATE TABLE IF NOT EXISTS public.restaurant_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL,
  image_url TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  promo_code TEXT,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 12. Seed: Default Tags
-- =============================================
INSERT INTO public.tags (name, category, i18n_key) VALUES
  -- Food interests
  ('日料', 'food', 'tags.food.japanese'),
  ('泰菜', 'food', 'tags.food.thai'),
  ('中餐', 'food', 'tags.food.chinese'),
  ('韓料', 'food', 'tags.food.korean'),
  ('義大利菜', 'food', 'tags.food.italian'),
  ('火鍋', 'food', 'tags.food.hotpot'),
  ('BBQ', 'food', 'tags.food.bbq'),
  ('海鮮', 'food', 'tags.food.seafood'),
  ('咖啡甜點', 'food', 'tags.food.cafe'),
  ('素食', 'food', 'tags.food.vegetarian'),
  -- General interests
  ('旅行', 'interest', 'tags.interest.travel'),
  ('美食探索', 'interest', 'tags.interest.foodie'),
  ('攝影', 'interest', 'tags.interest.photography'),
  ('電影', 'interest', 'tags.interest.movies'),
  ('音樂', 'interest', 'tags.interest.music'),
  ('運動健身', 'interest', 'tags.interest.fitness'),
  ('創業', 'interest', 'tags.interest.startup'),
  ('數位遊牧', 'interest', 'tags.interest.digital_nomad'),
  ('語言交換', 'interest', 'tags.interest.language_exchange'),
  -- Personality
  ('話嘮', 'personality', 'tags.personality.chatty'),
  ('傾聽者', 'personality', 'tags.personality.listener'),
  ('幽默', 'personality', 'tags.personality.humorous'),
  ('內向', 'personality', 'tags.personality.introvert')
ON CONFLICT DO NOTHING;

-- =============================================
-- 13. Enable pg_trgm for search (optional)
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_nickname_trgm ON public.profiles USING GIN (nickname gin_trgm_ops)
  WHERE nickname IS NOT NULL;
