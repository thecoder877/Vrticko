-- Create test users with proper auth accounts
-- This script creates users that can actually log in

-- First, let's check what users exist
SELECT 'Existing users:' as info, id::text, username, email, role, auth_user_id::text 
FROM public.users 
ORDER BY created_at DESC;

-- Note: You cannot create auth users directly via SQL
-- Auth users must be created through the Supabase Auth API
-- This script only shows the user profiles that should exist

-- If you need to create auth users, use the UserManagementPage in your app
-- or the Supabase dashboard Auth section

-- For testing purposes, here are some sample user profiles that should have corresponding auth accounts:

-- Sample admin user (should have auth account with email: admin@vrticko.com)
-- Sample parent user (should have auth account with email: parent@vrticko.com)  
-- Sample teacher user (should have auth account with email: teacher@vrticko.com)

-- To create these users properly:
-- 1. Use the UserManagementPage in your app (recommended)
-- 2. Or use Supabase dashboard Auth section
-- 3. Or use the Supabase Admin API

-- Check if there are any users without auth_user_id
SELECT 'Users without auth accounts:' as info, COUNT(*) as count
FROM public.users 
WHERE auth_user_id IS NULL;

-- Show users without auth accounts
SELECT 'Users without auth accounts details:' as info, 
       id::text, username, email, role, created_at
FROM public.users 
WHERE auth_user_id IS NULL
ORDER BY created_at DESC;
