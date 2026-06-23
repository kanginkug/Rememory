'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BellIcon from '@/components/BellIcon';
import { useRouter } from 'next/navigation';
import { fetchMyReviews, deleteReview, CATEGORY_LABEL, type PlaceReview, type Category } from '@/lib/api';

const NAV_ITEMS = [
  { label: '홈',        href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '추억',      href: '/memory', d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' },
  { label: '지도탐색',  href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',    d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

const BADGE_CLASS: Record<Category, string> = {
  RESTAURANT:    'badge-restaurant',
  CAFE:          'badge-cafe',
  ATTRACTION:    'badge-attraction',
  ACCOMMODATION: 'badge-accommodation',
};

const REVIEW_FALLBACK: Record<Category, string> = {
  RESTAURANT:    '/images/no_reveiw_restaurant.png',
  CAFE:          '/images/no_review_cafe.png',
  ATTRACTION:    '/images/no_review_attraction.png',
  ACCOMMODATION: '/images/no_review_accommodation.png',
};

const STAR_PATH = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

function Stars({ rating, id }: { rating: number; id: number }) {
  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <linearGradient id={`hg-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#FFCC00" />
            <stop offset="50%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="stars">
        {[1, 2, 3, 4, 5].map(i => {
          const fill = rating >= i ? '#FFCC00' : rating >= i - 0.5 ? `url(#hg-${id})` : '#E2E8F0';
          return (
            <svg key={i} className="star-svg" viewBox="0 0 24 24">
              <path d={STAR_PATH} fill={fill} />
            </svg>
          );
        })}
      </div>
    </>
  );
}

interface DeleteTarget {
  reviewId: number;
  memoryId: number;
  placeId: number;
}

export default function ReviewManagementPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    document.body.classList.add('page-review-mgmt');
    return () => document.body.classList.remove('page-review-mgmt');
  }, [router]);

  useEffect(() => {
    fetchMyReviews()
      .then(setReviews)
      .catch((e: Error) => alert(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpanded = (reviewId: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(reviewId) ? next.delete(reviewId) : next.add(reviewId);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteReview(deleteTarget.memoryId, deleteTarget.placeId, deleteTarget.reviewId);
      setReviews(prev => prev.filter(r => r.reviewId !== deleteTarget.reviewId));
      setDeleteTarget(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <button className="back-btn" onClick={() => router.push('/my')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <BellIcon />
      </header>

      <div className="app-container">
        <main className="app-main">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 80, color: '#888', fontSize: 14 }}>
              불러오는 중...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 80, color: '#94a3b8', fontSize: 14 }}>
              작성한 후기가 없습니다.
            </div>
          ) : (
            <div className="rm-list">
              {reviews.map(review => {
                const thumb = review.rpResponseDTOList?.[0]?.photoUrl ?? REVIEW_FALLBACK[review.placeCategory];
                const isExpanded = expanded.has(review.reviewId);
                const hasLongContent = (review.content?.length ?? 0) > 60;

                return (
                  <div key={review.reviewId} className="review-card">
                    <img
                      className="place-thumb"
                      src={thumb}
                      alt={review.placeName}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = REVIEW_FALLBACK[review.placeCategory]; }}
                    />
                    <div className="card-body">
                      <div className="place-header">
                        <span className={`badge ${BADGE_CLASS[review.placeCategory]}`}>
                          {CATEGORY_LABEL[review.placeCategory]}
                        </span>
                        <span className="place-name">{review.placeName}</span>
                      </div>
                      <p className="memory-label">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
                        </svg>
                        {review.memoryName}
                      </p>
                      <div className="rating-row">
                        <Stars rating={review.rating} id={review.reviewId} />
                        <span className="rating-val">{review.rating.toFixed(1)}</span>
                      </div>
                      {review.content && (
                        <div className="review-desc-wrap">
                          <p className={`review-desc ${isExpanded ? 'review-desc-expanded' : 'review-desc-clamped'}`}>
                            {review.content}
                          </p>
                          {hasLongContent && (
                            <button
                              className="review-desc-toggle"
                              onClick={() => toggleExpanded(review.reviewId)}
                            >
                              {isExpanded ? '말줄임' : '더보기'}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="card-footer">
                        <span className="visit-date">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {review.visitedAt ? `${review.visitedAt.replace(/-/g, '.')} 방문` : '방문일 미기록'}
                        </span>
                        <div className="action-group">
                          <button
                            className="btn btn-edit"
                            onClick={() => router.push(`/place/${review.memoryId}/${review.placeId}/review/edit?from=my-reviews`)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            수정
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => setDeleteTarget({ reviewId: review.reviewId, memoryId: review.memoryId, placeId: review.placeId })}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" />
                            </svg>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* 삭제 확인 팝업 */}
        <div
          className={`confirm-overlay${deleteTarget ? ' open' : ''}`}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="confirm-popup">
            <div className="confirm-icon">🗑️</div>
            <p className="confirm-title">후기를 삭제하시겠습니까?</p>
            <p className="confirm-desc">삭제한 후기는 복구할 수 없습니다.</p>
            <div className="confirm-btns">
              <button className="confirm-btn confirm-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="confirm-btn confirm-btn-ok danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '삭제 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>

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
