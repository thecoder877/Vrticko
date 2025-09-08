-- EMERGENCY RESET - Remove all RLS policies and start fresh
-- This will temporarily disable RLS to get the app working

-- Disable RLS on all tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Temporary: All users can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

DROP POLICY IF EXISTS "Everyone can read menu" ON public.menu;
DROP POLICY IF EXISTS "Admins can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Teachers can manage menu" ON public.menu;
DROP POLICY IF EXISTS "Admins and teachers can manage menu" ON public.menu;

DROP POLICY IF EXISTS "Parents can read notes about own children" ON public.notes;
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;
DROP POLICY IF EXISTS "Teachers can read all notes" ON public.notes;

DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
DROP POLICY IF EXISTS "Teachers can read all children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can insert children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can update children" ON public.children;
DROP POLICY IF EXISTS "Admins and teachers can delete children" ON public.children;

-- Show current status
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu')
ORDER BY tablename;

-- Show all users (should work now)
SELECT 'All users:' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
