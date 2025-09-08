-- Fix users table with NO recursion
-- This script creates simple policies that don't cause infinite recursion

-- First, let's see what policies currently exist
SELECT 'Current users policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop ALL existing users policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create SIMPLE policies with NO recursion
-- 1. Service role can do everything (no recursion)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- 3. Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- 4. Allow user creation (no recursion)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- 5. TEMPORARY: Allow all authenticated users to read all users (for testing)
-- This will be removed once we confirm everything works
CREATE POLICY "Temporary: All users can read all users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Show the new policies
SELECT 'New users policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Show all users in the table (for debugging)
SELECT 'All users in table:' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
