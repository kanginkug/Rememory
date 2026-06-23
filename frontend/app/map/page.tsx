'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import BellIcon from '@/components/BellIcon';
import { useRouter } from 'next/navigation';
import {
  fetchAllPlaces,
  fetchPlace,
  fetchMemoryList,
  CATEGORY_LABEL,
  type PlaceMapItem,
  type Category,
  type Memory,
} from '@/lib/api';

declare global {
  interface Window { kakao: any; }
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
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClickedRef = useRef(false);

  const [allPlaces, setAllPlaces] = useState<PlaceMapItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemoryId, setSelectedMemoryId] = useState<number | null>(null);
  const [selected, setSelected] = useState<PlaceMapItem | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});
  const [kakaoReady, setKakaoReady] = useState(false);

  const places = useMemo(
    () => selectedMemoryId ? allPlaces.filter(p => p.memoryId === selectedMemoryId) : allPlaces,
    [allPlaces, selectedMemoryId],
  );

  useEffect(() => {
    document.body.classList.add('page-map');
    return () => document.body.classList.remove('page-map');
  }, []);

  useEffect(() => {
    fetchAllPlaces().then(setAllPlaces).catch(() => {});
    fetchMemoryList('DATE_DESC').then(setMemories).catch(() => {});
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

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (!kakaoReady || !mapRef.current) return;
    const { maps } = window.kakao;
    const center = new maps.LatLng(36.5, 127.8);
    mapInstanceRef.current = new maps.Map(mapRef.current, { center, level: 13 });
    maps.event.addListener(mapInstanceRef.current, 'click', () => {
      if (markerClickedRef.current) { markerClickedRef.current = false; return; }
      setSelected(null);
    });
  }, [kakaoReady]);

  // 마커 교체 (places 변경 시)
  useEffect(() => {
    if (!kakaoReady || !mapInstanceRef.current) return;
    const { maps } = window.kakao;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    setSelected(null);

    const validPlaces = places.filter(p => p.latitude && p.longitude);

    validPlaces.forEach(place => {
      const color = PIN_COLOR[place.category];
      const emoji = PIN_EMOJI[place.category];
      const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 44 54">`,
        `<path d="M22 0C9.8 0 0 9.8 0 22c0 15 19 30.3 21.2 31.8.5.3 1.1.3 1.6 0C25 52.3 44 37 44 22 44 9.8 34.2 0 22 0z" fill="${color}"/>`,
        `<circle cx="22" cy="21" r="14" fill="white"/>`,
        `<text x="22" y="27" text-anchor="middle" font-size="14">${emoji}</text>`,
        `</svg>`,
      ].join('');

      const markerImage = new maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        new maps.Size(40, 50),
        { offset: new maps.Point(20, 50) },
      );

      const marker = new maps.Marker({
        map: mapInstanceRef.current,
        position: new maps.LatLng(place.latitude, place.longitude),
        image: markerImage,
      });

      maps.event.addListener(marker, 'click', () => {
        markerClickedRef.current = true;
        setSelected(place);
      });
      markersRef.current.push(marker);
    });

    // 마커들에 맞게 지도 범위 조정
    if (validPlaces.length === 0) {
      mapInstanceRef.current.setCenter(new maps.LatLng(36.5, 127.8));
      mapInstanceRef.current.setLevel(13);
    } else if (validPlaces.length === 1) {
      mapInstanceRef.current.setCenter(new maps.LatLng(validPlaces[0].latitude, validPlaces[0].longitude));
      mapInstanceRef.current.setLevel(6);
    } else {
      const bounds = new maps.LatLngBounds();
      validPlaces.forEach(p => bounds.extend(new maps.LatLng(p.latitude, p.longitude)));
      mapInstanceRef.current.setBounds(bounds, 80);
    }
  }, [kakaoReady, places]);

  useEffect(() => {
    if (!selected) return;
    fetchPlace(selected.memoryId, selected.placeId)
      .then(detail => {
        const photo = detail.placePhotoList?.[0]?.imageUrl;
        if (photo) setPhotoMap(prev => ({ ...prev, [selected.placeId]: photo }));
      })
      .catch(() => {});
  }, [selected]);

  const thumbSrc = selected
    ? (photoMap[selected.placeId] ?? CATEGORY_FALLBACK[selected.category])
    : '';
  const filledStars = selected ? Math.round(Number(selected.avgRating)) : 0;

  return (
    <>
      <div ref={mapRef} className="map-full" />

      {/* 헤더 */}
      <header className="app-header" id="appHeader">
        <button className="back-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <BellIcon />
      </header>

      {/* 추억 선택 셀렉트 */}
      <div style={{
        position: 'fixed',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 418,
        zIndex: 30,
      }}>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedMemoryId ?? ''}
            onChange={e => setSelectedMemoryId(e.target.value === '' ? null : Number(e.target.value))}
            style={{
              width: '100%',
              padding: '11px 40px 11px 16px',
              borderRadius: 14,
              border: 'none',
              background: 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">전체 추억</option>
            {memories.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {selectedMemoryId && (
          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.85)', borderRadius: 8, padding: '3px 10px', display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)' }}>
            장소 {places.filter(p => p.latitude && p.longitude).length}개
          </div>
        )}
      </div>

      {/* 바텀시트 */}
      {selected && (
        <div className="map-bottom-sheet">
          <div className="map-sheet-handle" />
          <div className="map-place-row">
            <div className="map-thumb">
              <img
                src={thumbSrc || CATEGORY_FALLBACK[selected.category]}
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
