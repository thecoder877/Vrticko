-- Diagnose duplicate key constraint violation in users table
-- This script helps identify the root cause of the duplicate key error

-- 1. Check the table structure
SELECT 'Table structure:' as info, 
       column_name, 
       data_type, 
       is_nullable, 
       column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check for duplicate IDs
SELECT 'Duplicate IDs found:' as info, COUNT(*) as duplicate_count
FROM (
  SELECT id, COUNT(*) as count
  FROM public.users 
  GROUP BY id 
  HAVING COUNT(*) > 1
) duplicates;

-- 3. If duplicates exist, show them
SELECT 'Duplicate ID details:' as info, id::text, COUNT(*) as count
FROM public.users 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 4. Check for the specific ID that's causing the error
-- Replace '3447ec49-7340-4716-86b7-41dcda38f887' with the actual ID from your error
SELECT 'Specific ID check:' as info, 
       id::text, 
       username, 
       email, 
       role, 
       created_at
FROM public.users 
WHERE id = '3447ec49-7340-4716-86b7-41dcda38f887';

-- 5. Check if there are any constraints or triggers that might be causing issues
SELECT 'Constraints on users table:' as info,
       constraint_name,
       constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'users' AND table_schema = 'public';

-- 6. Check for any triggers on the users table
SELECT 'Triggers on users table:' as info,
       trigger_name,
       event_manipulation,
       action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'public';
