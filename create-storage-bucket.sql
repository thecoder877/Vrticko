-- Create storage bucket for child photos
-- This script creates a public bucket for storing child photos

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-photos',
  'child-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Create RLS policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload child photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'child-photos' AND
    auth.role() = 'authenticated'
  );

-- 3. Create RLS policy to allow everyone to view photos (since bucket is public)
CREATE POLICY "Everyone can view child photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'child-photos');

-- 4. Create RLS policy to allow authenticated users to update photos
CREATE POLICY "Authenticated users can update child photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'child-photos' AND
    auth.role() = 'authenticated'
  );

-- 5. Create RLS policy to allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete child photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'child-photos' AND
    auth.role() = 'authenticated'
  );

-- 6. Show the created bucket
SELECT * FROM storage.buckets WHERE id = 'child-photos';
