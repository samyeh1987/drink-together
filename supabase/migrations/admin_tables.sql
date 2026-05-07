-- ============================================
-- EatTogether Admin - DB Migration SQL
-- Execute in Supabase SQL Editor
-- ============================================

-- 1. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports policy: allow all authenticated users to read (for admin via service role)
CREATE POLICY "Reports select for authenticated" ON reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Reports policy: allow authenticated users to insert
CREATE POLICY "Reports insert for authenticated" ON reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports policy: allow authenticated users to update
CREATE POLICY "Reports update for authenticated" ON reports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Settings policy: allow all authenticated users
CREATE POLICY "Settings select for authenticated" ON platform_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Settings upsert for authenticated" ON platform_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Settings update for authenticated" ON platform_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Ensure meal_photos table exists with correct structure
CREATE TABLE IF NOT EXISTS meal_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT,
  photo_url TEXT,
  caption TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on meal_photos
ALTER TABLE meal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meal photos select for authenticated" ON meal_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Meal photos insert for authenticated" ON meal_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Meal photos update for authenticated" ON meal_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Meal photos delete for authenticated" ON meal_photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Add status column to profiles if not exists (for ban/suspend)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
      CHECK (status IN ('active', 'banned', 'suspended'));
  END IF;
END $$;

-- 5. Ensure credit_history table exists (for credit adjustment logs)
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL DEFAULT 0,
  new_score INTEGER NOT NULL DEFAULT 100,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on credit_history
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit history select for authenticated" ON credit_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Credit history insert for authenticated" ON credit_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
