-- Migration 010: Extended profile fields + community posts

-- 1. 擴充 profiles 表格（身高、體重、生日、城市、LINE ID、WhatsApp、星座）
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS height integer,           -- cm
  ADD COLUMN IF NOT EXISTS weight integer,           -- kg
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zodiac text,
  ADD COLUMN IF NOT EXISTS line_id text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS contact_visible boolean DEFAULT false;  -- 只有加入酒局後才顯示

-- 2. 建立 community_posts 表格（酒友圈）
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  image_url text,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. 建立 community_post_likes 表格（按讚）
CREATE TABLE IF NOT EXISTS community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 4. RLS Policies for community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "public can view posts" ON community_posts
  FOR SELECT USING (true);

-- Authenticated users can insert posts
CREATE POLICY "auth users can post" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own posts
CREATE POLICY "users can manage own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "public can view likes" ON community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "auth users can like" ON community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can unlike" ON community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 觸發器：自動更新 likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes ON community_post_likes;
CREATE TRIGGER trigger_update_post_likes
  AFTER INSERT OR DELETE ON community_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);
