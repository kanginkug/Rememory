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

    // ===== DEBUG START (iOS FCM 디버깅용 임시 코드) =====
    const dbgToast = (msg: string) =>
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'notification' } }));

    (async () => {
      // 1. 알림 권한 상태
      const perm = 'Notification' in window ? Notification.permission : 'unsupported';
      dbgToast(`[FCM 1] 권한: ${perm}`);

      // 2. FCM 토큰 발급
      let fcmToken: string | null = null;
      try {
        fcmToken = await getFcmToken();
        dbgToast(`[FCM 2] 토큰 발급 성공: ${fcmToken ? fcmToken.slice(0, 20) + '...' : 'null'}`);
      } catch (e) {
        dbgToast(`[FCM 2] 토큰 발급 실패: ${e instanceof Error ? e.message : String(e)}`);
      }

      // 3. 백엔드 등록
      if (fcmToken) {
        try {
          await registerFcmToken(fcmToken);
          dbgToast('[FCM 3] 서버 등록 성공 (200 OK)');
        } catch (e) {
          dbgToast(`[FCM 3] 서버 등록 실패: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        dbgToast('[FCM 3] 토큰 없어서 서버 등록 건너뜀');
      }
      // ===== DEBUG END =====

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
