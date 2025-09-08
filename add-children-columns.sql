-- Add missing columns to children table
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Grupa A';

-- Update existing children to have default group if not set
UPDATE public.children 
SET group_name = 'Grupa A' 
WHERE group_name IS NULL;

-- Create index for better performance on group_name
CREATE INDEX IF NOT EXISTS idx_children_group_name ON public.children(group_name);
CREATE INDEX IF NOT EXISTS idx_children_birth_date ON public.children(birth_date);
