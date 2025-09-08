-- Uklonite sve postojeće RLS politike za notifications tabelu
DROP POLICY IF EXISTS "Everyone can read notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers and admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update read_status" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON notifications;

-- Kreirajte jednostavne politike
-- 1. Svi autentifikovani korisnici mogu da čitaju notifikacije
CREATE POLICY "Allow read for authenticated users" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Svi autentifikovani korisnici mogu da kreiraju notifikacije
CREATE POLICY "Allow insert for authenticated users" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Svi autentifikovani korisnici mogu da ažuriraju notifikacije
CREATE POLICY "Allow update for authenticated users" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Svi autentifikovani korisnici mogu da brišu notifikacije
CREATE POLICY "Allow delete for authenticated users" ON notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Proverite da li su politike kreirane
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
