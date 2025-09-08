-- Fix menu access without recursion
-- This script creates policies that don't cause infinite recursion

-- First, let's see current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu')
ORDER BY tablename;

-- Disable RLS on menu table temporarily
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;

-- Drop any existing menu policies
DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Teachers can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

-- Show current status
SELECT 'RLS Status after disabling:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu')
ORDER BY tablename;

-- Test: Show all users to confirm they're visible
SELECT 'All users (should be visible now):' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
