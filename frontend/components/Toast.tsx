'use client';

import { useEffect, useState } from 'react';

type ToastItem = { id: number; message: string; type: 'error' | 'success' };

let nextId = 0;

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: 'error' | 'success' }>).detail;
      const id = nextId++;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      pointerEvents: 'none',
      padding: '0 16px',
      boxSizing: 'border-box',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#1e293b' : '#22c55e',
          color: 'white',
          padding: '11px 20px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          maxWidth: '100%',
          textAlign: 'center',
          wordBreak: 'keep-all',
          lineHeight: 1.5,
          pointerEvents: 'auto',
          animation: 'toast-in 0.2s ease',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
