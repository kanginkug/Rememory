'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageLightbox from '@/components/ImageLightbox';
import {
  fetchPlace,
  fetchPlaceReviewsSorted,
  fetchMyReview,
  deleteReview,
  deletePlace,
  CATEGORY_LABEL,
  type PlaceDetail,
  type PlaceReview,
  type ReviewSortType,
} from '@/lib/api';

const SORT_OPTIONS: { label: string; value: ReviewSortType }[] = [
  { label: '최신순',    value: 'DATE_DESC'   },
  { label: '오래된순',  value: 'DATE_ASC'    },
  { label: '별점높은순', value: 'RATING_DESC' },
  { label: '별점낮은순', value: 'RATING_ASC'  },
];

const NAV_ITEMS = [
  { label: '홈',        href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '후기',      href: '/memory', d: 'M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H7v-2h8v2zm3-4H7v-2h11v2zm0-4H7V6h11v2z' },
  { label: '지도탐색',  href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',   d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
];

function ReviewTextToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.cssText = 'display:block;overflow:visible;-webkit-line-clamp:unset;';
    const full = el.scrollHeight;
    el.style.cssText = '';
    setOverflows(full > el.clientHeight + 1);
  }, [text]);

  return (
    <div className="review-text-wrap">
      <p ref={ref} className={`review-text ${expanded ? 'review-text-expanded' : 'review-text-clamped'}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button className="review-toggle-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? '말줄임' : '더보기'}
        </button>
      )}
    </div>
  );
}


export default function PlaceDetailPage() {
  const router = useRouter();
  const { id, placeId } = useParams<{ id: string; placeId: string }>();
  const memoryId = Number(id);
  const placeIdNum = Number(placeId);

  const [place,    setPlace]    = useState<PlaceDetail | null>(null);
  const [reviews,  setReviews]  = useState<PlaceReview[]>([]);
  const [myReview, setMyReview] = useState<PlaceReview | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [sortType, setSortType] = useState<ReviewSortType>('DATE_DESC');

  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const [placeMenuSheet, setPlaceMenuSheet] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    document.body.classList.add('page-review');
    return () => document.body.classList.remove('page-review');
  }, [router]);

  useEffect(() => {
    Promise.allSettled([
      fetchPlace(memoryId, placeIdNum),
      fetchPlaceReviewsSorted(memoryId, placeIdNum, 'DATE_DESC'),
      fetchMyReview(memoryId, placeIdNum),
    ]).then(([p, r, m]) => {
      if (p.status === 'fulfilled') setPlace(p.value);
      if (r.status === 'fulfilled') setReviews(r.value ?? []);
      if (m.status === 'fulfilled') setMyReview(m.value ?? null);
    }).finally(() => setLoading(false));
  }, [memoryId, placeIdNum]);

  useEffect(() => {
    const el = descRef.current;
    if (!el || !place?.description) return;
    el.style.cssText = 'display:block;overflow:visible;';
    const full = el.scrollHeight;
    el.style.cssText = '';
    setDescOverflows(full > el.clientHeight + 1);
  }, [place]);

  const anySheet = placeMenuSheet;
  useEffect(() => {
    document.body.style.overflow = anySheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anySheet]);

  const loadReviews = async (sort: string) => {
    const [r, m] = await Promise.allSettled([
      fetchPlaceReviewsSorted(memoryId, placeIdNum, sort),
      fetchMyReview(memoryId, placeIdNum),
    ]);
    if (r.status === 'fulfilled') setReviews(r.value ?? []);
    if (m.status === 'fulfilled') setMyReview(m.value ?? null);
  };

  const handleSortChange = (sort: ReviewSortType) => {
    setSortType(sort);
    loadReviews(sort);
  };

  const handleDelete = async () => {
    if (!myReview || !confirm('후기를 삭제하시겠어요?')) return;
    try {
      await deleteReview(memoryId, placeIdNum, myReview.reviewId);
      setMyReview(null);
      await loadReviews(sortType);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handlePlaceDelete = async () => {
    if (!confirm('장소를 삭제하시겠어요?\n장소에 등록된 모든 후기도 함께 삭제됩니다.')) return;
    try {
      await deletePlace(placeIdNum);
      router.replace(`/memory/${memoryId}`);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  const photos = place?.placePhotoList ?? [];
  const otherReviews = reviews.filter(r => r.reviewId !== myReview?.reviewId);

  return (
    <div className="app-container">

      {/* 헤더 */}
      <header className="app-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <img src="/images/default_phrase.png" alt="Rememory" className="logo-img" />
        <img src="/images/bell_icon_transparent.png" alt="알림" className="bell-img" />
      </header>

      <div className="content">

        {/* 장소 정보 카드 */}
        <div className="place-detail-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h2 className="place-detail-name" style={{ marginBottom: 0 }}>{place?.name}</h2>
            <span
              className={`tag tag-${place?.category?.toLowerCase() ?? 'attraction'}`}
              style={{ alignSelf: 'center', marginBottom: 0 }}
            >
              {CATEGORY_LABEL[place?.category ?? 'ATTRACTION']}
            </span>
            <button
              onClick={() => setPlaceMenuSheet(true)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>

          {place?.description && (
            <div className="place-desc-wrap">
              <p
                ref={descRef}
                className={`place-desc ${descExpanded ? 'place-desc-expanded' : 'place-desc-clamped'}`}
              >
                {place.description}
              </p>
              {(descOverflows || descExpanded) && (
                <button className="desc-toggle-btn" onClick={() => setDescExpanded(e => !e)}>
                  {descExpanded ? '말줄임' : '더보기'}
                </button>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="image-scroll-view">
              {photos.map((photo, i) => (
                <img
                  key={photo.placePhotoId}
                  className="scroll-img"
                  src={photo.imageUrl}
                  alt="장소 사진"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setLightbox({ images: photos.map(p => p.imageUrl), index: i })}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-place.png'; }}
                />
              ))}
            </div>
          )}

          {place?.address && (
            <div className="detail-info-line">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{place.address}</span>
            </div>
          )}
          {place?.visitedAt && (
            <div className="detail-info-line">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
              </svg>
              <span>{place.visitedAt}</span>
            </div>
          )}
          <div className="detail-info-line">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span>평균 별점 {place?.avgRating != null ? place.avgRating.toFixed(1) : '-'}</span>
            <span className="detail-divider">|</span>
            <span>후기 {place?.reviewCount ?? 0}</span>
          </div>
        </div>

        {/* 후기 없을 때 빈 상태 */}
        {!myReview && reviews.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 20px 28px', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <img
              src="/images/no_review_data.png"
              alt="후기 없음"
              style={{ width: '90%', maxWidth: 320, objectFit: 'contain', display: 'block', margin: '0 auto 16px' }}
            />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>아직 후기가 없어요</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>첫 번째 후기를 작성해보세요!</p>
          </div>
        ) : (
          <>
            {/* 정렬 탭 */}
            <div className="filter-container" style={{ paddingBottom: 16 }}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`chip${sortType === opt.value ? ' active' : ''}`}
                  onClick={() => handleSortChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 내 후기 */}
            {myReview && (
              <div className="my-review-container">
                <div className="my-review-header">
                  <span>내 후기</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => router.push(`/place/${memoryId}/${placeIdNum}/review/edit`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={handleDelete}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="review-card">
                  {myReview.rpResponseDTOList?.length > 0 && (
                    <div className="card-img-row">
                      {myReview.rpResponseDTOList.slice(0, 3).map((p, i) => (
                        <img key={p.reviewPhotoId} className="card-img" src={p.photoUrl} alt="후기 사진"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setLightbox({ images: myReview.rpResponseDTOList.map(x => x.photoUrl), index: i })}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ))}
                    </div>
                  )}
                  <div className="profile-row">
                    {myReview.profileImageUrl ? (
                      <img className="user-avatar" src={myReview.profileImageUrl} alt={myReview.creatorName} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="user-avatar" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                      </div>
                    )}
                    <span className="user-name">{myReview.creatorName}</span>
                    <span className="rating-star">⭐ {myReview.rating.toFixed(1)}</span>
                    <span className="review-date">{myReview.visitedAt ?? myReview.createdAt?.slice(0, 10)}</span>
                  </div>
                  {myReview.content && <ReviewTextToggle text={myReview.content} />}
                </div>
              </div>
            )}

            {/* 전체 후기 목록 */}
            <div className="other-reviews-list">
              {otherReviews.map(r => (
                <div key={r.reviewId} className="other-review-card">
                  {r.rpResponseDTOList?.length > 0 && (
                    <div className="card-img-row">
                      {r.rpResponseDTOList.slice(0, 3).map((p, i) => (
                        <img key={p.reviewPhotoId} className="card-img" src={p.photoUrl} alt="후기 사진"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setLightbox({ images: r.rpResponseDTOList.map(x => x.photoUrl), index: i })}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ))}
                    </div>
                  )}
                  <div className="profile-row">
                    {r.profileImageUrl ? (
                      <img className="user-avatar" src={r.profileImageUrl} alt={r.creatorName} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="user-avatar" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                      </div>
                    )}
                    <span className="user-name">{r.creatorName}</span>
                    <span className="rating-star">⭐ {r.rating.toFixed(1)}</span>
                    <span className="review-date">{r.visitedAt ?? r.createdAt?.slice(0, 10)}</span>
                  </div>
                  {r.content && <ReviewTextToggle text={r.content} />}
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* FAB */}
      <button className="fab" onClick={() => router.push(`/place/${memoryId}/${placeIdNum}/review/new`)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        후기 작성
      </button>

      {/* 하단 네비 */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, href, d }) => (
          <Link key={label} href={href} className={`nav-item${label === '후기' ? ' active' : ''}`}>
            <span className="nav-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg></span>
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>

      {lightbox && (
        <ImageLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      {/* 장소 메뉴 시트 */}
      {placeMenuSheet && (
        <div className="sheet-overlay open" onClick={() => setPlaceMenuSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div
              className="menu-item"
              onClick={() => { setPlaceMenuSheet(false); router.push(`/place/${memoryId}/${placeIdNum}/edit`); }}
            >
              <div className="menu-item-icon" style={{ background: '#f1f0ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              장소 수정
            </div>
            <div
              className="menu-item danger"
              onClick={() => { setPlaceMenuSheet(false); handlePlaceDelete(); }}
            >
              <div className="menu-item-icon" style={{ background: '#fef2f2' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              장소 삭제
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
