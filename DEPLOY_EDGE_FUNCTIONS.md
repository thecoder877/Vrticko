# Deploy Edge Functions

Ovaj fajl sadrži instrukcije za deploy Edge funkcija za user management.

## Edge Funkcije

Kreirane su sledeće Edge funkcije:

1. **create-user** - Kreiranje novih korisnika sa auth nalozima
2. **delete-user** - Brisanje korisnika i njihovih auth naloga
3. **send-push-notification** - Slanje push notifikacija (već postoji)

## Deploy Instrukcije

### 1. Deploy create-user funkcije

```bash
cd "c:\Users\admin\Desktop\MASTER RAD\Vrticko\vrticko-app"
supabase functions deploy create-user
```

### 2. Deploy delete-user funkcije

```bash
supabase functions deploy delete-user
```

### 3. Deploy send-push-notification funkcije (ako nije već deploy-ovana)

```bash
supabase functions deploy send-push-notification
```

## Environment Variables

Uverite se da su sledeće environment varijable postavljene u Supabase:

- `SUPABASE_URL` - URL vašeg Supabase projekta
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key za admin operacije
- `VAPID_PUBLIC_KEY` - VAPID public key za push notifikacije
- `VAPID_PRIVATE_KEY` - VAPID private key za push notifikacije

## Testiranje

Nakon deploy-a, možete testirati funkcije:

### Test create-user

```bash
curl -X POST https://bylgwspkjtgcasuldgeq.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "Test User",
    "role": "parent"
  }'
```

### Test delete-user

```bash
curl -X POST https://bylgwspkjtgcasuldgeq.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_TO_DELETE"
  }'
```

## Napomene

- Edge funkcije koriste service role key za admin operacije
- Sve funkcije imaju CORS headers konfigurisane
- Funkcije vraćaju JSON response sa success/error statusom
- create-user funkcija automatski kreira i auth nalog i user profil
- delete-user funkcija briše i auth nalog i user profil, plus sve povezane children

## Troubleshooting

Ako imate probleme:

1. Proverite da li su environment varijable postavljene
2. Proverite da li su funkcije uspešno deploy-ovane
3. Proverite Supabase logs za greške
4. Uverite se da imate service role key sa dovoljnim permisijama
