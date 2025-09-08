-- Add read_status columns to both tables if they don't exist
-- This script ensures the read_status columns exist for mark as read functionality

-- Add read_status column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';

-- Add read_status column to chat_messages table  
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON public.notifications USING GIN (read_status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_status ON public.chat_messages USING GIN (read_status);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO anon;

-- Test the columns exist
SELECT 'Notifications table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY column_name;

SELECT 'Chat_messages table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY column_name;
