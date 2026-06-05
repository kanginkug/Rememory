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

const CATEGORY_STYLE: Record<Category, { bg: string; color: string }> = {
  RESTAURANT:    { bg: '#FFEAEA', color: '#FF5A5A' },
  CAFE:          { bg: '#FFF0E6', color: '#E8873A' },
  ATTRACTION:    { bg: '#EAFFEA', color: '#2ECC71' },
  ACCOMMODATION: { bg: '#F5EAFF', color: '#9B59B6' },
};

const REVIEW_FALLBACK: Record<Category, string> = {
  RESTAURANT:    '/images/no_reveiw_restaurant.png',
  CAFE:          '/images/no_review_cafe.png',
  ATTRACTION:    '/images/no_review_attraction.png',
  ACCOMMODATION: '/images/no_review_accommodation.png',
};

const NAV_ITEMS = [
  { label: '홈', href: '/home', active: true,  d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억', href: '/memory', active: false, d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색', href: '/map', active: false, d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my', active: false, d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

function StarIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function SkeletonCard({ w, h }: { w: string; h: number }) {
  return (
    <div
      className="shrink-0 animate-pulse rounded-2xl bg-gray-100"
      style={{ width: w, height: h }}
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [headerH, setHeaderH] = useState(56);
  const [bannerH, setBannerH] = useState(200);
  const [bestPlaces, setBestPlaces] = useState<BestPlace[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth guard + mount (localStorage는 클라이언트에서만 접근 가능)
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    setMounted(true);

    Promise.allSettled([
      fetchBestPlaces(),
      fetchRecentMemories(),
      fetchRecentReviews(),
    ]).then(([p, m, r]) => {
      if (p.status === 'fulfilled') setBestPlaces(p.value);
      if (m.status === 'fulfilled') setMemories(m.value);
      if (r.status === 'fulfilled') setReviews(r.value);
      setLoading(false);
    });
  }, [router]);

  // Measure header + banner heights
  useEffect(() => {
    if (!mounted) return;
    function measure() {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
      if (bannerRef.current) setBannerH(bannerRef.current.offsetHeight);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mounted]);

  // Scroll: banner fade + header color transition
  useEffect(() => {
    if (!mounted) return;
    function onScroll() {
      const bh = bannerRef.current?.offsetHeight ?? bannerH;
      const t = Math.min(1, window.scrollY / Math.max(bh * 0.75, 1));
      if (bannerRef.current) bannerRef.current.style.opacity = String(1 - t);
      if (headerRef.current) {
        const lr = (a: number, b: number) => Math.round(a + (b - a) * t);
        headerRef.current.style.background = `rgb(${lr(191,255)},${lr(219,255)},${lr(243,255)})`;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [bannerH, mounted]);

  // 마운트 전: 서버 HTML과 동일한 정적 껍데기 반환 → hydration 불일치 방지
  if (!mounted) {
    return <div style={{ background: '#BFDBF3', minHeight: '100dvh' }} />;
  }

  const spacerH = headerH + bannerH - 36;

  return (
    <div style={{ background: '#BFDBF3' }}>

      {/* Fixed header */}
      <header
        ref={headerRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-20 flex justify-center items-end"
        style={{ background: '#BFDBF3', padding: '10px 20px 2px' }}
      >
        <img src="/images/default_phrase.png" alt="Rememory" className="object-contain" style={{ height: 50, mixBlendMode: 'multiply' }} />
        <button
          className="absolute flex items-center justify-center"
          style={{ right: 20, top: '58%', transform: 'translateY(-50%)' }}
        >
          <img
            src="/images/bell_icon_transparent.png"
            alt="알림"
            style={{ height: 22, width: 'auto', filter: 'brightness(0) saturate(100%) invert(20%) sepia(40%) saturate(500%) hue-rotate(330deg) brightness(55%)' }}
          />
        </button>
      </header>

      {/* Fixed banner (fades on scroll) */}
      <div
        ref={bannerRef}
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[450px] z-10"
        style={{ top: headerH - 1 }}
      >
        <img
          src="/images/mainBanner.png"
          alt="메인 배너"
          className="w-full block"
          onLoad={() => bannerRef.current && setBannerH(bannerRef.current.offsetHeight)}
        />
      </div>

      {/* Scrollable content (z-15 so white area covers banner while scrolling) */}
      <div className="relative mx-auto w-full max-w-[450px]" style={{ zIndex: 15 }}>

        {/* Spacer: pushes content below header + banner */}
        <div style={{ height: spacerH }} />

        {/* White main area */}
        <main style={{ borderRadius: '30px 30px 0 0', background: '#fff', paddingBottom: 80 }}>

          {loading ? (
            /* ── 로딩 스켈레톤 ── */
            <>
              <section className="px-5 pt-6 pb-2">
                <div className="h-12 bg-gray-100 animate-pulse rounded-2xl" />
              </section>
              <section className="mt-5">
                <div className="px-5 mb-3 h-5 w-36 bg-gray-100 animate-pulse rounded" />
                <div className="flex gap-3 px-5">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} w="144px" h={210} />)}
                </div>
              </section>
              <section className="mt-5">
                <div className="px-5 mb-3 h-5 w-28 bg-gray-100 animate-pulse rounded" />
                <div className="flex gap-3 px-5">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} w="144px" h={180} />)}
                </div>
              </section>
            </>
          ) : memories.length === 0 ? (
            /* ── 추억 없음 ── */
            <section className="flex flex-col items-center px-5 pt-8 pb-10">
              <img
                src="/images/home_no_data.png"
                alt="추억 없음"
                className="w-full object-contain"
                style={{ maxWidth: 320 }}
              />
              <p className="mt-2 text-lg font-bold text-center" style={{ color: '#333' }}>
                아직 기록된 추억이 없어요.
              </p>
              <p className="mt-2 text-sm text-center leading-relaxed" style={{ color: '#94a3b8' }}>
                소중한 순간들을 기록해보세요.<br />새 추억을 추가하면 이곳에 나타납니다!
              </p>
              <button
                onClick={() => router.push('/memory/new')}
                className="mt-10 w-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  padding: '16px',
                  background: '#FFF6CD',
                  border: '1.5px solid #F3DF95',
                  borderRadius: 50,
                  color: '#5A4A42',
                  boxShadow: '0 4px 14px rgba(164,180,200,0.13)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm7-10.7h-1.4l-1.4-1.5H7.8L6.4 4.5H5C3.9 4.5 3 5.4 3 6.5v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-7 11.7a4.7 4.7 0 1 1 0-9.4 4.7 4.7 0 0 1 0 9.4z" />
                </svg>
                새 추억 만들기 +
              </button>
            </section>
          ) : (
            /* ── 데이터 있음 ── */
            <>
              {/* CTA */}
              <section className="px-5 pt-6 pb-2">
                <button
                  onClick={() => router.push('/memory/new')}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:opacity-90"
                  style={{ background: '#7F77DD' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm7-10.7h-1.4l-1.4-1.5H7.8L6.4 4.5H5C3.9 4.5 3 5.4 3 6.5v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-7 11.7a4.7 4.7 0 1 1 0-9.4 4.7 4.7 0 0 1 0 9.4z" />
                  </svg>
                  새 추억 만들기 +
                </button>
              </section>

              {/* Best Places (데이터 있을 때만) */}
              {bestPlaces.length > 0 && (
                <section className="mt-5">
                  <h2 className="px-5 mb-3 text-base font-extrabold text-gray-900">우리 추억 장소 베스트</h2>
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                    {bestPlaces.map(place => {
                      const s = CATEGORY_STYLE[place.category];
                      return (
                        <div key={place.id} className="shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden">
                          <img
                            src={place.placePhotoList[0]?.imageUrl ?? '/images/no-place.png'}
                            alt={place.name}
                            className="w-full object-cover"
                            style={{ height: 120 }}
                            onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-place.png'; }}
                          />
                          <div className="p-2.5 flex flex-col gap-1">
                            <span
                              className="self-start text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {CATEGORY_LABEL[place.category]}
                            </span>
                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{place.name}</p>
                            {place.memoryName && (
                              <p className="text-[11px] text-gray-400 line-clamp-1">{place.memoryName}</p>
                            )}
                            <div className="flex items-center justify-between mt-auto pt-1">
                              <span className="flex items-center gap-0.5 text-xs font-bold text-yellow-500">
                                <StarIcon /> {place.avgRating.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-gray-400">리뷰 {place.reviewCount}개</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Recent Memories */}
              <section className="mt-5">
                <div className="flex items-center justify-between px-5 mb-3">
                  <h2 className="text-base font-extrabold text-gray-900">최근 추억 카드</h2>
                  <Link href="/memory" className="text-xs font-semibold" style={{ color: '#7F77DD' }}>
                    전체 보기
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                  {memories.map(mem => (
                    <Link
                      key={mem.id}
                      href={`/memory/${mem.id}`}
                      className="shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden"
                    >
                      <img
                        src={mem.imageUrl ?? '/images/no-memory.png'}
                        alt={mem.name}
                        className="w-full object-cover"
                        style={{ height: 100 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-memory.png'; }}
                      />
                      <div className="p-2.5 flex flex-col gap-1">
                        <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{mem.name}</p>
                        <p className="text-[11px] text-gray-500">장소 {mem.placeCount}곳</p>
                        {mem.avgRating > 0 && (
                          <div className="flex items-center gap-0.5 text-xs font-bold text-yellow-500">
                            <StarIcon /> {mem.avgRating.toFixed(1)}
                          </div>
                        )}
                        {mem.memberCount != null && (
                          <p className="text-[11px] text-gray-400">멤버 {mem.memberCount}명</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Recent Reviews (데이터 있을 때만) */}
              {reviews.length > 0 && (
                <section className="mt-5 mb-2">
                  <h2 className="px-5 mb-3 text-base font-extrabold text-gray-900">내 추억 최근 리뷰</h2>
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                    {reviews.map(rev => (
                      <div key={rev.reviewId} className="shrink-0 w-40 bg-white rounded-2xl shadow-sm overflow-hidden">
                        <img
                          src={REVIEW_FALLBACK[rev.placeCategory] ?? '/images/no-place.png'}
                          alt={rev.placeName}
                          className="w-full object-cover"
                          style={{ height: 110 }}
                          onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-place.png'; }}
                        />
                        <div className="p-2.5 flex flex-col gap-1">
                          <p className="text-xs font-bold text-gray-900 line-clamp-1">{rev.placeName}</p>
                          <div className="flex items-center gap-0.5 text-xs font-bold text-yellow-500">
                            <StarIcon /> {rev.rating.toFixed(1)}
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{rev.memoryName}</p>
                          {rev.content && (
                            <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed">{rev.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        </main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-20 flex items-center bg-white"
          style={{ height: 64, borderTop: '1px solid #eeeeee', justifyContent: 'space-around' }}
        >
          {NAV_ITEMS.map(({ label, href, active, d }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1"
              style={{ color: active ? '#333333' : '#aaaaaa' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d={d} />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </div>
  );
}
