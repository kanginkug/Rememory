'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAllPlaces, CATEGORY_LABEL, type PlaceMapItem, type Category } from '@/lib/api';

declare global {
  interface Window {
    kakao: any;
    __kakaoMapPinClick: (id: number) => void;
  }
}

const PIN_COLOR: Record<Category, string> = {
  RESTAURANT:    '#FF7F7F',
  CAFE:          '#FFA866',
  ACCOMMODATION: '#BB7EDE',
  ATTRACTION:    '#5EDF8C',
};

const PIN_EMOJI: Record<Category, string> = {
  RESTAURANT:    '🍴',
  CAFE:          '☕',
  ACCOMMODATION: '🛏️',
  ATTRACTION:    '🎡',
};

const CATEGORY_BADGE: Record<Category, { background: string; color: string }> = {
  RESTAURANT:    { background: '#FFEAEA', color: '#FF5A5A' },
  CAFE:          { background: '#FFF0E6', color: '#E8873A' },
  ATTRACTION:    { background: '#EAFFEA', color: '#2ECC71' },
  ACCOMMODATION: { background: '#F5EAFF', color: '#9B59B6' },
};

const CATEGORY_FALLBACK: Record<Category, string> = {
  RESTAURANT:    '/images/no_reveiw_restaurant.png',
  ATTRACTION:    '/images/no_review_attraction.png',
  ACCOMMODATION: '/images/no_review_accommodation.png',
  CAFE:          '/images/no_review_cafe.png',
};

const NAV_ITEMS = [
  { label: '홈',        href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억',      href: '/memory', d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색',  href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',    d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<PlaceMapItem[]>([]);
  const [selected, setSelected] = useState<PlaceMapItem | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    document.body.classList.add('page-map');
    return () => document.body.classList.remove('page-map');
  }, []);

  useEffect(() => {
    fetchAllPlaces().then(setPlaces).catch(() => {});
  }, []);

  useEffect(() => {
    const init = () => window.kakao.maps.load(() => setKakaoReady(true));
    const check = () => typeof window.kakao?.maps?.load === 'function';
    if (check()) { init(); return; }
    const t = setInterval(() => {
      if (check()) { clearInterval(t); init(); }
    }, 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    window.__kakaoMapPinClick = (id: number) => {
      setSelected(places.find(p => p.placeId === id) ?? null);
    };
  }, [places]);

  useEffect(() => {
    if (!kakaoReady || !mapRef.current) return;

    const { maps } = window.kakao;
    const validPlaces = places.filter(p => p.latitude && p.longitude);

    const center = new maps.LatLng(36.5, 127.8);
    const map = new maps.Map(mapRef.current, { center, level: 13 });

    validPlaces.forEach(place => {
      const color = PIN_COLOR[place.category];
      const emoji = PIN_EMOJI[place.category];
      const content = [
        `<div onclick="event.stopPropagation();window.__kakaoMapPinClick(${place.placeId})"`,
        ` style="position:relative;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">`,
        `<svg width="40" height="50" viewBox="0 0 44 54">`,
        `<path d="M22 0C9.8 0 0 9.8 0 22c0 15 19 30.3 21.2 31.8.5.3 1.1.3 1.6 0C25 52.3 44 37 44 22 44 9.8 34.2 0 22 0z" fill="${color}"/>`,
        `<circle cx="22" cy="21" r="14" fill="white"/>`,
        `</svg>`,
        `<span style="position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:14px;">${emoji}</span>`,
        `</div>`,
      ].join('');

      new maps.CustomOverlay({
        map,
        position: new maps.LatLng(place.latitude, place.longitude),
        content,
        yAnchor: 1,
      });
    });

    maps.event.addListener(map, 'click', () => setSelected(null));
  }, [kakaoReady, places]);

  const thumbSrc = selected ? CATEGORY_FALLBACK[selected.category] : '';
  const filledStars = selected ? Math.round(Number(selected.avgRating)) : 0;

  return (
    <>
      {/* 지도 배경 */}
      <div ref={mapRef} className="map-full" />

      {/* 헤더 */}
      <header className="app-header" id="appHeader">
        <button className="back-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <img src="/images/bell_icon_transparent.png" alt="알림" className="bell-img" />
      </header>

{/* 바텀시트 */}
      {selected && (
        <div className="map-bottom-sheet">
          <div className="map-sheet-handle" />
          <div className="map-place-row">
            <div className="map-thumb">
              <img
                src={thumbSrc}
                alt={selected.placeName}
                onError={e => { (e.currentTarget as HTMLImageElement).src = CATEGORY_FALLBACK[selected.category]; }}
              />
            </div>
            <div className="map-place-info">
              <div className="map-name-row">
                <span className="map-place-name">{selected.placeName}</span>
                <span className="map-cat-badge" style={CATEGORY_BADGE[selected.category]}>{CATEGORY_LABEL[selected.category]}</span>
              </div>
              <div className="map-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star${i >= filledStars ? ' empty' : ''}`}>★</span>
                ))}
                <span className="avg">{selected.avgRating.toFixed(1)}</span>
              </div>
              <div className="map-memory-row">
                <div className="map-memory-texts">
                  <span className="map-memory-label">소속 추억</span>
                  <span className="map-memory-name">{selected.memoryName}</span>
                </div>
              </div>
            </div>
          </div>
          <button className="map-detail-btn" onClick={() => router.push(`/place/${selected.memoryId}/${selected.placeId}`)}>
            장소 상세 보기
            <span className="chevron">❯</span>
          </button>
        </div>
      )}

      {/* 하단 네비 */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, href, d }) => (
          <Link key={label} href={href} className={`nav-item${label === '지도탐색' ? ' active' : ''}`}>
            <span className="nav-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg></span>
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
