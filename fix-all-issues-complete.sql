-- Complete fix for all RLS issues
-- This script safely removes all existing policies and creates new ones

-- ==============================================
-- 1. REMOVE ALL EXISTING POLICIES
-- ==============================================

-- Remove all menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

-- Remove all notes policies
DROP POLICY IF EXISTS "Parents can read notes about own children" ON public.notes;
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;
DROP POLICY IF EXISTS "Teachers can read all notes" ON public.notes;

-- Remove all children policies
DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
DROP POLICY IF EXISTS "Teachers and admins can read all children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can insert children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can update children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can delete children" ON public.children;
DROP POLICY IF EXISTS "Teachers can read all children" ON public.children;

-- Remove all users policies
DROP POLICY IF EXISTS "Enable all operations for admins" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;

-- ==============================================
-- 2. CREATE NEW SIMPLE POLICIES
-- ==============================================

-- Menu table policies
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

CREATE POLICY "Admins and teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Notes table policies
CREATE POLICY "Parents can read notes about own children" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE id = child_id AND parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can read all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Children table policies
CREATE POLICY "Parents can read own children" ON public.children
  FOR SELECT USING (
    auth.uid() = parent_id::uuid OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can read all children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins can manage all children" ON public.children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins and teachers can insert children" ON public.children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins and teachers can update children" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins and teachers can delete children" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Users table policies (simple, no recursion)
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id
  );

CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- 3. VERIFY POLICIES
-- ==============================================

-- Show all policies for verification
SELECT 'Menu table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Notes table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notes' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Children table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'children' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Users table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
