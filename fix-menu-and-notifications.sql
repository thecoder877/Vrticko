-- Fix menu access and notifications privacy
-- This script fixes both menu access and notification privacy

-- 1. First, let's see current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 2. Disable RLS on menu table completely (no restrictions)
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;

-- 3. Drop any existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Teachers can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

-- 4. Enable RLS on notifications table for privacy
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing notification policies
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Teachers can create notifications" ON public.notifications;

-- 6. Create notification policies for privacy
-- Users can only see notifications sent to them
CREATE POLICY "Users can read their notifications" ON public.notifications
  FOR SELECT USING (
    -- Show notifications sent to 'all', 'parents', 'teachers', or to this specific user
    target IN ('all', 'parents', 'teachers') OR 
    target = auth.uid()::text
  );

-- Admins can create and manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can create notifications
CREATE POLICY "Teachers can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- 7. Show updated RLS status
SELECT 'Updated RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 8. Show notification policies
SELECT 'Notification policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public'
ORDER BY policyname;

-- 9. Test: Show all users to confirm they're visible
SELECT 'All users (should be visible now):' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
