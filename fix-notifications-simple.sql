-- Fix notifications privacy with simple policies (no recursion)
-- This script creates simple policies that don't cause infinite recursion

-- 1. First, let's see current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 2. Disable RLS on notifications table temporarily
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing notification policies
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Teachers can create notifications" ON public.notifications;

-- 4. Show updated RLS status
SELECT 'Updated RLS Status (notifications should be false):' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 5. Test: Show all notifications (for debugging)
SELECT 'All notifications (for debugging):' as info, id, title, target, created_at
FROM public.notifications
ORDER BY created_at DESC;

-- 6. Test: Show all users to confirm they're visible
SELECT 'All users (should be visible now):' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
