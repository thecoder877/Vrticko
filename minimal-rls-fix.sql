-- Minimal RLS fix - just the essential policies
-- This script fixes the most critical RLS policies

-- 1. Fix menu table - allow teachers to manage menu
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
CREATE POLICY "Admins and teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 2. Fix notes table - allow teachers to create and read notes
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;
DROP POLICY IF EXISTS "Teachers can read all notes" ON public.notes;

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

-- 3. Fix children table - allow teachers to read all children
DROP POLICY IF EXISTS "Teachers can read all children" ON public.children;
CREATE POLICY "Teachers can read all children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 4. Fix users table - allow teachers to read user profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Show current policies
SELECT 'Current policies:' as info, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('menu', 'notes', 'children', 'users')
ORDER BY tablename, policyname;
