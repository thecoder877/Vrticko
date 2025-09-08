-- Fix infinite recursion in RLS policies
-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- Create simple, non-recursive policies
-- Allow all operations for authenticated users (temporary fix)
CREATE POLICY "Allow all for authenticated users" ON public.users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Alternative: More restrictive policy
-- CREATE POLICY "Users can manage their own data" ON public.users
--   FOR ALL USING (
--     auth.uid() = id::uuid OR 
--     auth.uid() = auth_user_id
--   );
