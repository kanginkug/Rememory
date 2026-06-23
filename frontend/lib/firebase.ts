import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export async function getFcmToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) return null;

    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(getFirebaseApp());

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
  } catch {
    return null;
  }
}

export async function listenForegroundMessages(
  callback: (title: string, body: string, url?: string) => void,
): Promise<(() => void) | null> {
  try {
    if (typeof window === 'undefined') return null;

    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(getFirebaseApp());
    return onMessage(messaging, (payload) => {
      callback(
        payload.notification?.title ?? 'Rememory',
        payload.notification?.body ?? '',
        payload.data?.url,
      );
    });
  } catch {
    return null;
  }
}
