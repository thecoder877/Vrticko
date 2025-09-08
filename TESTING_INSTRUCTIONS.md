# Instrukcije za testiranje Push Notifikacija

## Problem koji rešavamo
Push notifikacije ne rade - u Supabase log-u se vidi samo OPTIONS request (CORS preflight), što znači da se glavni POST request ne šalje.

## Kako testirati

### Korak 1: Pokrenite aplikaciju
```bash
cd vrticko-app
npm run dev
```

### Korak 2: Otvorite test stranicu
Idite na: `http://localhost:5173/test-push-notifications.html`

### Korak 3: Testirajte korak po korak

#### 1. Check Browser Support
- Kliknite "Check Support"
- Trebalo bi da vidite ✅ za sve provere
- Ako vidite ❌, koristite drugi browser

#### 2. Request Permission
- Kliknite "Request Permission"
- Browser će zatražiti dozvolu za notifikacije
- Kliknite "Allow" ili "Dozvoli"

#### 3. Register Service Worker
- Kliknite "Register Service Worker"
- Trebalo bi da vidite ✅ uspeh

#### 4. Create Push Subscription
- Kliknite "Create Push Subscription"
- Trebalo bi da vidite ✅ uspeh sa endpoint-om

#### 5. Login to Test
- **VAŽNO**: Unesite email i password za test korisnika
- **Test korisnici:**
  - Email: `test@example.com`, Password: `password123`
  - Email: `admin@example.com`, Password: `admin123`
  - Email: `teacher@example.com`, Password: `teacher123`
- Kliknite "Login"
- Trebalo bi da vidite ✅ uspeh sa user informacijama

#### 6. Test Direct API Call
- Kliknite "Test Direct API Call"
- **Ovo je ključni test!**
- Trebalo bi da vidite POST request u Network tab-u
- Status treba da bude 200, ne 401

#### 7. Test Supabase Function
- Kliknite "Test Supabase Function"
- Trebalo bi da vidite ✅ uspeh

#### 8. Test from Main App
- Kliknite "Test from Main App"
- Trebalo bi da vidite ✅ uspeh

#### 9. Check Authentication Status
- Kliknite "Check Auth Status"
- Trebalo bi da vidite auth context i token-e

### Korak 4: Testirajte u glavnoj aplikaciji

1. Idite na `http://localhost:5173`
2. Ulogujte se
3. Idite na Dashboard
4. Kliknite "Test Notifikacija" dugme
5. Proverite browser console za logove

## Očekivani rezultati

### Uspesan test:
```
[1:13:54 AM] Testing direct API call...
[1:13:54 AM] Response status: 200
[1:13:54 AM] Response data: {
  "message": "Notification created and sent via real-time",
  "notification": {...},
  "total": 0,
  "successful": 0,
  "failed": 0,
  "pushEnabled": false,
  "results": []
}
[1:13:54 AM] ✅ Direct API call successful
```

### Neuspešan test (401 greška):
```
[1:13:54 AM] Testing direct API call...
[1:13:54 AM] Response status: 401
[1:13:54 AM] Response data: {
  "code": 401,
  "message": "Missing authorization header"
}
[1:13:54 AM] ❌ Direct API call failed
```

## Debugging

### Ako vidite 401 grešku:
1. Proverite da li ste ulogovani u glavnoj aplikaciji
2. Proverite "Check Auth Status" da vidite da li su token-i dostupni
3. Proverite da li je `window.supabase` dostupan

### Ako vidite CORS grešku:
1. Proverite da li se šalje OPTIONS request
2. Proverite da li se šalje POST request nakon OPTIONS
3. Proverite Network tab u Developer Tools

### Ako ne vidite notifikaciju:
1. Proverite da li je dozvola za notifikacije data
2. Proverite da li je service worker registrovan
3. Proverite da li je push subscription kreiran

## Real-time notifikacije

Aplikacija koristi real-time notifikacije kao fallback:
- Kada se kreira nova notifikacija u bazi, automatski se prikazuje
- Ne zahteva push subscription
- Radi dok je korisnik na sajtu

## Kontakt

Ako i dalje imate probleme:
1. Proverite browser console za greške
2. Proverite Network tab za failed requests
3. Proverite Supabase function logs
4. Proverite Service Worker status u Application tab
