'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMe, fetchMemoryList, removeToken, deleteMe, type Member, type Memory } from '@/lib/api';

const NAV_ITEMS = [
  { label: '홈',        href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억',      href: '/memory', d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색',  href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',    d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

const CHEVRON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function MyPage() {
  const router = useRouter();
  const [me, setMe] = useState<Member | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    document.body.classList.add('page-mypage');
    return () => document.body.classList.remove('page-mypage');
  }, [router]);

  useEffect(() => {
    Promise.allSettled([fetchMe(), fetchMemoryList('DATE_DESC')]).then(([m, mem]) => {
      if (m.status === 'fulfilled') setMe(m.value);
      if (mem.status === 'fulfilled') setMemories(mem.value);
    });
  }, []);

  const memoryCount = memories.length;
  const placeCount = memories.reduce((sum, m) => sum + m.placeCount, 0);
  const ratedMemories = memories.filter(m => m.avgRating > 0);
  const avgRating = ratedMemories.length > 0
    ? ratedMemories.reduce((sum, m) => sum + m.avgRating, 0) / ratedMemories.length
    : 0;

  const handleLogout = () => {
    removeToken();
    router.replace('/login');
  };

  const handleWithdraw = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n탈퇴 후에도 동일 계정으로 재로그인 시 복구할 수 있습니다.')) return;
    try {
      await deleteMe();
      removeToken();
      router.replace('/login');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <>
      <header className="app-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <img src="/images/bell_icon_transparent.png" alt="알림" className="bell-img" />
      </header>

      <div className="app-container">
      <main className="app-main">
        <div className="mypage-section">

          {/* 프로필 카드 */}
          <div className="mp-card profile-card">
            <div className="avatar-wrapper">
              {me?.profileImageUrl ? (
                <img className="profile-img" src={me.profileImageUrl} alt={me.name} />
              ) : (
                <div className="profile-img" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#94a3b8">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
              <div className="camera-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm7-10.7h-1.4l-1.4-1.5H7.8L6.4 4.5H5C3.9 4.5 3 5.4 3 6.5v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-7 11.7a4.7 4.7 0 1 1 0-9.4 4.7 4.7 0 0 1 0 9.4z" />
                </svg>
              </div>
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <p className="profile-name">{me?.name ?? ''}</p>
                <button className="profile-edit-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <p className="profile-email">{me?.email ?? ''}</p>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="mp-card stats-card">
            <div className="stats-item">
              <div className="stats-icon-bg bg-purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
                </svg>
              </div>
              <p className="stats-label">추억 수</p>
              <p className="stats-value text-purple">{memoryCount}</p>
            </div>
            <div className="stats-item">
              <div className="stats-icon-bg bg-blue">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <p className="stats-label">방문 장소 수</p>
              <p className="stats-value text-blue">{placeCount}</p>
            </div>
            <div className="stats-item">
              <div className="stats-icon-bg bg-yellow">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
              <p className="stats-label">평균 별점</p>
              <p className="stats-value text-yellow">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
            </div>
          </div>

          {/* 메뉴 카드 1 */}
          <div className="mp-card">
            <div className="menu-item" style={{ cursor: 'pointer' }} onClick={() => router.push('/my/reviews')}>
              <div className="menu-icon mi-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <span className="menu-title">후기 관리</span>
              <span className="chevron-right">{CHEVRON}</span>
            </div>
          </div>

          {/* 메뉴 카드 2 */}
          <div className="mp-card">
            <div className="menu-item" style={{ cursor: 'pointer' }}>
              <div className="menu-icon mi-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="menu-title">버그/건의 게시판</span>
              <span className="chevron-right">{CHEVRON}</span>
            </div>
            <div className="menu-item" style={{ cursor: 'pointer' }} onClick={handleLogout}>
              <div className="menu-icon mi-gray">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span className="menu-title">로그아웃</span>
              <span className="chevron-right">{CHEVRON}</span>
            </div>
            <div className="menu-item menu-danger" style={{ cursor: 'pointer' }} onClick={handleWithdraw}>
              <div className="menu-icon mi-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <span className="menu-title">회원탈퇴</span>
              <span className="chevron-right">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
          </div>

        </div>
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, href, d }) => (
          <Link
            key={label}
            href={href}
            className={`nav-item${label === '마이페이지' ? ' active' : ''}`}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
            </span>
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>
      </div>
    </>
  );
}
