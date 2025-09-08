-- Test notification update
-- This script tests updating a notification's read_status

-- 1. First, let's see the current state
SELECT id, title, target, read_status
FROM public.notifications
WHERE target = 'all'
ORDER BY created_at DESC
LIMIT 2;

-- 2. Update a specific notification with read_status
-- Replace 'YOUR_USER_ID' with the actual user ID from the console logs
UPDATE public.notifications 
SET read_status = '{"32c09354-6962-47cb-9032-4e00eb928a10": "2025-09-04T16:30:00.000Z"}'
WHERE target = 'all'
LIMIT 1;

-- 3. Check the result
SELECT id, title, target, read_status
FROM public.notifications
WHERE target = 'all'
ORDER BY created_at DESC
LIMIT 2;
