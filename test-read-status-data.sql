-- Test by updating some notifications with read_status data
UPDATE public.notifications 
SET read_status = '{"test-user-id": "2024-01-01T00:00:00.000Z"}' 
WHERE id IN (
  SELECT id FROM public.notifications LIMIT 1
);

-- Check the result
SELECT id, title, read_status FROM public.notifications LIMIT 3;
