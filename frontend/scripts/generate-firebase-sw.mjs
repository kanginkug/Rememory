import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// .env.local 파싱 (CI 환경에서는 process.env 우선)
const envLocal = {};
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    envLocal[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const get = (key) => process.env[key] ?? envLocal[key] ?? '';

const config = {
  apiKey: get('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: get('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: get('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: get('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: get('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

const content = `importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var title = (payload.data && payload.data.title) || 'Rememory';
  var options = {
    body: payload.data && payload.data.body,
    icon: '/icons/icon-192.png',
    data: { url: (payload.data && payload.data.url) || '/' },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('navigate' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
`;

writeFileSync(join(root, 'public', 'firebase-messaging-sw.js'), content, 'utf-8');
console.log('✓ generated public/firebase-messaging-sw.js');
