'use client';

import { useEffect, useRef, useState } from 'react';

interface ImageLightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, startIndex, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(startIndex);
  const touchStartX = useRef(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setCurrent(c => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(images.length - 1, c + 1));
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [images.length, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta >  50) setCurrent(c => Math.min(images.length - 1, c + 1));
    if (delta < -50) setCurrent(c => Math.max(0, c - 1));
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 1 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* 카운터 */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>
          {current + 1} / {images.length}
        </div>
      )}

      {/* 이미지 */}
      <img
        src={images[current]}
        alt={`${current + 1}`}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100vw', maxHeight: '80dvh', objectFit: 'contain', userSelect: 'none', WebkitUserSelect: 'none' }}
      />

      {/* 이전 버튼 */}
      {images.length > 1 && current > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c - 1); }}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* 다음 버튼 */}
      {images.length > 1 && current < images.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c + 1); }}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* 닷 인디케이터 */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 4, background: i === current ? 'white' : 'rgba(255,255,255,0.35)', transition: 'all 0.2s', cursor: 'pointer' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
