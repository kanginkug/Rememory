'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchBestPlaces,
  fetchRecentMemories,
  fetchRecentReviews,
  CATEGORY_LABEL,
  type BestPlace,
  type Memory,
  type RecentReview,
  type Category,
} from '@/lib/api';

const CATEGORY_TAG: Record<Category, string> = {
  RESTAURANT:    'tag-restaurant',
  CAFE:          'tag-cafe',
  ATTRACTION:    'tag-attraction',
  ACCOMMODATION: 'tag-accommodation',
};

const REVIEW_FALLBACK: Record<Category, string> = {
  RESTAURANT:    '/images/no_reveiw_restaurant.png',
  CAFE:          '/images/no_review_cafe.png',
  ATTRACTION:    '/images/no_review_attraction.png',
  ACCOMMODATION: '/images/no_review_accommodation.png',
};

const NAV_ITEMS = [
  { label: '홈',        href: '/home',   active: true,  d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억',      href: '/memory', active: false, d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색',  href: '/map',    active: false, d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',    active: false, d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

export default function HomePage() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const bannerRef  = useRef<HTMLDivElement>(null);
  const spacerRef  = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [bestPlaces, setBestPlaces] = useState<BestPlace[]>([]);
  const [memories,   setMemories]   = useState<Memory[]>([]);
  const [reviews,    setReviews]    = useState<RecentReview[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    setMounted(true);
    window.scrollTo(0, 0);

    Promise.allSettled([
      fetchBestPlaces(),
      fetchRecentMemories(),
      fetchRecentReviews(),
    ]).then(([p, m, r]) => {
      if (p.status === 'fulfilled') setBestPlaces(p.value);
      if (m.status === 'fulfilled') setMemories(m.value);
      if (r.status === 'fulfilled') setReviews(r.value);
    });
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    function syncLayout() {
      const header = headerRef.current;
      const banner = bannerRef.current;
      const spacer = spacerRef.current;
      if (!header || !banner || !spacer) return;
      const hh = header.offsetHeight;
      banner.style.top = (hh - 1) + 'px';
      spacer.style.height = (hh + banner.offsetHeight - 36) + 'px';
    }
    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const from = { r: 191, g: 219, b: 243 };
    const to   = { r: 255, g: 255, b: 255 };
    function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
    function onScroll() {
      const banner = bannerRef.current;
      const header = headerRef.current;
      if (!banner || !header) return;
      const t = Math.min(1, window.scrollY / Math.max(banner.offsetHeight * 0.75, 1));
      banner.style.opacity = String(1 - t);
      header.style.background = `rgb(${lerp(from.r, to.r, t)},${lerp(from.g, to.g, t)},${lerp(from.b, to.b, t)})`;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);

  if (!mounted) return <div style={{ background: '#BFDBF3', minHeight: '100dvh' }} />;

  return (
    <>
      {/* 고정 헤더 */}
      <header ref={headerRef} className="app-header" id="appHeader">
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <img src="/images/bell_icon_transparent.png" alt="알림" className="bell-img" />
      </header>

      {/* 고정 배너 */}
      <div ref={bannerRef} className="banner-section" id="bannerSection">
        <img src="/images/mainBanner.png" alt="메인 배너" className="main-banner" fetchPriority="high" />
      </div>

      <div className="app-container">
        <div ref={spacerRef} className="banner-spacer" id="bannerSpacer" />

        <main className="app-main">

          {/* 새 추억 만들기 CTA */}
          <section className="cta-section">
            <button className="main-cta-btn" onClick={() => router.push('/memory/new')}>
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm7-10.7h-1.4l-1.4-1.5H7.8L6.4 4.5H5C3.9 4.5 3 5.4 3 6.5v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-7 11.7a4.7 4.7 0 1 1 0-9.4 4.7 4.7 0 0 1 0 9.4z" />
                </svg>
              </span>
              새 추억 만들기 +
            </button>
          </section>

          {/* 우리 추억 장소 베스트 */}
          {bestPlaces.length > 0 && (
            <section className="scroll-section">
              <div className="section-header">
                <h2>우리 추억 장소 베스트</h2>
              </div>
              <div className="horizontal-scroll best-places">
                {bestPlaces.map(place => (
                  <div key={place.id} className="place-card" onClick={() => router.push(`/place/${place.memoryId}/${place.id}`)} style={{ cursor: 'pointer' }}>
                    <img
                      className="card-image"
                      src={place.placePhotoList?.[0]?.imageUrl ?? REVIEW_FALLBACK[place.category]}
                      alt={place.name}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = REVIEW_FALLBACK[place.category]; }}
                    />
                    <div className="card-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`category ${CATEGORY_TAG[place.category]}`}>
                          {CATEGORY_LABEL[place.category]}
                        </span>
                        {place.visitedAt && (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, flexShrink: 0 }}>
                            {place.visitedAt.slice(0, 10).replace(/-/g, '.')}
                          </span>
                        )}
                      </div>
                      <h3 className="place-name">{place.name}</h3>
                      <p className="memory-title">{place.memoryName}</p>
                      <div className="card-footer">
                        <span className="rating">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          {place.avgRating.toFixed(1)}
                        </span>
                        {place.reviewCount > 0 && (
                          <span className="review-count">리뷰 {place.reviewCount}개</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 최근 추억 카드 */}
          {memories.length > 0 && (
            <section className="scroll-section">
              <div className="section-header">
                <h2>최근 추억 카드</h2>
                <Link href="/memory" className="more-link">전체 보기</Link>
              </div>
              <div className="horizontal-scroll memory-cards">
                {memories.map(mem => (
                  <Link key={mem.id} href={`/place/${mem.id}`} className="memory-card">
                    <img
                      className="memory-thumb"
                      src={mem.imageUrl ?? '/images/no-memory.png'}
                      alt={mem.name}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-memory.png'; }}
                    />
                    <div className="memory-info">
                      <h3 className="memory-name">{mem.name}</h3>
                      <p className="meta-info">장소 {mem.placeCount}곳</p>
                      {mem.avgRating > 0 && (
                        <p className="meta-info">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          {mem.avgRating.toFixed(1)}
                        </p>
                      )}
                      {mem.memberCount != null && (
                        <div className="member-tag">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                          </svg>
                          멤버 {mem.memberCount}명
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 내 추억 최근 리뷰 */}
          {reviews.length > 0 && (
            <section className="scroll-section">
              <div className="section-header">
                <h2>내 추억 최근 리뷰</h2>
              </div>
              <div className="horizontal-scroll review-cards">
                {reviews.map(rev => (
                  <div key={rev.reviewId} className="review-card" onClick={() => router.push(`/place/${rev.memoryId}/${rev.placeId}`)} style={{ cursor: 'pointer' }}>
                    <img
                      className="review-img"
                      src={rev.rpResponseDTOList?.[0]?.photoUrl ?? REVIEW_FALLBACK[rev.placeCategory] ?? '/images/no-place.png'}
                      alt={rev.placeName}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = REVIEW_FALLBACK[rev.placeCategory] ?? '/images/no-place.png'; }}
                    />
                    {rev.content && <p className="review-text">{rev.content}</p>}
                    <div className="review-rating">
                      <span className="review-creator">{rev.creatorName}</span>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      {rev.rating.toFixed(1)}
                    </div>
                    <p className="review-memory"><span className="review-label review-label-memory">추억</span>{rev.memoryName}</p>
                    <p className="review-place"><span className="review-label review-label-place">장소</span>{rev.placeName}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>

        <nav className="bottom-nav">
          {NAV_ITEMS.map(({ label, href, active, d }) => (
            <Link key={label} href={href} className={`nav-item${active ? ' active' : ''}`}>
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
