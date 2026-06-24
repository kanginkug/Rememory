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

async function getTokenFromFirebase(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const supported = await isSupported();
  if (!supported) return null;

  if (Notification.permission !== 'granted') return null;

  const messaging = getMessaging(getFirebaseApp());

  // 이미 등록된 SW(next-pwa의 sw.js)가 있으면 재사용, 없으면 개발용 SW 등록
  let swReg = await navigator.serviceWorker.getRegistration('/');
  if (!swReg) {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  }

  // SW가 activated 상태가 될 때까지 대기 (iOS 타이밍 문제 대응)
  const activating = swReg.installing ?? swReg.waiting;
  if (activating) {
    await new Promise<void>(resolve => {
      activating.addEventListener('statechange', function handler() {
        if (activating.state === 'activated') {
          activating.removeEventListener('statechange', handler);
          resolve();
        }
      });
    });
  }

  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
}

// 이미 권한이 granted인 경우에만 토큰 발급 (자동 실행용)
export async function getFcmToken(): Promise<string | null> {
  try {
    return await getTokenFromFirebase();
  } catch {
    return null;
  }
}

// 사용자 액션(버튼 클릭)에서 호출 — requestPermission 포함 (iOS 대응)
export async function requestAndGetFcmToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    if (!('Notification' in window)) return null;

    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    return await getTokenFromFirebase();
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
        payload.data?.title ?? 'Rememory',
        payload.data?.body ?? '',
        payload.data?.url,
      );
    });
  } catch {
    return null;
  }
}
