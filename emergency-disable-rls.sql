-- EMERGENCY: Privremeno isključite RLS za notifications tabelu
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Proverite da li je RLS isključen
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- Test insert
INSERT INTO notifications (title, message, target, created_by, created_at)
VALUES ('Test RLS Disabled', 'Test bez RLS', 'all', '79b8135e-26b1-4496-9931-4a885b17525c', NOW())
RETURNING *;
