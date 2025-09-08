-- Proverite trenutne RLS politike za notifications tabelu
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Proverite da li je RLS omogućen
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- Uklonite postojeće politike
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON notifications;

-- Kreirajte nove politike
-- 1. Dozvoli insert za sve autentifikovane korisnike
CREATE POLICY "Enable insert for authenticated users" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Dozvoli read za sve autentifikovane korisnike
CREATE POLICY "Enable read access for authenticated users" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Dozvoli update za sve autentifikovane korisnike
CREATE POLICY "Enable update for authenticated users" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Dozvoli delete za sve autentifikovane korisnike
CREATE POLICY "Enable delete for authenticated users" ON notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Proverite da li su politike kreirane
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';
