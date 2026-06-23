/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', event => {
  if (!event.data) return;

  let title = 'Rememory';
  let body = '';
  let url = '/';

  try {
    const data = event.data.json();
    title = data.notification?.title ?? data.title ?? 'Rememory';
    body  = data.notification?.body  ?? data.body  ?? '';
    url   = data.data?.url ?? '/';
  } catch {
    title = event.data.text() || 'Rememory';
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? '/';
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
