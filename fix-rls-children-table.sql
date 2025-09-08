-- Fix RLS policies for children table to allow admin operations
-- This script ensures admins can create, read, update, and delete children records

-- Drop existing policies on children table
DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
DROP POLICY IF EXISTS "Teachers and admins can read all children" ON public.children;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.children;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.children;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.children;

-- Create comprehensive policies for children table

-- 1. Allow admins to do everything with children
CREATE POLICY "Admins can manage all children" ON public.children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- 2. Allow parents to read their own children
CREATE POLICY "Parents can read own children" ON public.children
  FOR SELECT USING (
    auth.uid() = parent_id::uuid OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow teachers to read all children
CREATE POLICY "Teachers can read all children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 4. Allow admins and teachers to insert children
CREATE POLICY "Admins and teachers can insert children" ON public.children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 5. Allow admins and teachers to update children
CREATE POLICY "Admins and teachers can update children" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 6. Allow admins and teachers to delete children
CREATE POLICY "Admins and teachers can delete children" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Verify the policies were created
SELECT 'Children table policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'children' AND schemaname = 'public';
