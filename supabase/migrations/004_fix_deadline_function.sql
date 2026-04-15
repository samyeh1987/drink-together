-- Fix: ambiguous column in check_meal_deadlines
-- Please run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.check_meal_deadlines()
RETURNS void AS $$
BEGIN
  -- Close meals past deadline that are still 'open'
  UPDATE public.meals SET status = 'closed', updated_at = NOW()
  WHERE status = 'open' AND deadline < NOW()
  AND id IN (SELECT m.id FROM public.meals m WHERE m.status = 'open' AND m.deadline < NOW() FOR UPDATE SKIP LOCKED);

  -- Check closed meals: confirm or cancel
  UPDATE public.meals m SET status = CASE WHEN cnt.approved_count >= m.min_participants THEN 'confirmed' ELSE 'cancelled' END, updated_at = NOW()
  FROM (
    SELECT meal_id, COUNT(*) AS approved_count FROM public.meal_participants WHERE status = 'approved' GROUP BY meal_id
  ) cnt
  WHERE m.id = cnt.meal_id AND m.status = 'closed';

  -- Start meals when datetime arrives (confirmed → ongoing)
  UPDATE public.meals SET status = 'ongoing', updated_at = NOW()
  WHERE status = 'confirmed' AND datetime <= NOW() AND datetime > NOW() - INTERVAL '4 hours';

  -- Complete meals 4 hours after datetime
  UPDATE public.meals SET status = 'completed', updated_at = NOW()
  WHERE status = 'ongoing' AND datetime < NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
