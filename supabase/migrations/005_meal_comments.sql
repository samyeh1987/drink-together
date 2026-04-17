-- Meal comments table
CREATE TABLE IF NOT EXISTS public.meal_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_comments_meal ON public.meal_comments(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_comments_user ON public.meal_comments(user_id);

ALTER TABLE public.meal_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "meal_comments_select" ON public.meal_comments FOR SELECT USING (true);

-- Authenticated users who are participants can comment
CREATE POLICY "meal_comments_insert" ON public.meal_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.meal_participants 
    WHERE meal_id = meal_comments.meal_id 
    AND user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- Only comment author can update/delete their comment
CREATE POLICY "meal_comments_update" ON public.meal_comments FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY "meal_comments_delete" ON public.meal_comments FOR DELETE USING (
  auth.uid() = user_id
);
