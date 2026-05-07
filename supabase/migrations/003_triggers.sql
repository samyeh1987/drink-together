-- ============================================================
-- EatTogether Triggers & Functions
-- Migration: 003_triggers.sql
-- Date: 2026-04-16
-- Description: Meal status automation + credit score system
-- ============================================================

-- =============================================
-- 1. MEAL STATUS AUTOMATION
-- =============================================

-- 1a. When a meal is created with valid data, set it to 'open'
CREATE OR REPLACE FUNCTION public.on_meal_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set status to 'open' if datetime is in the future
  IF NEW.datetime > NOW() THEN
    NEW.status := 'open';
  END IF;

  -- Auto-add creator as approved participant
  INSERT INTO public.meal_participants (meal_id, user_id, status)
  VALUES (NEW.id, NEW.creator_id, 'approved')
  ON CONFLICT (meal_id, user_id) DO NOTHING;

  -- Credit: +5 for creating a meal
  INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
  VALUES (NEW.creator_id, 'create_meal', 5, '發起飯局', NEW.id);

  UPDATE public.profiles
  SET credit_score = credit_score + 5, updated_at = NOW()
  WHERE id = NEW.creator_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_meal_created
  AFTER INSERT ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.on_meal_created();


-- 1b. When a participant joins, check if max is reached
CREATE OR REPLACE FUNCTION public.on_participant_joined()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  IF NEW.status = 'approved' THEN
    SELECT COUNT(*), max_participants INTO current_count, max_count
    FROM public.meals m
    LEFT JOIN public.meal_participants mp ON mp.meal_id = m.id AND mp.status = 'approved'
    WHERE m.id = NEW.meal_id
    GROUP BY max_participants;

    -- If reached max, close the meal
    IF current_count >= max_count THEN
      UPDATE public.meals SET status = 'closed', updated_at = NOW() WHERE id = NEW.meal_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_participant_joined
  AFTER INSERT OR UPDATE ON public.meal_participants
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.on_participant_joined();


-- 1c. Scheduled: Check deadlines and auto-close meals
-- This function should be called by a cron job (e.g., pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION public.check_meal_deadlines()
RETURNS void AS $$
BEGIN
  -- Close meals past deadline that are still 'open'
  UPDATE public.meals
  SET status = 'closed', updated_at = NOW()
  WHERE status = 'open'
    AND deadline < NOW()
    AND id IN (
      SELECT m.id FROM public.meals m
      WHERE m.status = 'open' AND m.deadline < NOW()
      FOR UPDATE SKIP LOCKED
    );

  -- Check closed meals: confirm or cancel
  UPDATE public.meals
  SET status = CASE
    WHEN approved_count >= min_participants THEN 'confirmed'
    ELSE 'cancelled'
  END,
  updated_at = NOW()
  FROM (
    SELECT
      m.id,
      m.min_participants,
      COUNT(mp.id) AS approved_count
    FROM public.meals m
    LEFT JOIN public.meal_participants mp ON mp.meal_id = m.id AND mp.status = 'approved'
    WHERE m.status = 'closed'
    GROUP BY m.id, m.min_participants
  ) AS counts
  WHERE meals.id = counts.id;

  -- Start meals when datetime arrives (confirmed → ongoing)
  UPDATE public.meals
  SET status = 'ongoing', updated_at = NOW()
  WHERE status = 'confirmed'
    AND datetime <= NOW()
    AND datetime > NOW() - INTERVAL '4 hours';

  -- Complete meals 4 hours after datetime
  UPDATE public.meals
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'ongoing'
    AND datetime < NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 2. CREDIT SCORE SYSTEM
-- =============================================

-- 2a. Credit level calculation
CREATE OR REPLACE FUNCTION public.get_credit_level(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF score >= 150 THEN RETURN 'excellent';
  ELSIF score >= 120 THEN RETURN 'good';
  ELSIF score >= 90 THEN RETURN 'average';
  ELSIF score >= 60 THEN RETURN 'newbie';
  ELSE RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2b. On review submitted: adjust credit based on rating
CREATE OR REPLACE FUNCTION public.on_review_submitted()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_score INTEGER;
  reviewee_score INTEGER;
BEGIN
  -- Reviewer gets +2 for leaving a review
  SELECT credit_score INTO reviewer_score FROM public.profiles WHERE id = NEW.reviewer_id;
  IF reviewer_score IS NOT NULL THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    VALUES (NEW.reviewer_id, 'write_review', 2, '留下評價', NEW.meal_id);
    UPDATE public.profiles SET credit_score = credit_score + 2, updated_at = NOW() WHERE id = NEW.reviewer_id;
  END IF;

  -- Reviewee gets credit based on rating
  SELECT credit_score INTO reviewee_score FROM public.profiles WHERE id = NEW.reviewee_id;
  IF reviewee_score IS NOT NULL THEN
    DECLARE
      points INTEGER;
      reason TEXT;
    BEGIN
      CASE NEW.rating
        WHEN 5 THEN points := 5; reason := '收到 5 星好評';
        WHEN 4 THEN points := 3; reason := '收到 4 星評價';
        WHEN 3 THEN points := 0; reason := '收到 3 星評價';
        WHEN 2 THEN points := -3; reason := '收到 2 星差評';
        WHEN 1 THEN points := -5; reason := '收到 1 星差評';
        ELSE points := 0; reason := '收到評價';
      END CASE;

      INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
      VALUES (NEW.reviewee_id, 'receive_review', points, reason, NEW.meal_id);
      UPDATE public.profiles SET credit_score = GREATEST(0, credit_score + points), updated_at = NOW() WHERE id = NEW.reviewee_id;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_review_submitted
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.on_review_submitted();


-- 2c. No-show penalty: when participant marked as no_show
CREATE OR REPLACE FUNCTION public.on_no_show()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    VALUES (NEW.user_id, 'no_show', -15, '飯局未到', NEW.meal_id);
    UPDATE public.profiles
    SET credit_score = GREATEST(0, credit_score - 15), updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_no_show
  AFTER UPDATE ON public.meal_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.on_no_show();


-- 2d. Cancel participation penalty: -3 if cancelled within 24h of meal
CREATE OR REPLACE FUNCTION public.on_participant_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    IF EXISTS (
      SELECT 1 FROM public.meals
      WHERE id = NEW.meal_id
        AND datetime < NOW() + INTERVAL '24 hours'
        AND datetime > NOW()
    ) THEN
      INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
      VALUES (NEW.user_id, 'late_cancel', -3, '24小時內取消參與', NEW.meal_id);
      UPDATE public.profiles
      SET credit_score = GREATEST(0, credit_score - 3), updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_participant_cancel
  AFTER UPDATE ON public.meal_participants
  FOR EACH ROW
  WHEN (OLD.status = 'approved')
  EXECUTE FUNCTION public.on_participant_cancel();


-- 2e. Join meal credit: +1 for joining a meal (only first time per meal)
CREATE OR REPLACE FUNCTION public.on_join_meal_credit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.user_id != (
    SELECT creator_id FROM public.meals WHERE id = NEW.meal_id
  ) THEN
    INSERT INTO public.credit_history (user_id, event_type, points_change, reason, meal_id)
    VALUES (NEW.user_id, 'join_meal', 1, '參加飯局', NEW.meal_id);
    UPDATE public.profiles
    SET credit_score = credit_score + 1, updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_join_meal_credit
  AFTER INSERT ON public.meal_participants
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.on_join_meal_credit();


-- =============================================
-- 3. UPDATED_AT auto-update trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
