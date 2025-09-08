# Push Notifications Debug Guide

Ovaj vodič objašnjava kako da testirate i debug-ujete push notifikacije u Vrtićko aplikaciji.

## Problem

Push notifikacije ne rade - u Supabase invocations log-u se vidi samo OPTIONS request (CORS preflight), što znači da se glavni POST request ne šalje.

## Rešenje

Implementirane su sledeće izmene:

### 1. Poboljšano CORS handling
- Dodati dodatni CORS headers u Supabase edge function
- Dodana podrška za OPTIONS request

### 2. Dodato debugging
- Detaljno logovanje u `usePushNotifications.ts`
- Detaljno logovanje u Supabase edge function
- Fallback na direktno pozivanje fetch API-ja

### 3. Kreiran test page
- `test-push-notifications.html` - kompletna test stranica
- Testira sve korake push notification procesa

## Kako testirati

### Korak 1: Otvorite test stranicu
```
http://localhost:5173/test-push-notifications.html
```

### Korak 2: Testirajte korak po korak
1. **Check Browser Support** - proverite da li browser podržava push notifikacije
2. **Request Permission** - zatražite dozvolu za notifikacije
3. **Register Service Worker** - registrujte service worker
4. **Create Push Subscription** - kreirajte push subscription
5. **Test Direct API Call** - testirajte direktno pozivanje API-ja
6. **Test Supabase Function** - testirajte Supabase funkciju

### Korak 3: Testirajte u aplikaciji
1. Idite na `/dashboard` stranicu
2. Kliknite na "Test Notifikacija" dugme
3. Proverite browser console za detaljne logove

## Debugging

### Console Logs
Svi koraci su detaljno logovani u browser console:
- `=== testNotification pozvan ===`
- `Pozivam Supabase function...`
- `Supabase function response:`
- `Fetch response status:`

### Supabase Logs
Supabase edge function loguje:
- `=== Supabase Function Called ===`
- `Method: POST`
- `Request body:`
- `Parsed data:`

### Network Tab
Proverite Network tab u Developer Tools:
- Trebalo bi da vidite POST request na `/functions/v1/send-push-notification`
- Status kod treba da bude 200
- Response treba da sadrži JSON sa podacima o notifikaciji

## Mogući problemi

### 1. CORS Error
- **Simptom**: OPTIONS request se šalje, ali POST ne
- **Rešenje**: Proverite CORS headers u Supabase function

### 2. Authentication Error
- **Simptom**: 401 Unauthorized
- **Rešenje**: Proverite da li je korisnik ulogovan

### 3. Service Worker Error
- **Simptom**: Service Worker se ne registruje
- **Rešenje**: Proverite da li je `/sw.js` dostupan

### 4. Push Subscription Error
- **Simptom**: Push subscription se ne kreira
- **Rešenje**: Proverite VAPID keys

## Real-time Notifications

Aplikacija koristi real-time notifikacije kao fallback:
- Kada se kreira nova notifikacija u bazi, automatski se prikazuje
- Ne zahteva push subscription
- Radi dok je korisnik na sajtu

## Testiranje Real-time Notifikacija

1. Otvorite aplikaciju u dva browser tab-a
2. U jednom tab-u kliknite "Test Notifikacija"
3. U drugom tab-u trebalo bi da vidite notifikaciju

## Logovi za analizu

### Browser Console
```javascript
// Proverite da li su dostupni debugging objekti
console.log('React context:', window.React);
console.log('Supabase import:', window.supabase);
console.log('Auth context:', window.authContext);
```

### Supabase Function Logs
- Idite na Supabase Dashboard > Functions > send-push-notification
- Proverite Logs sekciju za detaljne logove

## Kontakt

Ako i dalje imate probleme, proverite:
1. Browser console za greške
2. Network tab za failed requests
3. Supabase function logs
4. Service Worker status u Application tab
