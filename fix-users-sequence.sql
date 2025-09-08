-- Check users table structure and identify duplicate key issues
-- Note: This table uses UUID primary keys, not serial integers

-- Check if users table has a sequence (it shouldn't for UUID primary keys)
SELECT 'Checking for sequence:' as info, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') 
         THEN 'Sequence exists (unexpected for UUID primary key)'
         ELSE 'No sequence found (correct for UUID primary key)'
       END as sequence_status;

-- Check for duplicate IDs in users table
SELECT 'Duplicate IDs check:' as info, COUNT(*) as duplicate_count 
FROM (
  SELECT id, COUNT(*) 
  FROM public.users 
  GROUP BY id 
  HAVING COUNT(*) > 1
) duplicates;

-- Check total number of users
SELECT 'Total users count:' as info, COUNT(*) as user_count FROM public.users;

-- Check for any users with NULL IDs (shouldn't happen with UUID primary key)
SELECT 'Users with NULL IDs:' as info, COUNT(*) as null_id_count 
FROM public.users WHERE id IS NULL;

-- List all user IDs to help identify any issues
SELECT 'All user IDs:' as info, id::text as user_id, username, email 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;
