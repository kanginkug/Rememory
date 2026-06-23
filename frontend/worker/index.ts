/// <reference lib="webworker" />

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

const app = getApps().length === 0
  ? initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  : getApps()[0];

const messaging = getMessaging(app);

onBackgroundMessage(messaging, payload => {
  const { title = 'Rememory', body } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    data: { url: payload.data?.url ?? '/' },
  });
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string | undefined) ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('navigate' in client) {
          (client as WindowClient).navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
