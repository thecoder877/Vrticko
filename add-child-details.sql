-- Add additional fields to children table
-- This script adds gender, allergies, notes, photo, and personal ID fields

-- 1. Add new columns to children table
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('muški', 'ženski')),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS personal_id TEXT;

-- 2. Create index for better performance on personal_id
CREATE INDEX IF NOT EXISTS idx_children_personal_id ON public.children(personal_id);

-- 3. Create index for gender
CREATE INDEX IF NOT EXISTS idx_children_gender ON public.children(gender);

-- 4. Show updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'children' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
