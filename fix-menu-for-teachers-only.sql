-- Fix menu access for teachers only
-- This script enables RLS on menu table with proper policies for teachers

-- First, let's see current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu')
ORDER BY tablename;

-- Enable RLS on menu table only
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;

-- Drop any existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Teachers can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

-- Create simple menu policies
-- 1. Everyone can read menu
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

-- 2. Teachers can manage menu (insert, update, delete)
CREATE POLICY "Teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- 3. Admins can manage menu (insert, update, delete)
CREATE POLICY "Admins can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Show the new menu policies
SELECT 'New menu policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public'
ORDER BY policyname;

-- Show updated RLS status
SELECT 'Updated RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu')
ORDER BY tablename;

-- Test: Show current user info
SELECT 'Current user info:' as info, auth.uid() as user_id, auth.role() as user_role;
