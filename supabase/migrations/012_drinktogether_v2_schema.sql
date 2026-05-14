-- ============================================================
-- DrinkTogether v2 Schema — 完整補充 migration
-- 基於 功能邏輯規劃 v1.2
-- 執行方式：在 Supabase SQL Editor 執行（已存在 drinktogether_init.sql 基礎）
-- 注意：此檔案使用 IF NOT EXISTS / ADD COLUMN IF NOT EXISTS 追加，不破壞現有資料
-- 不依賴任何額外擴展（無 earthdistance / pg_cron）
-- ============================================================

-- =============================================
-- PART 1: ALTER 現有 profiles 表 — 補充缺少欄位
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS birth_year SMALLINT CHECK (birth_year >= 1900 AND birth_year <= 2010),
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS zodiac TEXT,
  ADD COLUMN IF NOT EXISTS height SMALLINT CHECK (height >= 100 AND height <= 250),
  ADD COLUMN IF NOT EXISTS weight SMALLINT CHECK (weight >= 30 AND weight <= 300),
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS total_coins BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_coin_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_coin_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS completed_meals_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hosted_meals_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommend_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_credit_recovery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS credit_recovery_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS block_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_received_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.level IS '用戶等級 1-5，由 trigger 計算';
COMMENT ON COLUMN public.profiles.total_coins IS '金幣總餘額';
COMMENT ON COLUMN public.profiles.daily_coin_earned IS '今日系統任務已賺金幣（不含酒吧發放）';
COMMENT ON COLUMN public.profiles.daily_coin_reset_date IS '每日金幣計數重置日期';
COMMENT ON COLUMN public.profiles.completed_meals_count IS '已完成酒局場次（桌長確認入座）';
COMMENT ON COLUMN public.profiles.hosted_meals_count IS '已發起酒局場次';
COMMENT ON COLUMN public.profiles.posts_count IS '已發布動態數';
COMMENT ON COLUMN public.profiles.recommend_count IS '被桌長推薦次數';
COMMENT ON COLUMN public.profiles.invite_count IS '邀請好友數';
COMMENT ON COLUMN public.profiles.invited_by IS '邀請人（被誰邀請加入）';

-- =============================================
-- PART 2: 新增資料表
-- =============================================

-- 2A. bars
CREATE TABLE IF NOT EXISTS public.bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'bangkok' CHECK (city IN ('bangkok', 'kuala_lumpur')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL DEFAULT 'bar' CHECK (category IN (
    'bar', 'cocktail_lounge', 'pub', 'club', 'karaoke',
    'rooftop', 'jazz', 'craft_beer', 'wine_bar', 'speakeasy', 'other'
  )),
  description TEXT DEFAULT '',
  opening_hours JSONB DEFAULT '{}',
  min_spend INTEGER,
  cover_image_url TEXT,
  images TEXT[] DEFAULT '{}',
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bars_city ON public.bars(city);
CREATE INDEX IF NOT EXISTS idx_bars_category ON public.bars(category);
CREATE INDEX IF NOT EXISTS idx_bars_lat ON public.bars(latitude);
CREATE INDEX IF NOT EXISTS idx_bars_lng ON public.bars(longitude);
COMMENT ON TABLE public.bars IS '酒吧資料表（平台人工建檔）';

-- 2B. bar_checkins
CREATE TABLE IF NOT EXISTS public.bar_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  auto_checkout_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_bar_checkins_user ON public.bar_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_checkins_bar ON public.bar_checkins(bar_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bar_checkins_user_bar_date ON public.bar_checkins(user_id, bar_id, checkin_date);

-- 2C. bar_ratings
CREATE TABLE IF NOT EXISTS public.bar_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  environment_rating SMALLINT NOT NULL CHECK (environment_rating BETWEEN 1 AND 5),
  service_rating SMALLINT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  value_rating SMALLINT NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bar_id)
);

CREATE INDEX IF NOT EXISTS idx_bar_ratings_bar ON public.bar_ratings(bar_id);

-- 2D. follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

-- 2E. user_blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- 2F. moments
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  images TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'party_only')),
  mood_tag TEXT,
  bar_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  location_name TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  reports_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moments_user ON public.moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_created ON public.moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_visibility ON public.moments(visibility);

-- 2G. moment_likes
CREATE TABLE IF NOT EXISTS public.moment_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, moment_id)
);

CREATE INDEX IF NOT EXISTS idx_moment_likes_moment ON public.moment_likes(moment_id);

-- 2H. moment_comments
CREATE TABLE IF NOT EXISTS public.moment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.moment_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moment_comments_moment ON public.moment_comments(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_user ON public.moment_comments(user_id);

-- 2I. message_threads
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_a, participant_b),
  CHECK (participant_a != participant_b)
);

CREATE INDEX IF NOT EXISTS idx_message_threads_a ON public.message_threads(participant_a);
CREATE INDEX IF NOT EXISTS idx_message_threads_b ON public.message_threads(participant_b);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_msg ON public.message_threads(last_message_at DESC);

-- 2J. messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'party_invite', 'shop_share')),
  image_urls TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- 2K. coin_transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  description TEXT NOT NULL DEFAULT '',
  is_daily_task BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.coin_transactions.source_type IS 'system_daily_checkin, system_complete_profile, system_first_meal, system_level_up, system_invite, system_daily_login, system_streak_bonus, system_post_moment, system_moment_10_likes, system_host_meal, system_join_meal, system_rate_meal, system_bar_checkin, bar_grant, shop_purchase, admin_adjust, activity_reward';

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_daily ON public.coin_transactions(user_id, created_at) WHERE is_daily_task = TRUE;

-- 2L. daily_checkins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 10,
  streak_days INTEGER NOT NULL DEFAULT 1,
  is_streak_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON public.daily_checkins(user_id);

-- 2M. shop_items
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_th TEXT DEFAULT '',
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  description_th TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'food' CHECK (category IN ('food', 'drink', 'entertainment', 'spa', 'other')),
  coin_price INTEGER NOT NULL CHECK (coin_price > 0),
  stock INTEGER NOT NULL DEFAULT -1,
  image_url TEXT,
  terms TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  valid_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_items_active ON public.shop_items(is_active) WHERE is_active = TRUE;

-- 2N. shop_orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id),
  coins_spent INTEGER NOT NULL,
  qr_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'refunded')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  refund_coins INTEGER,
  refund_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON public.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_qr ON public.shop_orders(qr_code);

-- 2O. bar_coin_grants
CREATE TABLE IF NOT EXISTS public.bar_coin_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL CHECK (coins > 0),
  reason TEXT DEFAULT '',
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grant_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_bar_coin_grants_bar ON public.bar_coin_grants(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_coin_grants_user ON public.bar_coin_grants(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bar_coin_grants_bar_user_date ON public.bar_coin_grants(bar_id, user_id, grant_date);

-- 2P. user_reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moment_id UUID REFERENCES public.moments(id) ON DELETE SET NULL,
  bar_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);

-- =============================================
-- PART 2Q: ALTER 現有 meal_participants 表
-- =============================================

ALTER TABLE public.meal_participants
  ADD COLUMN IF NOT EXISTS apply_count SMALLINT NOT NULL DEFAULT 1 CHECK (apply_count BETWEEN 1 AND 2);

COMMENT ON COLUMN public.meal_participants.apply_count IS '同一酒局申請次數（最多 2 次）';

-- =============================================
-- PART 3: RLS 權限
-- =============================================

ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bars_select" ON public.bars FOR SELECT USING (is_active = TRUE OR auth.uid() IS NOT NULL);
CREATE POLICY "bars_insert" ON public.bars FOR INSERT WITH CHECK (false);
CREATE POLICY "bars_update" ON public.bars FOR UPDATE USING (false);
CREATE POLICY "bars_delete" ON public.bars FOR DELETE USING (false);

ALTER TABLE public.bar_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bar_checkins_select" ON public.bar_checkins FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.bars WHERE id = bar_id)
);
CREATE POLICY "bar_checkins_insert" ON public.bar_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bar_checkins_update" ON public.bar_checkins FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE public.bar_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bar_ratings_select" ON public.bar_ratings FOR SELECT USING (true);
CREATE POLICY "bar_ratings_insert" ON public.bar_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bar_ratings_update" ON public.bar_ratings FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (
  auth.uid() = follower_id OR auth.uid() = following_id
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_blocks_select" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "user_blocks_insert" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "user_blocks_delete" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moments_select" ON public.moments FOR SELECT USING (
  is_deleted = FALSE
  AND (
    visibility = 'public'
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.follower_id = auth.uid() AND f.following_id = moments.user_id
    ) AND EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = moments.user_id AND f2.following_id = auth.uid()
    ))
    OR (visibility = 'party_only' AND EXISTS (
      SELECT 1 FROM public.meal_participants mp
      JOIN public.meals m ON m.id = mp.meal_id
      WHERE mp.user_id = auth.uid() AND mp.status = 'approved'
      AND m.creator_id = moments.user_id
    ))
    OR user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_blocks ub
    WHERE ub.blocker_id = moments.user_id AND ub.blocked_id = auth.uid()
  )
);
CREATE POLICY "moments_insert" ON public.moments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_update" ON public.moments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.moment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moment_likes_select" ON public.moment_likes FOR SELECT USING (true);
CREATE POLICY "moment_likes_insert" ON public.moment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moment_likes_delete" ON public.moment_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.moment_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moment_comments_select" ON public.moment_comments FOR SELECT USING (
  is_deleted = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM public.user_blocks ub
    WHERE ub.blocker_id = public.moment_comments.user_id AND ub.blocked_id = auth.uid()
  )
);
CREATE POLICY "moment_comments_insert" ON public.moment_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moment_comments_update" ON public.moment_comments FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_threads_select" ON public.message_threads FOR SELECT USING (
  participant_a = auth.uid() OR participant_b = auth.uid()
);
CREATE POLICY "message_threads_insert" ON public.message_threads FOR INSERT WITH CHECK (
  participant_a = auth.uid() OR participant_b = auth.uid()
);
CREATE POLICY "message_threads_update" ON public.message_threads FOR UPDATE USING (
  participant_a = auth.uid() OR participant_b = auth.uid()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.message_threads WHERE id = thread_id AND (participant_a = auth.uid() OR participant_b = auth.uid()))
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (sender_id = auth.uid());

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coin_transactions_select" ON public.coin_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "coin_transactions_insert" ON public.coin_transactions FOR INSERT WITH CHECK (false);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_checkins_select" ON public.daily_checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "daily_checkins_insert" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_items_select" ON public.shop_items FOR SELECT USING (is_active = TRUE);
CREATE POLICY "shop_items_insert" ON public.shop_items FOR INSERT WITH CHECK (false);
CREATE POLICY "shop_items_update" ON public.shop_items FOR UPDATE USING (false);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_orders_select" ON public.shop_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "shop_orders_insert" ON public.shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shop_orders_update" ON public.shop_orders FOR UPDATE USING (
  user_id = auth.uid() OR redeemed_by = auth.uid()
);

ALTER TABLE public.bar_coin_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bar_coin_grants_select" ON public.bar_coin_grants FOR SELECT USING (
  user_id = auth.uid() OR granted_by = auth.uid()
);
CREATE POLICY "bar_coin_grants_insert" ON public.bar_coin_grants FOR INSERT WITH CHECK (
  granted_by = auth.uid()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_reports_select" ON public.user_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "user_reports_insert" ON public.user_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- =============================================
-- PART 4: Functions & Triggers
-- =============================================

-- 4A. 封鎖/取消封鎖 → 更新 block_count
CREATE OR REPLACE FUNCTION public.on_block_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_target_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_target_id := NEW.blocked_id;
    UPDATE public.profiles SET block_count = block_count + 1, updated_at = NOW() WHERE id = v_target_id;
    IF (SELECT block_count FROM public.profiles WHERE id = v_target_id) >= 10 THEN
      UPDATE public.profiles SET status = 'suspended', updated_at = NOW() WHERE id = v_target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_target_id := OLD.blocked_id;
    UPDATE public.profiles SET block_count = GREATEST(0, block_count - 1), updated_at = NOW() WHERE id = v_target_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_block_changed ON public.user_blocks;
CREATE TRIGGER trigger_block_changed AFTER INSERT OR DELETE ON public.user_blocks FOR EACH ROW
  EXECUTE FUNCTION public.on_block_changed();

-- 4B. 舉報通過 → 更新 report_received_count
CREATE OR REPLACE FUNCTION public.on_report_resolved()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.reported_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET report_received_count = report_received_count + 1, updated_at = NOW()
    WHERE id = NEW.reported_user_id;

    SELECT report_received_count INTO v_count FROM public.profiles WHERE id = NEW.reported_user_id;
    IF v_count >= 5 THEN
      UPDATE public.profiles SET status = 'suspended', updated_at = NOW() WHERE id = NEW.reported_user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_report_resolved ON public.user_reports;
CREATE TRIGGER trigger_report_resolved AFTER UPDATE ON public.user_reports FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.on_report_resolved();

-- 4C. 退出酒局分段扣信用分（-1/-3/-5）
DROP TRIGGER IF EXISTS trigger_participant_cancel ON public.meal_participants;
DROP TRIGGER IF EXISTS trigger_participant_cancel_v2 ON public.meal_participants;

CREATE OR REPLACE FUNCTION public.on_participant_cancel_v2()
RETURNS TRIGGER AS $$
DECLARE
  hours_until_meal NUMERIC;
  penalty INTEGER;
  reason TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    SELECT EXTRACT(EPOCH FROM (m.datetime - NOW())) / 3600 INTO hours_until_meal
    FROM public.meals m WHERE m.id = NEW.meal_id;

    IF hours_until_meal >= 24 THEN
      penalty := 1; reason := '提前 24 小時以上退出酒局';
    ELSIF hours_until_meal >= 6 THEN
      penalty := 3; reason := '酒局前 6~24 小時退出';
    ELSE
      penalty := 5; reason := '酒局前 6 小時內退出';
    END IF;

    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    VALUES (NEW.user_id, 'cancel_meal', -penalty, reason, NEW.meal_id);
    UPDATE public.profiles
    SET credit_score = GREATEST(0, credit_score - penalty), updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_participant_cancel_v2 AFTER UPDATE ON public.meal_participants FOR EACH ROW
  WHEN (OLD.status = 'approved')
  EXECUTE FUNCTION public.on_participant_cancel_v2();

-- 4D. no_show → -8 分
DROP TRIGGER IF EXISTS trigger_no_show ON public.meal_participants;
DROP TRIGGER IF EXISTS trigger_no_show_v2 ON public.meal_participants;

CREATE OR REPLACE FUNCTION public.on_no_show_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    VALUES (NEW.user_id, 'no_show', -8, '酒局無故缺席', NEW.meal_id);
    UPDATE public.profiles
    SET credit_score = GREATEST(0, credit_score - 8), updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_no_show_v2 AFTER UPDATE ON public.meal_participants FOR EACH ROW
  EXECUTE FUNCTION public.on_no_show_v2();

-- 4E. 金幣發放函數（含每日上限 300）
CREATE OR REPLACE FUNCTION public.grant_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_is_daily_task BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN AS $$
DECLARE
  new_balance BIGINT;
  today_date DATE;
  current_daily INTEGER;
BEGIN
  today_date := CURRENT_DATE;

  IF p_is_daily_task THEN
    IF (SELECT daily_coin_reset_date FROM public.profiles WHERE id = p_user_id) < today_date THEN
      UPDATE public.profiles SET daily_coin_earned = 0, daily_coin_reset_date = today_date WHERE id = p_user_id;
    END IF;

    SELECT daily_coin_earned INTO current_daily FROM public.profiles WHERE id = p_user_id;
    IF current_daily + p_amount > 300 THEN
      RETURN FALSE;
    END IF;

    UPDATE public.profiles
    SET daily_coin_earned = daily_coin_earned + p_amount
    WHERE id = p_user_id;
  END IF;

  UPDATE public.profiles
  SET total_coins = total_coins + p_amount
  WHERE id = p_user_id
  RETURNING total_coins INTO new_balance;

  INSERT INTO public.coin_transactions (user_id, amount, balance_after, source_type, source_id, description, is_daily_task)
  VALUES (p_user_id, p_amount, new_balance, p_source_type, p_source_id, p_description, p_is_daily_task);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4F. 金幣消費函數
CREATE OR REPLACE FUNCTION public.spend_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT ''
) RETURNS BOOLEAN AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  IF (SELECT total_coins FROM public.profiles WHERE id = p_user_id) < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET total_coins = total_coins - p_amount
  WHERE id = p_user_id
  RETURNING total_coins INTO new_balance;

  INSERT INTO public.coin_transactions (user_id, amount, balance_after, source_type, source_id, description, is_daily_task)
  VALUES (p_user_id, -p_amount, new_balance, p_source_type, p_source_id, p_description, FALSE);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4G. 酒局完成 → 更新完成場次 + 信用分（等級由獨立函數計算，避免遞迴）
DROP TRIGGER IF EXISTS trigger_meal_completed ON public.meals;
DROP TRIGGER IF EXISTS trigger_meal_completed_v2 ON public.meals;

CREATE OR REPLACE FUNCTION public.on_meal_completed_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    SELECT mp.user_id, 'complete_meal', 2, '完成酒局', NEW.id
    FROM public.meal_participants mp
    WHERE mp.meal_id = NEW.id AND mp.status = 'approved';

    UPDATE public.profiles
    SET completed_meals_count = completed_meals_count + 1,
        credit_score = LEAST(100, credit_score + 2),
        updated_at = NOW()
    WHERE id IN (
      SELECT mp.user_id FROM public.meal_participants mp
      WHERE mp.meal_id = NEW.id AND mp.status = 'approved'
    );

    UPDATE public.profiles
    SET hosted_meals_count = hosted_meals_count + 1, updated_at = NOW()
    WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_meal_completed_v2 AFTER UPDATE ON public.meals FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.on_meal_completed_v2();

-- 4H. 等級自動計算函數（獨立呼叫，不透過 trigger 避免遞迴）
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_user_id UUID) RETURNS SMALLINT AS $$
DECLARE
  v_completed INTEGER;
  v_hosted INTEGER;
  v_posts INTEGER;
  v_recommends INTEGER;
  v_current_level SMALLINT;
  v_new_level SMALLINT := 1;
  v_avg_rating NUMERIC;
  v_account_age TIMESTAMPTZ;
  v_reward INTEGER := 0;
BEGIN
  SELECT completed_meals_count, hosted_meals_count, posts_count, recommend_count, level, created_at
  INTO v_completed, v_hosted, v_posts, v_recommends, v_current_level, v_account_age
  FROM public.profiles WHERE id = p_user_id;

  IF v_completed >= 50 AND v_recommends >= 10 AND (NOW() - v_account_age) >= INTERVAL '90 days' THEN
    v_new_level := 5;
  ELSIF v_completed >= 25 AND v_hosted >= 3 THEN
    SELECT COALESCE(AVG(rating::numeric), 0) INTO v_avg_rating
    FROM public.reviews WHERE reviewee_id = p_user_id;
    IF v_avg_rating >= 4.2 THEN
      v_new_level := 4;
    END IF;
  END IF;

  IF v_new_level = 1 AND v_completed >= 10 AND v_posts >= 5 THEN
    v_new_level := 3;
  END IF;

  IF v_new_level = 1 AND v_completed >= 3 THEN
    v_new_level := 2;
  END IF;

  IF v_new_level > v_current_level THEN
    UPDATE public.profiles SET level = v_new_level, updated_at = NOW() WHERE id = p_user_id;

    CASE v_new_level
      WHEN 2 THEN v_reward := 100;
      WHEN 3 THEN v_reward := 200;
      WHEN 4 THEN v_reward := 500;
      WHEN 5 THEN v_reward := 1000;
    END CASE;

    IF v_reward > 0 THEN
      PERFORM public.grant_coins(
        p_user_id, v_reward,
        'system_level_up', NULL,
        '升級至 Lv.' || v_new_level || ' 獎勵',
        FALSE
      );
    END IF;
  END IF;

  RETURN COALESCE(v_new_level, v_current_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4I. 動態發布 → 更新 posts_count
CREATE OR REPLACE FUNCTION public.on_moment_created()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET posts_count = posts_count + 1, updated_at = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_moment_created ON public.moments;
CREATE TRIGGER trigger_moment_created AFTER INSERT ON public.moments FOR EACH ROW
  EXECUTE FUNCTION public.on_moment_created();

-- 4J. 動態點讚 → 更新 likes_count + 10讚獎勵
CREATE OR REPLACE FUNCTION public.on_moment_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE public.moments SET likes_count = likes_count + 1 WHERE id = NEW.moment_id RETURNING likes_count INTO v_new_count;
  IF v_new_count = 10 THEN
    PERFORM public.grant_coins(
      (SELECT user_id FROM public.moments WHERE id = NEW.moment_id),
      30, 'system_moment_10_likes', NEW.moment_id,
      '動態獲得 10 個讚', TRUE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_moment_liked ON public.moment_likes;
CREATE TRIGGER trigger_moment_liked AFTER INSERT ON public.moment_likes FOR EACH ROW
  EXECUTE FUNCTION public.on_moment_liked();

-- 4K. 取消點讚
CREATE OR REPLACE FUNCTION public.on_moment_unliked()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.moments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.moment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_moment_unliked ON public.moment_likes;
CREATE TRIGGER trigger_moment_unliked AFTER DELETE ON public.moment_likes FOR EACH ROW
  EXECUTE FUNCTION public.on_moment_unliked();

-- 4L. 動態留言
CREATE OR REPLACE FUNCTION public.on_moment_commented()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.moments SET comments_count = comments_count + 1 WHERE id = NEW.moment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_moment_commented ON public.moment_comments;
CREATE TRIGGER trigger_moment_commented AFTER INSERT ON public.moment_comments FOR EACH ROW
  EXECUTE FUNCTION public.on_moment_commented();

-- 4M. 簽到 → 金幣 + 連續天數
CREATE OR REPLACE FUNCTION public.on_daily_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - 1;
  v_streak INTEGER := 1;
  v_bonus BOOLEAN := FALSE;
  v_total_reward INTEGER := 10;
BEGIN
  SELECT MAX(streak_days) INTO v_streak
  FROM public.daily_checkins
  WHERE user_id = NEW.user_id AND checkin_date = v_yesterday;

  IF v_streak IS NOT NULL AND v_streak > 0 THEN
    v_streak := v_streak + 1;
  END IF;

  IF v_streak >= 7 AND v_streak % 7 = 0 THEN
    v_bonus := TRUE;
    v_total_reward := 10 + 50;
  END IF;

  NEW.streak_days := v_streak;
  NEW.is_streak_bonus := v_bonus;
  NEW.coins_earned := v_total_reward;

  PERFORM public.grant_coins(
    NEW.user_id, v_total_reward,
    CASE WHEN v_bonus THEN 'system_streak_bonus' ELSE 'system_daily_checkin' END,
    NULL,
    CASE WHEN v_bonus THEN '連續簽到 ' || v_streak || ' 天獎勵' ELSE '每日登入簽到' END,
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_daily_checkin ON public.daily_checkins;
CREATE TRIGGER trigger_daily_checkin BEFORE INSERT ON public.daily_checkins FOR EACH ROW
  EXECUTE FUNCTION public.on_daily_checkin();

-- 4N. 每日金幣計數重置函數
CREATE OR REPLACE FUNCTION public.reset_all_daily_coin_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET daily_coin_earned = 0, daily_coin_reset_date = CURRENT_DATE
  WHERE daily_coin_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4O. 信用分月度恢復
CREATE OR REPLACE FUNCTION public.monthly_credit_recovery()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credit_score = LEAST(100, credit_score + GREATEST(0, 10 - credit_recovery_this_month)),
      last_credit_recovery_date = CURRENT_DATE,
      credit_recovery_this_month = credit_recovery_this_month + GREATEST(0, 10 - credit_recovery_this_month),
      updated_at = NOW()
  WHERE credit_score < 100
    AND (last_credit_recovery_date IS NULL
         OR last_credit_recovery_date < CURRENT_DATE - INTERVAL '1 month')
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4P. 商城兌換
CREATE OR REPLACE FUNCTION public.redeem_shop_item(
  p_user_id UUID,
  p_item_id UUID
) RETURNS UUID AS $$
DECLARE
  v_item RECORD;
  v_order_id UUID;
  v_qr_code TEXT;
BEGIN
  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND is_active = TRUE FOR UPDATE;

  IF v_item IS NULL THEN
    RAISE EXCEPTION '商品不存在或已下架';
  END IF;

  IF v_item.stock > 0 THEN
    UPDATE public.shop_items SET stock = stock - 1 WHERE id = p_item_id;
  ELSIF v_item.stock = 0 THEN
    RAISE EXCEPTION '商品已售罄';
  END IF;

  IF NOT public.spend_coins(p_user_id, v_item.coin_price, 'shop_purchase', p_item_id, '兌換：' || v_item.name_zh) THEN
    RAISE EXCEPTION '金幣餘額不足';
  END IF;

  v_qr_code := upper(encode(digest(gen_random_uuid()::text || p_user_id::text || NOW()::text, 'sha256'), 'hex'));

  INSERT INTO public.shop_orders (user_id, item_id, coins_spent, qr_code, expires_at)
  VALUES (p_user_id, p_item_id, v_item.coin_price, v_qr_code, NOW() + (v_item.valid_days || ' days')::INTERVAL)
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4Q. 酒吧簽到 → 金幣 +5
CREATE OR REPLACE FUNCTION public.on_bar_checkin()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.grant_coins(
    NEW.user_id, 5,
    'system_bar_checkin', NEW.bar_id,
    '酒吧簽到',
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bar_checkin ON public.bar_checkins;
CREATE TRIGGER trigger_bar_checkin AFTER INSERT ON public.bar_checkins FOR EACH ROW
  EXECUTE FUNCTION public.on_bar_checkin();

-- 4R. 酒吧發幣（不計入每日上限）
-- 注意：所有參數都沒有 DEFAULT，避免 42P13 錯誤
CREATE OR REPLACE FUNCTION public.bar_grant_coins(
  p_bar_id UUID,
  p_user_id UUID,
  p_coins INTEGER,
  p_granted_by UUID,
  p_reason TEXT DEFAULT ''
) RETURNS BOOLEAN AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.bar_coin_grants
    WHERE bar_id = p_bar_id AND user_id = p_user_id AND grant_date = CURRENT_DATE
  ) >= 3 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.bar_coin_grants (bar_id, user_id, coins, reason, granted_by)
  VALUES (p_bar_id, p_user_id, p_coins, p_reason, p_granted_by);

  PERFORM public.grant_coins(
    p_user_id, p_coins,
    'bar_grant', p_bar_id,
    p_reason || ' (酒吧發放)',
    FALSE
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4S. 電子券過期
CREATE OR REPLACE FUNCTION public.expire_shop_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.shop_orders
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4T. updated_at 自動更新
DROP TRIGGER IF EXISTS trigger_bars_updated_at ON public.bars;
CREATE TRIGGER trigger_bars_updated_at BEFORE UPDATE ON public.bars FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_moments_updated_at ON public.moments;
CREATE TRIGGER trigger_moments_updated_at BEFORE UPDATE ON public.moments FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_shop_items_updated_at ON public.shop_items;
CREATE TRIGGER trigger_shop_items_updated_at BEFORE UPDATE ON public.shop_items FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 完成！ v2 Schema Migration (clean)
-- =============================================
