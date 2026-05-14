-- 013: Create reviews table (user-to-user rating after meals)
-- Referenced by calculate_user_level() for Lv.4 promotion

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can only review another user once per meal
  CONSTRAINT uq_review_meal UNIQUE (reviewer_id, reviewee_id, meal_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_meal ON public.reviews(meal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_deleted ON public.reviews(is_deleted);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (reviewer_id = auth.uid());

-- Prevent self-reviews
CREATE POLICY "reviews_no_self" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_id != reviewee_id);
