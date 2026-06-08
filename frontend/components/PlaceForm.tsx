'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, PlacePhoto } from '@/lib/api';

const CATEGORY_CHIPS: { value: Category; label: string }[] = [
  { value: 'RESTAURANT',    label: '🍽️ 식당' },
  { value: 'CAFE',          label: '🧋 카페' },
  { value: 'ACCOMMODATION', label: '🛏️ 숙소' },
  { value: 'ATTRACTION',    label: '🎡 관광지' },
];

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

export interface PlaceFormValues {
  name: string;
  category: Category;
  description: string;
  visitedAt: string;
  locationTab: 'kakao' | 'manual';
  kakaoPlace: KakaoPlace | null;
  depth1: string;
  depth2: string;
  newPhotos: File[];
  removedPhotoIds: number[];
}

interface PlaceFormProps {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  initialData?: {
    name?: string;
    category?: Category;
    description?: string;
    visitedAt?: string | null;
    regionDepth1?: string;
    regionDepth2?: string;
    placePhotoList?: PlacePhoto[];
  };
  onSubmit: (values: PlaceFormValues) => Promise<void>;
}

declare global {
  interface Window { kakao: any; }
}

function parseRegion(address: string) {
  const parts = address.split(' ');
  return { depth1: parts[0] ?? '', depth2: parts[1] ?? '' };
}

export default function PlaceForm({
  title, submitLabel, submittingLabel, initialData, onSubmit,
}: PlaceFormProps) {
  const router = useRouter();

  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState<Category>('RESTAURANT');
  const [description, setDescription] = useState('');
  const [visitedAt,   setVisitedAt]   = useState('');
  const [locationTab, setLocationTab] = useState<'kakao' | 'manual'>('kakao');
  const [kakaoPlace,  setKakaoPlace]  = useState<KakaoPlace | null>(null);
  const [depth1,      setDepth1]      = useState('');
  const [depth2,      setDepth2]      = useState('');

  const [existingPhotos,  setExistingPhotos]  = useState<PlacePhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [newPhotos,       setNewPhotos]       = useState<File[]>([]);
  const [newPhotoUrls,    setNewPhotoUrls]    = useState<string[]>([]);

  const [searchSheet, setSearchSheet] = useState(false);
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<KakaoPlace[]>([]);
  const [submitting,  setSubmitting]  = useState(false);

  const fileRef    = useRef<HTMLInputElement>(null);
  const queryRef   = useRef<HTMLInputElement>(null);
  const kakaoReady = useRef(false);

  useEffect(() => {
    document.body.classList.add('page-create-place');
    return () => document.body.classList.remove('page-create-place');
  }, []);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.name)        setName(initialData.name);
    if (initialData.category)    setCategory(initialData.category);
    if (initialData.description) setDescription(initialData.description);
    setVisitedAt(initialData.visitedAt ?? '');
    if (initialData.regionDepth1 || initialData.regionDepth2) {
      setLocationTab('manual');
      setDepth1(initialData.regionDepth1 ?? '');
      setDepth2(initialData.regionDepth2 ?? '');
    }
    if (initialData.placePhotoList) setExistingPhotos(initialData.placePhotoList);
  }, [initialData]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!key || kakaoReady.current) return;
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.onload = () => { window.kakao.maps.load(() => { kakaoReady.current = true; }); };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    document.body.style.overflow = searchSheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [searchSheet]);

  const handleSearch = () => {
    if (!query.trim() || !window.kakao?.maps?.services) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data: KakaoPlace[], status: string) => {
      setResults(status === window.kakao.maps.services.Status.OK ? data : []);
    });
  };

  const totalPhotoCount = existingPhotos.length + newPhotos.length;

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const toAdd = Array.from(e.target.files).slice(0, 4 - totalPhotoCount);
    setNewPhotos(prev => [...prev, ...toAdd]);
    setNewPhotoUrls(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveExisting = (photoId: number) => {
    setRemovedPhotoIds(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.placePhotoId !== photoId));
  };

  const handleRemoveNew = (i: number) => {
    URL.revokeObjectURL(newPhotoUrls[i]);
    setNewPhotos(prev => prev.filter((_, idx) => idx !== i));
    setNewPhotoUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        description,
        visitedAt,
        locationTab,
        kakaoPlace,
        depth1,
        depth2,
        newPhotos,
        removedPhotoIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ background: '#BFDBF3', minHeight: '100dvh' }}>

      <header className="app-header" style={{ position: 'relative', left: 'auto', transform: 'none', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'transparent' }}>
        <button
          className="back-btn"
          style={{ position: 'relative', left: 'auto', top: 'auto', transform: 'none' }}
          onClick={() => router.back()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>{title}</h1>
        <div style={{ width: 22 }} />
      </header>

      <main style={{ background: 'transparent', padding: '0 0 100px' }}>
        <div className="input-card-group">

          {/* 장소 이름 */}
          <div className="input-field">
            <label className="field-label">
              장소 이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="장소 이름"
              maxLength={30}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {name.length}/30
            </div>
          </div>

          {/* 카테고리 */}
          <div className="input-field">
            <label className="field-label">
              카테고리 <span className="required">*</span>
            </label>
            <div className="cat-chips">
              {CATEGORY_CHIPS.map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  className={`cat-chip${category === chip.value ? ' active' : ''}`}
                  onClick={() => setCategory(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="input-field">
            <label className="field-label">설명</label>
            <textarea
              placeholder="장소에 대한 설명을 입력해주세요"
              maxLength={300}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {description.length}/300
            </div>
          </div>

          {/* 방문일 */}
          <div className="input-field">
            <label className="field-label">방문일</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={visitedAt}
                onChange={e => setVisitedAt(e.target.value)}
              />
              <span className="calendar-icon">📅</span>
            </div>
          </div>

          {/* 장소 선택 */}
          <div className="input-field">
            <label className="field-label">장소 선택</label>
            <div className="tab-group">
              <button
                type="button"
                className={`tab-btn${locationTab === 'kakao' ? ' active' : ''}`}
                onClick={() => setLocationTab('kakao')}
              >
                카카오맵 검색
              </button>
              <button
                type="button"
                className={`tab-btn${locationTab === 'manual' ? ' active' : ''}`}
                onClick={() => setLocationTab('manual')}
              >
                직접 입력
              </button>
            </div>

            {locationTab === 'kakao' && (
              <div>
                <button
                  type="button"
                  className={`kakao-search-trigger${kakaoPlace ? ' has-value' : ''}`}
                  onClick={() => { setSearchSheet(true); setTimeout(() => queryRef.current?.focus(), 80); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{kakaoPlace ? kakaoPlace.place_name : '장소명 또는 주소 검색'}</span>
                </button>
                {kakaoPlace && (
                  <div className="selected-place-card visible">
                    <span className="selected-place-name">{kakaoPlace.place_name}</span>
                    <span className="selected-place-addr">{kakaoPlace.road_address_name || kakaoPlace.address_name}</span>
                    <button
                      type="button"
                      className="selected-place-clear"
                      onClick={() => { setKakaoPlace(null); setQuery(''); setResults([]); }}
                    >✕</button>
                  </div>
                )}
              </div>
            )}

            {locationTab === 'manual' && (
              <div className="region-row">
                <div className="manual-field">
                  <label>시/도</label>
                  <input type="text" placeholder="예: 서울" value={depth1} onChange={e => setDepth1(e.target.value)} />
                </div>
                <div className="manual-field">
                  <label>시/군/구</label>
                  <input type="text" placeholder="예: 중구" value={depth2} onChange={e => setDepth2(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* 장소 사진 */}
          <div className="input-field" style={{ marginBottom: 0 }}>
            <label className="field-label">장소 사진</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleAddPhoto}
            />
            <div className="photo-grid">
              {totalPhotoCount < 4 && (
                <div className="photo-slot photo-add" onClick={() => fileRef.current?.click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>사진 추가</span>
                </div>
              )}
              {existingPhotos.map(photo => (
                <div key={photo.placePhotoId} className="photo-slot">
                  <img src={photo.imageUrl} alt="장소 사진" />
                  <button type="button" className="photo-remove-btn" onClick={() => handleRemoveExisting(photo.placePhotoId)}>✕</button>
                </div>
              ))}
              {newPhotoUrls.map((url, i) => (
                <div key={`new-${i}`} className="photo-slot">
                  <img src={url} alt={`새 사진 ${i + 1}`} />
                  <button type="button" className="photo-remove-btn" onClick={() => handleRemoveNew(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="bottom-button-area" style={{ background: '#BFDBF3' }}>
          <button
            type="button"
            className={`submit-btn${name.trim() ? ' active' : ''}`}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </main>

      {/* 카카오맵 검색 바텀시트 */}
      {searchSheet && (
        <div className="sheet-overlay open" onClick={() => setSearchSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">장소 검색</div>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="kakao-search-row">
                <input
                  ref={queryRef}
                  type="text"
                  placeholder="장소명 또는 주소 검색"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                />
                <button type="button" className="kakao-search-btn" onClick={handleSearch}>검색</button>
              </div>
            </div>
            <div className="sheet-body">
              {results.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  검색어를 입력하고 검색 버튼을 눌러주세요
                </div>
              ) : results.map(place => (
                <div
                  key={place.id}
                  className={`search-result-item${kakaoPlace?.id === place.id ? ' selected' : ''}`}
                  onClick={() => { setKakaoPlace(place); setSearchSheet(false); }}
                >
                  <span className="result-name">{place.place_name}</span>
                  <span className="result-category">{place.category_name}</span>
                  <span className="result-address">{place.road_address_name || place.address_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
