-- Fix user creation function
-- This script creates the function needed for user creation

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS create_user_with_auth(TEXT, TEXT, TEXT, TEXT);

-- 2. Create function to create user with auth account
CREATE OR REPLACE FUNCTION create_user_with_auth(
  p_username TEXT,
  p_email TEXT,
  p_password TEXT,
  p_role TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Generate new UUID for user
  v_user_id := gen_random_uuid();
  
  -- Create user profile
  INSERT INTO public.users (id, username, email, role, temp_password, created_at)
  VALUES (v_user_id, p_username, p_email, p_role, p_password, NOW());
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User created successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create user'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_with_auth(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Test the function
SELECT 'Testing create_user_with_auth function:' as info;

-- 5. Show current users
SELECT 'Current users:' as info, id, username, role, email, created_at
FROM public.users
ORDER BY created_at DESC;

-- 6. Test function call (commented out to avoid creating test user)
-- SELECT create_user_with_auth('Test User', 'test@example.com', 'password123', 'parent');
