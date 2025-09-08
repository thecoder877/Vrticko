-- Fix infinite recursion in users table RLS policies
-- This script removes problematic policies and creates simple ones

-- Drop ALL existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create simple, non-recursive policies for users table
-- Policy 1: Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- Policy 2: Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

-- Policy 3: Allow service role to do everything (for admin operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Policy 4: Allow insert for user creation (no recursion)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- Verify the policies
SELECT 'Users table policies after fix:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
