'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  fetchPlace,
  fetchMyReview,
  updateReview,
  addReviewPhotos,
  deleteReviewPhotos,
  fetchPresignedUrls,
  uploadToS3,
  CATEGORY_LABEL,
  type PlaceDetail,
  type PlaceReview,
  type ReviewPhoto,
} from '@/lib/api';
import { showToast } from '@/lib/toast';

const STAR_PATH = "M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const getState = (i: number): 'full' | 'half' | 'empty' => {
    const val = i + 1;
    if (display >= val) return 'full';
    if (display >= val - 0.5) return 'half';
    return 'empty';
  };

  const pick = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onChange((e.clientX - rect.left) < rect.width / 2 ? i + 0.5 : i + 1);
  };

  const hover_ = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover((e.clientX - rect.left) < rect.width / 2 ? i + 0.5 : i + 1);
  };

  return (
    <div className="star-rating-wrap">
      <div className="star-rating-row" onMouseLeave={() => setHover(0)}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            {[0, 1, 2, 3, 4].map(i => (
              <clipPath key={i} id={`halfClipE${i}`}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            ))}
          </defs>
        </svg>
        {[0, 1, 2, 3, 4].map(i => {
          const state = getState(i);
          return (
            <button
              key={i}
              type="button"
              className="star-btn"
              onClick={e => pick(e, i)}
              onMouseMove={e => hover_(e, i)}
            >
              <svg viewBox="0 0 24 24">
                <path d={STAR_PATH} fill={state === 'full' ? '#FFB800' : '#e2e8f0'} />
                {state === 'half' && (
                  <path d={STAR_PATH} fill="#FFB800" clipPath={`url(#halfClipE${i})`} />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      <span className="star-score">{value > 0 ? value.toFixed(1) : '-'}</span>
    </div>
  );
}

export default function EditReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id, placeId } = useParams<{ id: string; placeId: string }>();
  const memoryId   = Number(id);
  const placeIdNum = Number(placeId);
  const backTo = searchParams.get('from') === 'my-reviews' ? '/my/reviews' : `/place/${memoryId}/${placeIdNum}`;

  const [place,           setPlace]           = useState<PlaceDetail | null>(null);
  const [myReview,        setMyReview]        = useState<PlaceReview | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [rating,          setRating]          = useState(0);
  const [visitedAt,       setVisitedAt]       = useState('');
  const [content,         setContent]         = useState('');
  const [existingPhotos,  setExistingPhotos]  = useState<ReviewPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [newPhotos,       setNewPhotos]       = useState<File[]>([]);
  const [newPreviews,     setNewPreviews]     = useState<string[]>([]);
  const [submitting,      setSubmitting]      = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const keptPhotos  = existingPhotos.filter(p => !removedPhotoIds.includes(p.reviewPhotoId));
  const totalPhotos = keptPhotos.length + newPhotos.length;

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.replace('/login'); return; }
    document.body.classList.add('page-create-review');
    return () => document.body.classList.remove('page-create-review');
  }, [router]);

  useEffect(() => {
    Promise.allSettled([
      fetchPlace(memoryId, placeIdNum),
      fetchMyReview(memoryId, placeIdNum),
    ]).then(([p, m]) => {
      if (p.status === 'fulfilled') setPlace(p.value);
      if (m.status === 'fulfilled' && m.value) {
        const r = m.value;
        setMyReview(r);
        setRating(r.rating);
        setContent(r.content ?? '');
        setVisitedAt(r.visitedAt ?? '');
        setExistingPhotos(r.rpResponseDTOList ?? []);
      } else {
        router.replace(`/place/${memoryId}/${placeIdNum}`);
      }
    }).finally(() => setLoading(false));
  }, [memoryId, placeIdNum, router]);

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const remaining = 3 - totalPhotos;
    if (remaining <= 0) return;
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    setNewPhotos(p => [...p, ...files]);
    setNewPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveExisting = (photoId: number) => {
    setRemovedPhotoIds(ids => [...ids, photoId]);
  };

  const handleRemoveNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewPhotos(p => p.filter((_, i) => i !== idx));
    setNewPreviews(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!myReview || rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await updateReview(myReview.reviewId, {
        placeId: placeIdNum,
        memoryId,
        rating,
        content: content.trim() || undefined,
        visitedAt: visitedAt || undefined,
      });

      const photoTasks: Promise<void>[] = [];

      if (removedPhotoIds.length > 0) {
        photoTasks.push(deleteReviewPhotos(memoryId, myReview.reviewId, removedPhotoIds));
      }

      if (newPhotos.length > 0) {
        const uploadTask = async () => {
          const slots = await fetchPresignedUrls('review', newPhotos.length);
          await Promise.all(slots.map((slot, i) => uploadToS3(slot.presignedUrl, newPhotos[i])));
          await addReviewPhotos(memoryId, myReview.reviewId, slots.map(s => s.imageUrl));
        };
        photoTasks.push(uploadTask());
      }

      if (photoTasks.length > 0) await Promise.all(photoTasks);

      router.replace(backTo);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#BFDBF3', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#888', fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  const firstPhoto = place?.placePhotoList?.[0]?.imageUrl;

  return (
    <div className="app-container">

      <header className="app-header">
        <button className="back-btn" onClick={() => router.push(backTo)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="page-title">후기 수정</h1>
        <div className="header-empty" />
      </header>

      {/* 장소 요약 카드 */}
      <div className="place-summary-card">
        <img
          className="place-summary-thumb"
          src={firstPhoto ?? '/images/no-place.png'}
          alt={place?.name ?? ''}
          onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/no-place.png'; }}
        />
        <div className="place-summary-info">
          <div className="place-summary-name">{place?.name}</div>
          <span className={`tag tag-${place?.category?.toLowerCase() ?? 'attraction'}`} style={{ marginBottom: 0 }}>
            {CATEGORY_LABEL[place?.category ?? 'ATTRACTION']}
          </span>
          {place?.address && (
            <div className="place-summary-addr">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{place.address}</span>
            </div>
          )}
        </div>
      </div>

      <main className="app-main">
        <div className="input-card-group">

          {/* 별점 */}
          <div className="input-field">
            <label className="field-label">별점 <span className="required">*</span></label>
            <StarRating value={rating} onChange={setRating} />
            <div className="star-hint">별을 터치하여 별점을 선택해주세요 (0.5 단위)</div>
          </div>

          {/* 방문일 */}
          <div className="input-field">
            <label className="field-label">방문일</label>
            <div style={{ position: 'relative' }}>
              <div className={`date-trigger${visitedAt ? '' : ' empty'}`}>
                <span>{visitedAt ? visitedAt.replace(/-/g, '.') : '날짜 선택'}</span>
                {!visitedAt && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
              </div>
              <input
                type="date"
                value={visitedAt}
                onChange={e => setVisitedAt(e.target.value)}
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: visitedAt ? 44 : 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
              />
              {visitedAt && (
                <button type="button" onClick={() => setVisitedAt('')}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="input-field">
            <label className="field-label">후기 내용</label>
            <div className="review-textarea-wrap">
              <textarea
                className="review-textarea"
                placeholder={"맛, 분위기, 서비스 등\n다른 사람들이 참고할 수 있도록 작성해주세요."}
                rows={5}
                maxLength={1000}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <span className="char-count">{content.length} / 1,000</span>
            </div>
          </div>

          {/* 사진 */}
          <div className="input-field" style={{ marginBottom: 0 }}>
            <div className="photo-section-header">
              <label className="field-label" style={{ marginBottom: 0 }}>사진 (최대 3장)</label>
              <span className="photo-count">{totalPhotos} / 3</span>
            </div>
            <div className="photo-grid">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleAddPhoto}
              />

              {/* 기존 사진 */}
              {keptPhotos.map(p => (
                <div key={p.reviewPhotoId} className="photo-slot">
                  <img src={p.photoUrl} alt="사진" />
                  <button type="button" className="photo-remove-btn" onClick={() => handleRemoveExisting(p.reviewPhotoId)}>✕</button>
                </div>
              ))}

              {/* 새 사진 미리보기 */}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="photo-slot">
                  <img src={src} alt={`새 사진 ${i + 1}`} />
                  <button type="button" className="photo-remove-btn" onClick={() => handleRemoveNew(i)}>✕</button>
                </div>
              ))}

              {/* 빈 추가 슬롯 */}
              {Array.from({ length: 3 - totalPhotos }).map((_, i) => (
                <label key={`empty-${i}`} className="photo-slot photo-add" style={{ cursor: 'pointer' }} onClick={() => photoInputRef.current?.click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="7" width="18" height="14" rx="2" />
                    <circle cx="12" cy="14" r="3" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>사진 추가</span>
                </label>
              ))}
            </div>
            <p className="photo-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              사진은 최대 3장까지 등록할 수 있습니다.
            </p>
          </div>

        </div>

        <div className="bottom-button-area">
          <button
            type="button"
            className={`submit-btn${rating > 0 ? ' active' : ''}`}
            disabled={rating === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '수정 중...' : '수정하기'}
          </button>
        </div>
      </main>

    </div>
  );
}
