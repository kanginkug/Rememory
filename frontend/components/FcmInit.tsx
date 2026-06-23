'use client';

import { useEffect } from 'react';
import { getToken, registerFcmToken } from '@/lib/api';
import { getFcmToken, listenForegroundMessages } from '@/lib/firebase';
import { setNotificationBadge } from '@/lib/notificationBadge';
import { addNotification } from '@/lib/notifications';

export default function FcmInit() {
  useEffect(() => {
    // ===== DEBUG START (iOS FCM 디버깅용 임시 코드) =====
    const dbg = (msg: string) => alert(msg);

    const jwt = getToken();
    dbg(`[FCM 0] FcmInit 실행됨 / JWT: ${jwt ? '있음' : '없음(로그인 필요)'}`);

    if (!jwt) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      // 1. 알림 권한 상태
      const perm = 'Notification' in window ? Notification.permission : 'unsupported';
      dbg(`[FCM 1] 권한: ${perm}`);

      // 2. FCM 토큰 발급
      let fcmToken: string | null = null;
      try {
        fcmToken = await getFcmToken();
        dbg(`[FCM 2] 토큰 발급 성공: ${fcmToken ? fcmToken.slice(0, 20) + '...' : 'null'}`);
      } catch (e) {
        dbg(`[FCM 2] 토큰 발급 실패: ${e instanceof Error ? e.message : String(e)}`);
      }

      // 3. 백엔드 등록
      if (fcmToken) {
        try {
          await registerFcmToken(fcmToken);
          dbg('[FCM 3] 서버 등록 성공 (200 OK)');
        } catch (e) {
          dbg(`[FCM 3] 서버 등록 실패: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        dbg('[FCM 3] 토큰 없어서 서버 등록 건너뜀');
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
