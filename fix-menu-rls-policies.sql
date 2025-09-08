-- Fix RLS policies for menu table to allow teachers access
-- This script updates menu policies to allow teachers to read menu

-- Drop existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;

-- Create new policies for menu table

-- 1. Allow everyone to read menu (parents, teachers, admins)
CREATE POLICY "Everyone can read menu" ON public.menu
  FOR SELECT USING (true);

-- 2. Allow admins and teachers to manage menu
CREATE POLICY "Admins and teachers can manage menu" ON public.menu
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Also fix notes policies to ensure teachers can create notes
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;

-- Allow teachers to create notes
CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Allow teachers to read all notes
CREATE POLICY "Teachers can read all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Verify the policies were created
SELECT 'Menu table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'menu' AND schemaname = 'public';

SELECT 'Notes table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notes' AND schemaname = 'public';
