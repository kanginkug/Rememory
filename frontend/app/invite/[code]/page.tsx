'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agreeInvitation } from '@/lib/api';

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      localStorage.setItem('pendingInviteCode', code);
      router.replace('/login');
      return;
    }

    agreeInvitation(code)
      .then(() => router.replace('/home'))
      .catch((err: Error) => {
        if (err.message.includes('이미 참가한')) {
          router.replace('/home');
          return;
        }
        setStatus('error');
        if (err.message.includes('만료된')) {
          setErrorMsg('초대 링크가 만료되었습니다.');
        } else if (err.message.includes('사용 횟수')) {
          setErrorMsg('초대 링크 사용 횟수를 초과했습니다.');
        } else {
          setErrorMsg('초대 링크가 유효하지 않습니다.');
        }
      });
  }, [code, router]);

  if (status === 'error') {
    return (
      <div style={{
        backgroundColor: '#BFDBF3', minHeight: '100vh',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{
          width: '100%', maxWidth: 450, padding: '40px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{ fontSize: 48 }}>😢</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', textAlign: 'center' }}>
            {errorMsg}
          </h2>
          <button
            onClick={() => router.replace('/home')}
            style={{
              backgroundColor: '#7F77DD', color: 'white',
              border: 'none', borderRadius: 16, padding: '12px 32px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#BFDBF3', minHeight: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 450, padding: '40px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(127,119,221,0.2)',
          borderTopColor: '#7F77DD',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>초대를 수락하는 중이에요...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
