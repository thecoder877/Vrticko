-- Comprehensive RLS policy fix for all tables
-- This script fixes all RLS policies to allow proper access for teachers and admins

-- ==============================================
-- 1. FIX MENU TABLE POLICIES
-- ==============================================

-- Drop existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;

-- Create new policies for menu table
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

CREATE POLICY "Admins and teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ==============================================
-- 2. FIX NOTES TABLE POLICIES
-- ==============================================

-- Drop existing notes policies
DROP POLICY IF EXISTS "Parents can read notes about own children" ON public.notes;
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;
DROP POLICY IF EXISTS "Teachers can read all notes" ON public.notes;

-- Create comprehensive notes policies
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

-- ==============================================
-- 3. FIX CHILDREN TABLE POLICIES
-- ==============================================

-- Drop existing children policies
DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
DROP POLICY IF EXISTS "Teachers and admins can read all children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can insert children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can update children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can delete children" ON public.children;

-- Create comprehensive children policies
CREATE POLICY "Admins can manage all children" ON public.children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

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

-- ==============================================
-- 4. FIX USERS TABLE POLICIES
-- ==============================================

-- Drop existing users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins and user creation" ON public.users;

-- Create comprehensive users policies
CREATE POLICY "Enable all operations for admins" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for admins and user creation" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    ) OR
    -- Allow insert if no user exists yet (during initial setup)
    NOT EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid())
  );

-- ==============================================
-- 5. VERIFY POLICIES
-- ==============================================

-- Show all policies for verification
SELECT 'Menu table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public';

SELECT 'Notes table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notes' AND schemaname = 'public';

SELECT 'Children table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'children' AND schemaname = 'public';

SELECT 'Users table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
