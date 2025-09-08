-- Test if read_status columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'read_status';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND column_name = 'read_status';

-- Check current notifications data
SELECT id, title, target, read_status 
FROM public.notifications 
LIMIT 5;

-- Check current chat_messages data  
SELECT id, sender_id, receiver_id, read_status 
FROM public.chat_messages 
LIMIT 5;
