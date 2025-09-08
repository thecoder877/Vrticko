-- Test direct read of read_status column
-- This script tests if we can read the read_status column directly

-- 1. Test basic read of notifications with read_status
SELECT id, title, target, read_status, created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 5;

-- 2. Test if read_status column exists and has data
SELECT 
  id,
  title,
  read_status,
  CASE 
    WHEN read_status IS NULL THEN 'NULL'
    WHEN read_status = '{}' THEN 'EMPTY_OBJECT'
    WHEN jsonb_typeof(read_status) = 'object' THEN 'OBJECT_WITH_DATA'
    ELSE 'OTHER'
  END as read_status_type,
  jsonb_object_keys(read_status) as read_status_keys
FROM public.notifications
WHERE read_status IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Test update of read_status (replace with actual user ID from console logs)
-- First, let's see what we're working with
SELECT id, title, read_status
FROM public.notifications
WHERE target = 'all'
LIMIT 1;

-- 4. Manual update test (uncomment and replace with actual values)
-- UPDATE public.notifications 
-- SET read_status = '{"2f7ca05c-6641-4028-a8b1-b9a5f0437ffd": "2025-01-01T00:00:00.000Z"}'
-- WHERE id = '13913536-7e3c-4598-8b7f-1fb0c54c9f4a';

-- 5. Verify the update
-- SELECT id, title, read_status
-- FROM public.notifications
-- WHERE id = '13913536-7e3c-4598-8b7f-1fb0c54c9f4a';
