-- ============================================================
-- DrinkTogether - 完整資料庫初始化
-- 不要一個人喝酒 - SQL Schema
-- 請複製全部內容，貼到 Supabase SQL Editor 執行
-- ============================================================

-- =============================================
-- PART 1: 資料表結構
-- =============================================

-- 1. Profiles
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('drink', 'interest', 'personality', 'other')),
  i18n_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Tags
CREATE TABLE IF NOT EXISTS public.user_tags (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- 4. Drinks (原本是 Meals)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cuisine_type TEXT NOT NULL CHECK (cuisine_type IN (
    'cocktail', 'beer', 'whisky', 'wine', 'sake',
    'draft', 'shot', 'mocktail', 'champagne', 'other'
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

CREATE INDEX IF NOT EXISTS idx_meals_datetime ON public.meals(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_meals_status ON public.meals(status);
CREATE INDEX IF NOT EXISTS idx_meals_creator ON public.meals(creator_id);

-- 5. Meal Tags
CREATE TABLE IF NOT EXISTS public.meal_tags (
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (meal_id, tag_id)
);

-- 6. Meal Participants
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

-- 7. Reviews
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

-- 8. Reports
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

-- 9. Notifications
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

-- 10. Credit History
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

-- 11. Bar Deals (原本是 Restaurant Deals)
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

-- 12. Meal Photos
CREATE TABLE IF NOT EXISTS public.meal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT,
  photo_url TEXT,
  caption TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Default Tags
INSERT INTO public.tags (name, category, i18n_key) VALUES
  ('雞尾酒', 'drink', 'tags.drink.cocktail'),
  ('啤酒', 'drink', 'tags.drink.beer'),
  ('威士忌', 'drink', 'tags.drink.whisky'),
  ('清酒', 'drink', 'tags.drink.sake'),
  ('紅酒', 'drink', 'tags.drink.wine'),
  ('白酒', 'drink', 'tags.drink.white_wine'),
  ('香檳', 'drink', 'tags.drink.champagne'),
  ('無酒精飲料', 'drink', 'tags.drink.mocktail'),
  ('shot', 'drink', 'tags.drink.shot'),
  ('生啤酒', 'drink', 'tags.drink.draft'),
  ('夜店', 'interest', 'tags.interest.club'),
  ('酒吧', 'interest', 'tags.interest.bar'),
  ('Live Band', 'interest', 'tags.interest.live_music'),
  ('高空酒吧', 'interest', 'tags.interest.rooftop'),
  ('洞穴酒吧', 'interest', 'tags.interest.cocktail_lounge'),
  ('精釀啤酒', 'interest', 'tags.interest.craft_beer'),
  ('旅行', 'interest', 'tags.interest.travel'),
  ('派對', 'interest', 'tags.interest.party'),
  ('語言交換', 'interest', 'tags.interest.language_exchange'),
  ('話嘮', 'personality', 'tags.personality.chatty'),
  ('傾聽者', 'personality', 'tags.personality.listener'),
  ('幽默', 'personality', 'tags.personality.humorous'),
  ('內向', 'personality', 'tags.personality.introvert')
ON CONFLICT DO NOTHING;

-- 15. Search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_nickname_trgm ON public.profiles USING GIN (nickname gin_trgm_ops) WHERE nickname IS NOT NULL;

-- =============================================
-- PART 2: RLS 權限
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (false);

-- Tags
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (false);
CREATE POLICY "tags_update" ON public.tags FOR UPDATE USING (false);
CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (false);

-- User Tags
CREATE POLICY "user_tags_select" ON public.user_tags FOR SELECT USING (true);
CREATE POLICY "user_tags_insert" ON public.user_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_tags_delete" ON public.user_tags FOR DELETE USING (auth.uid() = user_id);

-- Meals
CREATE POLICY "meals_select" ON public.meals FOR SELECT USING (
  status IN ('open', 'confirmed', 'ongoing', 'completed') OR creator_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.meal_participants WHERE meal_id = id AND user_id = auth.uid())
);
CREATE POLICY "meals_insert" ON public.meals FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "meals_update" ON public.meals FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "meals_delete" ON public.meals FOR DELETE USING (creator_id = auth.uid() AND status IN ('pending', 'open'));

-- Meal Tags
CREATE POLICY "meal_tags_select" ON public.meal_tags FOR SELECT USING (true);
CREATE POLICY "meal_tags_insert" ON public.meal_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid())
);
CREATE POLICY "meal_tags_delete" ON public.meal_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid())
);

-- Meal Participants
CREATE POLICY "meal_participants_select" ON public.meal_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meals WHERE id = meal_id AND (status IN ('open', 'confirmed', 'ongoing', 'completed') OR creator_id = auth.uid()))
  OR user_id = auth.uid()
);
CREATE POLICY "meal_participants_insert" ON public.meal_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_participants_update" ON public.meal_participants FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid())
) WITH CHECK (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid())
);

-- Reviews
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (SELECT 1 FROM public.meal_participants WHERE meal_id = reviews.meal_id AND user_id = auth.uid() AND status = 'approved')
  AND EXISTS (SELECT 1 FROM public.meals WHERE id = reviews.meal_id AND status = 'completed')
);

-- Reports
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (false);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Credit History
CREATE POLICY "credit_history_select" ON public.credit_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "credit_history_insert" ON public.credit_history FOR INSERT WITH CHECK (false);

-- Restaurant Deals
CREATE POLICY "restaurant_deals_select" ON public.restaurant_deals FOR SELECT USING (is_active = TRUE);
CREATE POLICY "restaurant_deals_insert" ON public.restaurant_deals FOR INSERT WITH CHECK (false);
CREATE POLICY "restaurant_deals_update" ON public.restaurant_deals FOR UPDATE USING (false);
CREATE POLICY "restaurant_deals_delete" ON public.restaurant_deals FOR DELETE USING (false);

-- Meal Photos
CREATE POLICY "meal_photos_select" ON public.meal_photos FOR SELECT USING (true);
CREATE POLICY "meal_photos_insert" ON public.meal_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_photos_update" ON public.meal_photos FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = reviewed_by);
CREATE POLICY "meal_photos_delete" ON public.meal_photos FOR DELETE USING (auth.uid() = user_id);

-- Platform Settings
CREATE POLICY "platform_settings_select" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "platform_settings_insert" ON public.platform_settings FOR INSERT WITH CHECK (false);
CREATE POLICY "platform_settings_update" ON public.platform_settings FOR UPDATE USING (false);

-- =============================================
-- PART 3: 觸發器 & 函數
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update email_verified
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET email_verified = TRUE, updated_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- Meal created: auto-open, auto-add creator, credit +5
CREATE OR REPLACE FUNCTION public.on_meal_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.datetime > NOW() THEN NEW.status := 'open'; END IF;
  INSERT INTO public.meal_participants (meal_id, user_id, status) VALUES (NEW.id, NEW.creator_id, 'approved') ON CONFLICT (meal_id, user_id) DO NOTHING;
  INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.creator_id, 'create_meal', 5, '發起酒局', NEW.id);
  UPDATE public.profiles SET credit_score = credit_score + 5, updated_at = NOW() WHERE id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_meal_created ON public.meals;
CREATE TRIGGER trigger_meal_created AFTER INSERT ON public.meals FOR EACH ROW EXECUTE FUNCTION public.on_meal_created();

-- Participant joined: check max → close
CREATE OR REPLACE FUNCTION public.on_participant_joined()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF (
      SELECT COUNT(*) >= m.max_participants
      FROM public.meals m
      LEFT JOIN public.meal_participants mp ON mp.meal_id = m.id AND mp.status = 'approved'
      WHERE m.id = NEW.meal_id
    ) THEN
      UPDATE public.meals SET status = 'closed', updated_at = NOW() WHERE id = NEW.meal_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_participant_joined ON public.meal_participants;
CREATE TRIGGER trigger_participant_joined AFTER INSERT OR UPDATE ON public.meal_participants FOR EACH ROW
  WHEN (NEW.status = 'approved') EXECUTE FUNCTION public.on_participant_joined();

-- Scheduled deadline check
CREATE OR REPLACE FUNCTION public.check_meal_deadlines()
RETURNS void AS $$
BEGIN
  UPDATE public.meals SET status = 'closed', updated_at = NOW()
  WHERE status = 'open' AND deadline < NOW()
  AND id IN (SELECT m.id FROM public.meals m WHERE m.status = 'open' AND m.deadline < NOW() FOR UPDATE SKIP LOCKED);
  UPDATE public.meals SET status = CASE WHEN approved_count >= min_participants THEN 'confirmed' ELSE 'cancelled' END, updated_at = NOW()
  FROM (SELECT m.id, m.min_participants, COUNT(mp.id) AS approved_count FROM public.meals m
    LEFT JOIN public.meal_participants mp ON mp.meal_id = m.id AND mp.status = 'approved'
    WHERE m.status = 'closed' GROUP BY m.id, m.min_participants) AS counts WHERE meals.id = counts.id;
  UPDATE public.meals SET status = 'ongoing', updated_at = NOW() WHERE status = 'confirmed' AND datetime <= NOW() AND datetime > NOW() - INTERVAL '4 hours';
  UPDATE public.meals SET status = 'completed', updated_at = NOW() WHERE status = 'ongoing' AND datetime < NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credit level helper
CREATE OR REPLACE FUNCTION public.get_credit_level(score INTEGER) RETURNS TEXT AS $$
BEGIN
  IF score >= 150 THEN RETURN 'excellent';
  ELSIF score >= 120 THEN RETURN 'good';
  ELSIF score >= 90 THEN RETURN 'average';
  ELSIF score >= 60 THEN RETURN 'newbie';
  ELSE RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Review submitted: reviewer +2, reviewee ±points
CREATE OR REPLACE FUNCTION public.on_review_submitted()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.reviewer_id, 'write_review', 2, '留下評價', NEW.meal_id);
  UPDATE public.profiles SET credit_score = credit_score + 2, updated_at = NOW() WHERE id = NEW.reviewer_id;
  DECLARE points INTEGER; reason TEXT;
  BEGIN
    CASE NEW.rating WHEN 5 THEN points := 5; reason := '收到 5 星好評'; WHEN 4 THEN points := 3; reason := '收到 4 星評價'; WHEN 3 THEN points := 0; reason := '收到 3 星評價'; WHEN 2 THEN points := -3; reason := '收到 2 星差評'; WHEN 1 THEN points := -5; reason := '收到 1 星差評'; ELSE points := 0; reason := '收到評價'; END CASE;
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.reviewee_id, 'receive_review', points, reason, NEW.meal_id);
    UPDATE public.profiles SET credit_score = GREATEST(0, credit_score + points), updated_at = NOW() WHERE id = NEW.reviewee_id;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_review_submitted ON public.reviews;
CREATE TRIGGER trigger_review_submitted AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.on_review_submitted();

-- No-show penalty: -15
CREATE OR REPLACE FUNCTION public.on_no_show()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.user_id, 'no_show', -15, '酒局未到', NEW.meal_id);
    UPDATE public.profiles SET credit_score = GREATEST(0, credit_score - 15), updated_at = NOW() WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_no_show ON public.meal_participants;
CREATE TRIGGER trigger_no_show AFTER UPDATE ON public.meal_participants FOR EACH ROW EXECUTE FUNCTION public.on_no_show();

-- Late cancel penalty: -3 within 24h
CREATE OR REPLACE FUNCTION public.on_participant_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    IF EXISTS (SELECT 1 FROM public.meals WHERE id = NEW.meal_id AND datetime < NOW() + INTERVAL '24 hours' AND datetime > NOW()) THEN
      INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.user_id, 'late_cancel', -3, '24小時內取消參與', NEW.meal_id);
      UPDATE public.profiles SET credit_score = GREATEST(0, credit_score - 3), updated_at = NOW() WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_participant_cancel ON public.meal_participants;
CREATE TRIGGER trigger_participant_cancel AFTER UPDATE ON public.meal_participants FOR EACH ROW
  WHEN (OLD.status = 'approved') EXECUTE FUNCTION public.on_participant_cancel();

-- Join meal credit: +1
CREATE OR REPLACE FUNCTION public.on_join_meal_credit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.user_id != (SELECT creator_id FROM public.meals WHERE id = NEW.meal_id) THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id) VALUES (NEW.user_id, 'join_meal', 1, '參加酒局', NEW.meal_id);
    UPDATE public.profiles SET credit_score = credit_score + 1, updated_at = NOW() WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_join_meal_credit ON public.meal_participants;
CREATE TRIGGER trigger_join_meal_credit AFTER INSERT ON public.meal_participants FOR EACH ROW
  WHEN (NEW.status = 'approved') EXECUTE FUNCTION public.on_join_meal_credit();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_meals_updated_at ON public.meals;
CREATE TRIGGER trigger_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trigger_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 完成！
-- =============================================
