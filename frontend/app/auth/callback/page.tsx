'use client';

import { useEffect, useState, Suspense, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setRefreshToken } from '@/lib/api';

const STEPS = ['인증 확인', '정보 확인', '홈으로 이동'];

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { router.replace('/login'); return; }

    localStorage.setItem('accessToken', token);
    const refreshToken = searchParams.get('refreshToken');
    if (refreshToken) setRefreshToken(refreshToken);
    window.dispatchEvent(new Event('auth-login'));
    const pendingInviteCode = localStorage.getItem('pendingInviteCode');
    if (pendingInviteCode) {
      localStorage.removeItem('pendingInviteCode');
      setTimeout(() => setStep(1), 600);
      setTimeout(() => setStep(2), 1300);
      setTimeout(() => router.replace(`/invite/${pendingInviteCode}`), 2000);
    } else {
      setTimeout(() => setStep(1), 600);
      setTimeout(() => setStep(2), 1300);
      setTimeout(() => router.replace('/home'), 2000);
    }
  }, [router, searchParams]);

  return (
    <div style={{
      backgroundColor: '#BFDBF3',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 450,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '100px 20px 40px',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src="/images/default_phrase.png" alt="Rememory" style={{ height: 36 }} />
            <span style={{ fontSize: 16, position: 'absolute', right: 18, top: -6 }}>☁️</span>
          </div>
          <h2 style={{
            fontSize: 22, fontWeight: 800, color: '#1E293B',
            fontFamily: "'Noto Sans KR', sans-serif",
            letterSpacing: '-0.3px', marginBottom: 8,
          }}>
            로그인 중이에요
          </h2>
          <p style={{
            fontSize: 14, fontWeight: 500, color: '#64748B',
            fontFamily: "'Noto Sans KR', sans-serif",
            lineHeight: 1.8, letterSpacing: '-0.1px',
          }}>
            안전하게 로그인하고 있어요<br />잠시만 기다려주세요.
          </p>
        </div>

        {/* 일러스트 */}
        <div style={{ width: 260, height: 180, margin: '24px 0 8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/images/callbackBanner.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* 로딩 스피너 */}
        <div style={{
          width: 30, height: 30,
          border: '3px solid rgba(127,119,221,0.2)',
          borderTopColor: '#7F77DD',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '16px 0 24px',
        }} />

        {/* 스텝 카드 */}
        <div style={{
          background: 'white', borderRadius: 20, width: '100%',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          padding: '20px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          {STEPS.map((label, i) => (
            <Fragment key={label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: `2px solid ${i <= step ? '#7F77DD' : '#E2E8F0'}`,
                  background: i <= step ? '#7F77DD' : 'white',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i <= step ? 'white' : '#CBD5E1',
                  boxShadow: i <= step ? '0 3px 8px rgba(127,119,221,0.3)' : 'none',
                  transition: 'all 0.4s ease',
                }}>
                  {i <= step ? '✓' : ''}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: i <= step ? 700 : 600,
                  color: i <= step ? '#7F77DD' : '#94A3B8',
                  transition: 'color 0.4s ease',
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 40, borderTop: '2px dashed #E2E8F0',
                  marginBottom: 22, flexShrink: 0,
                }} />
              )}
            </Fragment>
          ))}
        </div>

        {/* 보안 카드 */}
        <div style={{
          background: 'white', borderRadius: 20, width: '100%',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, backgroundColor: '#EEF0FF',
            borderRadius: '50%', display: 'flex', justifyContent: 'center',
            alignItems: 'center', fontSize: 20, flexShrink: 0,
          }}>
            🛡️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>안전한 로그인을 위해</h3>
            <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500, lineHeight: 1.4 }}>
              회원님의 정보는 암호화되어 안전하게 보호됩니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div style={{
          marginTop: 'auto', paddingTop: 32,
          fontSize: 13, fontWeight: 600, color: '#475569',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          잠시만 기다려주시면 곧 이동할게요!
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#BFDBF3', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 30, height: 30, border: '3px solid rgba(127,119,221,0.2)', borderTopColor: '#7F77DD', borderRadius: '50%' }} />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
