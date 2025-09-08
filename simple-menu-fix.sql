-- Simple fix for menu access
-- This script creates the most basic policies that should work

-- Drop all existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Teachers can manage menu" ON public.menu;

-- Create simple policies
-- 1. Everyone can read menu
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

-- 2. Teachers can manage menu (simple approach)
CREATE POLICY "Teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- 3. Admins can manage menu (simple approach)
CREATE POLICY "Admins can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Show current policies
SELECT 'Menu policies after fix:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'menu';
