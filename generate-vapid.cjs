const webpush = require('web-push');

console.log('Generating VAPID keys...');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID KEYS ===');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);

console.log('\n=== .env FILE CONTENT ===');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VITE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

console.log('\n=== SUPABASE ENVIRONMENT VARIABLES ===');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);