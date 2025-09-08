-- Fix admin access to users table
-- This script ensures admins can see all users

-- First, let's see what policies currently exist on users table
SELECT 'Current users policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new policies for users table
-- 1. Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- 4. Allow user creation (for registration)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- 5. CRITICAL: Allow admins to read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- 6. CRITICAL: Allow admins to update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- 7. CRITICAL: Allow admins to delete all users
CREATE POLICY "Admins can delete all users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Show the new policies
SELECT 'New users policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Check if RLS is enabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
