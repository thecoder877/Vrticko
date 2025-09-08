-- Update users table to add new columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS temp_password TEXT,
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update the primary key constraint to allow custom UUIDs
-- First, drop all dependent foreign key constraints
ALTER TABLE public.children DROP CONSTRAINT IF EXISTS children_parent_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_created_by_fkey;
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_teacher_id_fkey;

-- Drop the existing primary key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;

-- Add new primary key constraint
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Recreate foreign key constraints
ALTER TABLE public.children ADD CONSTRAINT children_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.notes ADD CONSTRAINT notes_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update RLS policies for the new structure
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create new RLS policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id::uuid OR 
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::uuid = auth.uid() AND role = 'admin'
    )
  );

-- Update existing users to have auth_user_id if they exist in auth.users
UPDATE public.users 
SET auth_user_id = id::uuid 
WHERE id::uuid IN (SELECT id FROM auth.users);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
