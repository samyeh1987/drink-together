-- ============================================================
-- Fix: RLS infinite recursion on meals + notifications insert
-- Migration: 007_fix_rls_recursion.sql
-- Date: 2026-04-18
-- Description:
--   1. Fix infinite recursion in meals_select policy by using
--      SECURITY DEFINER helper functions (bypasses RLS)
--   2. Allow authenticated users to insert notifications
-- ============================================================

-- =============================================
-- 1. Helper functions to bypass RLS recursion
-- =============================================

-- Check if user is a participant of a specific meal
CREATE OR REPLACE FUNCTION public.is_meal_participant(meal_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meal_participants mp
    WHERE mp.meal_id = meal_id_param
      AND mp.user_id = user_id_param
      AND mp.status = 'approved'
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is the creator of a specific meal
CREATE OR REPLACE FUNCTION public.is_meal_creator(meal_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meals m
    WHERE m.id = meal_id_param
      AND m.creator_id = user_id_param
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- 2. Drop and recreate meals policies using helper functions
-- =============================================

DROP POLICY IF EXISTS "meals_select" ON public.meals;
CREATE POLICY "meals_select" ON public.meals
  FOR SELECT USING (
    status IN ('open', 'confirmed', 'ongoing', 'completed')
    OR creator_id = auth.uid()
    OR is_meal_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "meals_insert" ON public.meals;
CREATE POLICY "meals_insert" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- meals_update and meals_delete don't have recursion issues, keep as-is
DROP POLICY IF EXISTS "meals_update" ON public.meals;
CREATE POLICY "meals_update" ON public.meals
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "meals_delete" ON public.meals;
CREATE POLICY "meals_delete" ON public.meals
  FOR DELETE USING (
    creator_id = auth.uid()
    AND status IN ('pending', 'open')
  );

-- =============================================
-- 3. Fix meal_participants policies (also has recursion via meals)
-- =============================================

DROP POLICY IF EXISTS "meal_participants_select" ON public.meal_participants;
CREATE POLICY "meal_participants_select" ON public.meal_participants
  FOR SELECT USING (
    is_meal_creator(meal_id, auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meals m
      WHERE m.id = meal_participants.meal_id
        AND m.status IN ('open', 'confirmed', 'ongoing', 'completed')
    )
  );

-- meal_participants_insert and meal_participants_update are fine (no subqueries to meals with EXISTS)

-- =============================================
-- 4. Fix meal_tags policies (also references meals)
-- =============================================

DROP POLICY IF EXISTS "meal_tags_insert" ON public.meal_tags;
CREATE POLICY "meal_tags_insert" ON public.meal_tags
  FOR INSERT WITH CHECK (
    is_meal_creator(meal_id, auth.uid())
  );

DROP POLICY IF EXISTS "meal_tags_delete" ON public.meal_tags;
CREATE POLICY "meal_tags_delete" ON public.meal_tags
  FOR DELETE USING (
    is_meal_creator(meal_id, auth.uid())
  );

-- =============================================
-- 5. Fix meal_comments policies (also references meals via meal_participants)
-- =============================================

-- Check if user is an approved participant of a meal (for comments)
CREATE OR REPLACE FUNCTION public.is_approved_participant(meal_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meal_participants mp
    WHERE mp.meal_id = meal_id_param
      AND mp.user_id = user_id_param
      AND mp.status = 'approved'
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "meal_comments_insert" ON public.meal_comments;
CREATE POLICY "meal_comments_insert" ON public.meal_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND is_approved_participant(meal_id, auth.uid())
);

-- =============================================
-- 6. Allow authenticated users to insert notifications
-- (previously was WITH CHECK (false) which blocked all client-side inserts)
-- =============================================

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Also allow users to read their own (already exists, but ensure)
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
