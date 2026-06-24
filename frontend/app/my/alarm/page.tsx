'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BellIcon from '@/components/BellIcon';
import { fetchMe, updateNotificationSettings, registerFcmToken, type NotificationSettings } from '@/lib/api';
import { requestAndGetFcmToken } from '@/lib/firebase';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      onClick={() => { if (!disabled) onChange(!on); }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: on ? '#7F77DD' : '#CBD5E1',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        flexShrink: 0,
        marginLeft: 10,
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: on ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

const TYPE_ITEMS: { key: keyof Omit<NotificationSettings, 'notificationEnabled'>; icon: string; title: string; desc: string }[] = [
  { key: 'notificationPlaceEnabled',      icon: '🗺️', title: '장소 추가 알림', desc: '친구가 새 장소를 추가하면 알려드려요' },
  { key: 'notificationReviewEnabled',     icon: '⭐', title: '리뷰 작성 알림', desc: '친구가 리뷰를 작성하면 알려드려요' },
  { key: 'notificationInvitationEnabled', icon: '🎉', title: '초대 알림',      desc: '초대를 수락한 멤버가 생기면 알려드려요' },
];

export default function AlarmPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationEnabled: true,
    notificationPlaceEnabled: true,
    notificationReviewEnabled: true,
    notificationInvitationEnabled: true,
  });
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    document.body.classList.add('page-alarm');
    if ('Notification' in window) setPermission(Notification.permission);

    fetchMe()
      .then(me => setSettings({
        notificationEnabled: me.notificationEnabled,
        notificationPlaceEnabled: me.notificationPlaceEnabled,
        notificationReviewEnabled: me.notificationReviewEnabled,
        notificationInvitationEnabled: me.notificationInvitationEnabled,
      }))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => document.body.classList.remove('page-alarm');
  }, []);

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (updating) return;
    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setUpdating(true);
    try {
      await updateNotificationSettings(next);
    } catch {
      setSettings(prev);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestPermission = async () => {
    const fcmToken = await requestAndGetFcmToken();
    if (fcmToken) registerFcmToken(fcmToken).catch(() => {});
    if ('Notification' in window) setPermission(Notification.permission);
  };

  if (loading) return null;

  return (
    <div style={{ background: '#BFDBF3', minHeight: '100dvh' }}>
      <header className="app-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <BellIcon />
      </header>

      <div className="app-container" style={{ paddingTop: 62, paddingBottom: 40 }}>
        <div style={{ padding: '20px 0 40px' }}>

          {permission !== null && permission !== 'granted' && (
            <div style={{
              marginBottom: 16, padding: '14px 16px', backgroundColor: '#FFF7ED',
              borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12,
              marginLeft: 16, marginRight: 16,
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>
                  브라우저 알림이 차단되어 있어요
                </p>
                <p style={{ fontSize: 12, color: '#B45309', margin: '2px 0 0', lineHeight: 1.4 }}>
                  브라우저 설정에서 알림을 허용해주세요
                </p>
              </div>
              {permission === 'default' && (
                <button
                  onClick={handleRequestPermission}
                  style={{
                    background: '#F97316', border: 'none', borderRadius: 8,
                    color: 'white', fontSize: 12, fontWeight: 700,
                    padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  허용
                </button>
              )}
            </div>
          )}

          <div className="alarm-card">
            <div className="alarm-item" style={{ paddingTop: 0, paddingBottom: 0 }}>
              <div className="icon-box">🔔</div>
              <div className="alarm-info">
                <span className="alarm-item-title">전체 알림</span>
                <span className="alarm-item-desc">모든 알림을 켜거나 끌 수 있어요</span>
              </div>
              <Toggle
                on={settings.notificationEnabled}
                onChange={v => handleToggle('notificationEnabled', v)}
                disabled={updating}
              />
            </div>
          </div>

          <div className="alarm-card">
            <p className="alarm-card-title">알림 종류</p>
            {TYPE_ITEMS.map((item, i) => (
              <div key={item.key} className="alarm-item" style={i === 0 ? { paddingTop: 0 } : {}}>
                <div className="icon-box">{item.icon}</div>
                <div className="alarm-info">
                  <span className="alarm-item-title">{item.title}</span>
                  <span className="alarm-item-desc">{item.desc}</span>
                </div>
                <Toggle
                  on={settings[item.key]}
                  onChange={v => handleToggle(item.key, v)}
                  disabled={!settings.notificationEnabled || updating}
                />
              </div>
            ))}
          </div>

          <p className="intro-text">
            알림을 받으려면 브라우저 알림 권한이 필요해요.
          </p>

        </div>
      </div>
    </div>
  );
}
