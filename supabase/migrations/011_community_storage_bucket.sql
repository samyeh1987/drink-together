-- Migration 011: community storage bucket + debug logging
-- 1. Create dedicated storage bucket for community posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-photos', 'community-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Public read
DROP POLICY IF EXISTS "community_photos_public_read" ON storage.objects;
CREATE POLICY "community_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-photos');

-- 3. Authenticated upload (any logged-in user can upload to their own folder)
DROP POLICY IF EXISTS "community_photos_upload" ON storage.objects;
CREATE POLICY "community_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-photos'
    AND auth.role() = 'authenticated'
  );

-- 4. Owner delete
DROP POLICY IF EXISTS "community_photos_delete" ON storage.objects;
CREATE POLICY "community_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'community-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
