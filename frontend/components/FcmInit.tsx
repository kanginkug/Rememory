'use client';

import { useEffect } from 'react';
import { getToken, registerFcmToken } from '@/lib/api';
import { getFcmToken, listenForegroundMessages } from '@/lib/firebase';
import { setNotificationBadge } from '@/lib/notificationBadge';
import { addNotification } from '@/lib/notifications';

async function initFcm(onMessage: (title: string, body: string, url?: string) => void) {
  if (!getToken()) return null;

  // 이미 권한이 granted인 경우에만 자동으로 토큰 발급
  // iOS는 사용자 액션 없이 requestPermission() 호출 시 무시되므로
  // permission이 default/denied면 여기서 처리하지 않음
  const fcmToken = await getFcmToken().catch(() => null);
  if (fcmToken) registerFcmToken(fcmToken).catch(() => {});

  return listenForegroundMessages(onMessage).catch(() => null);
}

export default function FcmInit() {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let destroyed = false;
    let generation = 0;

    const onMessage = (title: string, body: string, url?: string) => {
      addNotification({ title, body, url, timestamp: Date.now() });
      setNotificationBadge();
      const message = body ? `${title}\n${body}` : title;
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'notification' } }));
    };

    function startFcm() {
      const gen = ++generation;
      initFcm(onMessage).then(unsub => {
        if (destroyed || gen !== generation) { unsub?.(); return; }
        unsubscribe = unsub;
      });
    }

    startFcm();

    const handleLogin = () => {
      unsubscribe?.();
      unsubscribe = null;
      startFcm();
    };
    window.addEventListener('auth-login', handleLogin);

    return () => {
      destroyed = true;
      unsubscribe?.();
      window.removeEventListener('auth-login', handleLogin);
    };
  }, []);

  return null;
}
