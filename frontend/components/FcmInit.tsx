'use client';

import { useEffect } from 'react';
import { getToken, registerFcmToken } from '@/lib/api';
import { getFcmToken, listenForegroundMessages } from '@/lib/firebase';
import { setNotificationBadge } from '@/lib/notificationBadge';
import { addNotification } from '@/lib/notifications';

async function initFcm(onMessage: (title: string, body: string, url?: string) => void) {
  if (!getToken()) return null;

  const fcmToken = await getFcmToken().catch(() => null);
  if (fcmToken) registerFcmToken(fcmToken).catch(() => {});

  return listenForegroundMessages(onMessage).catch(() => null);
}

export default function FcmInit() {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const onMessage = (title: string, body: string, url?: string) => {
      addNotification({ title, body, url, timestamp: Date.now() });
      setNotificationBadge();
      const message = body ? `${title}\n${body}` : title;
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'notification' } }));
    };

    initFcm(onMessage).then(unsub => { unsubscribe = unsub; });

    const handleLogin = () => {
      initFcm(onMessage).then(unsub => { unsubscribe = unsub; });
    };
    window.addEventListener('auth-login', handleLogin);

    return () => {
      unsubscribe?.();
      window.removeEventListener('auth-login', handleLogin);
    };
  }, []);

  return null;
}
