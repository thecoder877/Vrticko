# Push Notifikacije - Setup Instrukcije

## 🚀 Pregled

Push notifikacije omogućavaju korisnicima da primate obaveštenja čak i kada nisu na sajtu. Ova implementacija koristi:

- **Service Worker** za handling push notifikacija
- **Web Push API** za slanje notifikacija
- **Supabase Edge Functions** za server-side logiku
- **VAPID keys** za autentifikaciju

## 📋 Korak 1: Kreiranje VAPID ključeva

```bash
# Instaliraj web-push paket
npm install -g web-push

# Generiši VAPID ključeve
npx web-push generate-vapid-keys
```

Kopiraj generisane ključeve u `.env` fajl:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key
```

## 📋 Korak 2: Kreiranje Supabase tabele

Pokreni SQL skriptu u Supabase SQL Editor:

```sql
-- Pokreni create-push-subscriptions-table.sql
```

## 📋 Korak 3: Deploy Edge Function

```bash
# Instaliraj Supabase CLI
npm install -g supabase

# Login u Supabase
supabase login

# Deploy Edge Function
supabase functions deploy send-push-notification
```

## 📋 Korak 4: Konfiguracija Supabase

1. Idite u Supabase Dashboard → Settings → API
2. Kopiraj `service_role` key u `.env` fajl
3. Idite u Edge Functions → Settings
4. Dodaj environment varijable:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

## 📋 Korak 5: Testiranje

1. Otvorite aplikaciju u browseru
2. Idite na Dashboard
3. Kliknite "Aktiviraj Push Notifikacije"
4. Dozvolite notifikacije kada browser pita
5. Kliknite "Test Notifikacija"

## 🔧 Funkcionalnosti

### Za sve korisnike:
- ✅ Aktivacija/deaktivacija push notifikacija
- ✅ Test notifikacije
- ✅ Automatsko čuvanje subscription-a u bazu

### Za admin/vaspitače:
- ✅ Slanje push notifikacija kroz `SendNotificationsPage`
- ✅ Targetiranje po ulogama (roditelji, vaspitači, admini)
- ✅ Slanje individualnih notifikacija

## 🐛 Troubleshooting

### "Push notifikacije nisu podržane"
- Koristite HTTPS (ne HTTP)
- Koristite moderniji browser (Chrome, Firefox, Safari)
- Proverite da li je Service Worker registriran

### "Dozvola za notifikacije nije data"
- Kliknite na ikonu notifikacija u browser toolbar-u
- Dozvolite notifikacije za ovaj sajt
- Refresh-ujte stranicu

### "Greška pri slanju test notifikacije"
- Proverite da li je Edge Function deploy-ovana
- Proverite VAPID ključeve
- Proverite Supabase service role key

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

## 🔒 Security

- VAPID ključevi se koriste za autentifikaciju
- RLS politike kontrolišu pristup subscription-ima
- Service Worker radi u sandbox-u
- Notifikacije se šalju preko HTTPS

## 📊 Monitoring

- Edge Function logovi u Supabase Dashboard
- Browser Developer Tools → Application → Service Workers
- Console logovi za debugging

## 🚀 Production Deployment

1. Generiši production VAPID ključeve
2. Deploy Edge Function na production
3. Konfiguriši environment varijable
4. Testiraj na različitim browser-ima
5. Monitoriši logove i performanse

## 📚 Dodatni resursi

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
