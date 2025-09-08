-- Complete fix for mark as read functionality
-- This script adds read_status columns and fixes the database schema

-- 1. Add read_status column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';

-- 2. Add read_status column to chat_messages table if it doesn't exist
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON public.notifications USING GIN (read_status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_status ON public.chat_messages USING GIN (read_status);

-- 4. Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO anon;

-- 5. Add RLS policies for chat_messages if they don't exist
-- Users can read their own messages (sent or received)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can read own messages'
    ) THEN
        CREATE POLICY "Users can read own messages" ON public.chat_messages
        FOR SELECT USING (
            sender_id = auth.uid() OR receiver_id = auth.uid()
        );
    END IF;
END $$;

-- Users can create messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can create messages'
    ) THEN
        CREATE POLICY "Users can create messages" ON public.chat_messages
        FOR INSERT WITH CHECK (
            sender_id = auth.uid()
        );
    END IF;
END $$;

-- Users can update read status of messages they received
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can update read status'
    ) THEN
        CREATE POLICY "Users can update read status" ON public.chat_messages
        FOR UPDATE USING (
            receiver_id = auth.uid()
        );
    END IF;
END $$;

-- 6. Enable RLS on chat_messages if not already enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 7. Test the setup
SELECT 'Setup completed successfully!' as status;

-- Show table structures
SELECT 'Notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

SELECT 'Chat_messages table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;
