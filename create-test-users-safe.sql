-- Safe script to create test users (checks if they exist first)
-- Run this in Supabase SQL Editor

-- Create admin user (only if doesn't exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@vrticko.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vrticko.com');

-- Create teacher user (only if doesn't exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teacher@vrticko.com',
  crypt('teacher123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@vrticko.com');

-- Create parent user (only if doesn't exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'parent@vrticko.com',
  crypt('parent123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'parent@vrticko.com');

-- Add user profiles (only if they don't exist)
INSERT INTO public.users (id, username, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@vrticko.com' THEN 'Administrator'
    WHEN u.email = 'teacher@vrticko.com' THEN 'Vaspitač Marko'
    WHEN u.email = 'parent@vrticko.com' THEN 'Roditelj Ana'
  END,
  CASE 
    WHEN u.email = 'admin@vrticko.com' THEN 'admin'
    WHEN u.email = 'teacher@vrticko.com' THEN 'teacher'
    WHEN u.email = 'parent@vrticko.com' THEN 'parent'
  END
FROM auth.users u
WHERE u.email IN ('admin@vrticko.com', 'teacher@vrticko.com', 'parent@vrticko.com')
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = u.id);
