'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchPlace,
  fetchPlaceReviewsSorted,
  fetchMyReview,
  createReview,
  updateReview,
  deleteReview,
  CATEGORY_LABEL,
  type PlaceDetail,
  type PlaceReview,
} from '@/lib/api';

const SORT_OPTIONS = [
  { label: '최신순',    value: 'LATEST'      },
  { label: '오래된순',  value: 'OLDEST'      },
  { label: '별점높은순', value: 'HIGH_RATING' },
  { label: '별점낮은순', value: 'LOW_RATING'  },
];

const NAV_ITEMS = [
  { label: '홈',       href: '/home',   d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { label: '장소',     href: '/memory', d: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { label: '지도탐색', href: '/map',    d: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z' },
  { label: '마이페이지', href: '/my',  d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
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

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill={s <= value ? '#FFB800' : '#e2e8f0'}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
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
  const [sortType, setSortType] = useState('LATEST');

  const [descExpanded,  setDescExpanded]  = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const [moreSheet,  setMoreSheet]  = useState(false);
  const [writeSheet, setWriteSheet] = useState(false);
  const [editSheet,  setEditSheet]  = useState(false);
  const [rating,     setRating]     = useState(0);
  const [content,    setContent]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    document.body.classList.add('page-review');
    return () => document.body.classList.remove('page-review');
  }, [router]);

  useEffect(() => {
    Promise.allSettled([
      fetchPlace(memoryId, placeIdNum),
      fetchPlaceReviewsSorted(memoryId, placeIdNum, 'LATEST'),
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

  const anySheet = moreSheet || writeSheet || editSheet;
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

  const handleSortChange = (sort: string) => {
    setSortType(sort);
    loadReviews(sort);
  };

  const handleWriteSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createReview(memoryId, placeIdNum, { rating, content: content.trim() || undefined });
      await loadReviews(sortType);
      setWriteSheet(false);
      setRating(0);
      setContent('');
    } catch {
      alert('후기 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = () => {
    if (!myReview) return;
    setRating(myReview.rating);
    setContent(myReview.content ?? '');
    setEditSheet(true);
  };

  const handleEditSubmit = async () => {
    if (!myReview || rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await updateReview(memoryId, placeIdNum, myReview.reviewId, { rating, content: content.trim() || undefined });
      await loadReviews(sortType);
      setEditSheet(false);
      setRating(0);
      setContent('');
    } catch {
      alert('후기 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview || !confirm('후기를 삭제하시겠어요?')) return;
    try {
      await deleteReview(memoryId, placeIdNum, myReview.reviewId);
      setMyReview(null);
      await loadReviews(sortType);
    } catch {
      alert('후기 삭제에 실패했습니다.');
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
        <button
          onClick={() => setMoreSheet(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
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
              {photos.map(photo => (
                <img
                  key={photo.placePhotoId}
                  className="scroll-img"
                  src={photo.imageUrl}
                  alt="장소 사진"
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
                  onClick={handleEditOpen}
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
              {myReview.photoUrlList?.length > 0 && (
                <div className="card-img-row">
                  {myReview.photoUrlList.slice(0, 3).map((url, i) => (
                    <img key={i} className="card-img" src={url} alt="후기 사진" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                </div>
              )}
              <div className="profile-row">
                {myReview.profileImageUrl ? (
                  <img className="user-avatar" src={myReview.profileImageUrl} alt={myReview.memberName} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="user-avatar" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  </div>
                )}
                <span className="user-name">{myReview.memberName}</span>
                <span className="rating-star">⭐ {myReview.rating.toFixed(1)}</span>
                <span className="review-date">{myReview.visitedAt ?? myReview.createdAt?.slice(0, 10)}</span>
              </div>
              {myReview.content && <ReviewTextToggle text={myReview.content} />}
            </div>
          </div>
        )}

        {/* 전체 후기 목록 */}
        <div className="other-reviews-list">
          {otherReviews.length === 0 && !myReview && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
              아직 후기가 없어요. 첫 번째로 후기를 남겨보세요!
            </div>
          )}
          {otherReviews.map(r => (
            <div key={r.reviewId} className="other-review-card">
              {r.photoUrlList?.length > 0 && (
                <div className="card-img-row">
                  {r.photoUrlList.slice(0, 3).map((url, i) => (
                    <img key={i} className="card-img" src={url} alt="후기 사진" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                </div>
              )}
              <div className="profile-row">
                {r.profileImageUrl ? (
                  <img className="user-avatar" src={r.profileImageUrl} alt={r.memberName} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="user-avatar" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  </div>
                )}
                <span className="user-name">{r.memberName}</span>
                <span className="rating-star">⭐ {r.rating.toFixed(1)}</span>
                <span className="review-date">{r.visitedAt ?? r.createdAt?.slice(0, 10)}</span>
              </div>
              {r.content && <ReviewTextToggle text={r.content} />}
            </div>
          ))}
        </div>

      </div>

      {/* FAB */}
      <button className="fab" onClick={() => { setRating(0); setContent(''); setWriteSheet(true); }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        후기 작성
      </button>

      {/* 하단 네비 */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, href, d }) => (
          <Link key={label} href={href} className={`nav-item${label === '장소' ? ' active' : ''}`}>
            <span className="nav-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg></span>
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>

      {/* 더보기 시트 */}
      {moreSheet && (
        <div className="sheet-overlay open" onClick={() => setMoreSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div
              className="menu-item"
              onClick={() => { setMoreSheet(false); router.push(`/place/${memoryId}/${placeIdNum}/edit`); }}
            >
              <div className="menu-item-icon" style={{ background: '#f1f0ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              장소 수정
            </div>
          </div>
        </div>
      )}

      {/* 후기 작성 시트 */}
      {writeSheet && (
        <div className="sheet-overlay open" onClick={() => setWriteSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">후기 작성</div>
            <div className="sheet-body" style={{ padding: '16px 20px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>별점을 선택해주세요 *</div>
                <StarInput value={rating} onChange={setRating} />
                {rating > 0 && <div style={{ fontSize: 13, color: '#5CCCBA', fontWeight: 700, marginTop: 6 }}>{rating}.0점</div>}
              </div>
              <textarea
                placeholder="방문 후기를 남겨보세요 (선택)"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={500}
                rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1e293b' }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>{content.length}/500</div>
              <button
                onClick={handleWriteSubmit}
                disabled={rating === 0 || submitting}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed', background: rating > 0 ? '#5CCCBA' : '#e2e8f0', color: rating > 0 ? '#fff' : '#94a3b8' }}
              >
                {submitting ? '등록 중...' : '후기 등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 후기 수정 시트 */}
      {editSheet && (
        <div className="sheet-overlay open" onClick={() => setEditSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">후기 수정</div>
            <div className="sheet-body" style={{ padding: '16px 20px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>별점을 선택해주세요 *</div>
                <StarInput value={rating} onChange={setRating} />
                {rating > 0 && <div style={{ fontSize: 13, color: '#5CCCBA', fontWeight: 700, marginTop: 6 }}>{rating}.0점</div>}
              </div>
              <textarea
                placeholder="방문 후기를 남겨보세요 (선택)"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={500}
                rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1e293b' }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>{content.length}/500</div>
              <button
                onClick={handleEditSubmit}
                disabled={rating === 0 || submitting}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed', background: rating > 0 ? '#5CCCBA' : '#e2e8f0', color: rating > 0 ? '#fff' : '#94a3b8' }}
              >
                {submitting ? '수정 중...' : '수정하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
