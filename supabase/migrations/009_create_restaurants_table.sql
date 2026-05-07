-- 009_create_restaurants_table.sql
-- Create restaurants table for admin restaurant management

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_local TEXT,
  address TEXT,
  cuisine_type TEXT NOT NULL DEFAULT 'other',
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  rating NUMERIC(2, 1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  description TEXT,
  avatar_url TEXT,
  total_meals_hosted INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurant_deals table
CREATE TABLE IF NOT EXISTS restaurant_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC(10, 2),
  deal_price NUMERIC(10, 2),
  min_pax INTEGER DEFAULT 1,
  max_pax INTEGER DEFAULT 10,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'expired', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_deals ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurants (allow all reads, restrict writes)
CREATE POLICY "restaurants_select" ON restaurants FOR SELECT USING (true);
CREATE POLICY "restaurants_insert" ON restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "restaurants_update" ON restaurants FOR UPDATE USING (true);
CREATE POLICY "restaurants_delete" ON restaurants FOR DELETE USING (true);

-- RLS policies for restaurant_deals
CREATE POLICY "deals_select" ON restaurant_deals FOR SELECT USING (true);
CREATE POLICY "deals_insert" ON restaurant_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "deals_update" ON restaurant_deals FOR UPDATE USING (true);
CREATE POLICY "deals_delete" ON restaurant_deals FOR DELETE USING (true);

-- Index for faster lookups
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurant_deals_restaurant_id ON restaurant_deals(restaurant_id);
