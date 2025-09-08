-- Simple script to add read_status columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS read_status JSONB DEFAULT '{}';
