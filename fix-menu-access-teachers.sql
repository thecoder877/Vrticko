-- Fix menu access for teachers
-- This script specifically fixes menu table policies

-- First, let's see what policies currently exist on menu table
SELECT 'Current menu policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public'
ORDER BY policyname;

-- Drop all existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

-- Create new menu policies that definitely work
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

-- This policy allows both admins and teachers to manage menu
CREATE POLICY "Admins and teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Alternative approach: Create separate policies for admins and teachers
CREATE POLICY "Admins can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Show the new policies
SELECT 'New menu policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public'
ORDER BY policyname;

-- Also check if RLS is enabled on menu table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'menu';

-- If RLS is not enabled, enable it
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
