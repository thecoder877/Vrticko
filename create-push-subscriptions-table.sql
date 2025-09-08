-- Kreiranje tabele za push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Kreiranje indeksa za brže pretraživanje
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS politike za push_subscriptions tabelu
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Korisnici mogu da vide samo svoje subscriptions
CREATE POLICY "Users can view their own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Korisnici mogu da kreiraju svoje subscriptions
CREATE POLICY "Users can create their own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Korisnici mogu da ažuriraju svoje subscriptions
CREATE POLICY "Users can update their own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Korisnici mogu da brišu svoje subscriptions
CREATE POLICY "Users can delete their own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Admini mogu da vide sve subscriptions
CREATE POLICY "Admins can view all subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Funkcija za ažuriranje updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger za automatsko ažuriranje updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Funkcija za slanje push notifikacija
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_icon TEXT DEFAULT NULL,
  p_badge TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
  result BOOLEAN := FALSE;
BEGIN
  -- Pronađi sve subscriptions za korisnika
  FOR subscription_record IN 
    SELECT endpoint, p256dh_key, auth_key 
    FROM push_subscriptions 
    WHERE user_id = p_user_id
  LOOP
    -- Ovde bi se pozvala Edge Function za slanje push notifikacije
    -- Za sada samo logujemo
    RAISE NOTICE 'Sending push notification to user %: % - %', 
      p_user_id, p_title, p_body;
    
    result := TRUE;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcija za slanje push notifikacija svim korisnicima
CREATE OR REPLACE FUNCTION send_push_notification_to_all(
  p_title TEXT,
  p_body TEXT,
  p_icon TEXT DEFAULT NULL,
  p_badge TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  subscription_record RECORD;
  count_sent INTEGER := 0;
BEGIN
  -- Pronađi sve subscriptions
  FOR subscription_record IN 
    SELECT user_id, endpoint, p256dh_key, auth_key 
    FROM push_subscriptions
  LOOP
    -- Ovde bi se pozvala Edge Function za slanje push notifikacije
    -- Za sada samo logujemo
    RAISE NOTICE 'Sending push notification to user %: % - %', 
      subscription_record.user_id, p_title, p_body;
    
    count_sent := count_sent + 1;
  END LOOP;
  
  RETURN count_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Komentari
COMMENT ON TABLE push_subscriptions IS 'Tabela za čuvanje push notification subscriptions';
COMMENT ON COLUMN push_subscriptions.user_id IS 'ID korisnika koji je pretplaćen';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'P256DH public key za enkripciju';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Auth secret key za enkripciju';
