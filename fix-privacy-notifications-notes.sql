-- Fix privacy for notifications and notes
-- This script enables RLS with proper policies for privacy

-- 1. First, let's see current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 2. Enable RLS on notifications and notes tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Teachers can create notifications" ON public.notifications;

DROP POLICY IF EXISTS "Parents can read notes about own children" ON public.notes;
DROP POLICY IF EXISTS "Teachers can create notes" ON public.notes;
DROP POLICY IF EXISTS "Teachers can read all notes" ON public.notes;

-- 4. Create notification policies for privacy
-- Users can only see notifications sent to them specifically
CREATE POLICY "Users can read their notifications" ON public.notifications
  FOR SELECT USING (
    -- Show notifications sent to 'all', 'parents', 'teachers', or to this specific user
    target IN ('all', 'parents', 'teachers') OR 
    target = auth.uid()::text
  );

-- Admins can create and manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Teachers can create notifications
CREATE POLICY "Teachers can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- 5. Create notes policies for privacy
-- Parents can only read notes about their own children
CREATE POLICY "Parents can read notes about own children" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children 
      WHERE id = child_id AND parent_id = auth.uid()
    )
  );

-- Teachers can create notes
CREATE POLICY "Teachers can create notes" ON public.notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can read all notes (for their work)
CREATE POLICY "Teachers can read all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'teacher'
    )
  );

-- Admins can manage all notes
CREATE POLICY "Admins can manage all notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- 6. Show updated RLS status
SELECT 'Updated RLS Status:' as info, schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'children', 'notes', 'menu', 'notifications')
ORDER BY tablename;

-- 7. Show notification policies
SELECT 'Notification policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public'
ORDER BY policyname;

-- 8. Show notes policies
SELECT 'Notes policies:' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notes' AND schemaname = 'public'
ORDER BY policyname;

-- 9. Test: Show all users to confirm they're visible
SELECT 'All users (should be visible now):' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;
