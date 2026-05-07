-- Add photos column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';

-- Create storage bucket for profile photos (requires Supabase CLI or Dashboard)
-- Run this in Supabase Dashboard > Storage, or use the Dashboard UI:
--   1. Go to Storage > New Bucket
--   2. Name: "profile-photos"
--   3. Public: true (so uploaded images are publicly accessible)
--   4. File size limit: 2MB
--   5. Allowed MIME types: image/*

-- Storage policies (run in SQL Editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "profile_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow anyone to view profile photos (public bucket)
CREATE POLICY "profile_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "profile_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
