-- Kreiranje test korisnika za push notification testing
-- Ovi korisnici će biti korišćeni za testiranje push notifikacija

-- Kreiranje test korisnika u auth.users tabeli
INSERT INTO auth.users (
    id,
    instance_id,
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
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
), (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
), (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teacher@example.com',
    crypt('teacher123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Kreiranje test korisnika u users tabeli
INSERT INTO users (
    id,
    username,
    role,
    email,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test User',
    'parent',
    'test@example.com',
    NOW()
), (
    '22222222-2222-2222-2222-222222222222',
    'Admin User',
    'admin',
    'admin@example.com',
    NOW()
), (
    '33333333-3333-3333-3333-333333333333',
    'Teacher User',
    'teacher',
    'teacher@example.com',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    email = EXCLUDED.email;

-- Kreiranje test notifikacije
INSERT INTO notifications (
    title,
    message,
    target,
    created_by,
    created_at
) VALUES (
    'Test notifikacija',
    'Ovo je test notifikacija za push testing',
    'all',
    '22222222-2222-2222-2222-222222222222',
    NOW()
) ON CONFLICT DO NOTHING;

-- Komentari
COMMENT ON TABLE users IS 'Test korisnici za push notification testing';
COMMENT ON COLUMN users.id IS 'ID korisnika koji odgovara auth.users.id';
COMMENT ON COLUMN users.username IS 'Korisničko ime za testiranje';
COMMENT ON COLUMN users.role IS 'Uloga korisnika (parent, teacher, admin)';
COMMENT ON COLUMN users.email IS 'Email adresa za testiranje';

-- Test podaci
SELECT 'Test korisnici kreirani:' as status;
SELECT id, username, role, email FROM users WHERE email IN ('test@example.com', 'admin@example.com', 'teacher@example.com');
