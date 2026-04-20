-- Create recommended_bars table for popular bar recommendations
CREATE TABLE IF NOT EXISTS recommended_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_local TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('bangkok', 'pattaya', 'chiangmai', 'phuket')),
  phone TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recommended_bars_city ON recommended_bars(city);
CREATE INDEX IF NOT EXISTS idx_recommended_bars_status ON recommended_bars(status);

-- Enable RLS
ALTER TABLE recommended_bars ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read bars
CREATE POLICY "Allow authenticated read" ON recommended_bars
  FOR SELECT TO authenticated USING (status = 'active');

-- Allow authenticated users to read all (for admin)
CREATE POLICY "Allow authenticated read all" ON recommended_bars
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert (for admin)
CREATE POLICY "Allow authenticated insert" ON recommended_bars
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update (for admin)
CREATE POLICY "Allow authenticated update" ON recommended_bars
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete (for admin)
CREATE POLICY "Allow authenticated delete" ON recommended_bars
  FOR DELETE TO authenticated USING (true);

-- Insert sample data
INSERT INTO recommended_bars (name, name_local, address, city, phone, description, sort_order) VALUES
  ('Maggie Choo''s', 'แมกกี้ ชูส์', 'Silom, Bangkok', 'bangkok', '+66 2 636 1442', '時尚地下酒吧，適合派對和社交', 1),
  ('Above Riva', 'อะบูฟ ริวา', 'Riverside, Bangkok', 'bangkok', '+66 2 861 1999', '河畔景觀酒吧，浪漫氛圍', 2),
  ('Sky Bar', 'สกาย บาร์', 'Sathorn, Bangkok', 'bangkok', '+66 2 304 4000', '蓮花塔頂層酒吧，壯觀夜景', 3),
  ('Lucifer Bar', 'ลูซิเฟอร์ บาร์', 'Walking Street, Pattaya', 'pattaya', '+66 38 421 177', '派對酒吧，音樂勁爆', 1),
  ('The Rock House', 'เดอะ ร็อค เฮาส์', 'North Pattaya', 'pattaya', '+66 38 361 771', '搖滾風格酒吧，每晚現場演出', 2),
  ('The Good View Bar', 'เดอะกู๊ดวิวบาร์', 'Charoenrat, Chiang Mai', 'chiangmai', '+66 53 248 871', '河岸酒吧，現場音樂表演', 1),
  ('Warm Up Cafe', 'วอร์มอัพคาเฟ่', 'Nimmanhaemin, Chiang Mai', 'chiangmai', '+66 53 894 481', '年輕人聚集的時尚酒吧', 2),
  ('Bangla Boxing Stadium', 'สนามมวยบางกอก', 'Patong, Phuket', 'phuket', '+66 76 342 081', '拳擊主題酒吧，刺激體驗', 1),
  ('Illuzion Phuket', 'อิลลูซิออน ภูเก็ต', 'Bangla Road, Patong', 'phuket', '+66 76 343 343', '大型夜店，國際DJ演出', 2);
