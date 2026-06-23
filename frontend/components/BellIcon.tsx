'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BADGE_EVENT, clearNotificationBadge, getNotificationBadge } from '@/lib/notificationBadge';
import {
  clearNotifications,
  formatRelativeTime,
  getNotifications,
  type NotificationItem,
} from '@/lib/notifications';

export default function BellIcon() {
  const [hasBadge, setHasBadge] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setHasBadge(getNotificationBadge());
    const handler = () => {
      setHasBadge(getNotificationBadge());
      setItems(getNotifications());
    };
    window.addEventListener(BADGE_EVENT, handler);
    return () => window.removeEventListener(BADGE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!bellRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleBellClick = () => {
    const next = !open;
    if (next) {
      setItems(getNotifications());
      clearNotificationBadge();
    }
    setOpen(next);
  };

  const handleItemClick = (item: NotificationItem) => {
    setOpen(false);
    if (item.url) router.push(item.url);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotifications();
    setItems([]);
  };

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 426,
        maxHeight: 420,
        overflowY: 'auto',
        backgroundColor: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        zIndex: 9999,
      }}
    >
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px 12px',
        borderBottom: '1px solid #F1F5F9',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderRadius: '20px 20px 0 0',
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>알림</span>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              color: '#94A3B8',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
            }}
          >
            모두 지우기
          </button>
        )}
      </div>

      {/* 목록 */}
      {items.length === 0 ? (
        <div style={{
          padding: '36px 16px',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: 13,
          fontWeight: 500,
        }}>
          아직 알림이 없어요
        </div>
      ) : (
        items.map((item, i) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            style={{
              padding: '13px 16px',
              borderBottom: i < items.length - 1 ? '1px solid #F8FAFC' : 'none',
              cursor: item.url ? 'pointer' : 'default',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#EEF0FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>
              🔔
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#1E293B',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: 12,
                color: '#64748B',
                lineHeight: 1.4,
                wordBreak: 'keep-all',
              }}>
                {item.body}
              </div>
              <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4, fontWeight: 500 }}>
                {formatRelativeTime(item.timestamp)}
              </div>
            </div>
            {item.url && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div
      ref={bellRef}
      style={{ position: 'absolute', right: 20, top: '58%', transform: 'translateY(-50%)' }}
    >
      <div
        onClick={handleBellClick}
        style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
      >
        <img
          src="/images/bell_icon_transparent.png"
          alt="알림"
          style={{
            height: 22,
            width: 'auto',
            filter: 'brightness(0) saturate(100%) invert(20%) sepia(40%) saturate(500%) hue-rotate(330deg) brightness(55%)',
          }}
        />
        {hasBadge && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            backgroundColor: '#EF4444',
            borderRadius: '50%',
            border: '1.5px solid white',
          }} />
        )}
      </div>

      {mounted && open && createPortal(panel, document.body)}
    </div>
  );
}
