-- Fix admin operations to work with service role client
-- This script ensures admin operations work properly

-- 1. Check current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications', 'attendance')
ORDER BY tablename;

-- 2. Keep RLS disabled on users table for admin operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies on users table
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- 4. Show updated RLS status
SELECT 'Updated RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications', 'attendance')
ORDER BY tablename;

-- 5. Test: Show all users (should be visible now)
SELECT 'All users (should be visible now):' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;

-- 6. Test: Show all children (should be visible now)
SELECT 'All children (should be visible now):' as info, id, name, parent_id, group_name, created_at
FROM public.children
ORDER BY created_at DESC;
