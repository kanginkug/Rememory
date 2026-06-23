'use client';

import { useEffect } from 'react';
import { getToken, registerFcmToken } from '@/lib/api';
import { getFcmToken, listenForegroundMessages } from '@/lib/firebase';
import { setNotificationBadge } from '@/lib/notificationBadge';
import { addNotification } from '@/lib/notifications';

export default function FcmInit() {
  useEffect(() => {
    if (!getToken()) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      const fcmToken = await getFcmToken().catch(() => null);
      if (fcmToken) registerFcmToken(fcmToken).catch(() => {});

      unsubscribe = await listenForegroundMessages((title, body, url) => {
        addNotification({ title, body, url, timestamp: Date.now() });
        setNotificationBadge();
        const message = body ? `${title}\n${body}` : title;
        window.dispatchEvent(
          new CustomEvent('app-toast', { detail: { message, type: 'notification' } }),
        );
      }).catch(() => null);
    })();

    return () => { unsubscribe?.(); };
  }, []);

  return null;
}
