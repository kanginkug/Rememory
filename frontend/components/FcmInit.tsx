'use client';

import { useEffect } from 'react';
import { getToken, registerFcmToken } from '@/lib/api';
import { listenForegroundMessages } from '@/lib/firebase';
import { setNotificationBadge } from '@/lib/notificationBadge';
import { addNotification } from '@/lib/notifications';

// ===== DEBUG (iOS FCM 디버깅용 임시 코드) =====
const dbg = (msg: string) => alert(msg);
const err = (e: unknown) => e instanceof Error ? e.message : String(e);

async function initFcm(onMessage: (title: string, body: string, url?: string) => void) {
  const jwt = getToken();
  dbg(`[FCM 0] initFcm 실행 / JWT: ${jwt ? '있음' : '없음'}`);
  if (!jwt) return null;

  // 1. isSupported
  let supported = false;
  try {
    const { isSupported } = await import('firebase/messaging');
    supported = await isSupported();
    dbg(`[FCM 1] isSupported: ${supported}`);
  } catch (e) { dbg(`[FCM 1] isSupported 에러: ${err(e)}`); }
  if (!supported) return null;

  // 2. 알림 권한
  let perm: string = 'Notification' in window ? Notification.permission : 'unsupported';
  dbg(`[FCM 2] 권한 현재: ${perm}`);
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission();
      dbg(`[FCM 2] 권한 요청 결과: ${perm}`);
    } catch (e) { dbg(`[FCM 2] 권한 요청 에러: ${err(e)}`); }
  }
  if (perm !== 'granted') return null;

  // 3. 서비스워커 등록
  let swReg: ServiceWorkerRegistration | null = null;
  try {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    dbg(`[FCM 3] SW 등록 성공: ${swReg.scope}`);
  } catch (e) { dbg(`[FCM 3] SW 등록 실패: ${err(e)}`); return null; }

  // 4. FCM 토큰
  let fcmToken: string | null = null;
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');
    const app = getApps().length === 0 ? initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }) : getApps()[0];
    const messaging = getMessaging(app);
    fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    dbg(`[FCM 4] 토큰: ${fcmToken ? fcmToken.slice(0, 20) + '...' : 'null (getToken이 null 반환)'}`);
  } catch (e) { dbg(`[FCM 4] 토큰 에러: ${err(e)}`); }

  // 5. 백엔드 등록
  if (fcmToken) {
    try {
      await registerFcmToken(fcmToken);
      dbg('[FCM 5] 서버 등록 성공 (200 OK)');
    } catch (e) { dbg(`[FCM 5] 서버 등록 실패: ${err(e)}`); }
  } else {
    dbg('[FCM 5] 토큰 없어서 서버 등록 건너뜀');
  }
  // ===== DEBUG END =====

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
