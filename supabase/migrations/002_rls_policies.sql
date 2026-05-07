-- ============================================================
-- EatTogether RLS (Row Level Security) Policies
-- Migration: 002_rls_policies.sql
-- Date: 2026-04-16
-- Description: Access control for all tables
-- ============================================================

-- =============================================
-- Helper: Anon users = anyone (logged in or not)
-- Authenticated users = logged in users
-- =============================================

-- Enable RLS on all tables
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

-- =============================================
-- PROFILES
-- =============================================
-- Anyone can view profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (handled by trigger, but just in case)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only service_role can delete profiles
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (false);

-- =============================================
-- TAGS
-- =============================================
-- Anyone can read tags
CREATE POLICY "tags_select" ON public.tags
  FOR SELECT USING (true);

-- Only service_role can manage tags (admin)
CREATE POLICY "tags_insert" ON public.tags
  FOR INSERT WITH CHECK (false);
CREATE POLICY "tags_update" ON public.tags
  FOR UPDATE USING (false);
CREATE POLICY "tags_delete" ON public.tags
  FOR DELETE USING (false);

-- =============================================
-- USER_TAGS
-- =============================================
-- Anyone can read user tags
CREATE POLICY "user_tags_select" ON public.user_tags
  FOR SELECT USING (true);

-- Users can add tags to themselves
CREATE POLICY "user_tags_insert" ON public.user_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own tags
CREATE POLICY "user_tags_delete" ON public.user_tags
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- MEALS
-- =============================================
-- Anyone can read open/confirmed/ongoing meals
CREATE POLICY "meals_select" ON public.meals
  FOR SELECT USING (
    status IN ('open', 'confirmed', 'ongoing', 'completed')
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meal_participants
      WHERE meal_id = id AND user_id = auth.uid()
    )
  );

-- Authenticated users can create meals
CREATE POLICY "meals_insert" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Only creator can update their own meal
CREATE POLICY "meals_update" ON public.meals
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Only creator can delete (only if still pending/open)
CREATE POLICY "meals_delete" ON public.meals
  FOR DELETE USING (
    creator_id = auth.uid()
    AND status IN ('pending', 'open')
  );

-- =============================================
-- MEAL_TAGS
-- =============================================
-- Anyone can read meal tags
CREATE POLICY "meal_tags_select" ON public.meal_tags
  FOR SELECT USING (true);

-- Meal creator can tag their own meal
CREATE POLICY "meal_tags_insert" ON public.meal_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid()
    )
  );

-- Meal creator can remove tags from their own meal
CREATE POLICY "meal_tags_delete" ON public.meal_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid()
    )
  );

-- =============================================
-- MEAL_PARTICIPANTS
-- =============================================
-- Anyone can read participants of visible meals
CREATE POLICY "meal_participants_select" ON public.meal_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meals WHERE id = meal_id
      AND (status IN ('open', 'confirmed', 'ongoing', 'completed') OR creator_id = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- Users can join meals (insert themselves as participant)
CREATE POLICY "meal_participants_insert" ON public.meal_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Participants can update their own status (cancel)
-- Creator can approve/reject participants
CREATE POLICY "meal_participants_update" ON public.meal_participants
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.meals WHERE id = meal_id AND creator_id = auth.uid()
    )
  );

-- =============================================
-- REVIEWS
-- =============================================
-- Anyone can read reviews
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

-- Participants of a completed meal can write reviews
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.meal_participants
      WHERE meal_id = reviews.meal_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.meals
      WHERE id = reviews.meal_id AND status = 'completed'
    )
  );

-- =============================================
-- REPORTS
-- =============================================
-- Users can only see reports they created
CREATE POLICY "reports_select" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- =============================================
-- NOTIFICATIONS
-- =============================================
-- Users can only read their own notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- System/service inserts notifications (users cannot)
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (false);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- CREDIT_HISTORY
-- =============================================
-- Users can read their own credit history
CREATE POLICY "credit_history_select" ON public.credit_history
  FOR SELECT USING (user_id = auth.uid());

-- System inserts credit changes (users cannot)
CREATE POLICY "credit_history_insert" ON public.credit_history
  FOR INSERT WITH CHECK (false);

-- =============================================
-- RESTAURANT_DEALS
-- =============================================
-- Anyone can view active deals
CREATE POLICY "restaurant_deals_select" ON public.restaurant_deals
  FOR SELECT USING (is_active = TRUE);

-- Only service_role can manage deals
CREATE POLICY "restaurant_deals_insert" ON public.restaurant_deals
  FOR INSERT WITH CHECK (false);
CREATE POLICY "restaurant_deals_update" ON public.restaurant_deals
  FOR UPDATE USING (false);
CREATE POLICY "restaurant_deals_delete" ON public.restaurant_deals
  FOR DELETE USING (false);
