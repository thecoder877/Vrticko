-- Fix notifications table to allow read_status updates
-- This script adds UPDATE policy for notifications table

-- 1. First, let's see current RLS status
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'notifications';

-- 2. Add UPDATE policy for notifications (allow users to update read_status)
CREATE POLICY "Users can update read_status" ON public.notifications
  FOR UPDATE USING (
    -- Allow users to update read_status for notifications they can read
    target IN ('all', 'parents', 'teachers') OR 
    target = auth.uid()::text
  );

-- 3. Show updated policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public'
ORDER BY policyname;

-- 4. Test update of read_status (replace with actual user ID from console logs)
-- UPDATE public.notifications 
-- SET read_status = '{"2f7ca05c-6641-4028-a8b1-b9a5f0437ffd": "2025-01-01T00:00:00.000Z"}'
-- WHERE id = '13913536-7e3c-4598-8b7f-1fb0c54c9f4a';

-- 5. Verify the update
-- SELECT id, title, read_status
-- FROM public.notifications
-- WHERE id = '13913536-7e3c-4598-8b7f-1fb0c54c9f4a';
